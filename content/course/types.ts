import type { CefrLevel } from "@/lib/types";

/**
 * Exercise kinds. Each lesson hand-writes the ones that teach its grammar point;
 * vocabulary drills are generated at runtime from the lesson's word list so we
 * don't have to author four cards per word by hand.
 */
export type Exercise =
  /** Produce the Swedish for a German prompt (or the reverse). */
  | {
      kind: "translate";
      direction: "de-sv" | "sv-de";
      prompt: string;
      answer: string;
      /** Other answers that should also be accepted. */
      alts?: string[];
      hint?: string;
      explain?: string;
    }
  /** Pick one option. `answer` is the index into `options`. */
  | {
      kind: "choice";
      prompt: string;
      options: string[];
      answer: number;
      explain?: string;
    }
  /** Fill the gap. The prompt contains "___". */
  | {
      kind: "blank";
      prompt: string;
      answer: string;
      alts?: string[];
      hint?: string;
      explain?: string;
    }
  /** Drag the tokens into the right order. Tests word order specifically. */
  | {
      kind: "order";
      prompt: string;
      tokens: string[];
      answer: string;
      explain?: string;
    }
  /** Hear it, type it. Uses TTS. */
  | {
      kind: "listen";
      sv: string;
      de: string;
      explain?: string;
    }
  /** Say it out loud. Scored by transcription. */
  | {
      kind: "speak";
      sv: string;
      de: string;
    };

export type Lesson = {
  id: string;
  title: string;
  titleDe: string;
  /** Two or three sentences framing what this lesson is for. */
  intro: string;
  /** Links to a topic in the grammar reference, shown as "read more". */
  grammarId?: string;
  /**
   * Swedish headwords introduced here. Resolved against the corpus at load time,
   * which also means a typo fails loudly at build rather than silently.
   */
  words: string[];
  /** Hand-written exercises that teach this lesson's specific point. */
  exercises: Exercise[];
};

export type Unit = {
  id: string;
  title: string;
  titleDe: string;
  emoji: string;
  level: CefrLevel;
  blurb: string;
  lessons: Lesson[];
};
