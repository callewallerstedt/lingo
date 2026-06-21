// Surge — a self-contained, gamified spaced-repetition engine.
// Pure logic + localStorage persistence. No server dependency required: it ships
// with built-in decks so it works end to end offline, and the UI can optionally
// enrich the deck with AI-generated items from /api/surge-items.
//
// Spaced repetition model (per the product spec):
//   An item must be answered correctly 5 times IN A ROW (no mistakes) to advance
//   to the next stage. Any wrong answer resets the in-a-row streak. The stages and
//   the gap before the item next becomes due:
//     stage 0  New        -> due immediately (drilled this session)
//     stage 1  1 hour
//     stage 2  1 day
//     stage 3  3 days
//     stage 4  1 week
//     stage 5  1 month
//     stage 6  6 months    (mastered)

export type SaItemType = "word" | "phrase" | "sentence";

export type SaWord = {
  id: string;
  text: string; // target language
  translation: string; // English
  type: SaItemType;
  note?: string; // "good to know" — grammar/usage tip
  level?: number; // 1 = core, 2 = stretch / harder
  theme?: string; // grouping for stats ("Greetings", "Food & Drink", ...)
};

export type SaCard = SaWord & {
  stage: number; // 0..SA_MAX_STAGE
  streak: number; // current correct-in-a-row within this stage (0..SA_REQUIRED_STREAK)
  seen: number;
  correct: number;
  lapses: number;
  dueAt: number; // epoch ms
  lastSeen: number;
  introduced: boolean;
};

export type SaSettings = {
  listening: boolean;
  sentences: boolean;
};

export type SaAchievement = { id: string; title: string; blurb: string; icon: string };

export type SaProfile = {
  xp: number;
  streak: number; // daily streak
  lastPlayedDay: string;
  totalReviews: number;
  totalCorrect: number;
  bestCombo: number;
  sessionsPlayed: number;
  dailyDay: string;
  dailyProgress: number;
  dailyGoal: number;
  achievements: string[];
};

export type SaState = {
  version: number;
  language: string;
  cards: Record<string, SaCard>;
  profile: SaProfile;
  settings: SaSettings;
  updatedAt: number;
};

// ---- Game step model -------------------------------------------------------

export type SaStep =
  | { kind: "flash"; card: SaCard }
  | { kind: "flashReview"; card: SaCard }
  | { kind: "choice"; card: SaCard; options: string[] }
  | { kind: "produce"; card: SaCard; options: string[] }
  | { kind: "type"; card: SaCard }
  | { kind: "typeTarget"; card: SaCard }
  | { kind: "listen"; card: SaCard; options: string[] }
  | { kind: "scramble"; card: SaCard; tokens: string[]; byWord: boolean }
  | { kind: "trueFalse"; card: SaCard; shown: string; isCorrect: boolean }
  | { kind: "cloze"; card: SaCard; masked: string; answer: string; options: string[] }
  | { kind: "match"; cards: SaCard[] }
  | { kind: "lightning"; cards: SaCard[] };

// A practice mode the learner can launch directly from the hub.
export type SaMode =
  | "smart"
  | "flashcards"
  | "match"
  | "choice"
  | "type"
  | "listen"
  | "build"
  | "lightning"
  | "truefalse"
  | "cloze";

// ---- Constants -------------------------------------------------------------

export const SA_STATE_VERSION = 5;
export const SA_STATE_KEY_PREFIX = "neolingo_surge_v5_";
export const SA_REQUIRED_STREAK = 5;
export const SA_MAX_STAGE = 6;
export const SA_DEFAULT_DAILY_GOAL = 40;
export const SA_NEW_PER_SESSION = 6;
export const SA_MAX_SESSION_CARDS = 12;

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const SA_STAGE_INTERVALS: number[] = [
  0, // 0 New
  HOUR, // 1
  DAY, // 2
  3 * DAY, // 3
  7 * DAY, // 4
  30 * DAY, // 5
  180 * DAY, // 6
];

export const SA_STAGE_LABELS: string[] = ["New", "1 hour", "1 day", "3 days", "1 week", "1 month", "6 months"];

export const SA_DEFAULT_SETTINGS: SaSettings = { listening: true, sentences: true };

export const SA_ACHIEVEMENTS: SaAchievement[] = [
  { id: "first_session", title: "Lift Off", blurb: "Finish your first session.", icon: "🚀" },
  { id: "combo_10", title: "On Fire", blurb: "Hit a 10× combo.", icon: "🔥" },
  { id: "perfect", title: "Flawless", blurb: "Finish a session with no mistakes.", icon: "💎" },
  { id: "streak_3", title: "Habit Forming", blurb: "Keep a 3-day streak.", icon: "📅" },
  { id: "streak_7", title: "Unstoppable", blurb: "Keep a 7-day streak.", icon: "⚡" },
  { id: "mastered_10", title: "Collector", blurb: "Master 10 items.", icon: "🏆" },
  { id: "mastered_50", title: "Fluent Mind", blurb: "Master 50 items.", icon: "🧠" },
  { id: "level_5", title: "Rising Star", blurb: "Reach level 5.", icon: "🌟" },
  { id: "night_owl", title: "Night Owl", blurb: "Study after midnight.", icon: "🦉" },
  { id: "century", title: "Centurion", blurb: "Answer 100 reviews total.", icon: "💯" },
];

// ---- Day helpers -----------------------------------------------------------

export function saDayKey(at = Date.now()): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / DAY);
}

// ---- Level math ------------------------------------------------------------

export type SaLevelInfo = { level: number; intoLevel: number; levelSpan: number; progress: number };

export function saLevelInfo(xp: number): SaLevelInfo {
  let level = 1;
  let need = 120;
  let acc = 0;
  while (xp >= acc + need) {
    acc += need;
    level += 1;
    need = 120 + (level - 1) * 45;
  }
  const intoLevel = xp - acc;
  return { level, intoLevel, levelSpan: need, progress: need > 0 ? intoLevel / need : 0 };
}

// ---- Normalisation / matching ---------------------------------------------

export function saNormalizeKey(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}' -]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function saNormalizeAnswer(value: string, mode: "target" | "english"): string {
  let out = value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\([^)]*\)/g, " ") // drop parenthetical hints
    .replace(/[’']/g, "")
    .replace(/\s*\/\s*/g, "/") // normalise " / " -> "/"
    .replace(/[^\p{L}\p{N}/ -]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (mode === "english") {
    out = out.replace(/\b(a|an|the|to)\b/g, " ").replace(/\s+/g, " ").trim();
  }
  return out;
}

// Robust answer matching. Accepts:
//   - the full expected string ("hi/bye")
//   - any "/"- or ","-separated alternative ("hi" OR "bye")
export function saMatchesAnswer(submitted: string, expected: string, mode: "target" | "english"): boolean {
  const s = saNormalizeAnswer(submitted, mode);
  if (!s) return false;
  const e = saNormalizeAnswer(expected, mode);
  if (s === e) return true; // whole-string match (fixes the "/" bug)
  const variants = new Set<string>();
  for (const piece of e.split("/")) {
    const t = piece.trim();
    if (t) variants.add(t);
  }
  for (const piece of expected.split(/[,/]/)) {
    const t = saNormalizeAnswer(piece, mode);
    if (t) variants.add(t);
  }
  return variants.has(s);
}

// ---- Shuffle ---------------------------------------------------------------

export function saShuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

// ---- Card creation & SRS scheduling ---------------------------------------

export function saMakeCard(word: SaWord, at = Date.now()): SaCard {
  return {
    ...word,
    type: word.type,
    stage: 0,
    streak: 0,
    seen: 0,
    correct: 0,
    lapses: 0,
    dueAt: at,
    lastSeen: 0,
    introduced: false,
  };
}

// Apply a single answer to a card and return the updated card.
export function saAnswerCard(card: SaCard, correct: boolean, at = Date.now()): SaCard {
  if (correct) {
    let stage = card.stage;
    let streak = card.streak + 1;
    let dueAt = at; // keep drilling within the session until the streak completes
    if (streak >= SA_REQUIRED_STREAK) {
      stage = Math.min(SA_MAX_STAGE, stage + 1);
      streak = 0;
      dueAt = at + SA_STAGE_INTERVALS[stage];
    }
    return {
      ...card,
      stage,
      streak,
      dueAt,
      seen: card.seen + 1,
      correct: card.correct + 1,
      introduced: true,
      lastSeen: at,
    };
  }
  // Wrong: reset the in-a-row streak and drop a stage as a gentle penalty.
  return {
    ...card,
    stage: Math.max(0, card.stage - 1),
    streak: 0,
    dueAt: at,
    seen: card.seen + 1,
    lapses: card.lapses + 1,
    introduced: true,
    lastSeen: at,
  };
}

export function saIsMastered(card: SaCard): boolean {
  return card.stage >= SA_MAX_STAGE;
}

export function saIsDue(card: SaCard, at = Date.now()): boolean {
  return card.introduced && card.dueAt <= at && !saIsMastered(card);
}

export function saStageLabel(card: SaCard): string {
  return SA_STAGE_LABELS[Math.max(0, Math.min(SA_MAX_STAGE, card.stage))];
}

// ---- Deck stats ------------------------------------------------------------

export type SaDeckStats = {
  total: number;
  introduced: number;
  due: number;
  mastered: number;
  learning: number;
  fresh: number;
};

export function saDeckStats(state: SaState, at = Date.now()): SaDeckStats {
  const cards = Object.values(state.cards);
  let introduced = 0;
  let due = 0;
  let mastered = 0;
  let fresh = 0;
  for (const c of cards) {
    if (!c.introduced) fresh += 1;
    else {
      introduced += 1;
      if (saIsMastered(c)) mastered += 1;
      else if (c.dueAt <= at) due += 1;
    }
  }
  return { total: cards.length, introduced, due, mastered, learning: introduced - mastered, fresh };
}

export const SA_DEFAULT_THEME = "General";

export function saCardTheme(card: SaCard): string {
  return card.theme && card.theme.trim() ? card.theme.trim() : SA_DEFAULT_THEME;
}

export function saCardAccuracy(card: SaCard): number {
  return card.seen > 0 ? card.correct / card.seen : 0;
}

export type SaThemeStat = {
  theme: string;
  total: number;
  mastered: number;
  learning: number;
  fresh: number;
  due: number;
  accuracy: number; // 0..1 over reviewed items in the theme
  progress: number; // 0..1 mastery progress (avg stage / max stage of introduced)
};

export function saThemeStats(state: SaState, at = Date.now()): SaThemeStat[] {
  const groups = new Map<string, SaCard[]>();
  for (const c of Object.values(state.cards)) {
    const t = saCardTheme(c);
    const list = groups.get(t);
    if (list) list.push(c);
    else groups.set(t, [c]);
  }
  const out: SaThemeStat[] = [];
  for (const [theme, cards] of groups) {
    let mastered = 0;
    let fresh = 0;
    let due = 0;
    let seen = 0;
    let correct = 0;
    let stageSum = 0;
    let introduced = 0;
    for (const c of cards) {
      if (!c.introduced) fresh += 1;
      else {
        introduced += 1;
        stageSum += c.stage;
        if (saIsMastered(c)) mastered += 1;
        else if (c.dueAt <= at) due += 1;
      }
      seen += c.seen;
      correct += c.correct;
    }
    out.push({
      theme,
      total: cards.length,
      mastered,
      learning: introduced - mastered,
      fresh,
      due,
      accuracy: seen > 0 ? correct / seen : 0,
      progress: introduced > 0 ? stageSum / (introduced * SA_MAX_STAGE) : 0,
    });
  }
  return out.sort((a, b) => b.total - a.total);
}

// Cards the learner struggles with most (introduced, low accuracy / high lapses).
export function saWeakCards(state: SaState, n = 8): SaCard[] {
  return Object.values(state.cards)
    .filter((c) => c.introduced && c.seen >= 2 && !saIsMastered(c))
    .map((c) => ({ card: c, score: c.lapses * 2 + (1 - saCardAccuracy(c)) * 3 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.card);
}

// ---- Session building ------------------------------------------------------

function settingsFilter(card: SaCard, settings: SaSettings): boolean {
  if (!settings.sentences && card.type === "sentence") return false;
  return true;
}

export function saSelectSessionCards(state: SaState, at = Date.now()): SaCard[] {
  const cards = Object.values(state.cards).filter((c) => settingsFilter(c, state.settings));
  const due = cards.filter((c) => saIsDue(c, at)).sort((a, b) => a.dueAt - b.dueAt);
  const fresh = cards.filter((c) => !c.introduced).sort((a, b) => (a.level || 1) - (b.level || 1));

  const picked: SaCard[] = [];
  for (const c of due) {
    if (picked.length >= SA_MAX_SESSION_CARDS) break;
    picked.push(c);
  }
  const newRoom = Math.min(SA_NEW_PER_SESSION, SA_MAX_SESSION_CARDS - picked.length);
  for (const c of fresh.slice(0, newRoom)) picked.push(c);

  if (!picked.length) {
    const soon = cards
      .filter((c) => c.introduced && !saIsMastered(c))
      .sort((a, b) => a.dueAt - b.dueAt)
      .slice(0, SA_MAX_SESSION_CARDS);
    return soon.length ? soon : saShuffle(cards).slice(0, Math.min(SA_MAX_SESSION_CARDS, cards.length));
  }
  return picked;
}

function distractors(card: SaCard, pool: SaCard[], field: "translation" | "text", n: number): string[] {
  const answer = saNormalizeKey(card[field]);
  const seen = new Set<string>([answer]);
  const out: string[] = [];
  // Prefer same-type distractors so a sentence isn't mixed with single words.
  const ordered = saShuffle(pool).sort((a, b) => (a.type === card.type ? -1 : 1) - (b.type === card.type ? -1 : 1));
  for (const c of ordered) {
    const value = c[field];
    const key = saNormalizeKey(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= n) break;
  }
  return out;
}

function buildOptions(card: SaCard, pool: SaCard[], field: "translation" | "text"): string[] {
  return saShuffle([card[field], ...distractors(card, pool, field, 3)]);
}

function makeScramble(card: SaCard): Extract<SaStep, { kind: "scramble" }> {
  const words = card.text.trim().split(/\s+/);
  if (words.length >= 3) {
    let shuffled = saShuffle(words);
    if (shuffled.join(" ") === words.join(" ")) shuffled = saShuffle(words);
    return { kind: "scramble", card, tokens: shuffled, byWord: true };
  }
  const target = words.sort((a, b) => b.length - a.length)[0] || card.text;
  const letters = target.split("");
  let shuffled = saShuffle(letters);
  if (shuffled.join("") === letters.join("") && letters.length > 1) shuffled = saShuffle(letters);
  return { kind: "scramble", card, tokens: shuffled, byWord: false };
}

function quizStepForCard(card: SaCard, pool: SaCard[], settings: SaSettings): SaStep {
  const roll = Math.random();
  const stage = card.stage;
  const isSentence = card.type === "sentence";
  const allowProduction = pool.length >= 4;
  const allowListen = settings.listening;

  if (stage <= 1) {
    if (allowListen && roll < 0.2) return { kind: "listen", card, options: buildOptions(card, pool, "translation") };
    if (roll < 0.7) return { kind: "choice", card, options: buildOptions(card, pool, "translation") };
    return makeScramble(card);
  }
  if (stage <= 3) {
    if (allowListen && roll < 0.18) return { kind: "listen", card, options: buildOptions(card, pool, "translation") };
    if (roll < 0.45) return { kind: "type", card }; // type the English meaning
    if (roll < 0.7 && allowProduction) return { kind: "produce", card, options: buildOptions(card, pool, "text") };
    return makeScramble(card);
  }
  // Higher stages: production focus.
  if (isSentence) {
    if (roll < 0.5) return makeScramble(card);
    if (roll < 0.8 && allowProduction) return { kind: "produce", card, options: buildOptions(card, pool, "text") };
    return { kind: "type", card };
  }
  if (roll < 0.55) return { kind: "typeTarget", card };
  if (roll < 0.8 && allowProduction) return { kind: "produce", card, options: buildOptions(card, pool, "text") };
  return { kind: "type", card };
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function saBuildSteps(sessionCards: SaCard[], pool: SaCard[], settings: SaSettings): SaStep[] {
  const steps: SaStep[] = [];
  const newCards = sessionCards.filter((c) => !c.introduced);
  const poolForDistractors = pool.length >= 4 ? pool : sessionCards;

  for (const c of newCards) steps.push({ kind: "flash", card: c });

  // Warm-up matching uses only short items (words/phrases) so the grid stays tidy.
  const matchable = sessionCards.filter((c) => c.type !== "sentence");
  if (matchable.length >= 4) {
    for (const group of chunk(saShuffle(matchable), 5)) {
      if (group.length >= 3) steps.push({ kind: "match", cards: group });
    }
  }

  for (const c of saShuffle(sessionCards)) steps.push(quizStepForCard(c, poolForDistractors, settings));

  // New cards get an easy second touch.
  for (const c of saShuffle(newCards)) {
    steps.push({ kind: "choice", card: c, options: buildOptions(c, poolForDistractors, "translation") });
  }

  // Finale lightning round over short items.
  const lightningCards = sessionCards.filter((c) => c.type !== "sentence");
  if (lightningCards.length >= 3) steps.push({ kind: "lightning", cards: saShuffle(lightningCards) });

  return steps;
}

const SA_STOPWORDS = new Set([
  "a", "an", "the", "to", "of", "is", "il", "lo", "la", "i", "gli", "le", "un", "una", "di", "e",
  "el", "los", "las", "y", "de", "le", "les", "der", "die", "das", "und", "è", "ci",
]);

function makeTrueFalse(card: SaCard, pool: SaCard[]): Extract<SaStep, { kind: "trueFalse" }> {
  const showTruth = Math.random() < 0.5;
  if (showTruth) return { kind: "trueFalse", card, shown: card.translation, isCorrect: true };
  const decoy = distractors(card, pool, "translation", 1)[0] || card.translation;
  const isCorrect = saNormalizeKey(decoy) === saNormalizeKey(card.translation);
  return { kind: "trueFalse", card, shown: decoy, isCorrect };
}

function makeCloze(card: SaCard, pool: SaCard[]): SaStep {
  const words = card.text.trim().split(/\s+/);
  // Choose a meaningful content word to blank (skip tiny function words).
  const candidates = words
    .map((w, i) => ({ w, i, clean: w.replace(/[.,!?;:¿¡]/g, "") }))
    .filter((x) => x.clean.length >= 3 && !SA_STOPWORDS.has(x.clean.toLocaleLowerCase()));
  const chosen = (candidates.length ? candidates : words.map((w, i) => ({ w, i, clean: w.replace(/[.,!?;:¿¡]/g, "") })))
    .sort((a, b) => b.clean.length - a.clean.length)[0];
  if (!chosen) return { kind: "choice", card, options: buildOptions(card, pool, "translation") };
  const masked = words.map((w, i) => (i === chosen.i ? "____" : w)).join(" ");
  const answer = chosen.clean;
  // Distractor words pulled from other cards' texts.
  const seen = new Set<string>([saNormalizeKey(answer)]);
  const opts: string[] = [];
  for (const c of saShuffle(pool)) {
    for (const w of c.text.trim().split(/\s+/)) {
      const clean = w.replace(/[.,!?;:¿¡]/g, "");
      const key = saNormalizeKey(clean);
      if (clean.length < 3 || !key || seen.has(key) || SA_STOPWORDS.has(clean.toLocaleLowerCase())) continue;
      seen.add(key);
      opts.push(clean);
      break;
    }
    if (opts.length >= 3) break;
  }
  return { kind: "cloze", card, masked, answer, options: saShuffle([answer, ...opts]) };
}

// Build a session of a single game type for focused practice from the hub.
export function saBuildFocusSteps(sessionCards: SaCard[], pool: SaCard[], settings: SaSettings, mode: SaMode): SaStep[] {
  if (mode === "smart") return saBuildSteps(sessionCards, pool, settings);
  const poolForDistractors = pool.length >= 4 ? pool : sessionCards;
  const steps: SaStep[] = [];

  if (mode === "match") {
    const matchable = sessionCards.filter((c) => c.type !== "sentence");
    for (const group of chunk(saShuffle(matchable), 5)) if (group.length >= 3) steps.push({ kind: "match", cards: group });
    if (!steps.length && matchable.length) steps.push({ kind: "match", cards: matchable });
    return steps;
  }
  if (mode === "lightning") {
    const cards = sessionCards.filter((c) => c.type !== "sentence");
    for (const group of chunk(saShuffle(cards), 8)) if (group.length >= 3) steps.push({ kind: "lightning", cards: group });
    return steps;
  }
  if (mode === "cloze") {
    const sentences = sessionCards.filter((c) => c.text.trim().split(/\s+/).length >= 3);
    for (const c of saShuffle(sentences)) steps.push(makeCloze(c, poolForDistractors));
    return steps;
  }

  for (const card of saShuffle(sessionCards)) {
    switch (mode) {
      case "flashcards":
        steps.push({ kind: "flashReview", card });
        break;
      case "choice":
        steps.push({ kind: "choice", card, options: buildOptions(card, poolForDistractors, "translation") });
        break;
      case "type":
        steps.push(card.type === "sentence" ? { kind: "type", card } : { kind: "typeTarget", card });
        break;
      case "listen":
        steps.push({ kind: "listen", card, options: buildOptions(card, poolForDistractors, "translation") });
        break;
      case "build":
        steps.push(makeScramble(card));
        break;
      case "truefalse":
        steps.push(makeTrueFalse(card, poolForDistractors));
        break;
      default:
        steps.push({ kind: "choice", card, options: buildOptions(card, poolForDistractors, "translation") });
    }
  }
  return steps;
}

// Lenient selection for focused practice: due first, then new, then fill with the
// weakest introduced cards so a mode always has enough to work with.
export function saSelectPracticeCards(state: SaState, mode: SaMode, at = Date.now()): SaCard[] {
  let cards = Object.values(state.cards).filter((c) => settingsFilter(c, state.settings));
  if (mode === "cloze") cards = cards.filter((c) => c.text.trim().split(/\s+/).length >= 3);
  if (mode === "match" || mode === "lightning") cards = cards.filter((c) => c.type !== "sentence");

  const due = cards.filter((c) => saIsDue(c, at)).sort((a, b) => a.dueAt - b.dueAt);
  const fresh = cards.filter((c) => !c.introduced).sort((a, b) => (a.level || 1) - (b.level || 1));
  const rest = cards
    .filter((c) => c.introduced && !saIsDue(c, at))
    .sort((a, b) => a.stage - b.stage || a.lastSeen - b.lastSeen);

  const picked: SaCard[] = [];
  const seen = new Set<string>();
  for (const list of [due, fresh, rest]) {
    for (const c of list) {
      if (picked.length >= SA_MAX_SESSION_CARDS) break;
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      picked.push(c);
    }
  }
  return picked;
}

// All cards sorted for the library view (most urgent first).
export function saLibrary(state: SaState, at = Date.now()): SaCard[] {
  return Object.values(state.cards).sort((a, b) => {
    const am = saIsMastered(a) ? 2 : a.introduced ? (a.dueAt <= at ? 0 : 1) : 0.5;
    const bm = saIsMastered(b) ? 2 : b.introduced ? (b.dueAt <= at ? 0 : 1) : 0.5;
    if (am !== bm) return am - bm;
    return a.stage - b.stage;
  });
}

// ---- XP / rewards ----------------------------------------------------------

export const SA_BASE_XP = 10;

export function saComboMultiplier(combo: number): number {
  if (combo >= 12) return 3;
  if (combo >= 8) return 2.5;
  if (combo >= 5) return 2;
  if (combo >= 3) return 1.5;
  return 1;
}

export function saXpForAnswer(combo: number, hard: boolean): number {
  return Math.round((hard ? SA_BASE_XP + 4 : SA_BASE_XP) * saComboMultiplier(combo));
}

// ---- Profile / streak / achievements --------------------------------------

export function saDefaultProfile(): SaProfile {
  return {
    xp: 0,
    streak: 0,
    lastPlayedDay: "",
    totalReviews: 0,
    totalCorrect: 0,
    bestCombo: 0,
    sessionsPlayed: 0,
    dailyDay: saDayKey(),
    dailyProgress: 0,
    dailyGoal: SA_DEFAULT_DAILY_GOAL,
    achievements: [],
  };
}

export function saRollDay(profile: SaProfile, at = Date.now()): SaProfile {
  const today = saDayKey(at);
  let next = profile;
  if (profile.dailyDay !== today) next = { ...next, dailyDay: today, dailyProgress: 0 };
  if (profile.lastPlayedDay && profile.lastPlayedDay !== today && daysBetween(profile.lastPlayedDay, today) > 1) {
    next = { ...next, streak: 0 };
  }
  return next;
}

export function saRegisterAnswer(profile: SaProfile, correct: boolean, combo: number, gainedXp: number): SaProfile {
  return {
    ...profile,
    xp: profile.xp + (correct ? gainedXp : 0),
    totalReviews: profile.totalReviews + 1,
    totalCorrect: profile.totalCorrect + (correct ? 1 : 0),
    bestCombo: Math.max(profile.bestCombo, combo),
    dailyProgress: profile.dailyProgress + 1,
  };
}

export function saCompleteSession(profile: SaProfile, at = Date.now()): SaProfile {
  const today = saDayKey(at);
  let streak = profile.streak;
  let lastPlayedDay = profile.lastPlayedDay;
  if (profile.lastPlayedDay !== today) {
    streak = profile.streak + 1;
    lastPlayedDay = today;
  }
  return { ...profile, streak, lastPlayedDay, sessionsPlayed: profile.sessionsPlayed + 1 };
}

export type SaAchievementContext = {
  bestComboThisSession: number;
  mistakesThisSession: number;
  masteredCount: number;
  level: number;
  at: number;
};

export function saCheckAchievements(profile: SaProfile, ctx: SaAchievementContext): string[] {
  const unlocked = new Set(profile.achievements);
  const newly: string[] = [];
  const add = (id: string, cond: boolean) => {
    if (cond && !unlocked.has(id)) {
      unlocked.add(id);
      newly.push(id);
    }
  };
  const hour = new Date(ctx.at).getHours();
  add("first_session", profile.sessionsPlayed >= 1);
  add("combo_10", ctx.bestComboThisSession >= 10);
  add("perfect", ctx.mistakesThisSession === 0);
  add("streak_3", profile.streak >= 3);
  add("streak_7", profile.streak >= 7);
  add("mastered_10", ctx.masteredCount >= 10);
  add("mastered_50", ctx.masteredCount >= 50);
  add("level_5", ctx.level >= 5);
  add("night_owl", hour >= 0 && hour < 5);
  add("century", profile.totalReviews >= 100);
  return newly;
}

export function saAchievementById(id: string): SaAchievement | undefined {
  return SA_ACHIEVEMENTS.find((a) => a.id === id);
}

// ---- Persistence -----------------------------------------------------------

export function saStateKey(language: string): string {
  return `${SA_STATE_KEY_PREFIX}${saNormalizeKey(language) || "default"}`;
}

export function saCreateState(language: string, words: SaWord[]): SaState {
  const cards: Record<string, SaCard> = {};
  for (const w of words) cards[w.id] = saMakeCard(w);
  return {
    version: SA_STATE_VERSION,
    language,
    cards,
    profile: saDefaultProfile(),
    settings: { ...SA_DEFAULT_SETTINGS },
    updatedAt: Date.now(),
  };
}

export function saLoadState(language: string): SaState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(saStateKey(language));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SaState>;
    if (!parsed || parsed.version !== SA_STATE_VERSION || typeof parsed.cards !== "object") return null;
    return {
      version: SA_STATE_VERSION,
      language,
      cards: (parsed.cards as Record<string, SaCard>) || {},
      profile: { ...saDefaultProfile(), ...(parsed.profile || {}) },
      settings: { ...SA_DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      updatedAt: parsed.updatedAt || Date.now(),
    };
  } catch {
    return null;
  }
}

export function saSaveState(state: SaState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(saStateKey(state.language), JSON.stringify({ ...state, updatedAt: Date.now() }));
  } catch {
    /* storage unavailable — still works in memory */
  }
}

export function saMergeWords(state: SaState, words: SaWord[]): SaState {
  const existing = new Set(Object.values(state.cards).map((c) => saNormalizeKey(c.text)));
  const cards = { ...state.cards };
  for (const w of words) {
    const key = saNormalizeKey(w.text);
    if (!key || existing.has(key)) continue;
    existing.add(key);
    cards[w.id] = saMakeCard(w);
  }
  return { ...state, cards };
}
