import type { CefrLevel } from "@/lib/types";

export type GrammarExample = {
  sv: string;
  de: string;
  /** Set when the example demonstrates a mistake rather than the target form. */
  wrong?: boolean;
  note?: string;
};

export type GrammarTable = {
  head: string[];
  rows: string[][];
};

export type GrammarSection = {
  heading: string;
  /** Explanation prose. Written in English, since that's the shared language. */
  body: string;
  examples?: GrammarExample[];
  table?: GrammarTable;
  /** A German-speaker-specific warning, rendered as a highlighted aside. */
  germanTrap?: string;
};

export type GrammarTopic = {
  id: string;
  level: CefrLevel;
  /** Swedish title. */
  title: string;
  /** German title, shown as the subtitle. */
  titleDe: string;
  blurb: string;
  sections: GrammarSection[];
  /** The three or four things to actually remember. */
  keyPoints: string[];
};
