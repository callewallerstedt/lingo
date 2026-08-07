import type { CefrLevel, PartOfSpeech, Word } from "@/lib/types";

/**
 * Vocabulary is authored as pipe-delimited lines grouped into themed blocks.
 * It keeps 1000+ entries readable and diffable, and the block header carries
 * the level and tags so they don't have to be repeated on every line.
 *
 *   sv | de | en | pos | forms | note
 *
 * Only the first four fields are required.
 *
 *   forms  noun  -> "en bil, bilen, bilar, bilarna"
 *          verb  -> "äta, äter, åt, ätit"
 *          adj   -> "stor, stort, stora"
 *   note   a trap worth flagging for a German speaker (false friend, gender,
 *          word order). Optional and used sparingly.
 */
export type RawBlock = {
  level: CefrLevel;
  tags: string[];
  lines: string;
};

const POS_VALUES = new Set<string>([
  "noun",
  "verb",
  "adj",
  "adv",
  "pron",
  "prep",
  "conj",
  "num",
  "interj",
  "phrase",
  "det",
]);

function slugify(sv: string): string {
  return sv
    .toLowerCase()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Turn authored blocks into Word records. Rank follows authoring order, which
 * is roughly frequency-ordered: core function words first, then themes.
 * Duplicate headwords are dropped — the first (more common) sense wins, except
 * that its tags absorb the later block's so themed decks stay complete.
 */
export function parseBlocks(blocks: RawBlock[]): Word[] {
  const words: Word[] = [];
  const byId = new Map<string, Word>();

  for (const block of blocks) {
    for (const rawLine of block.lines.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const parts = line.split("|").map((part) => part.trim());
      const [sv, de, en, pos, forms, note] = parts;

      if (!sv || !de || !en || !pos) {
        throw new Error(`Vocabulary line is missing a required field: "${line}"`);
      }
      if (!POS_VALUES.has(pos)) {
        throw new Error(`Unknown part of speech "${pos}" on line: "${line}"`);
      }

      let id = slugify(sv);
      const existing = byId.get(id);
      if (existing) {
        // Same headword in two themes (e.g. "en" as article and as numeral):
        // keep one card but let both themes find it.
        if (existing.pos === pos) {
          for (const tag of block.tags) {
            if (!existing.tags.includes(tag)) existing.tags.push(tag);
          }
          continue;
        }
        id = `${id}-${pos}`;
        if (byId.has(id)) continue;
      }

      const word: Word = {
        id,
        rank: words.length + 1,
        sv,
        de,
        en,
        pos: pos as PartOfSpeech,
        level: block.level,
        tags: [...block.tags],
        ...(forms ? { forms } : {}),
        ...(note ? { note } : {}),
      };

      byId.set(id, word);
      words.push(word);
    }
  }

  return words;
}
