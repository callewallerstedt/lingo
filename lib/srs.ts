import type { CardState } from "./types";

/** What the learner pressed after seeing the answer. */
export type Grade = "again" | "hard" | "good" | "easy";

export const DAY_MS = 24 * 60 * 60 * 1000;

export function newCard(): CardState {
  return {
    reps: 0,
    correct: 0,
    lapses: 0,
    ease: 2.5,
    intervalDays: 0,
    due: 0,
    last: 0,
    streak: 0,
    starred: false,
    archived: false,
  };
}

/**
 * SM-2 with the sharp edges filed off: short graduating steps so a new word
 * comes back the same session, and a cap so nothing disappears for a year.
 */
const MAX_INTERVAL_DAYS = 210;

export function schedule(card: CardState, grade: Grade, now = Date.now()): CardState {
  const next: CardState = { ...card };
  next.reps += 1;
  next.last = now;

  if (grade === "again") {
    next.lapses += 1;
    next.streak = 0;
    next.ease = Math.max(1.3, next.ease - 0.2);
    next.intervalDays = 0;
    // Come back in ten minutes, still inside this session.
    next.due = now + 10 * 60 * 1000;
    return next;
  }

  next.correct += 1;
  next.streak += 1;

  if (grade === "hard") {
    next.ease = Math.max(1.3, next.ease - 0.15);
  } else if (grade === "easy") {
    next.ease = Math.min(3.2, next.ease + 0.15);
  }

  let interval: number;
  if (next.streak === 1) {
    interval = grade === "easy" ? 3 : 1;
  } else if (next.streak === 2) {
    interval = grade === "easy" ? 7 : grade === "hard" ? 2 : 4;
  } else {
    const factor = grade === "hard" ? 1.2 : grade === "easy" ? next.ease * 1.35 : next.ease;
    interval = Math.max(1, card.intervalDays || 1) * factor;
  }

  interval = Math.min(MAX_INTERVAL_DAYS, Math.round(interval * 10) / 10);
  next.intervalDays = interval;
  next.due = now + interval * DAY_MS;
  return next;
}

export function isDue(card: CardState, now = Date.now()) {
  return !card.archived && card.due <= now;
}

export function isNew(card: CardState | undefined) {
  return !card || card.reps === 0;
}

/** Rough retention estimate, used for the "known" count on the stats screen. */
export function isKnown(card: CardState) {
  return card.archived || (card.streak >= 3 && card.intervalDays >= 21);
}

export function formatInterval(days: number): string {
  if (days <= 0) return "now";
  if (days < 1) return `${Math.round(days * 24)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

/** Preview of when each button would bring the card back, shown on the buttons. */
export function gradePreview(card: CardState): Record<Grade, string> {
  const now = Date.now();
  return {
    again: "10m",
    hard: formatInterval(schedule(card, "hard", now).intervalDays),
    good: formatInterval(schedule(card, "good", now).intervalDays),
    easy: formatInterval(schedule(card, "easy", now).intervalDays),
  };
}
