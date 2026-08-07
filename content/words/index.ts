import type { CefrLevel, Word } from "@/lib/types";
import { parseBlocks, type RawBlock } from "./parse";
import { A1_BLOCKS } from "./a1";
import { A2_BLOCKS } from "./a2";
import { B1_BLOCKS } from "./b1";
import { B2_BLOCKS } from "./b2";

const ALL_BLOCKS: RawBlock[] = [...A1_BLOCKS, ...A2_BLOCKS, ...B1_BLOCKS, ...B2_BLOCKS];

/** The full corpus, frequency/usefulness ordered. Rank 1 is the first word taught. */
export const WORDS: Word[] = parseBlocks(ALL_BLOCKS);

export const WORD_BY_ID = new Map(WORDS.map((word) => [word.id, word]));

export function getWord(id: string): Word | undefined {
  return WORD_BY_ID.get(id);
}

export const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];

export function wordsByLevel(level: CefrLevel): Word[] {
  return WORDS.filter((word) => word.level === level);
}

export function wordsByTag(tag: string): Word[] {
  return WORDS.filter((word) => word.tags.includes(tag));
}

export type Deck = {
  id: string;
  title: string;
  /** German subtitle, since that's the learner's first language. */
  subtitle: string;
  emoji: string;
  tag: string;
};

/**
 * Themed decks, in a sensible learning order. Each maps onto a tag used in the
 * vocabulary blocks, so adding words to a block grows the matching deck.
 */
export const DECKS: Deck[] = [
  { id: "core", title: "Kärnord", subtitle: "Die wichtigsten Wörter", emoji: "⭐", tag: "core" },
  { id: "greetings", title: "Hälsningar", subtitle: "Begrüßung & Höflichkeit", emoji: "👋", tag: "greetings" },
  { id: "pronouns", title: "Pronomen", subtitle: "ich, du, mein, dein", emoji: "🙋", tag: "pronouns" },
  { id: "verbs", title: "Verb", subtitle: "Die häufigsten Verben", emoji: "🏃", tag: "verbs" },
  { id: "numbers", title: "Siffror", subtitle: "Zahlen & Ordnungszahlen", emoji: "🔢", tag: "numbers" },
  { id: "time", title: "Tid", subtitle: "Uhrzeit, Tage, Monate", emoji: "🕐", tag: "time" },
  { id: "family", title: "Familj", subtitle: "Familie & Menschen", emoji: "👨‍👩‍👧", tag: "family" },
  { id: "food", title: "Mat och dryck", subtitle: "Essen & Trinken", emoji: "🍽️", tag: "food" },
  { id: "home", title: "Hemma", subtitle: "Wohnung & Gegenstände", emoji: "🏠", tag: "home" },
  { id: "adjectives", title: "Adjektiv", subtitle: "Beschreibende Wörter", emoji: "🎨", tag: "adjectives" },
  { id: "colors", title: "Färger och kropp", subtitle: "Farben & Körper", emoji: "🌈", tag: "colors" },
  { id: "clothes", title: "Kläder", subtitle: "Kleidung & Einkaufen", emoji: "👕", tag: "clothes" },
  { id: "travel", title: "Resa", subtitle: "Reisen & Verkehr", emoji: "🚆", tag: "travel" },
  { id: "city", title: "Staden", subtitle: "Stadt & Orte", emoji: "🏙️", tag: "city" },
  { id: "work", title: "Jobb och skola", subtitle: "Arbeit & Schule", emoji: "💼", tag: "work" },
  { id: "nature", title: "Natur och väder", subtitle: "Natur & Wetter", emoji: "🌲", tag: "nature" },
  { id: "animals", title: "Djur", subtitle: "Tiere", emoji: "🦌", tag: "animals" },
  { id: "feelings", title: "Känslor", subtitle: "Gefühle & Charakter", emoji: "💭", tag: "feelings" },
  { id: "health", title: "Hälsa", subtitle: "Gesundheit & Körper", emoji: "🩺", tag: "health" },
  { id: "hobbies", title: "Fritid", subtitle: "Hobbys, Sport & Medien", emoji: "⚽", tag: "hobbies" },
  { id: "technology", title: "Teknik", subtitle: "Technik & Digitales", emoji: "📱", tag: "technology" },
  { id: "abstract", title: "Abstrakta ord", subtitle: "Denken & Argumentieren", emoji: "🧠", tag: "abstract" },
  { id: "society", title: "Samhälle", subtitle: "Gesellschaft & Nachrichten", emoji: "📰", tag: "society" },
  { id: "connectors", title: "Bindeord", subtitle: "Verknüpfungen & Struktur", emoji: "🔗", tag: "connectors" },
  { id: "nuance", title: "Nyanser", subtitle: "Feinheiten (B2)", emoji: "✨", tag: "nuance" },
  { id: "idioms", title: "Idiom", subtitle: "Redewendungen", emoji: "🗣️", tag: "idioms" },
  { id: "swedish-life", title: "Svenskt liv", subtitle: "Kultur & Alltag in Schweden", emoji: "🇸🇪", tag: "swedish-life" },
];

export function deckWords(deckId: string): Word[] {
  const deck = DECKS.find((entry) => entry.id === deckId);
  if (!deck) return [];
  return wordsByTag(deck.tag);
}
