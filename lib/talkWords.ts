import { WORDS } from "@/content/words";
import type { Word } from "./types";

export function slugifyWord(sv: string): string {
  return sv
    .toLowerCase()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

/** Match a Swedish headword against the built-in corpus (light normalization). */
export function findCorpusWord(sv: string): Word | undefined {
  const norm = sv.trim().toLowerCase().replace(/\s+/g, " ");
  if (!norm) return undefined;

  const bare = norm.replace(/^(en|ett|att)\s+/, "");

  return WORDS.find((word) => {
    const head = word.sv.toLowerCase();
    return head === norm || head === bare || head.replace(/^(en|ett|att)\s+/, "") === bare;
  });
}

export function buildCustomWord(input: { sv: string; de: string; en?: string }): Word {
  const sv = input.sv.trim();
  const de = input.de.trim();
  const en = (input.en || "").trim() || de;
  const id = `custom-${slugifyWord(sv) || "ord"}`;

  return {
    id,
    rank: 9500,
    sv,
    de,
    en,
    pos: sv.includes(" ") ? "phrase" : "noun",
    level: "A2",
    tags: ["talk", "saved"],
  };
}
