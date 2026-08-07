import type { Progress, CardState, LessonProgress, DayStat, ChatThread } from "./types";

/**
 * Merge two snapshots of the same profile (e.g. phone and laptop).
 *
 * Whole-object last-write-wins would silently throw away a review session done
 * on the other device, so we merge per record instead: each card keeps whichever
 * copy was reviewed most recently, counters take the max, and only genuinely
 * scalar things (name, settings) follow the newer snapshot.
 */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const newer = a.updatedAt >= b.updatedAt ? a : b;
  const older = a.updatedAt >= b.updatedAt ? b : a;

  const cards: Record<string, CardState> = { ...older.cards };
  for (const [id, card] of Object.entries(newer.cards)) {
    const prev = cards[id];
    cards[id] = prev ? mergeCard(prev, card) : card;
  }

  const lessons: Record<string, LessonProgress> = { ...older.lessons };
  for (const [id, lesson] of Object.entries(newer.lessons)) {
    const prev = lessons[id];
    lessons[id] = prev
      ? {
          completed: prev.completed || lesson.completed,
          best: Math.max(prev.best, lesson.best),
          attempts: Math.max(prev.attempts, lesson.attempts),
          lastAt: Math.max(prev.lastAt, lesson.lastAt),
        }
      : lesson;
  }

  const days: Record<string, DayStat> = { ...older.days };
  for (const [day, stat] of Object.entries(newer.days)) {
    const prev = days[day];
    days[day] = prev
      ? {
          reviews: Math.max(prev.reviews, stat.reviews),
          correct: Math.max(prev.correct, stat.correct),
          xp: Math.max(prev.xp, stat.xp),
          lessons: Math.max(prev.lessons, stat.lessons),
        }
      : stat;
  }

  const chatsById = new Map<string, ChatThread>();
  for (const thread of [...older.chats, ...newer.chats]) {
    const prev = chatsById.get(thread.id);
    if (!prev || thread.updatedAt > prev.updatedAt) chatsById.set(thread.id, thread);
  }
  const chats = [...chatsById.values()].sort((x, y) => y.updatedAt - x.updatedAt).slice(0, 40);

  return {
    version: 2,
    name: newer.name || older.name,
    settings: newer.settings,
    cards,
    lessons,
    days,
    xp: Math.max(a.xp, b.xp),
    streak: Math.max(a.streak, b.streak),
    lastActiveDay: newer.lastActiveDay > older.lastActiveDay ? newer.lastActiveDay : older.lastActiveDay,
    saved: [...new Set([...older.saved, ...newer.saved])],
    chats,
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

function mergeCard(x: CardState, y: CardState): CardState {
  // The copy reviewed most recently owns the schedule; counters take the max so
  // reviews done on the other device still show up in the totals.
  const lead = y.last >= x.last ? y : x;
  return {
    reps: Math.max(x.reps, y.reps),
    correct: Math.max(x.correct, y.correct),
    lapses: Math.max(x.lapses, y.lapses),
    ease: lead.ease,
    intervalDays: lead.intervalDays,
    due: lead.due,
    last: Math.max(x.last, y.last),
    streak: lead.streak,
    starred: lead.starred,
    archived: lead.archived,
  };
}
