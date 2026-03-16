export type SurgeItemType = "word" | "phrase";
export type SurgeStatus = "learning" | "known";
export type SurgeDirection = "target_to_english" | "english_to_target";
export type SurgeResult = "correct" | "wrong";
export type SurgePhase = "preview" | "match" | "typing";

export type SurgeItem = {
  itemKey: string;
  text: string;
  translation: string;
  itemType: SurgeItemType;
};

export type SurgeProgressRecord = {
  itemKey: string;
  itemText: string;
  translation: string;
  itemType: SurgeItemType;
  status: SurgeStatus;
  stage: number;
  timesSeen: number;
  timesCorrect: number;
  lastResult?: SurgeResult | null;
  lastDirection?: SurgeDirection | null;
  lastReviewedAt?: number | null;
  nextReviewAt?: number | null;
  createdAt?: number | null;
  updatedAt?: number | null;
};

export type SurgeDelayedReview = {
  item: SurgeItem;
  remainingSkips: number;
};

export type SurgeTypingFeedback = {
  status: SurgeResult;
  expected: string;
  direction: SurgeDirection;
};

export type SurgeSession = {
  language: string;
  phase: SurgePhase;
  activeRound: SurgeItem[];
  reserve: SurgeItem[];
  reviewQueue: SurgeItem[];
  typingQueue: SurgeItem[];
  delayedReviewQueue: SurgeDelayedReview[];
  recentlySeen: string[];
  cycleCount: number;
  previewIndex: number;
  previewRevealed: boolean;
  previewSeenKeys: string[];
  matchTargets: string[];
  matchTranslations: string[];
  matchedKeys: string[];
  selectedTargetKey: string | null;
  selectedTranslationKey: string | null;
  typingInput: string;
  typingDirection: SurgeDirection | null;
  typingHintCount: number;
  typingFeedback: SurgeTypingFeedback | null;
};

export const SURGE_SESSION_KEY = "lingoarc_surge_session";
export const SURGE_PROGRESS_KEY_PREFIX = "lingoarc_surge_progress_";

export function createEmptySurgeSession(language: string): SurgeSession {
  return {
    language,
    phase: "preview",
    activeRound: [],
    reserve: [],
    reviewQueue: [],
    typingQueue: [],
    delayedReviewQueue: [],
    recentlySeen: [],
    cycleCount: 0,
    previewIndex: 0,
    previewRevealed: false,
    previewSeenKeys: [],
    matchTargets: [],
    matchTranslations: [],
    matchedKeys: [],
    selectedTargetKey: null,
    selectedTranslationKey: null,
    typingInput: "",
    typingDirection: null,
    typingHintCount: 0,
    typingFeedback: null,
  };
}

export function normalizeSurgeKey(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}' -]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSurgeAnswer(value: string, mode: "target" | "english") {
  let normalized = value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}' -]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (mode === "english") {
    normalized = normalized
      .replace(/\b(a|an|the)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return normalized;
}

export function getDirectionForStage(stage: number): SurgeDirection {
  return stage >= 3 ? "english_to_target" : "target_to_english";
}

export function getNextReviewAtForStage(stage: number, fromTime = Date.now()) {
  const offsets: Record<number, number> = {
    0: 0,
    1: 10 * 60 * 1000,
    2: 24 * 60 * 60 * 1000,
    3: 3 * 24 * 60 * 60 * 1000,
    4: 7 * 24 * 60 * 60 * 1000,
    5: 14 * 24 * 60 * 60 * 1000,
    6: 30 * 24 * 60 * 60 * 1000,
  };
  return fromTime + (offsets[Math.max(0, Math.min(6, stage))] ?? offsets[6]);
}

export function dedupeSurgeItems(items: SurgeItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.itemKey || seen.has(item.itemKey)) return false;
    seen.add(item.itemKey);
    return true;
  });
}

export function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function shuffleList<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}
