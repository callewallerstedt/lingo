/** Language the learner reads translations in. Tiffy is German, so that's the default. */
export type GlossLang = "de" | "en";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adj"
  | "adv"
  | "pron"
  | "prep"
  | "conj"
  | "num"
  | "interj"
  | "phrase"
  | "det";

export type Word = {
  /** Stable id, derived from the Swedish headword. Used as the flashcard key. */
  id: string;
  /** Frequency rank, 1 = most common. */
  rank: number;
  sv: string;
  de: string;
  en: string;
  pos: PartOfSpeech;
  level: CefrLevel;
  /** Theme tags used to build themed decks ("food", "travel", ...). */
  tags: string[];
  /**
   * Extra morphology, rendered under the headword:
   * nouns  -> "en bil, bilen, bilar, bilarna"
   * verbs  -> "att äta, äter, åt, ätit"
   */
  forms?: string;
  /** Example sentence with translation, when one earns its place. */
  ex?: { sv: string; de: string; en: string };
  /** Warning for German speakers: false friends, gender traps, word-order traps. */
  note?: string;
};

/** One flashcard's scheduling + history state. */
export type CardState = {
  /** Total times reviewed. Shown on the card. */
  reps: number;
  correct: number;
  lapses: number;
  /** SM-2 style ease factor. */
  ease: number;
  intervalDays: number;
  /** Epoch ms when the card next comes up. */
  due: number;
  /** Epoch ms of the last review, 0 if never. */
  last: number;
  /** Consecutive correct answers. */
  streak: number;
  starred: boolean;
  /** Retired by the learner: "I know this". Stays out of rotation until unarchived. */
  archived: boolean;
};

export type LessonProgress = {
  completed: boolean;
  /** Best score as a 0-1 fraction. */
  best: number;
  attempts: number;
  lastAt: number;
};

export type DayStat = {
  reviews: number;
  correct: number;
  xp: number;
  lessons: number;
};

export type Settings = {
  glossLang: GlossLang;
  /** Cards introduced per day in the flashcard queue. */
  newPerDay: number;
  /** Target reviews per day, drives the ring on the home screen. */
  dailyGoal: number;
  autoPlayAudio: boolean;
  showPhonetics: boolean;
  theme: "system" | "light" | "dark";
};

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
  /** Cached translation of an assistant turn, filled in on demand. */
  translation?: string;
  at: number;
};

export type ChatThread = {
  id: string;
  scenarioId: string;
  title: string;
  turns: ChatTurn[];
  updatedAt: number;
};

export type Progress = {
  version: 2;
  name: string;
  settings: Settings;
  cards: Record<string, CardState>;
  lessons: Record<string, LessonProgress>;
  /** ISO day string (YYYY-MM-DD) -> counters. */
  days: Record<string, DayStat>;
  xp: number;
  streak: number;
  /** ISO day string of the most recent active day. */
  lastActiveDay: string;
  /** Word ids the learner added to their own list. */
  saved: string[];
  chats: ChatThread[];
  /** Epoch ms of the last local mutation, used for last-write-wins sync. */
  updatedAt: number;
};
