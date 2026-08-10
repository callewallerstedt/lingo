import type { Progress, Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  glossLang: "de",
  newPerDay: 15,
  dailyGoal: 40,
  autoPlayAudio: true,
  showPhonetics: false,
  theme: "system",
};

export function emptyProgress(name = ""): Progress {
  return {
    version: 2,
    name,
    settings: { ...DEFAULT_SETTINGS },
    cards: {},
    lessons: {},
    days: {},
    xp: 0,
    streak: 0,
    lastActiveDay: "",
    saved: [],
    customWords: {},
    chats: [],
    updatedAt: 0,
  };
}

/** Local calendar day, not UTC — a 23:00 review should count for today. */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dayKeyOffset(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return todayKey(d);
}

/**
 * Fill in anything missing from an older or hand-edited snapshot so the app
 * never reads `undefined` off a persisted object.
 */
export function hydrateProgress(raw: unknown): Progress {
  const base = emptyProgress();
  if (!raw || typeof raw !== "object") return base;
  const input = raw as Partial<Progress>;
  return {
    version: 2,
    name: typeof input.name === "string" ? input.name : base.name,
    settings: { ...base.settings, ...(input.settings || {}) },
    cards: input.cards && typeof input.cards === "object" ? input.cards : {},
    lessons: input.lessons && typeof input.lessons === "object" ? input.lessons : {},
    days: input.days && typeof input.days === "object" ? input.days : {},
    xp: typeof input.xp === "number" ? input.xp : 0,
    streak: typeof input.streak === "number" ? input.streak : 0,
    lastActiveDay: typeof input.lastActiveDay === "string" ? input.lastActiveDay : "",
    saved: Array.isArray(input.saved) ? input.saved : [],
    customWords:
      input.customWords && typeof input.customWords === "object" ? (input.customWords as Progress["customWords"]) : {},
    chats: Array.isArray(input.chats) ? input.chats : [],
    updatedAt: typeof input.updatedAt === "number" ? input.updatedAt : 0,
  };
}

/**
 * Recompute the day streak. A streak survives a gap of one calendar day only if
 * that day is today and yesterday was active.
 */
export function computeStreak(days: Record<string, unknown>): number {
  let streak = 0;
  const cursor = new Date();
  // Today not being active yet shouldn't break a streak built yesterday.
  if (!days[todayKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
  for (;;) {
    if (!days[todayKey(cursor)]) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
