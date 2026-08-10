"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CardState, Progress, Settings } from "./types";
import { computeStreak, emptyProgress, hydrateProgress, todayKey } from "./progress";
import { mergeProgress } from "./merge";
import { newCard, schedule, type Grade } from "./srs";
import { buildCustomWord, findCorpusWord } from "./talkWords";

const STORAGE_KEY = "neolingo.progress.v2";
const PROFILE_KEY = "neolingo.profile";
/** Idle time before a cloud flush. Keeps a review session to one write. */
const SYNC_DEBOUNCE_MS = 6000;

type SyncState = "idle" | "syncing" | "offline" | "error";

type Store = {
  progress: Progress;
  profileId: string;
  ready: boolean;
  syncState: SyncState;
  cardFor: (id: string) => CardState;
  gradeCard: (id: string, grade: Grade) => void;
  toggleStar: (id: string) => void;
  setArchived: (id: string, archived: boolean) => void;
  resetCard: (id: string) => void;
  completeLesson: (lessonId: string, score: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setName: (name: string) => void;
  setProfileId: (id: string) => void;
  saveChat: (thread: Progress["chats"][number]) => void;
  deleteChat: (id: string) => void;
  /** Save a word from talking mode into flashcards (corpus match or custom). */
  saveTalkWord: (input: { sv: string; de: string; en?: string }) => string;
  resetAll: () => void;
  syncNow: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside <StoreProvider>");
  return store;
}

function readLocal(): Progress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? hydrateProgress(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeLocal(progress: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private browsing or a full quota. The session still works in memory.
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => emptyProgress("Tiffy"));
  const [profileId, setProfileIdState] = useState("tiffy");
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  /** Mirrors `progress` so flush callbacks don't need it in their dep list. */
  const latest = useRef(progress);
  latest.current = progress;
  const profileRef = useRef(profileId);
  profileRef.current = profileId;

  const flush = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    setSyncState("syncing");
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: profileRef.current, snapshot: latest.current }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { cloud?: boolean; snapshot?: unknown };
      if (!data.cloud) {
        setSyncState("offline");
        return;
      }
      if (data.snapshot) {
        // The server merged in anything from another device; adopt the result.
        const merged = hydrateProgress(data.snapshot);
        setProgress(merged);
        writeLocal(merged);
      }
      setSyncState("idle");
    } catch {
      // Re-arm so the next mutation retries rather than silently dropping.
      dirty.current = true;
      setSyncState("error");
    }
  }, []);

  const scheduleSync = useCallback(() => {
    dirty.current = true;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => void flush(), SYNC_DEBOUNCE_MS);
  }, [flush]);

  /** Apply a change: update state, persist locally, and queue a cloud flush. */
  const mutate = useCallback(
    (updater: (current: Progress) => Progress) => {
      setProgress((current) => {
        const next = { ...updater(current), updatedAt: Date.now() };
        writeLocal(next);
        return next;
      });
      scheduleSync();
    },
    [scheduleSync],
  );

  // Boot: local first so the UI paints immediately, then reconcile with cloud.
  useEffect(() => {
    const storedProfile = localStorage.getItem(PROFILE_KEY) || "tiffy";
    setProfileIdState(storedProfile);

    const local = readLocal() ?? emptyProgress("Tiffy");
    setProgress(local);
    setReady(true);

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/sync?profile=${encodeURIComponent(storedProfile)}`);
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as { cloud?: boolean; snapshot?: unknown };
        if (cancelled) return;
        if (!data.cloud) {
          setSyncState("offline");
          return;
        }
        if (data.snapshot) {
          const merged = mergeProgress(local, hydrateProgress(data.snapshot));
          setProgress(merged);
          writeLocal(merged);
        }
        setSyncState("idle");
      } catch {
        if (!cancelled) setSyncState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Flush on the way out. visibilitychange is the only event iOS reliably fires
  // when the app is backgrounded or swiped away.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [flush]);

  // Register the service worker so the app installs and can receive push.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Blocked in private mode or unsupported. The app works without it.
    });
  }, []);

  const cardFor = useCallback((id: string) => progress.cards[id] ?? newCard(), [progress.cards]);

  /** Bump today's counters and recompute the streak. */
  const withDayStat = (current: Progress, patch: { reviews?: number; correct?: number; xp?: number; lessons?: number }) => {
    const day = todayKey();
    const existing = current.days[day] ?? { reviews: 0, correct: 0, xp: 0, lessons: 0 };
    const days = {
      ...current.days,
      [day]: {
        reviews: existing.reviews + (patch.reviews ?? 0),
        correct: existing.correct + (patch.correct ?? 0),
        xp: existing.xp + (patch.xp ?? 0),
        lessons: existing.lessons + (patch.lessons ?? 0),
      },
    };
    return {
      days,
      xp: current.xp + (patch.xp ?? 0),
      streak: computeStreak(days),
      lastActiveDay: day,
    };
  };

  const gradeCard = useCallback(
    (id: string, grade: Grade) => {
      mutate((current) => {
        const card = current.cards[id] ?? newCard();
        const updated = schedule(card, grade);
        const correct = grade !== "again";
        return {
          ...current,
          cards: { ...current.cards, [id]: updated },
          ...withDayStat(current, { reviews: 1, correct: correct ? 1 : 0, xp: correct ? 2 : 1 }),
        };
      });
    },
    [mutate],
  );

  const toggleStar = useCallback(
    (id: string) => {
      mutate((current) => {
        const card = current.cards[id] ?? newCard();
        return { ...current, cards: { ...current.cards, [id]: { ...card, starred: !card.starred } } };
      });
    },
    [mutate],
  );

  const setArchived = useCallback(
    (id: string, archived: boolean) => {
      mutate((current) => {
        const card = current.cards[id] ?? newCard();
        return { ...current, cards: { ...current.cards, [id]: { ...card, archived } } };
      });
    },
    [mutate],
  );

  const resetCard = useCallback(
    (id: string) => {
      mutate((current) => {
        const card = current.cards[id];
        // Keep the star; the learner chose that deliberately.
        return { ...current, cards: { ...current.cards, [id]: { ...newCard(), starred: card?.starred ?? false } } };
      });
    },
    [mutate],
  );

  const completeLesson = useCallback(
    (lessonId: string, score: number) => {
      mutate((current) => {
        const existing = current.lessons[lessonId] ?? { completed: false, best: 0, attempts: 0, lastAt: 0 };
        const xp = Math.round(20 + score * 30);
        return {
          ...current,
          lessons: {
            ...current.lessons,
            [lessonId]: {
              completed: true,
              best: Math.max(existing.best, score),
              attempts: existing.attempts + 1,
              lastAt: Date.now(),
            },
          },
          ...withDayStat(current, { lessons: 1, xp }),
        };
      });
    },
    [mutate],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      mutate((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
    },
    [mutate],
  );

  const setName = useCallback((name: string) => mutate((current) => ({ ...current, name })), [mutate]);

  const saveChat = useCallback(
    (thread: Progress["chats"][number]) => {
      mutate((current) => {
        const others = current.chats.filter((entry) => entry.id !== thread.id);
        return { ...current, chats: [thread, ...others].slice(0, 40) };
      });
    },
    [mutate],
  );

  const deleteChat = useCallback(
    (id: string) => {
      mutate((current) => ({ ...current, chats: current.chats.filter((entry) => entry.id !== id) }));
    },
    [mutate],
  );

  const saveTalkWord = useCallback(
    (input: { sv: string; de: string; en?: string }) => {
      const corpus = findCorpusWord(input.sv);
      const word = corpus ?? buildCustomWord(input);
      mutate((current) => {
        const existing = current.cards[word.id] ?? newCard();
        const cards = {
          ...current.cards,
          [word.id]: {
            ...existing,
            starred: true,
            archived: false,
            // Make it show up soon in the review queue.
            due: Math.min(existing.due || Date.now(), Date.now()),
          },
        };
        const saved = current.saved.includes(word.id) ? current.saved : [...current.saved, word.id];
        const customWords =
          corpus || current.customWords[word.id]
            ? current.customWords
            : { ...current.customWords, [word.id]: word };
        return { ...current, cards, saved, customWords };
      });
      return word.id;
    },
    [mutate],
  );

  const setProfileId = useCallback((id: string) => {
    const cleaned = id.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || "tiffy";
    localStorage.setItem(PROFILE_KEY, cleaned);
    setProfileIdState(cleaned);
    // Reload so the new profile's snapshot is pulled from a clean slate rather
    // than merged into the previous learner's progress.
    window.location.reload();
  }, []);

  const resetAll = useCallback(() => {
    const fresh = emptyProgress(latest.current.name);
    setProgress(fresh);
    writeLocal(fresh);
    scheduleSync();
  }, [scheduleSync]);

  const syncNow = useCallback(async () => {
    dirty.current = true;
    await flush();
  }, [flush]);

  const value = useMemo<Store>(
    () => ({
      progress,
      profileId,
      ready,
      syncState,
      cardFor,
      gradeCard,
      toggleStar,
      setArchived,
      resetCard,
      completeLesson,
      updateSettings,
      setName,
      setProfileId,
      saveChat,
      deleteChat,
      saveTalkWord,
      resetAll,
      syncNow,
    }),
    [
      progress,
      profileId,
      ready,
      syncState,
      cardFor,
      gradeCard,
      toggleStar,
      setArchived,
      resetCard,
      completeLesson,
      updateSettings,
      setName,
      setProfileId,
      saveChat,
      deleteChat,
      saveTalkWord,
      resetAll,
      syncNow,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
