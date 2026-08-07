import type { CefrLevel, Word } from "@/lib/types";
import { WORDS } from "@/content/words";
import type { Lesson, Unit, Exercise } from "./types";
import { COURSE_A1 } from "./a1";
import { COURSE_A2 } from "./a2";
import { COURSE_B1 } from "./b1";

export type { Lesson, Unit, Exercise } from "./types";

export const UNITS: Unit[] = [...COURSE_A1, ...COURSE_A2, ...COURSE_B1];

/** Swedish headword -> corpus entry, for resolving lesson word lists. */
const BY_HEADWORD = new Map<string, Word>();
for (const word of WORDS) {
  if (!BY_HEADWORD.has(word.sv)) BY_HEADWORD.set(word.sv, word);
}

export const LESSONS: Lesson[] = UNITS.flatMap((unit) => unit.lessons);

export const LESSON_BY_ID = new Map(LESSONS.map((lesson) => [lesson.id, lesson]));

const UNIT_OF_LESSON = new Map<string, Unit>();
for (const unit of UNITS) {
  for (const lesson of unit.lessons) UNIT_OF_LESSON.set(lesson.id, unit);
}

export function getLesson(id: string): Lesson | undefined {
  return LESSON_BY_ID.get(id);
}

export function unitOf(lessonId: string): Unit | undefined {
  return UNIT_OF_LESSON.get(lessonId);
}

/**
 * Resolve a lesson's headwords to corpus entries. Unknown headwords are dropped
 * rather than thrown so a typo degrades one drill instead of breaking the build;
 * `missingLessonWords()` surfaces them for the content check.
 */
export function lessonWords(lesson: Lesson): Word[] {
  const out: Word[] = [];
  for (const headword of lesson.words) {
    const word = BY_HEADWORD.get(headword);
    if (word) out.push(word);
  }
  return out;
}

/** Every lesson headword with no matching corpus entry. Used by the content check. */
export function missingLessonWords(): Array<{ lesson: string; word: string }> {
  const missing: Array<{ lesson: string; word: string }> = [];
  for (const lesson of LESSONS) {
    for (const headword of lesson.words) {
      if (!BY_HEADWORD.has(headword)) missing.push({ lesson: lesson.id, word: headword });
    }
  }
  return missing;
}

/** Grammar topic ids referenced by lessons but absent from the reference. */
export function referencedGrammarIds(): string[] {
  return [...new Set(LESSONS.map((lesson) => lesson.grammarId).filter((id): id is string => Boolean(id)))];
}

export function unitsByLevel(level: CefrLevel): Unit[] {
  return UNITS.filter((unit) => unit.level === level);
}

/** Ordered lesson ids, used to work out what comes next. */
export const LESSON_ORDER: string[] = LESSONS.map((lesson) => lesson.id);

export function nextLessonId(currentId: string): string | undefined {
  const index = LESSON_ORDER.indexOf(currentId);
  if (index < 0 || index === LESSON_ORDER.length - 1) return undefined;
  return LESSON_ORDER[index + 1];
}

/**
 * Build the exercise queue for a lesson: the hand-written items that teach its
 * grammar point, plus generated vocabulary drills from its word list. Authoring
 * four cards per word by hand would be unmaintainable; generating them keeps the
 * lesson dense while the hand-written items keep it pointed.
 */
export function buildLessonQueue(lesson: Lesson, glossLang: "de" | "en"): Exercise[] {
  const words = lessonWords(lesson);
  const generated: Exercise[] = [];

  for (const word of words) {
    const gloss = glossLang === "de" ? word.de : word.en;

    // Recognition first: seeing the Swedish and recalling the meaning is easier
    // than production, so it seeds the word before the harder direction.
    const distractors = words
      .filter((other) => other.id !== word.id)
      .map((other) => (glossLang === "de" ? other.de : other.en))
      .filter((option) => option !== gloss);

    if (distractors.length >= 3) {
      const options = shuffle([gloss, ...pickN(distractors, 3)]);
      generated.push({
        kind: "choice",
        prompt: word.sv,
        options,
        answer: options.indexOf(gloss),
        ...(word.note ? { explain: word.note } : {}),
      });
    }

    // Then production, which is what actually has to transfer to speech.
    generated.push({
      kind: "translate",
      direction: "de-sv",
      prompt: gloss,
      answer: word.sv,
      ...(word.forms ? { hint: word.forms } : {}),
      ...(word.note ? { explain: word.note } : {}),
    });
  }

  return [...lesson.exercises, ...shuffle(generated)];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickN<T>(items: T[], count: number): T[] {
  return shuffle(items).slice(0, count);
}
