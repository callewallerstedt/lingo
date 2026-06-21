"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SA_ACHIEVEMENTS,
  SA_REQUIRED_STREAK,
  SA_STATE_VERSION,
  saAchievementById,
  saAnswerCard,
  saBuildFocusSteps,
  saBuildSteps,
  saCheckAchievements,
  saCompleteSession,
  saComboMultiplier,
  saCreateState,
  saDeckStats,
  saIsMastered,
  saIsDue,
  saLevelInfo,
  saLibrary,
  saLoadState,
  saMatchesAnswer,
  saMergeWords,
  saRegisterAnswer,
  saRollDay,
  saSaveState,
  saSelectPracticeCards,
  saSelectSessionCards,
  saShuffle,
  saStageLabel,
  saCardTheme,
  saCardAccuracy,
  saThemeStats,
  saWeakCards,
  saXpForAnswer,
  type SaCard,
  type SaMode,
  type SaSettings,
  type SaState,
  type SaStep,
  type SaWord,
} from "../lib/surgeArc";
import { saStarterDeck } from "../lib/surgeDecks";
import LessonsPanel from "./Lessons";
import type { LessonContent } from "../lib/lessons";

type SurgeArcProps = {
  language: string | null;
  onPlayAudio?: (text: string) => void;
  onExit?: () => void;
  // Optional per-user persistence. When provided (logged in), Surge syncs the
  // full state to the database; it always falls back to localStorage.
  userId?: string | null;
  onLoadRemote?: (language: string) => Promise<SaState | null>;
  onSaveRemote?: (state: SaState) => void;
  onLoadLessons?: (language: string) => Promise<Record<string, LessonContent> | null>;
  onSaveLesson?: (language: string, content: LessonContent) => void;
};

type Screen = "hub" | "playing" | "summary";
type FloatingXp = { id: number; amount: number };
type SessionResult = {
  mode: SaMode;
  reviews: number;
  correct: number;
  xpGained: number;
  bestCombo: number;
  newlyMastered: SaCard[];
  newAchievements: string[];
  leveledUpTo: number | null;
};

type AnswerOpts = { hard?: boolean; combos?: boolean };
type AnswerFn = (card: SaCard, correct: boolean, opts?: AnswerOpts) => void;

// ---------------------------------------------------------------------------
// Sound + haptics + confetti
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}
function tone(freq: number, duration: number, when = 0, type: OscillatorType = "sine", gain = 0.05) {
  const ac = ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = ac.currentTime + when;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}
const sfx = {
  correct() {
    tone(659, 0.09, 0, "sine", 0.045);
    tone(988, 0.13, 0.05, "sine", 0.04);
  },
  wrong() {
    tone(190, 0.15, 0, "sine", 0.035);
    tone(150, 0.19, 0.04, "sine", 0.03);
  },
  combo(n: number) {
    const base = 540 + n * 34;
    tone(base, 0.08, 0, "triangle", 0.04);
    tone(base * 1.5, 0.1, 0.05, "triangle", 0.035);
  },
  tap() {
    tone(440, 0.035, 0, "sine", 0.025);
  },
  finish() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.2, i * 0.09, "sine", 0.045));
  },
};
function buzz(ms: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}
function confettiBurst() {
  if (typeof document === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const c = canvas.getContext("2d");
  if (!c) {
    canvas.remove();
    return;
  }
  const colors = ["#5b5bf6", "#22d3ee", "#818cf8", "#34d399", "#f0abfc"];
  const parts = Array.from({ length: 130 }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 240,
    y: window.innerHeight / 3 + (Math.random() - 0.5) * 60,
    vx: (Math.random() - 0.5) * 15,
    vy: Math.random() * -15 - 5,
    size: Math.random() * 7 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    life: 1,
  }));
  let frame = 0;
  function draw() {
    if (!c) return;
    c.clearRect(0, 0, canvas.width, canvas.height);
    frame += 1;
    for (const p of parts) {
      p.vy += 0.45;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.012;
      c.save();
      c.globalAlpha = Math.max(0, p.life);
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.fillStyle = p.color;
      c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      c.restore();
    }
    if (frame < 140) requestAnimationFrame(draw);
    else canvas.remove();
  }
  requestAnimationFrame(draw);
}

// ---------------------------------------------------------------------------
// Icons (clean line set)
// ---------------------------------------------------------------------------

const ICONS: Record<string, React.ReactNode> = {
  smart: (
    <>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
    </>
  ),
  cards: (
    <>
      <rect x="3" y="6" width="13" height="13" rx="2.5" />
      <path d="M8 4.5h9A2.5 2.5 0 0 1 19.5 7v9" />
    </>
  ),
  match: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
  choice: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.5l2.4 2.4 4.6-5" />
    </>
  ),
  type: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      <path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8 14h8" />
    </>
  ),
  listen: (
    <>
      <path d="M4 10v4h3l4 4V6L7 10H4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8 8 0 0 1 0 12" />
    </>
  ),
  build: (
    <>
      <rect x="3" y="13" width="7" height="7" rx="1.6" />
      <rect x="14" y="13" width="7" height="7" rx="1.6" />
      <rect x="8.5" y="4" width="7" height="7" rx="1.6" />
    </>
  ),
  lightning: <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z" />,
  truefalse: (
    <>
      <path d="M4 8.5l2.2 2.2L11 6" />
      <path d="M15 15l5 5M20 15l-5 5" />
    </>
  ),
  cloze: (
    <>
      <path d="M4 7h16M4 12h7M14 12h6M4 17h16" />
    </>
  ),
  library: (
    <>
      <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z" />
      <path d="M5 4a2 2 0 0 0-2 2v12" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  lesson: (
    <>
      <path d="M12 6.5C10.5 5 8 4.5 3.5 5v13c4.5-.5 7 0 8.5 1.5" />
      <path d="M12 6.5C13.5 5 16 4.5 20.5 5v13c-4.5-.5-7 0-8.5 1.5z" />
    </>
  ),
  flame: <path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c0-.8-.3-1.5-.3-1.5 2 1 3.3 3 3.3 5.5a5 5 0 1 1-10 0C7 9 12 8 12 3z" />,
  trophy: (
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4v1a3 3 0 0 0 3 3M17 5h3v1a3 3 0 0 1-3 3M9 20h6M12 13v4" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  audio: (
    <>
      <path d="M4 10v4h3l4 4V6L7 10H4z" />
      <path d="M15 9.5a4 4 0 0 1 0 5" />
    </>
  ),
};

function Icon({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Mode metadata
// ---------------------------------------------------------------------------

const MODES: { id: SaMode; name: string; blurb: string; icon: string }[] = [
  { id: "flashcards", name: "Flashcards", blurb: "Flip & learn", icon: "cards" },
  { id: "match", name: "Match", blurb: "Pair them up", icon: "match" },
  { id: "choice", name: "Multiple choice", blurb: "Spot the meaning", icon: "choice" },
  { id: "type", name: "Type it", blurb: "Recall & spell", icon: "type" },
  { id: "listen", name: "Listen", blurb: "Train your ear", icon: "listen" },
  { id: "build", name: "Build", blurb: "Construct words", icon: "build" },
  { id: "lightning", name: "Lightning", blurb: "Beat the clock", icon: "lightning" },
  { id: "truefalse", name: "True / False", blurb: "Quick judgment", icon: "truefalse" },
  { id: "cloze", name: "Fill the gap", blurb: "Complete sentences", icon: "cloze" },
];

type GenApiItem = { text?: string; translation?: string; itemType?: string; note?: string; theme?: string };

function mapGenItems(items: unknown, fallbackTheme: string): SaWord[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((raw, i): SaWord | null => {
      const it = raw as GenApiItem;
      if (!it || typeof it.text !== "string" || typeof it.translation !== "string") return null;
      const text = it.text.trim();
      const translation = it.translation.trim();
      if (!text || !translation) return null;
      const type: SaWord["type"] = it.itemType === "sentence" ? "sentence" : it.itemType === "phrase" ? "phrase" : text.includes(" ") ? "phrase" : "word";
      return {
        id: `ai-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        text,
        translation,
        type,
        note: typeof it.note === "string" && it.note.trim() ? it.note.trim() : undefined,
        theme: typeof it.theme === "string" && it.theme.trim() ? it.theme.trim() : fallbackTheme || "Generated",
        level: 2,
      };
    })
    .filter((w): w is SaWord => w !== null);
}

function relativeDue(at: number): string {
  const diff = at - Date.now();
  if (diff <= 0) return "due now";
  const m = Math.round(diff / 60000);
  if (m < 60) return `in ${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `in ${h}h`;
  const d = Math.round(h / 24);
  if (d < 30) return `in ${d}d`;
  return `in ${Math.round(d / 30)}mo`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function SurgeArc({ language, onPlayAudio, onExit, userId, onLoadRemote, onSaveRemote, onLoadLessons, onSaveLesson }: SurgeArcProps) {
  const [state, setState] = useState<SaState | null>(null);
  const [screen, setScreen] = useState<Screen>("hub");
  const [steps, setSteps] = useState<SaStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [combo, setCombo] = useState(0);
  const [floaters, setFloaters] = useState<FloatingXp[]>([]);
  const [enriching, setEnriching] = useState(false);
  const [modal, setModal] = useState<null | "achievements" | "library" | "stats" | "generate" | "lessons">(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [genBusy, setGenBusy] = useState(false);
  const [genProgress, setGenProgress] = useState("");
  const sessionMode = useRef<SaMode>("smart");

  const stateRef = useRef<SaState | null>(null);
  const saveTimer = useRef<number | null>(null);
  const floaterId = useRef(0);
  const ss = useRef({ reviews: 0, correct: 0, xpGained: 0, bestCombo: 0, mistakes: 0, startLevel: 1, startXp: 0, startAt: 0 });
  const onLoadRemoteRef = useRef(onLoadRemote);
  const onSaveRemoteRef = useRef(onSaveRemote);
  onLoadRemoteRef.current = onLoadRemote;
  onSaveRemoteRef.current = onSaveRemote;
  stateRef.current = state;

  // Save to localStorage + (when logged in) the database.
  const saveAll = useCallback((next: SaState) => {
    saSaveState(next);
    onSaveRemoteRef.current?.(next);
  }, []);

  useEffect(() => {
    if (!language) {
      setState(null);
      return;
    }
    let cancelled = false;
    // Offline-first: show local (or fresh) state immediately.
    const local = saLoadState(language);
    const base = local || saCreateState(language, saStarterDeck(language));
    base.profile = saRollDay(base.profile);
    setState(base);
    setScreen("hub");
    setSteps([]);
    setStepIndex(0);
    setCombo(0);
    (async () => {
      let chosen = base;
      if (onLoadRemoteRef.current && userId) {
        try {
          const remote = await onLoadRemoteRef.current(language);
          if (remote && remote.version === SA_STATE_VERSION && remote.cards) chosen = remote;
        } catch {
          /* keep local */
        }
      }
      // Always ensure the latest built-in deck words exist, then persist back.
      chosen = saMergeWords(chosen, saStarterDeck(language));
      chosen.profile = saRollDay(chosen.profile);
      if (!cancelled) {
        setState(chosen);
        saveAll(chosen);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, userId]);

  useEffect(() => {
    if (!language || !state) return;
    if (saDeckStats(state).fresh >= 8 || enriching) return;
    let cancelled = false;
    setEnriching(true);
    (async () => {
      try {
        const known = (stateRef.current ? Object.values(stateRef.current.cards) : []).map((c) => c.text);
        const res = await fetch("/api/surge-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, count: 12, existing: known, support: known, difficulty: "hard" }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items?: Array<{ text?: string; translation?: string; itemType?: string }> };
        const words: SaWord[] = (data.items || [])
          .filter((it) => it && typeof it.text === "string" && typeof it.translation === "string")
          .map((it, i) => ({
            id: `ai-${Date.now()}-${i}`,
            text: (it.text as string).trim(),
            translation: (it.translation as string).trim(),
            type: (it.itemType === "phrase" || (it.text as string).includes(" ") ? "phrase" : "word") as SaWord["type"],
          }))
          .filter((w) => w.text && w.translation);
        if (cancelled || !words.length) return;
        setState((prev) => {
          if (!prev) return prev;
          const merged = saMergeWords(prev, words);
          saveAll(merged);
          return merged;
        });
      } catch {
        /* offline — built-in deck still works */
      } finally {
        if (!cancelled) setEnriching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, state?.language, screen]);

  const persist = useCallback(
    (next: SaState) => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => saveAll(next), 350);
    },
    [saveAll]
  );

  const pushFloater = useCallback((amount: number) => {
    const id = (floaterId.current += 1);
    setFloaters((f) => [...f, { id, amount }]);
    window.setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 850);
  }, []);

  const updateSettings = useCallback((patch: Partial<SaSettings>) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, settings: { ...prev.settings, ...patch } };
      saveAll(next);
      return next;
    });
    sfx.tap();
  }, [saveAll]);

  const applyResult = useCallback<AnswerFn>(
    (card, correct, opts = {}) => {
      const useCombo = opts.combos !== false;
      const nextCombo = correct ? (useCombo ? combo + 1 : combo) : 0;
      const gained = correct ? saXpForAnswer(useCombo ? nextCombo : 0, Boolean(opts.hard)) : 0;
      setState((prev) => {
        if (!prev) return prev;
        const updated = saAnswerCard(prev.cards[card.id] || card, correct);
        const profile = saRegisterAnswer(prev.profile, correct, nextCombo, gained);
        const next: SaState = { ...prev, cards: { ...prev.cards, [card.id]: updated }, profile };
        persist(next);
        return next;
      });
      const s = ss.current;
      s.reviews += 1;
      if (correct) {
        s.correct += 1;
        s.xpGained += gained;
        s.bestCombo = Math.max(s.bestCombo, nextCombo);
        if (useCombo) setCombo(nextCombo);
        if (useCombo && (nextCombo === 3 || nextCombo === 5 || nextCombo === 8 || nextCombo >= 12)) {
          sfx.combo(nextCombo);
          buzz(16);
        } else sfx.correct();
        if (gained > 0) pushFloater(gained);
        buzz(8);
      } else {
        s.mistakes += 1;
        if (useCombo) setCombo(0);
        sfx.wrong();
        buzz([22, 32, 22]);
      }
    },
    [combo, persist, pushFloater]
  );

  const introduceCard = useCallback(
    (card: SaCard) => {
      setState((prev) => {
        if (!prev) return prev;
        const existing = prev.cards[card.id] || card;
        const updated: SaCard = { ...existing, introduced: true, seen: existing.seen + 1, lastSeen: Date.now() };
        const profile = { ...prev.profile, xp: prev.profile.xp + 4 };
        const next: SaState = { ...prev, cards: { ...prev.cards, [card.id]: updated }, profile };
        persist(next);
        return next;
      });
      ss.current.xpGained += 4;
      sfx.tap();
    },
    [persist]
  );

  const mergeGenerated = useCallback(
    (words: SaWord[]) => {
      if (!words.length) return 0;
      setState((prev) => {
        if (!prev) return prev;
        const merged = saMergeWords(prev, words);
        saveAll(merged);
        return merged;
      });
      return words.length;
    },
    [saveAll]
  );

  const generatePack = useCallback(
    async (theme: string) => {
      if (!language || genBusy) return;
      setGenBusy(true);
      setGenProgress(theme ? `Generating “${theme}”…` : "Generating fresh words…");
      try {
        const known = (stateRef.current ? Object.values(stateRef.current.cards) : []).map((c) => c.text);
        const res = await fetch("/api/surge-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, theme, count: 10, existing: known, level: "advanced" }),
        });
        if (!res.ok) throw new Error("bad response");
        const data = await res.json();
        const added = mergeGenerated(mapGenItems(data.items, theme));
        setGenProgress(added ? `Added ${added} new item${added > 1 ? "s" : ""} ✓` : "Nothing new to add");
        sfx.correct();
      } catch {
        setGenProgress("Couldn’t generate — needs an OpenAI key / connection.");
      } finally {
        setGenBusy(false);
      }
    },
    [language, genBusy, mergeGenerated]
  );

  const buildCourse = useCallback(
    async (goal: string) => {
      if (!language || genBusy) return;
      setGenBusy(true);
      setGenProgress("Designing your course…");
      try {
        const res = await fetch("/api/surge-course", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, goal, level: "beginner" }),
        });
        if (!res.ok) throw new Error("bad response");
        const data = await res.json();
        const themes: Array<{ title: string; count?: number }> = Array.isArray(data.themes) ? data.themes : [];
        if (!themes.length) throw new Error("no themes");
        let added = 0;
        for (let i = 0; i < themes.length; i += 1) {
          const th = themes[i];
          setGenProgress(`Building ${i + 1}/${themes.length}: ${th.title}`);
          try {
            const known = (stateRef.current ? Object.values(stateRef.current.cards) : []).map((c) => c.text);
            const r = await fetch("/api/surge-generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ language, theme: th.title, count: th.count || 10, existing: known, level: "advanced" }),
            });
            if (r.ok) {
              const d = await r.json();
              added += mergeGenerated(mapGenItems(d.items, th.title));
            }
          } catch {
            /* skip a failed theme, keep going */
          }
        }
        setGenProgress(added ? `Course ready — added ${added} items across ${themes.length} themes ✓` : "Course build returned nothing");
        sfx.finish();
      } catch {
        setGenProgress("Couldn’t build course — needs an OpenAI key / connection.");
      } finally {
        setGenBusy(false);
      }
    },
    [language, genBusy, mergeGenerated]
  );

  const startSession = useCallback((mode: SaMode = "smart") => {
    const cur = stateRef.current;
    if (!cur) return;
    const cards = mode === "smart" ? saSelectSessionCards(cur) : saSelectPracticeCards(cur, mode);
    if (!cards.length) return;
    const built = mode === "smart" ? saBuildSteps(cards, Object.values(cur.cards), cur.settings) : saBuildFocusSteps(cards, Object.values(cur.cards), cur.settings, mode);
    if (!built.length) return;
    sessionMode.current = mode;
    ss.current = {
      reviews: 0,
      correct: 0,
      xpGained: 0,
      bestCombo: 0,
      mistakes: 0,
      startLevel: saLevelInfo(cur.profile.xp).level,
      startXp: cur.profile.xp,
      startAt: Date.now(),
    };
    setSteps(built);
    setStepIndex(0);
    setCombo(0);
    setScreen("playing");
    ctx();
  }, []);

  const finishSession = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      const masteredCount = Object.values(prev.cards).filter(saIsMastered).length;
      let profile = saCompleteSession(prev.profile);
      const lvl = saLevelInfo(profile.xp).level;
      const newly = saCheckAchievements(profile, {
        bestComboThisSession: ss.current.bestCombo,
        mistakesThisSession: ss.current.mistakes,
        masteredCount,
        level: lvl,
        at: Date.now(),
      });
      if (newly.length) profile = { ...profile, achievements: [...profile.achievements, ...newly] };
      const next: SaState = { ...prev, profile };
      saveAll(next);
      const newlyMastered = Object.values(next.cards).filter((c) => saIsMastered(c) && c.lastSeen >= ss.current.startAt);
      setResult({
        mode: sessionMode.current,
        reviews: ss.current.reviews,
        correct: ss.current.correct,
        xpGained: profile.xp - ss.current.startXp,
        bestCombo: ss.current.bestCombo,
        newlyMastered,
        newAchievements: newly,
        leveledUpTo: lvl > ss.current.startLevel ? lvl : null,
      });
      return next;
    });
    setScreen("summary");
    sfx.finish();
    confettiBurst();
    buzz([16, 32, 16, 32, 48]);
  }, []);

  const advance = useCallback(() => {
    setStepIndex((i) => {
      const next = i + 1;
      if (next >= steps.length) {
        window.setTimeout(() => finishSession(), 0);
        return i;
      }
      return next;
    });
  }, [steps.length, finishSession]);

  const stats = useMemo(() => (state ? saDeckStats(state) : null), [state]);
  const level = useMemo(() => (state ? saLevelInfo(state.profile.xp) : null), [state]);
  const modeAvailability = useMemo(() => {
    const map: Partial<Record<SaMode, number>> = {};
    if (state) for (const m of MODES) map[m.id] = saSelectPracticeCards(state, m.id).length;
    return map;
  }, [state]);

  if (!language) {
    return (
      <div className="nx">
        <NxStyles />
        <div className="nx-empty">
          <div className="nx-empty-orb" />
          <h2>Select a language to begin</h2>
          <p>Your neural deck loads instantly — no setup needed.</p>
        </div>
      </div>
    );
  }
  if (!state || !stats || !level) {
    return (
      <div className="nx">
        <NxStyles />
        <div className="nx-empty">
          <div className="nx-loader" />
          <p>Calibrating your deck…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nx">
      <NxStyles />
      <div className="nx-floaters" aria-hidden>
        {floaters.map((f) => (
          <span key={f.id} className="nx-floater">
            +{f.amount}
          </span>
        ))}
      </div>

      {screen === "hub" && (
        <Hub
          state={state}
          stats={stats}
          level={level}
          enriching={enriching}
          modeAvailability={modeAvailability}
          onStart={startSession}
          onExit={onExit}
          onUpdateSettings={updateSettings}
          onOpenModal={setModal}
        />
      )}

      {screen === "playing" && steps[stepIndex] && (
        <Play
          step={steps[stepIndex]}
          index={stepIndex}
          total={steps.length}
          combo={combo}
          level={level}
          onAnswer={applyResult}
          onIntroduce={introduceCard}
          onAdvance={advance}
          onPlayAudio={onPlayAudio}
          onQuit={finishSession}
        />
      )}

      {screen === "summary" && result && (
        <Summary
          result={result}
          state={state}
          level={level}
          onAgain={() => {
            const m = result.mode;
            setScreen("hub");
            window.setTimeout(() => startSession(m), 50);
          }}
          onHome={() => setScreen("hub")}
        />
      )}

      {modal === "achievements" && <AchievementsModal unlocked={state.profile.achievements} onClose={() => setModal(null)} />}
      {modal === "library" && <LibraryModal state={state} onClose={() => setModal(null)} onPlayAudio={onPlayAudio} />}
      {modal === "stats" && <StatsModal state={state} onClose={() => setModal(null)} onPlayAudio={onPlayAudio} />}
      {modal === "lessons" && language && (
        <LessonsPanel language={language} onClose={() => setModal(null)} loadRemote={onLoadLessons} saveRemote={onSaveLesson} />
      )}
      {modal === "generate" && (
        <GenerateModal
          state={state}
          busy={genBusy}
          progress={genProgress}
          onClose={() => setModal(null)}
          onGenerate={generatePack}
          onBuildCourse={buildCourse}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hub
// ---------------------------------------------------------------------------

function Hub({
  state,
  stats,
  level,
  enriching,
  modeAvailability,
  onStart,
  onExit,
  onUpdateSettings,
  onOpenModal,
}: {
  state: SaState;
  stats: ReturnType<typeof saDeckStats>;
  level: ReturnType<typeof saLevelInfo>;
  enriching: boolean;
  modeAvailability: Partial<Record<SaMode, number>>;
  onStart: (mode?: SaMode) => void;
  onExit?: () => void;
  onUpdateSettings: (patch: Partial<SaSettings>) => void;
  onOpenModal: (m: "achievements" | "library" | "stats" | "generate" | "lessons") => void;
}) {
  const p = state.profile;
  const dailyPct = Math.min(1, p.dailyProgress / Math.max(1, p.dailyGoal));
  const masteredPct = stats.total ? stats.mastered / stats.total : 0;

  return (
    <div className="nx-hub">
      <header className="nx-top">
        {onExit ? (
          <button type="button" className="nx-ico-btn" onClick={onExit} aria-label="Back">
            <Icon name="back" size={20} />
          </button>
        ) : (
          <span />
        )}
        <div className="nx-brand">
          <span className="nx-brand-dot" />
          Surge
        </div>
        <button type="button" className="nx-streak" onClick={() => onOpenModal("achievements")}>
          <span className="nx-streak-ico">
            <Icon name="flame" size={15} />
          </span>
          {p.streak}
        </button>
      </header>

      <section className="nx-hero">
        <div className="nx-hero-ring">
          <Ring progress={level.progress} size={168} stroke={10}>
            <span className="nx-hero-lvl-label">LEVEL</span>
            <span className="nx-hero-lvl">{level.level}</span>
            <span className="nx-hero-xp">{level.intoLevel} / {level.levelSpan} XP</span>
          </Ring>
        </div>
        <p className="nx-hero-sub">
          {stats.due > 0 ? `${stats.due} ready to review` : "Your recall is sharp — keep building."}
          {stats.fresh > 0 ? ` · ${Math.min(6, stats.fresh)} new waiting` : ""}
        </p>
      </section>

      <button type="button" className="nx-cta" onClick={() => onStart("smart")} disabled={stats.total === 0}>
        <span className="nx-cta-glow" />
        <span className="nx-cta-ico">
          <Icon name="smart" size={24} />
        </span>
        <span className="nx-cta-text">
          <span className="nx-cta-main">Smart session</span>
          <span className="nx-cta-sub">
            {[stats.due > 0 ? `${stats.due} due` : null, stats.fresh > 0 ? `${Math.min(6, stats.fresh)} new` : null, "auto-mixed for recall"]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
        <span className="nx-cta-arrow">→</span>
      </button>

      <section className="nx-metrics">
        <Metric value={`${p.dailyProgress}/${p.dailyGoal}`} label="Daily goal" pct={dailyPct} />
        <Metric value={stats.due} label="Due now" accent={stats.due > 0} />
        <Metric value={stats.mastered} label="Mastered" />
        <Metric value={stats.learning} label="Learning" />
      </section>

      <section className="nx-section">
        <div className="nx-section-head">
          <h3>Practice modes</h3>
          <span className="nx-section-hint">{enriching ? "syncing new words…" : "pick your drill"}</span>
        </div>
        <div className="nx-modes">
          {MODES.map((m) => {
            const count = modeAvailability[m.id] ?? 0;
            const disabled = count === 0 || (m.id === "listen" && !state.settings.listening);
            return (
              <button key={m.id} type="button" className="nx-mode" disabled={disabled} onClick={() => onStart(m.id)}>
                <span className="nx-mode-ico">
                  <Icon name={m.icon} size={22} />
                </span>
                <span className="nx-mode-name">{m.name}</span>
                <span className="nx-mode-blurb">{disabled ? (m.id === "listen" ? "turn on listening" : "none ready") : m.blurb}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="nx-section">
        <button type="button" className="nx-row-card accent" onClick={() => onOpenModal("lessons")}>
          <span className="nx-row-ico accent">
            <Icon name="lesson" size={20} />
          </span>
          <span className="nx-row-text">
            <span className="nx-row-title">Lessons</span>
            <span className="nx-row-sub">Structured grammar — generated & saved</span>
          </span>
          <span className="nx-row-arrow">›</span>
        </button>
        <button type="button" className="nx-row-card" onClick={() => onOpenModal("generate")}>
          <span className="nx-row-ico">
            <Icon name="smart" size={20} />
          </span>
          <span className="nx-row-text">
            <span className="nx-row-title">Generate material</span>
            <span className="nx-row-sub">AI-made words, themes & full courses</span>
          </span>
          <span className="nx-row-arrow">›</span>
        </button>
        <button type="button" className="nx-row-card" onClick={() => onOpenModal("stats")}>
          <span className="nx-row-ico">
            <Icon name="choice" size={20} />
          </span>
          <span className="nx-row-text">
            <span className="nx-row-title">Stats</span>
            <span className="nx-row-sub">Progress by word &amp; theme</span>
          </span>
          <span className="nx-row-arrow">›</span>
        </button>
        <button type="button" className="nx-row-card" onClick={() => onOpenModal("library")}>
          <span className="nx-row-ico">
            <Icon name="library" size={20} />
          </span>
          <span className="nx-row-text">
            <span className="nx-row-title">Library</span>
            <span className="nx-row-sub">{stats.total} items · {stats.mastered} mastered</span>
          </span>
          <span className="nx-row-bar">
            <span className="nx-row-bar-fill" style={{ width: `${masteredPct * 100}%` }} />
          </span>
        </button>
        <button type="button" className="nx-row-card" onClick={() => onOpenModal("achievements")}>
          <span className="nx-row-ico">
            <Icon name="trophy" size={20} />
          </span>
          <span className="nx-row-text">
            <span className="nx-row-title">Achievements</span>
            <span className="nx-row-sub">
              {p.achievements.length} / {SA_ACHIEVEMENTS.length} unlocked
            </span>
          </span>
          <span className="nx-row-arrow">›</span>
        </button>
      </section>

      <section className="nx-section">
        <div className="nx-section-head">
          <h3>Settings</h3>
        </div>
        <Toggle label="Listening exercises" hint="Hear it, choose the meaning" checked={state.settings.listening} onChange={(v) => onUpdateSettings({ listening: v })} />
        <Toggle label="Full sentences" hint="Practise complete phrases" checked={state.settings.sentences} onChange={(v) => onUpdateSettings({ sentences: v })} />
      </section>
    </div>
  );
}

function Metric({ value, label, pct, accent }: { value: number | string; label: string; pct?: number; accent?: boolean }) {
  return (
    <div className={`nx-metric ${accent ? "accent" : ""}`}>
      <span className="nx-metric-val">{value}</span>
      <span className="nx-metric-lab">{label}</span>
      {typeof pct === "number" && (
        <span className="nx-metric-bar">
          <span className="nx-metric-bar-fill" style={{ width: `${Math.min(100, pct * 100)}%` }} />
        </span>
      )}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className="nx-toggle" onClick={() => onChange(!checked)} role="switch" aria-checked={checked}>
      <span className="nx-toggle-text">
        <span className="nx-toggle-label">{label}</span>
        {hint && <span className="nx-toggle-hint">{hint}</span>}
      </span>
      <span className={`nx-switch ${checked ? "on" : ""}`}>
        <span className="nx-switch-knob" />
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Play
// ---------------------------------------------------------------------------

function Play({
  step,
  index,
  total,
  combo,
  level,
  onAnswer,
  onIntroduce,
  onAdvance,
  onPlayAudio,
  onQuit,
}: {
  step: SaStep;
  index: number;
  total: number;
  combo: number;
  level: ReturnType<typeof saLevelInfo>;
  onAnswer: AnswerFn;
  onIntroduce: (card: SaCard) => void;
  onAdvance: () => void;
  onPlayAudio?: (text: string) => void;
  onQuit: () => void;
}) {
  const progress = total > 0 ? index / total : 0;
  const mult = saComboMultiplier(combo);
  return (
    <div className="nx-play">
      <div className="nx-play-top">
        <button type="button" className="nx-ico-btn" onClick={onQuit} aria-label="End session">
          <Icon name="close" size={18} />
        </button>
        <div className="nx-progress">
          <div className="nx-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        {combo >= 3 ? (
          <div className="nx-combo">
            {combo}× {mult > 1 && <em>×{mult}</em>}
          </div>
        ) : (
          <div className="nx-lvl-chip">L{level.level}</div>
        )}
      </div>
      <div className="nx-stage" key={index}>
        <GameRouter step={step} onAnswer={onAnswer} onIntroduce={onIntroduce} onAdvance={onAdvance} onPlayAudio={onPlayAudio} />
      </div>
    </div>
  );
}

function GameRouter(props: {
  step: SaStep;
  onAnswer: AnswerFn;
  onIntroduce: (card: SaCard) => void;
  onAdvance: () => void;
  onPlayAudio?: (text: string) => void;
}) {
  const { step, onAnswer, onIntroduce, onAdvance, onPlayAudio } = props;
  switch (step.kind) {
    case "flash":
      return <FlashGame card={step.card} onIntroduce={onIntroduce} onAdvance={onAdvance} onPlayAudio={onPlayAudio} />;
    case "flashReview":
      return <FlashReviewGame card={step.card} onAnswer={onAnswer} onAdvance={onAdvance} onPlayAudio={onPlayAudio} />;
    case "choice":
      return <ChoiceGame step={step} mode="recognition" onAnswer={onAnswer} onAdvance={onAdvance} onPlayAudio={onPlayAudio} />;
    case "produce":
      return <ChoiceGame step={step} mode="production" onAnswer={onAnswer} onAdvance={onAdvance} onPlayAudio={onPlayAudio} />;
    case "listen":
      return <ListenGame step={step} onAnswer={onAnswer} onAdvance={onAdvance} onPlayAudio={onPlayAudio} />;
    case "type":
      return <TypeGame card={step.card} mode="english" onAnswer={onAnswer} onAdvance={onAdvance} onPlayAudio={onPlayAudio} />;
    case "typeTarget":
      return <TypeGame card={step.card} mode="target" onAnswer={onAnswer} onAdvance={onAdvance} onPlayAudio={onPlayAudio} />;
    case "scramble":
      return <ScrambleGame step={step} onAnswer={onAnswer} onAdvance={onAdvance} onPlayAudio={onPlayAudio} />;
    case "trueFalse":
      return <TrueFalseGame step={step} onAnswer={onAnswer} onAdvance={onAdvance} onPlayAudio={onPlayAudio} />;
    case "cloze":
      return <ClozeGame step={step} onAnswer={onAnswer} onAdvance={onAdvance} onPlayAudio={onPlayAudio} />;
    case "match":
      return <MatchGame cards={step.cards} onAnswer={onAnswer} onAdvance={onAdvance} onPlayAudio={onPlayAudio} />;
    case "lightning":
      return <LightningGame cards={step.cards} onAnswer={onAnswer} onAdvance={onAdvance} onPlayAudio={onPlayAudio} />;
    default:
      return null;
  }
}

function StagePips({ card }: { card: SaCard }) {
  return (
    <div className="nx-pips" title={`${card.streak}/${SA_REQUIRED_STREAK} correct in a row to advance`}>
      {Array.from({ length: SA_REQUIRED_STREAK }, (_, i) => (
        <span key={i} className={`nx-pip ${i < card.streak ? "on" : ""}`} />
      ))}
      <span className="nx-pips-label">→ {saStageLabel(card)}</span>
    </div>
  );
}

function FeedbackBar({ status, card, answer, onNext }: { status: "correct" | "wrong"; card: SaCard; answer?: string; onNext: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNext]);
  return (
    <div className={`nx-feedback ${status}`}>
      <div className="nx-feedback-row">
        <div className="nx-feedback-text">
          <span className="nx-feedback-icon">{status === "correct" ? "✓" : "✕"}</span>
          <span>
            {status === "correct" ? "Correct" : "Answer:"} {answer ? <strong>{answer}</strong> : null}
          </span>
        </div>
        <button type="button" className="nx-next" onClick={onNext}>
          Continue
        </button>
      </div>
      {card.note && (
        <div className="nx-note">
          <span className="nx-note-tag">Good to know</span>
          {card.note}
        </div>
      )}
      <StagePips card={saAnswerCard(card, status === "correct")} />
    </div>
  );
}

function AudioButton({ text, onPlayAudio }: { text: string; onPlayAudio?: (t: string) => void }) {
  if (!onPlayAudio) return null;
  return (
    <button type="button" className="nx-audio" onClick={() => onPlayAudio(text)} aria-label="Play audio">
      <Icon name="audio" size={18} />
    </button>
  );
}

function TypeTag({ card }: { card: SaCard }) {
  return <span className="nx-type-tag">{card.type === "sentence" ? "Sentence" : card.type === "phrase" ? "Phrase" : "Word"}</span>;
}

// ---- Flash (meet new) -----------------------------------------------------

function FlashGame({ card, onIntroduce, onAdvance, onPlayAudio }: { card: SaCard; onIntroduce: (card: SaCard) => void; onAdvance: () => void; onPlayAudio?: (text: string) => void }) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    onPlayAudio?.(card.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="nx-game">
      <div className="nx-tag">
        <span className="nx-tag-pill">New</span>
        <TypeTag card={card} />
      </div>
      <div className={`nx-flip ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((f) => !f)}>
        <div className="nx-flip-inner">
          <div className="nx-flip-face nx-flip-front">
            <span className="nx-target">{card.text}</span>
            <AudioButton text={card.text} onPlayAudio={onPlayAudio} />
            <span className="nx-flip-hint">tap to reveal</span>
          </div>
          <div className="nx-flip-face nx-flip-back">
            <span className="nx-trans">{card.translation}</span>
            {card.note && (
              <div className="nx-note inline">
                <span className="nx-note-tag">Good to know</span>
                {card.note}
              </div>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        className="nx-next big"
        onClick={() => {
          onIntroduce(card);
          onAdvance();
        }}
      >
        Got it
      </button>
    </div>
  );
}

// ---- Flashcard review (self-graded) ---------------------------------------

function FlashReviewGame({ card, onAnswer, onAdvance, onPlayAudio }: { card: SaCard; onAnswer: AnswerFn; onAdvance: () => void; onPlayAudio?: (text: string) => void }) {
  const [flipped, setFlipped] = useState(false);
  const grade = (good: boolean) => {
    onAnswer(card, good);
    onAdvance();
  };
  return (
    <div className="nx-game">
      <div className="nx-tag">
        Flashcard <TypeTag card={card} />
      </div>
      <div className={`nx-flip ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((f) => !f)}>
        <div className="nx-flip-inner">
          <div className="nx-flip-face nx-flip-front">
            <span className="nx-target">{card.text}</span>
            <AudioButton text={card.text} onPlayAudio={onPlayAudio} />
            <span className="nx-flip-hint">tap to flip</span>
          </div>
          <div className="nx-flip-face nx-flip-back">
            <span className="nx-trans">{card.translation}</span>
            {card.note && (
              <div className="nx-note inline">
                <span className="nx-note-tag">Good to know</span>
                {card.note}
              </div>
            )}
          </div>
        </div>
      </div>
      {flipped ? (
        <div className="nx-grade">
          <button type="button" className="nx-grade-btn again" onClick={() => grade(false)}>
            Again
          </button>
          <button type="button" className="nx-grade-btn good" onClick={() => grade(true)}>
            Got it
          </button>
        </div>
      ) : (
        <button type="button" className="nx-next big" onClick={() => setFlipped(true)}>
          Reveal
        </button>
      )}
    </div>
  );
}

// ---- Choice ---------------------------------------------------------------

function ChoiceGame({
  step,
  mode,
  onAnswer,
  onAdvance,
  onPlayAudio,
}: {
  step: Extract<SaStep, { kind: "choice" | "produce" }>;
  mode: "recognition" | "production";
  onAnswer: AnswerFn;
  onAdvance: () => void;
  onPlayAudio?: (text: string) => void;
}) {
  const card = step.card;
  const matchMode = mode === "recognition" ? "english" : "target";
  const prompt = mode === "recognition" ? card.text : card.translation;
  const answer = mode === "recognition" ? card.translation : card.text;
  const [picked, setPicked] = useState<string | null>(null);
  const correct = picked !== null && saMatchesAnswer(picked, answer, matchMode);
  const choose = (opt: string) => {
    if (picked !== null) return;
    setPicked(opt);
    onAnswer(card, saMatchesAnswer(opt, answer, matchMode), { hard: mode === "production" });
  };
  return (
    <div className="nx-game">
      <div className="nx-tag">
        {mode === "recognition" ? "What does this mean?" : "Choose the translation"} <TypeTag card={card} />
      </div>
      <div className="nx-prompt">
        <span className={mode === "recognition" ? "nx-target" : "nx-trans"}>{prompt}</span>
        {mode === "recognition" && <AudioButton text={card.text} onPlayAudio={onPlayAudio} />}
      </div>
      <div className="nx-options">
        {step.options.map((opt) => {
          const isAnswer = saMatchesAnswer(opt, answer, matchMode);
          const cls = picked === null ? "" : isAnswer ? "right" : picked === opt ? "wrong" : "dim";
          return (
            <button key={opt} type="button" className={`nx-opt ${cls}`} onClick={() => choose(opt)} disabled={picked !== null}>
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && <FeedbackBar status={correct ? "correct" : "wrong"} card={card} answer={correct ? undefined : answer} onNext={onAdvance} />}
    </div>
  );
}

// ---- Listen ---------------------------------------------------------------

function ListenGame({ step, onAnswer, onAdvance, onPlayAudio }: { step: Extract<SaStep, { kind: "listen" }>; onAnswer: AnswerFn; onAdvance: () => void; onPlayAudio?: (text: string) => void }) {
  const card = step.card;
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const correct = picked !== null && saMatchesAnswer(picked, card.translation, "english");
  useEffect(() => {
    onPlayAudio?.(card.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const choose = (opt: string) => {
    if (picked !== null) return;
    setPicked(opt);
    setRevealed(true);
    onAnswer(card, saMatchesAnswer(opt, card.translation, "english"));
  };
  return (
    <div className="nx-game">
      <div className="nx-tag">Listen and choose</div>
      <button type="button" className="nx-listen" onClick={() => onPlayAudio?.(card.text)}>
        <span className="nx-listen-ico">
          <Icon name="listen" size={34} />
        </span>
        <span>Play again</span>
      </button>
      {revealed && <div className="nx-listen-word">{card.text}</div>}
      <div className="nx-options">
        {step.options.map((opt) => {
          const isAnswer = saMatchesAnswer(opt, card.translation, "english");
          const cls = picked === null ? "" : isAnswer ? "right" : picked === opt ? "wrong" : "dim";
          return (
            <button key={opt} type="button" className={`nx-opt ${cls}`} onClick={() => choose(opt)} disabled={picked !== null}>
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && <FeedbackBar status={correct ? "correct" : "wrong"} card={card} answer={correct ? undefined : card.translation} onNext={onAdvance} />}
    </div>
  );
}

// ---- Type -----------------------------------------------------------------

function TypeGame({ card, mode, onAnswer, onAdvance, onPlayAudio }: { card: SaCard; mode: "english" | "target"; onAnswer: AnswerFn; onAdvance: () => void; onPlayAudio?: (text: string) => void }) {
  const prompt = mode === "english" ? card.text : card.translation;
  const answer = mode === "english" ? card.translation : card.text;
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [hints, setHints] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const correct = checked && saMatchesAnswer(value, answer, mode);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const submit = () => {
    if (checked) {
      onAdvance();
      return;
    }
    if (!value.trim()) return;
    setChecked(true);
    onAnswer(card, saMatchesAnswer(value, answer, mode), { hard: mode === "target" });
  };
  const hintText = answer
    .split("")
    .map((ch, i) => (i < hints || ch === " " ? ch : "•"))
    .join("");
  return (
    <div className="nx-game">
      <div className="nx-tag">
        {mode === "english" ? "Type the meaning" : "Type it in the target language"} <TypeTag card={card} />
      </div>
      <div className="nx-prompt">
        <span className={mode === "english" ? "nx-target" : "nx-trans"}>{prompt}</span>
        {mode === "english" && <AudioButton text={card.text} onPlayAudio={onPlayAudio} />}
      </div>
      <input
        ref={inputRef}
        className={`nx-input ${checked ? (correct ? "right" : "wrong") : ""}`}
        value={value}
        disabled={checked}
        placeholder="Type your answer…"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {!checked && (
        <div className="nx-type-tools">
          <button type="button" className="nx-ghost" onClick={() => setHints((h) => Math.min(answer.length, h + 1))}>
            Hint
          </button>
          {hints > 0 && <span className="nx-hint">{hintText}</span>}
          <button type="button" className="nx-next" onClick={submit} disabled={!value.trim()}>
            Check
          </button>
        </div>
      )}
      {checked && <FeedbackBar status={correct ? "correct" : "wrong"} card={card} answer={correct ? undefined : answer} onNext={onAdvance} />}
    </div>
  );
}

// ---- Scramble -------------------------------------------------------------

function ScrambleGame({ step, onAnswer, onAdvance, onPlayAudio }: { step: Extract<SaStep, { kind: "scramble" }>; onAnswer: AnswerFn; onAdvance: () => void; onPlayAudio?: (text: string) => void }) {
  const card = step.card;
  const joiner = step.byWord ? " " : "";
  const target = step.byWord ? card.text.trim().split(/\s+/).join(" ") : card.text.trim().split(/\s+/).sort((a, b) => b.length - a.length)[0] || card.text;
  const [bank, setBank] = useState<string[]>(step.tokens);
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const built = picked.join(joiner);
  const correct = checked && saMatchesAnswer(built, target, "target");
  const take = (tok: string, i: number) => {
    if (checked) return;
    sfx.tap();
    setPicked((p) => [...p, tok]);
    setBank((b) => b.filter((_, idx) => idx !== i));
  };
  const undo = (i: number) => {
    if (checked) return;
    setBank((b) => [...b, picked[i]]);
    setPicked((p) => p.filter((_, idx) => idx !== i));
  };
  const submit = () => {
    if (checked) {
      onAdvance();
      return;
    }
    if (!picked.length) return;
    setChecked(true);
    onAnswer(card, saMatchesAnswer(built, target, "target"), { hard: true });
  };
  return (
    <div className="nx-game">
      <div className="nx-tag">
        Build the {step.byWord ? "sentence" : "word"} <TypeTag card={card} />
      </div>
      <div className="nx-prompt">
        <span className="nx-trans">{card.translation}</span>
        <AudioButton text={card.text} onPlayAudio={onPlayAudio} />
      </div>
      <div className={`nx-scramble-line ${checked ? (correct ? "right" : "wrong") : ""}`}>
        {picked.length === 0 ? <span className="nx-scramble-ph">tap the tiles…</span> : null}
        {picked.map((tok, i) => (
          <button key={`${tok}-${i}`} type="button" className="nx-tile picked" onClick={() => undo(i)}>
            {tok}
          </button>
        ))}
      </div>
      <div className="nx-scramble-bank">
        {bank.map((tok, i) => (
          <button key={`${tok}-${i}`} type="button" className="nx-tile" onClick={() => take(tok, i)}>
            {tok}
          </button>
        ))}
      </div>
      {!checked && (
        <button type="button" className="nx-next" onClick={submit} disabled={!picked.length}>
          Check
        </button>
      )}
      {checked && <FeedbackBar status={correct ? "correct" : "wrong"} card={card} answer={correct ? undefined : target} onNext={onAdvance} />}
    </div>
  );
}

// ---- True / False ---------------------------------------------------------

function TrueFalseGame({ step, onAnswer, onAdvance, onPlayAudio }: { step: Extract<SaStep, { kind: "trueFalse" }>; onAnswer: AnswerFn; onAdvance: () => void; onPlayAudio?: (text: string) => void }) {
  const card = step.card;
  const [judged, setJudged] = useState<null | boolean>(null);
  const ok = judged !== null && judged === step.isCorrect;
  const judge = (asTrue: boolean) => {
    if (judged !== null) return;
    setJudged(asTrue);
    onAnswer(card, asTrue === step.isCorrect);
  };
  return (
    <div className="nx-game">
      <div className="nx-tag">Does this match?</div>
      <div className="nx-tf">
        <div className="nx-tf-pair">
          <span className="nx-target">{card.text}</span>
          <AudioButton text={card.text} onPlayAudio={onPlayAudio} />
        </div>
        <span className="nx-tf-eq">=</span>
        <span className="nx-trans">{step.shown}</span>
      </div>
      <div className="nx-tf-actions">
        <button type="button" className={`nx-tf-btn no ${judged === false ? (ok ? "right" : "wrong") : ""}`} onClick={() => judge(false)} disabled={judged !== null}>
          ✕ Wrong
        </button>
        <button type="button" className={`nx-tf-btn yes ${judged === true ? (ok ? "right" : "wrong") : ""}`} onClick={() => judge(true)} disabled={judged !== null}>
          ✓ Correct
        </button>
      </div>
      {judged !== null && <FeedbackBar status={ok ? "correct" : "wrong"} card={card} answer={ok ? undefined : `${card.text} = ${card.translation}`} onNext={onAdvance} />}
    </div>
  );
}

// ---- Cloze (fill the gap) -------------------------------------------------

function ClozeGame({ step, onAnswer, onAdvance, onPlayAudio }: { step: Extract<SaStep, { kind: "cloze" }>; onAnswer: AnswerFn; onAdvance: () => void; onPlayAudio?: (text: string) => void }) {
  const card = step.card;
  const [picked, setPicked] = useState<string | null>(null);
  const correct = picked !== null && saMatchesAnswer(picked, step.answer, "target");
  const choose = (opt: string) => {
    if (picked !== null) return;
    setPicked(opt);
    onAnswer(card, saMatchesAnswer(opt, step.answer, "target"), { hard: true });
  };
  const parts = step.masked.split("____");
  return (
    <div className="nx-game">
      <div className="nx-tag">
        Fill the gap <TypeTag card={card} />
      </div>
      <div className="nx-cloze-sentence">
        {parts[0]}
        <span className={`nx-cloze-blank ${picked !== null ? (correct ? "right" : "wrong") : ""}`}>{picked !== null ? step.answer : "____"}</span>
        {parts[1]}
        <AudioButton text={card.text} onPlayAudio={onPlayAudio} />
      </div>
      <div className="nx-cloze-trans">{card.translation}</div>
      <div className="nx-options">
        {step.options.map((opt) => {
          const isAnswer = saMatchesAnswer(opt, step.answer, "target");
          const cls = picked === null ? "" : isAnswer ? "right" : picked === opt ? "wrong" : "dim";
          return (
            <button key={opt} type="button" className={`nx-opt ${cls}`} onClick={() => choose(opt)} disabled={picked !== null}>
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && <FeedbackBar status={correct ? "correct" : "wrong"} card={card} answer={correct ? undefined : step.answer} onNext={onAdvance} />}
    </div>
  );
}

// ---- Match ----------------------------------------------------------------

function MatchGame({ cards, onAnswer, onAdvance, onPlayAudio }: { cards: SaCard[]; onAnswer: AnswerFn; onAdvance: () => void; onPlayAudio?: (text: string) => void }) {
  const targets = useMemo(() => saShuffle(cards), [cards]);
  const translations = useMemo(() => saShuffle(cards), [cards]);
  const [matched, setMatched] = useState<string[]>([]);
  const [selT, setSelT] = useState<string | null>(null);
  const [selE, setSelE] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      const t = window.setTimeout(onAdvance, 420);
      return () => window.clearTimeout(t);
    }
  }, [matched.length, cards.length, onAdvance]);
  const attempt = (t: string | null, e: string | null) => {
    if (!t || !e) return;
    if (t === e) {
      const card = cards.find((c) => c.id === t);
      if (card) {
        onAnswer(card, true);
        onPlayAudio?.(card.text);
      }
      setMatched((m) => [...m, t]);
      setSelT(null);
      setSelE(null);
    } else {
      sfx.wrong();
      buzz(16);
      setWrong(`${t}:${e}`);
      window.setTimeout(() => {
        setWrong(null);
        setSelT(null);
        setSelE(null);
      }, 360);
    }
  };
  const cls = (id: string, sel: boolean) => (matched.includes(id) ? "matched" : wrong && wrong.includes(id) ? "wrong" : sel ? "sel" : "");
  return (
    <div className="nx-game">
      <div className="nx-tag">Match the pairs</div>
      <div className="nx-match">
        <div className="nx-match-col">
          {targets.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`nx-match-cell ${cls(c.id, selT === c.id)}`}
              disabled={matched.includes(c.id)}
              onClick={() => {
                if (matched.includes(c.id)) return;
                sfx.tap();
                const n = selT === c.id ? null : c.id;
                setSelT(n);
                attempt(n, selE);
              }}
            >
              {c.text}
            </button>
          ))}
        </div>
        <div className="nx-match-col">
          {translations.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`nx-match-cell trans ${cls(c.id, selE === c.id)}`}
              disabled={matched.includes(c.id)}
              onClick={() => {
                if (matched.includes(c.id)) return;
                sfx.tap();
                const n = selE === c.id ? null : c.id;
                setSelE(n);
                attempt(selT, n);
              }}
            >
              {c.translation}
            </button>
          ))}
        </div>
      </div>
      <div className="nx-match-count">
        {matched.length} / {cards.length}
      </div>
    </div>
  );
}

// ---- Lightning ------------------------------------------------------------

const LIGHTNING_TIME = 5000;

function LightningGame({ cards, onAnswer, onAdvance, onPlayAudio }: { cards: SaCard[]; onAnswer: AnswerFn; onAdvance: () => void; onPlayAudio?: (text: string) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(LIGHTNING_TIME);
  const [intro, setIntro] = useState(true);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const card = cards[i];
  const options = useMemo(() => {
    if (!card) return [];
    const wrong = saShuffle(cards.filter((c) => c.id !== card.id)).slice(0, 3).map((c) => c.translation);
    return saShuffle([card.translation, ...wrong]);
  }, [card, cards]);
  const next = useCallback(() => {
    setPicked(null);
    setI((prev) => {
      if (prev + 1 >= cards.length) {
        window.setTimeout(onAdvance, 200);
        return prev;
      }
      return prev + 1;
    });
  }, [cards.length, onAdvance]);
  const answer = useCallback(
    (opt: string | null) => {
      if (picked !== null || !card) return;
      const ok = opt !== null && saMatchesAnswer(opt, card.translation, "english");
      setPicked(opt ?? "__timeout__");
      onAnswer(card, ok);
      window.setTimeout(next, 460);
    },
    [picked, card, onAnswer, next]
  );
  useEffect(() => {
    if (!intro) return;
    const t = window.setTimeout(() => setIntro(false), 850);
    return () => window.clearTimeout(t);
  }, [intro]);
  useEffect(() => {
    if (intro || picked !== null || !card) return;
    startRef.current = performance.now();
    const tick = () => {
      const left = Math.max(0, LIGHTNING_TIME - (performance.now() - startRef.current));
      setTimeLeft(left);
      if (left <= 0) {
        answer(null);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [i, intro, picked, card, answer]);
  if (intro) {
    return (
      <div className="nx-game nx-lightning-intro">
        <div className="nx-bolt">
          <Icon name="lightning" size={56} />
        </div>
        <h2>Lightning Round</h2>
        <p>Be quick — combos count.</p>
      </div>
    );
  }
  if (!card) return null;
  const pct = (timeLeft / LIGHTNING_TIME) * 100;
  return (
    <div className="nx-game">
      <div className="nx-lightning-timer">
        <div className={`nx-lightning-fill ${pct < 30 ? "low" : ""}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="nx-tag">
        {i + 1} / {cards.length}
      </div>
      <div className="nx-prompt">
        <span className="nx-target">{card.text}</span>
        <AudioButton text={card.text} onPlayAudio={onPlayAudio} />
      </div>
      <div className="nx-options">
        {options.map((opt) => {
          const isAnswer = saMatchesAnswer(opt, card.translation, "english");
          const cls = picked === null ? "" : isAnswer ? "right" : picked === opt ? "wrong" : "dim";
          return (
            <button key={opt} type="button" className={`nx-opt ${cls}`} onClick={() => answer(opt)} disabled={picked !== null}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---- Summary --------------------------------------------------------------

function Summary({ result, state, level, onAgain, onHome }: { result: SessionResult; state: SaState; level: ReturnType<typeof saLevelInfo>; onAgain: () => void; onHome: () => void }) {
  const accuracy = result.reviews > 0 ? Math.round((result.correct / result.reviews) * 100) : 0;
  const stats = saDeckStats(state);
  return (
    <div className="nx-summary">
      <div className="nx-summary-card">
        <div className="nx-summary-orb" />
        <h2 className="nx-summary-title">Session complete</h2>
        {result.leveledUpTo !== null && <div className="nx-levelup">Level up — you reached level {result.leveledUpTo}</div>}
        <div className="nx-summary-xp">+{result.xpGained} XP</div>
        <div className="nx-summary-grid">
          <Metric value={result.reviews} label="reviews" />
          <Metric value={`${accuracy}%`} label="accuracy" accent={accuracy >= 80} />
          <Metric value={`${result.bestCombo}×`} label="best combo" />
          <Metric value={state.profile.streak} label="day streak" />
        </div>
        {result.newlyMastered.length > 0 && (
          <div className="nx-mastered">
            <div className="nx-mastered-title">Mastered {result.newlyMastered.length} item{result.newlyMastered.length > 1 ? "s" : ""}</div>
            <div className="nx-mastered-list">
              {result.newlyMastered.slice(0, 8).map((c) => (
                <span key={c.id} className="nx-mastered-chip">
                  {c.text}
                </span>
              ))}
            </div>
          </div>
        )}
        {result.newAchievements.length > 0 && (
          <div className="nx-achv-unlocked">
            {result.newAchievements.map((id) => {
              const a = saAchievementById(id);
              if (!a) return null;
              return (
                <div key={id} className="nx-achv-pop">
                  <span className="nx-achv-ic">{a.icon}</span>
                  <div>
                    <div className="nx-achv-name">{a.title}</div>
                    <div className="nx-achv-blurb">{a.blurb}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="nx-summary-progress">
          <div className="nx-summary-track">
            <div className="nx-summary-fill" style={{ width: `${level.progress * 100}%` }} />
          </div>
          <span>
            Level {level.level} · {level.intoLevel}/{level.levelSpan} XP · {stats.due} due
          </span>
        </div>
        <div className="nx-summary-actions">
          <button type="button" className="nx-ghost big" onClick={onHome}>
            Home
          </button>
          <button type="button" className="nx-cta compact" onClick={onAgain}>
            <span className="nx-cta-text">
              <span className="nx-cta-main">{stats.due > 0 || stats.fresh > 0 ? "Keep going" : "Again"}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Library --------------------------------------------------------------

function LibraryModal({ state, onClose, onPlayAudio }: { state: SaState; onClose: () => void; onPlayAudio?: (text: string) => void }) {
  const [q, setQ] = useState("");
  const all = useMemo(() => saLibrary(state), [state]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase();
    if (!needle) return all;
    return all.filter((c) => c.text.toLocaleLowerCase().includes(needle) || c.translation.toLocaleLowerCase().includes(needle));
  }, [all, q]);
  const stats = saDeckStats(state);
  return (
    <div className="nx-modal-overlay" onClick={onClose}>
      <div className="nx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nx-modal-head">
          <h3>Library</h3>
          <button type="button" className="nx-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="nx-lib-stats">
          <span>{stats.total} items</span>
          <span>{stats.mastered} mastered</span>
          <span>{stats.due} due</span>
        </div>
        <input className="nx-lib-search" value={q} placeholder="Search words…" onChange={(e) => setQ(e.target.value)} />
        <div className="nx-lib-list">
          {filtered.map((c) => {
            const status = saIsMastered(c) ? "mastered" : !c.introduced ? "new" : saIsDue(c) ? "due" : "learning";
            return (
              <div key={c.id} className="nx-lib-row" onClick={() => onPlayAudio?.(c.text)}>
                <div className="nx-lib-main">
                  <span className="nx-lib-text">{c.text}</span>
                  <span className="nx-lib-trans">{c.translation}</span>
                </div>
                <div className="nx-lib-meta">
                  <span className={`nx-lib-badge ${status}`}>{status === "new" ? "new" : saStageLabel(c)}</span>
                  {c.introduced && !saIsMastered(c) && <span className="nx-lib-due">{relativeDue(c.dueAt)}</span>}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="nx-lib-empty">No matches.</div>}
        </div>
      </div>
    </div>
  );
}

// ---- Stats ----------------------------------------------------------------

function StatsModal({ state, onClose, onPlayAudio }: { state: SaState; onClose: () => void; onPlayAudio?: (text: string) => void }) {
  const themes = useMemo(() => saThemeStats(state), [state]);
  const weak = useMemo(() => saWeakCards(state, 8), [state]);
  const deck = saDeckStats(state);
  const overallAcc = useMemo(() => {
    let seen = 0;
    let correct = 0;
    for (const c of Object.values(state.cards)) {
      seen += c.seen;
      correct += c.correct;
    }
    return seen > 0 ? Math.round((correct / seen) * 100) : 0;
  }, [state]);
  return (
    <div className="nx-modal-overlay" onClick={onClose}>
      <div className="nx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nx-modal-head">
          <h3>Your stats</h3>
          <button type="button" className="nx-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="nx-stats-top">
          <div className="nx-stats-big">
            <span className="nx-stats-big-val">{deck.mastered}</span>
            <span className="nx-stats-big-lab">mastered</span>
          </div>
          <div className="nx-stats-big">
            <span className="nx-stats-big-val">{deck.learning}</span>
            <span className="nx-stats-big-lab">learning</span>
          </div>
          <div className="nx-stats-big">
            <span className="nx-stats-big-val">{overallAcc}%</span>
            <span className="nx-stats-big-lab">accuracy</span>
          </div>
          <div className="nx-stats-big">
            <span className="nx-stats-big-val">{state.profile.totalReviews}</span>
            <span className="nx-stats-big-lab">reviews</span>
          </div>
        </div>

        <div className="nx-stats-section-title">By theme</div>
        <div className="nx-theme-list">
          {themes.map((t) => (
            <div key={t.theme} className="nx-theme-row">
              <div className="nx-theme-head">
                <span className="nx-theme-name">{t.theme}</span>
                <span className="nx-theme-meta">
                  {t.mastered}/{t.total} mastered{t.due > 0 ? ` · ${t.due} due` : ""}
                </span>
              </div>
              <div className="nx-theme-bar">
                <div className="nx-theme-bar-fill" style={{ width: `${Math.max(2, t.progress * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {weak.length > 0 && (
          <>
            <div className="nx-stats-section-title">Needs work</div>
            <div className="nx-weak-list">
              {weak.map((c) => (
                <div key={c.id} className="nx-weak-row" onClick={() => onPlayAudio?.(c.text)}>
                  <div className="nx-weak-main">
                    <span className="nx-weak-text">{c.text}</span>
                    <span className="nx-weak-trans">{c.translation}</span>
                  </div>
                  <div className="nx-weak-meta">
                    <span className="nx-weak-acc">{Math.round(saCardAccuracy(c) * 100)}%</span>
                    <span className="nx-weak-stage">{saStageLabel(c)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---- Generate -------------------------------------------------------------

function GenerateModal({
  state,
  busy,
  progress,
  onClose,
  onGenerate,
  onBuildCourse,
}: {
  state: SaState;
  busy: boolean;
  progress: string;
  onClose: () => void;
  onGenerate: (theme: string) => void;
  onBuildCourse: (goal: string) => void;
}) {
  const [theme, setTheme] = useState("");
  const [goal, setGoal] = useState("");
  const existingThemes = useMemo(() => Array.from(new Set(Object.values(state.cards).map(saCardTheme))).slice(0, 8), [state]);
  return (
    <div className="nx-modal-overlay" onClick={busy ? undefined : onClose}>
      <div className="nx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nx-modal-head">
          <h3>Generate material</h3>
          <button type="button" className="nx-ghost" onClick={onClose} disabled={busy}>
            Close
          </button>
        </div>

        <div className="nx-gen-block">
          <div className="nx-gen-label">Add a themed pack</div>
          <input
            className="nx-lib-search"
            value={theme}
            placeholder="e.g. At the restaurant, Travel, Past tense…"
            onChange={(e) => setTheme(e.target.value)}
            disabled={busy}
          />
          <div className="nx-gen-chips">
            {existingThemes.map((t) => (
              <button key={t} type="button" className="nx-gen-chip" onClick={() => setTheme(t)} disabled={busy}>
                {t}
              </button>
            ))}
          </div>
          <div className="nx-gen-actions">
            <button type="button" className="nx-ghost" onClick={() => onGenerate("")} disabled={busy}>
              Surprise me
            </button>
            <button type="button" className="nx-next" onClick={() => onGenerate(theme.trim())} disabled={busy || !theme.trim()}>
              Generate 10
            </button>
          </div>
        </div>

        <div className="nx-gen-divider">or</div>

        <div className="nx-gen-block">
          <div className="nx-gen-label">Design a full course (gpt-5.5)</div>
          <input
            className="nx-lib-search"
            value={goal}
            placeholder="Your goal, e.g. order food & chat on a trip"
            onChange={(e) => setGoal(e.target.value)}
            disabled={busy}
          />
          <button type="button" className="nx-cta compact" onClick={() => onBuildCourse(goal.trim() || "everyday conversational fluency")} disabled={busy}>
            <span className="nx-cta-text">
              <span className="nx-cta-main">Build my course</span>
            </span>
          </button>
        </div>

        {(busy || progress) && (
          <div className={`nx-gen-status ${busy ? "busy" : ""}`}>
            {busy && <span className="nx-gen-spinner" />}
            {progress || "Working…"}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Achievements ---------------------------------------------------------

function AchievementsModal({ unlocked, onClose }: { unlocked: string[]; onClose: () => void }) {
  const set = new Set(unlocked);
  return (
    <div className="nx-modal-overlay" onClick={onClose}>
      <div className="nx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nx-modal-head">
          <h3>Achievements</h3>
          <button type="button" className="nx-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="nx-achv-grid">
          {SA_ACHIEVEMENTS.map((a) => {
            const has = set.has(a.id);
            return (
              <div key={a.id} className={`nx-achv-tile ${has ? "got" : "locked"}`}>
                <span className="nx-achv-tile-ic">{has ? a.icon : "🔒"}</span>
                <div className="nx-achv-tile-name">{a.title}</div>
                <div className="nx-achv-tile-blurb">{a.blurb}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---- Ring -----------------------------------------------------------------

function Ring({ progress, size, stroke, children }: { progress: number; size: number; stroke: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <div className="nx-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="nx-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5b5bf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--nx-track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#nx-ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="nx-ring-content">{children}</div>
    </div>
  );
}

function NxStyles() {
  return <style dangerouslySetInnerHTML={{ __html: NX_CSS }} />;
}

const NX_CSS = `
.nx{--nx-bg:#fbfcfe;--nx-surface:#ffffff;--nx-surface2:#f5f7fb;--nx-ink:#0b0e17;--nx-ink2:#6b7384;--nx-line:#eceef4;--nx-line2:#e3e6ef;--nx-accent:#5b5bf6;--nx-accent2:#22d3ee;--nx-good:#10b981;--nx-warn:#f4516c;--nx-track:#e9ecf4;--nx-shadow:0 1px 2px rgba(11,14,23,.04),0 16px 36px -22px rgba(30,40,90,.28);--nx-radius:20px;color:var(--nx-ink);font-family:inherit;position:relative;letter-spacing:-0.01em;min-height:100vh;background:radial-gradient(130% 60% at 50% -8%,rgba(91,91,246,.07),transparent 58%),radial-gradient(90% 50% at 100% 0%,rgba(34,211,238,.06),transparent 55%),var(--nx-bg);}
.nx-hub,.nx-play,.nx-summary,.nx-empty{max-width:620px;margin:0 auto;padding:16px 16px 56px;}
.nx *{box-sizing:border-box;}
.nx-empty{text-align:center;padding:80px 20px;color:var(--nx-ink2);}
.nx-empty h2{color:var(--nx-ink);margin:14px 0 6px;font-weight:700;}
.nx-empty-orb{width:64px;height:64px;border-radius:50%;margin:0 auto;background:radial-gradient(circle at 35% 30%,#fff,#22d3ee 40%,#5b5bf6 75%);box-shadow:0 0 40px -6px rgba(91,91,246,.5);animation:nx-pulse 2.4s ease-in-out infinite;}
.nx-loader{width:40px;height:40px;border-radius:50%;border:3px solid var(--nx-track);border-top-color:var(--nx-accent);margin:0 auto 16px;animation:nx-spin .8s linear infinite;}
@keyframes nx-spin{to{transform:rotate(360deg);}}
@keyframes nx-pulse{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.08);opacity:.85;}}

.nx-floaters{position:fixed;top:30%;left:50%;transform:translateX(-50%);z-index:60;pointer-events:none;}
.nx-floater{font-weight:800;font-size:26px;color:var(--nx-good);animation:nx-float .85s ease-out forwards;display:block;text-align:center;}
@keyframes nx-float{0%{opacity:0;transform:translateY(8px) scale(.8);}25%{opacity:1;transform:translateY(-4px) scale(1.12);}100%{opacity:0;transform:translateY(-50px) scale(1);}}

/* top */
.nx-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.nx-ico-btn{background:var(--nx-surface);border:1px solid var(--nx-line);color:var(--nx-ink);width:40px;height:40px;border-radius:13px;display:grid;place-items:center;cursor:pointer;box-shadow:var(--nx-shadow);transition:transform .1s;}
.nx-ico-btn:active{transform:scale(.94);}
.nx-brand{font-weight:800;font-size:18px;display:flex;align-items:center;gap:8px;}
.nx-brand-dot{width:11px;height:11px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#22d3ee 45%,#5b5bf6 80%);box-shadow:0 0 12px -1px rgba(91,91,246,.7);}
.nx-streak{display:flex;align-items:center;gap:6px;background:var(--nx-surface);border:1px solid var(--nx-line);border-radius:14px;padding:8px 13px;font-weight:800;cursor:pointer;color:var(--nx-ink);box-shadow:var(--nx-shadow);}
.nx-streak-ico{color:#f97316;display:grid;place-items:center;}

/* hero */
.nx-hero{display:flex;flex-direction:column;align-items:center;gap:12px;margin:8px 0 22px;}
.nx-hero-ring{position:relative;}
.nx-hero-ring::after{content:"";position:absolute;inset:-12px;border-radius:50%;background:radial-gradient(circle,rgba(91,91,246,.14),transparent 70%);z-index:-1;}
.nx-ring{position:relative;display:grid;place-items:center;}
.nx-ring-content{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.nx-hero-lvl-label{font-size:10px;letter-spacing:2.5px;color:var(--nx-ink2);font-weight:700;}
.nx-hero-lvl{font-size:50px;font-weight:800;line-height:1;letter-spacing:-0.03em;}
.nx-hero-xp{font-size:12px;color:var(--nx-ink2);margin-top:4px;}
.nx-hero-sub{margin:0;color:var(--nx-ink2);font-size:14px;text-align:center;}

/* CTA */
.nx-cta{position:relative;width:100%;border:none;border-radius:var(--nx-radius);padding:18px 20px;background:linear-gradient(120deg,#5b5bf6,#6d6df8 55%,#22d3ee 140%);color:#fff;cursor:pointer;display:flex;align-items:center;gap:14px;overflow:hidden;box-shadow:0 14px 30px -12px rgba(91,91,246,.65);transition:transform .12s,box-shadow .2s;text-align:left;}
.nx-cta:hover{transform:translateY(-2px);}
.nx-cta:active{transform:translateY(1px) scale(.995);}
.nx-cta:disabled{opacity:.5;cursor:not-allowed;}
.nx-cta-glow{position:absolute;top:-40%;right:-10%;width:200px;height:200px;background:radial-gradient(circle,rgba(255,255,255,.35),transparent 70%);pointer-events:none;}
.nx-cta-ico{width:46px;height:46px;border-radius:13px;background:rgba(255,255,255,.18);display:grid;place-items:center;flex-shrink:0;}
.nx-cta-text{flex:1;display:flex;flex-direction:column;gap:3px;}
.nx-cta-main{font-size:19px;font-weight:800;}
.nx-cta-sub{font-size:12.5px;opacity:.92;}
.nx-cta-arrow{font-size:22px;opacity:.9;}
.nx-cta.compact{padding:15px;justify-content:center;flex:1;}
.nx-cta.compact .nx-cta-main{font-size:16px;}

/* metrics */
.nx-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0;}
.nx-metric{background:var(--nx-surface);border:1px solid var(--nx-line);border-radius:16px;padding:14px 8px 12px;display:flex;flex-direction:column;align-items:center;gap:3px;box-shadow:var(--nx-shadow);}
.nx-metric-val{font-size:21px;font-weight:800;letter-spacing:-0.02em;}
.nx-metric-lab{font-size:10.5px;color:var(--nx-ink2);text-align:center;}
.nx-metric.accent .nx-metric-val{color:var(--nx-accent);}
.nx-metric-bar{width:100%;height:4px;border-radius:99px;background:var(--nx-track);overflow:hidden;margin-top:4px;}
.nx-metric-bar-fill{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--nx-accent),var(--nx-accent2));}

/* sections */
.nx-section{margin-top:22px;}
.nx-section-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px;}
.nx-section-head h3{margin:0;font-size:15px;font-weight:800;}
.nx-section-hint{font-size:12px;color:var(--nx-ink2);}

/* mode grid */
.nx-modes{display:grid;grid-template-columns:repeat(auto-fill,minmax(102px,1fr));gap:10px;}
.nx-mode{background:var(--nx-surface);border:1px solid var(--nx-line);border-radius:16px;padding:15px 10px;display:flex;flex-direction:column;align-items:flex-start;gap:8px;cursor:pointer;box-shadow:var(--nx-shadow);transition:transform .12s,border-color .15s,box-shadow .2s;text-align:left;}
.nx-mode:hover:not(:disabled){transform:translateY(-2px);border-color:var(--nx-accent);box-shadow:0 14px 30px -18px rgba(91,91,246,.5);}
.nx-mode:active:not(:disabled){transform:scale(.98);}
.nx-mode:disabled{opacity:.42;cursor:not-allowed;}
.nx-mode-ico{width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,rgba(91,91,246,.12),rgba(34,211,238,.12));color:var(--nx-accent);display:grid;place-items:center;}
.nx-mode-name{font-weight:700;font-size:14px;}
.nx-mode-blurb{font-size:11px;color:var(--nx-ink2);}

/* row cards */
.nx-row-card{width:100%;display:flex;align-items:center;gap:13px;background:var(--nx-surface);border:1px solid var(--nx-line);border-radius:16px;padding:15px;cursor:pointer;box-shadow:var(--nx-shadow);margin-bottom:10px;transition:transform .1s,border-color .15s;}
.nx-row-card:hover{border-color:var(--nx-accent);}
.nx-row-card:active{transform:scale(.99);}
.nx-row-ico{width:40px;height:40px;border-radius:12px;background:var(--nx-surface2);color:var(--nx-accent);display:grid;place-items:center;flex-shrink:0;}
.nx-row-text{flex:1;display:flex;flex-direction:column;gap:2px;text-align:left;}
.nx-row-title{font-weight:700;font-size:15px;}
.nx-row-sub{font-size:12px;color:var(--nx-ink2);}
.nx-row-bar{width:64px;height:6px;border-radius:99px;background:var(--nx-track);overflow:hidden;}
.nx-row-bar-fill{display:block;height:100%;background:linear-gradient(90deg,var(--nx-accent),var(--nx-accent2));}
.nx-row-arrow{color:var(--nx-ink2);font-size:22px;}

/* toggle */
.nx-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--nx-surface);border:1px solid var(--nx-line);border-radius:16px;padding:14px 16px;cursor:pointer;text-align:left;box-shadow:var(--nx-shadow);margin-bottom:10px;}
.nx-toggle-label{font-weight:700;font-size:14.5px;display:block;}
.nx-toggle-hint{font-size:12px;color:var(--nx-ink2);}
.nx-switch{width:46px;height:27px;border-radius:99px;background:var(--nx-track);position:relative;transition:background .2s;flex-shrink:0;}
.nx-switch.on{background:var(--nx-accent);}
.nx-switch-knob{position:absolute;top:3px;left:3px;width:21px;height:21px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .2s;}
.nx-switch.on .nx-switch-knob{transform:translateX(19px);}

/* play */
.nx-play-top{display:flex;align-items:center;gap:12px;margin-bottom:18px;}
.nx-progress{flex:1;height:10px;border-radius:99px;background:var(--nx-track);overflow:hidden;}
.nx-progress-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--nx-accent),var(--nx-accent2));transition:width .4s ease;}
.nx-lvl-chip,.nx-combo{font-size:13px;font-weight:800;background:var(--nx-surface);border:1px solid var(--nx-line);padding:8px 11px;border-radius:11px;color:var(--nx-ink2);min-width:48px;text-align:center;}
.nx-combo{color:var(--nx-accent);border-color:var(--nx-accent);}
.nx-combo em{color:var(--nx-good);font-style:normal;}
.nx-stage{animation:nx-in .3s ease;}
@keyframes nx-in{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}

/* game shell */
.nx-game{background:var(--nx-surface);border:1px solid var(--nx-line);border-radius:var(--nx-radius);padding:26px 22px;display:flex;flex-direction:column;gap:18px;min-height:420px;box-shadow:var(--nx-shadow);}
.nx-tag{font-size:13px;color:var(--nx-ink2);font-weight:600;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;}
.nx-tag-pill{background:var(--nx-accent);color:#fff;border-radius:99px;padding:3px 11px;font-size:11px;font-weight:700;}
.nx-type-tag{background:var(--nx-surface2);border:1px solid var(--nx-line);color:var(--nx-ink2);border-radius:99px;padding:3px 10px;font-size:11px;font-weight:600;}
.nx-prompt{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;text-align:center;flex:1;}
.nx-target{font-size:34px;font-weight:800;letter-spacing:-0.02em;}
.nx-trans{font-size:25px;font-weight:700;}
.nx-audio{background:var(--nx-surface2);border:1px solid var(--nx-line);border-radius:12px;width:44px;height:44px;display:grid;place-items:center;cursor:pointer;color:var(--nx-ink);}

/* flip */
.nx-flip{perspective:1200px;cursor:pointer;flex:1;display:flex;align-items:center;justify-content:center;min-height:210px;}
.nx-flip-inner{position:relative;width:100%;min-height:210px;transition:transform .55s cubic-bezier(.22,1,.36,1);transform-style:preserve-3d;}
.nx-flip.flipped .nx-flip-inner{transform:rotateY(180deg);}
.nx-flip-face{position:absolute;inset:0;backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:linear-gradient(160deg,var(--nx-surface2),#fff);border:1px solid var(--nx-line);border-radius:18px;padding:24px;}
.nx-flip-back{transform:rotateY(180deg);}
.nx-flip-hint{font-size:12px;color:var(--nx-ink2);}

/* options */
.nx-options{display:grid;gap:10px;}
.nx-opt{background:var(--nx-surface);border:1.5px solid var(--nx-line2);color:var(--nx-ink);border-radius:14px;padding:16px;font-size:16px;font-weight:600;cursor:pointer;text-align:left;transition:transform .1s,border-color .15s,background .15s;}
.nx-opt:hover:not(:disabled){border-color:var(--nx-accent);transform:translateY(-1px);}
.nx-opt:active:not(:disabled){transform:scale(.99);}
.nx-opt.right{border-color:var(--nx-good);background:rgba(16,185,129,.08);}
.nx-opt.wrong{border-color:var(--nx-warn);background:rgba(244,81,108,.07);animation:nx-shake .35s;}
.nx-opt.dim{opacity:.4;}
.nx-opt:disabled{cursor:default;}
@keyframes nx-shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-6px);}40%{transform:translateX(6px);}60%{transform:translateX(-4px);}80%{transform:translateX(4px);}}

/* feedback */
.nx-feedback{border-radius:16px;padding:14px 16px;animation:nx-in .25s;display:flex;flex-direction:column;gap:10px;}
.nx-feedback.correct{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.28);}
.nx-feedback.wrong{background:rgba(244,81,108,.07);border:1px solid rgba(244,81,108,.28);}
.nx-feedback-row{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.nx-feedback-text{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;}
.nx-feedback.correct .nx-feedback-text{color:var(--nx-good);}
.nx-feedback.wrong .nx-feedback-text{color:var(--nx-warn);}
.nx-feedback-text strong{color:var(--nx-ink);}
.nx-feedback-icon{font-weight:900;}
.nx-note{font-size:13px;color:var(--nx-ink);background:var(--nx-surface);border:1px solid var(--nx-line);border-radius:12px;padding:10px 12px;line-height:1.5;}
.nx-note.inline{max-width:340px;}
.nx-note-tag{display:inline-block;font-size:9.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--nx-accent);margin-right:8px;}
.nx-pips{display:flex;align-items:center;gap:6px;}
.nx-pip{width:15px;height:6px;border-radius:99px;background:var(--nx-track);transition:background .2s;}
.nx-pip.on{background:linear-gradient(90deg,var(--nx-accent),var(--nx-accent2));}
.nx-pips-label{font-size:11px;color:var(--nx-ink2);margin-left:4px;}

.nx-next{background:var(--nx-accent);color:#fff;border:none;border-radius:12px;padding:12px 22px;font-weight:700;font-size:15px;cursor:pointer;white-space:nowrap;}
.nx-next.big{align-self:center;padding:14px 48px;}
.nx-next:disabled{opacity:.4;cursor:not-allowed;}
.nx-ghost{background:var(--nx-surface2);border:1px solid var(--nx-line);color:var(--nx-ink);border-radius:12px;padding:11px 18px;font-weight:600;cursor:pointer;font-size:14px;}
.nx-ghost.big{flex:1;padding:15px;}

/* grade (flashcard) */
.nx-grade{display:flex;gap:10px;}
.nx-grade-btn{flex:1;border:none;border-radius:14px;padding:15px;font-weight:700;font-size:15px;cursor:pointer;}
.nx-grade-btn.again{background:var(--nx-surface2);border:1px solid var(--nx-line);color:var(--nx-warn);}
.nx-grade-btn.good{background:var(--nx-accent);color:#fff;}

/* input */
.nx-input{width:100%;background:var(--nx-surface2);border:1.5px solid var(--nx-line2);color:var(--nx-ink);border-radius:14px;padding:16px;font-size:18px;text-align:center;outline:none;}
.nx-input:focus{border-color:var(--nx-accent);}
.nx-input.right{border-color:var(--nx-good);}
.nx-input.wrong{border-color:var(--nx-warn);}
.nx-type-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;}
.nx-hint{font-family:ui-monospace,monospace;letter-spacing:3px;font-size:18px;color:var(--nx-ink2);}

/* scramble */
.nx-scramble-line{min-height:58px;border-bottom:2px dashed var(--nx-line2);display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px;}
.nx-scramble-line.right{border-color:var(--nx-good);}
.nx-scramble-line.wrong{border-color:var(--nx-warn);}
.nx-scramble-ph{color:var(--nx-ink2);font-size:14px;}
.nx-scramble-bank{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;}
.nx-tile{background:var(--nx-surface2);border:1px solid var(--nx-line2);color:var(--nx-ink);border-radius:10px;padding:11px 15px;font-size:17px;font-weight:700;cursor:pointer;transition:transform .1s;}
.nx-tile:active{transform:scale(.95);}
.nx-tile.picked{background:var(--nx-accent);border-color:var(--nx-accent);color:#fff;}

/* true/false */
.nx-tf{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;}
.nx-tf-pair{display:flex;align-items:center;gap:10px;}
.nx-tf-eq{color:var(--nx-ink2);font-size:22px;}
.nx-tf-actions{display:flex;gap:10px;}
.nx-tf-btn{flex:1;border:1.5px solid var(--nx-line2);border-radius:14px;padding:16px;font-weight:700;font-size:16px;cursor:pointer;background:var(--nx-surface);color:var(--nx-ink);}
.nx-tf-btn.no:hover:not(:disabled){border-color:var(--nx-warn);}
.nx-tf-btn.yes:hover:not(:disabled){border-color:var(--nx-good);}
.nx-tf-btn.right{border-color:var(--nx-good);background:rgba(16,185,129,.08);}
.nx-tf-btn.wrong{border-color:var(--nx-warn);background:rgba(244,81,108,.07);}

/* cloze */
.nx-cloze-sentence{font-size:24px;font-weight:700;text-align:center;line-height:1.5;flex:1;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px;}
.nx-cloze-blank{display:inline-block;min-width:80px;border-bottom:2.5px solid var(--nx-accent);color:var(--nx-accent);padding:0 6px;}
.nx-cloze-blank.right{color:var(--nx-good);border-color:var(--nx-good);}
.nx-cloze-blank.wrong{color:var(--nx-warn);border-color:var(--nx-warn);}
.nx-cloze-trans{text-align:center;color:var(--nx-ink2);font-size:14px;}

/* match */
.nx-match{display:grid;grid-template-columns:1fr 1fr;gap:10px;flex:1;}
.nx-match-col{display:flex;flex-direction:column;gap:8px;}
.nx-match-cell{background:var(--nx-surface);border:1.5px solid var(--nx-line2);color:var(--nx-ink);border-radius:12px;padding:14px 8px;font-size:15px;font-weight:600;cursor:pointer;transition:all .15s;min-height:52px;}
.nx-match-cell:hover:not(:disabled){border-color:var(--nx-accent);}
.nx-match-cell.sel{border-color:var(--nx-accent);background:rgba(91,91,246,.07);}
.nx-match-cell.matched{opacity:0;pointer-events:none;transform:scale(.85);transition:opacity .4s,transform .4s;}
.nx-match-cell.wrong{border-color:var(--nx-warn);animation:nx-shake .35s;}
.nx-match-count{text-align:center;color:var(--nx-ink2);font-size:13px;font-weight:700;}

/* listen */
.nx-listen{align-self:center;display:flex;flex-direction:column;align-items:center;gap:8px;background:linear-gradient(160deg,var(--nx-surface2),#fff);border:1px solid var(--nx-line);color:var(--nx-accent);border-radius:18px;padding:26px 40px;cursor:pointer;}
.nx-listen span:last-child{font-size:13px;color:var(--nx-ink2);}
.nx-listen-word{text-align:center;font-size:22px;font-weight:800;color:var(--nx-accent);}

/* lightning */
.nx-lightning-intro{align-items:center;justify-content:center;text-align:center;gap:8px;}
.nx-bolt{color:var(--nx-accent);animation:nx-bolt .5s;}
@keyframes nx-bolt{0%{transform:scale(1);}50%{transform:scale(1.15);}100%{transform:scale(1);}}
.nx-lightning-intro h2{margin:4px 0;font-size:25px;}
.nx-lightning-intro p{color:var(--nx-ink2);margin:0;}
.nx-lightning-timer{height:8px;border-radius:99px;background:var(--nx-track);overflow:hidden;}
.nx-lightning-fill{height:100%;background:linear-gradient(90deg,var(--nx-accent),var(--nx-accent2));}
.nx-lightning-fill.low{background:var(--nx-warn);}

/* summary */
.nx-summary{animation:nx-in .4s;}
.nx-summary-card{background:var(--nx-surface);border:1px solid var(--nx-line);border-radius:24px;padding:30px 22px;text-align:center;box-shadow:var(--nx-shadow);}
.nx-summary-orb{width:60px;height:60px;border-radius:50%;margin:0 auto 6px;background:radial-gradient(circle at 35% 30%,#fff,#22d3ee 42%,#5b5bf6 78%);box-shadow:0 0 40px -6px rgba(91,91,246,.5);animation:nx-pulse 2.2s ease-in-out infinite;}
.nx-summary-title{margin:8px 0 2px;font-size:23px;font-weight:800;}
.nx-levelup{background:linear-gradient(120deg,var(--nx-accent),var(--nx-accent2));color:#fff;border-radius:12px;padding:10px;margin:10px 0;font-weight:700;}
.nx-summary-xp{font-size:40px;font-weight:800;color:var(--nx-good);margin:6px 0 16px;letter-spacing:-0.02em;}
.nx-summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;}
.nx-mastered{background:var(--nx-surface2);border:1px solid var(--nx-line);border-radius:14px;padding:14px;margin-bottom:12px;}
.nx-mastered-title{font-weight:700;margin-bottom:8px;}
.nx-mastered-list{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;}
.nx-mastered-chip{background:rgba(91,91,246,.09);color:var(--nx-accent);border-radius:99px;padding:5px 12px;font-size:13px;font-weight:600;}
.nx-achv-unlocked{display:flex;flex-direction:column;gap:8px;margin-bottom:14px;}
.nx-achv-pop{display:flex;align-items:center;gap:12px;background:var(--nx-surface2);border:1px solid var(--nx-line);border-radius:14px;padding:12px;text-align:left;}
.nx-achv-ic{font-size:26px;}
.nx-achv-name{font-weight:800;}
.nx-achv-blurb{font-size:12px;color:var(--nx-ink2);}
.nx-summary-progress{margin-bottom:16px;}
.nx-summary-track{height:8px;border-radius:99px;background:var(--nx-track);overflow:hidden;margin-bottom:6px;}
.nx-summary-fill{height:100%;background:linear-gradient(90deg,var(--nx-accent),var(--nx-accent2));transition:width .6s;}
.nx-summary-progress span{font-size:12px;color:var(--nx-ink2);}
.nx-summary-actions{display:flex;gap:10px;}

/* modal */
.nx-modal-overlay{position:fixed;inset:0;background:rgba(11,14,23,.4);display:grid;place-items:center;z-index:200;padding:18px;animation:nx-in .2s;backdrop-filter:blur(3px);}
.nx-modal{background:var(--nx-surface);border:1px solid var(--nx-line);border-radius:22px;padding:22px;max-width:560px;width:100%;max-height:84vh;overflow:auto;box-shadow:var(--nx-shadow);}
.nx-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.nx-modal-head h3{margin:0;font-weight:800;}
.nx-achv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;}
.nx-achv-tile{background:var(--nx-surface2);border:1px solid var(--nx-line);border-radius:14px;padding:14px 10px;text-align:center;}
.nx-achv-tile.locked{opacity:.5;}
.nx-achv-tile.got{border-color:var(--nx-accent);background:rgba(91,91,246,.05);}
.nx-achv-tile-ic{font-size:26px;}
.nx-achv-tile-name{font-weight:700;font-size:14px;margin-top:4px;}
.nx-achv-tile-blurb{font-size:11px;color:var(--nx-ink2);margin-top:2px;}

/* library */
.nx-lib-stats{display:flex;gap:14px;color:var(--nx-ink2);font-size:13px;margin-bottom:12px;}
.nx-lib-search{width:100%;background:var(--nx-surface2);border:1px solid var(--nx-line2);border-radius:12px;padding:12px 14px;font-size:15px;outline:none;margin-bottom:12px;color:var(--nx-ink);}
.nx-lib-search:focus{border-color:var(--nx-accent);}
.nx-lib-list{display:flex;flex-direction:column;gap:6px;}
.nx-lib-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border:1px solid var(--nx-line);border-radius:12px;cursor:pointer;transition:border-color .15s;}
.nx-lib-row:hover{border-color:var(--nx-accent);}
.nx-lib-main{display:flex;flex-direction:column;gap:2px;min-width:0;}
.nx-lib-text{font-weight:700;font-size:15px;}
.nx-lib-trans{font-size:12.5px;color:var(--nx-ink2);}
.nx-lib-meta{display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0;}
.nx-lib-badge{font-size:10.5px;font-weight:700;border-radius:99px;padding:3px 9px;background:var(--nx-surface2);color:var(--nx-ink2);border:1px solid var(--nx-line);}
.nx-lib-badge.mastered{background:rgba(16,185,129,.12);color:var(--nx-good);border-color:transparent;}
.nx-lib-badge.due{background:rgba(91,91,246,.12);color:var(--nx-accent);border-color:transparent;}
.nx-lib-badge.new{background:rgba(34,211,238,.14);color:#0891b2;border-color:transparent;}
.nx-lib-due{font-size:10.5px;color:var(--nx-ink2);}
.nx-lib-empty{text-align:center;color:var(--nx-ink2);padding:24px;}

/* row-card accent */
.nx-row-card.accent{border-color:rgba(91,91,246,.35);background:linear-gradient(120deg,rgba(91,91,246,.06),rgba(34,211,238,.05));}
.nx-row-ico.accent{background:linear-gradient(135deg,var(--nx-accent),var(--nx-accent2));color:#fff;}

/* stats */
.nx-stats-top{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;}
.nx-stats-big{background:var(--nx-surface2);border:1px solid var(--nx-line);border-radius:14px;padding:12px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;}
.nx-stats-big-val{font-size:20px;font-weight:800;letter-spacing:-0.02em;}
.nx-stats-big-lab{font-size:10px;color:var(--nx-ink2);}
.nx-stats-section-title{font-size:13px;font-weight:800;color:var(--nx-ink2);margin:6px 0 10px;text-transform:uppercase;letter-spacing:.5px;}
.nx-theme-list{display:flex;flex-direction:column;gap:12px;margin-bottom:18px;}
.nx-theme-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:5px;}
.nx-theme-name{font-weight:700;font-size:14px;}
.nx-theme-meta{font-size:11.5px;color:var(--nx-ink2);}
.nx-theme-bar{height:8px;border-radius:99px;background:var(--nx-track);overflow:hidden;}
.nx-theme-bar-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--nx-accent),var(--nx-accent2));transition:width .5s;}
.nx-weak-list{display:flex;flex-direction:column;gap:6px;}
.nx-weak-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid var(--nx-line);border-radius:12px;cursor:pointer;}
.nx-weak-row:hover{border-color:var(--nx-accent);}
.nx-weak-main{display:flex;flex-direction:column;gap:2px;min-width:0;}
.nx-weak-text{font-weight:700;font-size:14.5px;}
.nx-weak-trans{font-size:12px;color:var(--nx-ink2);}
.nx-weak-meta{display:flex;flex-direction:column;align-items:flex-end;gap:2px;}
.nx-weak-acc{font-weight:800;font-size:14px;color:var(--nx-warn);}
.nx-weak-stage{font-size:10.5px;color:var(--nx-ink2);}

/* generate */
.nx-gen-block{margin-bottom:14px;}
.nx-gen-label{font-size:13px;font-weight:700;margin-bottom:8px;}
.nx-gen-chips{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0;}
.nx-gen-chip{background:var(--nx-surface2);border:1px solid var(--nx-line);border-radius:99px;padding:6px 12px;font-size:12.5px;font-weight:600;color:var(--nx-ink);cursor:pointer;}
.nx-gen-chip:hover:not(:disabled){border-color:var(--nx-accent);}
.nx-gen-actions{display:flex;gap:10px;justify-content:flex-end;align-items:center;}
.nx-gen-divider{text-align:center;color:var(--nx-ink2);font-size:12px;margin:6px 0 14px;position:relative;}
.nx-gen-status{margin-top:14px;padding:12px 14px;border-radius:12px;background:var(--nx-surface2);border:1px solid var(--nx-line);font-size:13px;color:var(--nx-ink);display:flex;align-items:center;gap:10px;}
.nx-gen-spinner{width:16px;height:16px;border-radius:50%;border:2px solid var(--nx-track);border-top-color:var(--nx-accent);animation:nx-spin .8s linear infinite;flex-shrink:0;}

/* touch / mobile */
.nx button,.nx input{-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
.nx button{user-select:none;-webkit-user-select:none;}
.nx-hub,.nx-play,.nx-summary{padding-top:calc(16px + env(safe-area-inset-top));padding-bottom:calc(56px + env(safe-area-inset-bottom));}
.nx-modal{overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}
@media (max-width:420px){
  .nx-hub,.nx-play,.nx-summary,.nx-empty{padding-left:13px;padding-right:13px;}
  .nx-game{padding:22px 16px;min-height:62vh;}
  .nx-target{font-size:30px;}
  .nx-trans{font-size:22px;}
  .nx-cloze-sentence{font-size:21px;}
  .nx-metric-val{font-size:19px;}
  .nx-modes{grid-template-columns:repeat(2,1fr);}
  .nx-opt,.nx-match-cell{padding:15px 12px;}
  .nx-tile{padding:13px 16px;font-size:18px;}
}
@media (hover:none){
  .nx-opt:hover:not(:disabled),.nx-mode:hover:not(:disabled),.nx-match-cell:hover:not(:disabled){transform:none;}
}
`;
