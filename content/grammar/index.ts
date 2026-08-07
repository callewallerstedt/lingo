import type { CefrLevel } from "@/lib/types";
import type { GrammarTopic } from "./types";
import { GRAMMAR_A1 } from "./a1";
import { GRAMMAR_A2 } from "./a2";
import { GRAMMAR_B1 } from "./b1";

export type { GrammarTopic, GrammarSection, GrammarExample, GrammarTable } from "./types";

export const GRAMMAR: GrammarTopic[] = [...GRAMMAR_A1, ...GRAMMAR_A2, ...GRAMMAR_B1];

export const GRAMMAR_BY_ID = new Map(GRAMMAR.map((topic) => [topic.id, topic]));

export function getGrammar(id: string): GrammarTopic | undefined {
  return GRAMMAR_BY_ID.get(id);
}

export function grammarByLevel(level: CefrLevel): GrammarTopic[] {
  return GRAMMAR.filter((topic) => topic.level === level);
}
