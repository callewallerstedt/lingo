#!/usr/bin/env node
/**
 * Content integrity check.
 *
 * Lessons reference vocabulary by Swedish headword and grammar topics by id.
 * Those are plain strings, so a typo would silently drop a drill or a "read
 * more" link rather than failing the build. This catches them.
 *
 * Reads the sources as text instead of importing them, so it needs no
 * TypeScript toolchain and stays runnable in CI.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(...parts) {
  return readFileSync(join(ROOT, ...parts), "utf8");
}

// --- 1. Every Swedish headword in the corpus -------------------------------
const headwords = new Set();
let entryCount = 0;

for (const file of readdirSync(join(ROOT, "content/words")).filter((name) => /^(a1|a2|b1|b2)\.ts$/.test(name))) {
  for (const line of read("content/words", file).split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
    const parts = trimmed.split("|");
    if (parts.length < 4) continue;
    if (/^(level|tags|lines|import|export|const)/.test(trimmed)) continue;
    headwords.add(parts[0].trim());
    entryCount += 1;
  }
}

// --- 2. Grammar topic ids --------------------------------------------------
const grammarIds = new Set();
for (const file of ["a1.ts", "a2.ts", "b1.ts"]) {
  for (const match of read("content/grammar", file).matchAll(/^\s*id:\s*"([^"]+)"/gm)) {
    grammarIds.add(match[1]);
  }
}

// --- 3. Lesson references --------------------------------------------------
const problems = [];
let lessonCount = 0;
let referencedWords = 0;

for (const file of ["a1.ts", "a2.ts", "b1.ts"]) {
  const source = read("content/course", file);

  // Track the enclosing lesson id so a failure names the lesson, not a line number.
  const lessonIds = [...source.matchAll(/^\s{8}id:\s*"([^"]+)"/gm)].map((match) => ({
    id: match[1],
    index: match.index,
  }));
  lessonCount += lessonIds.length;

  const lessonIdAt = (index) => {
    let current = "(unknown)";
    for (const lesson of lessonIds) {
      if (lesson.index <= index) current = lesson.id;
      else break;
    }
    return current;
  };

  for (const match of source.matchAll(/words:\s*\[([^\]]*)\]/gs)) {
    const lesson = lessonIdAt(match.index);
    for (const raw of match[1].matchAll(/"([^"]+)"/g)) {
      referencedWords += 1;
      if (!headwords.has(raw[1])) {
        problems.push(`lesson "${lesson}" references unknown word: "${raw[1]}"`);
      }
    }
  }

  for (const match of source.matchAll(/grammarId:\s*"([^"]+)"/g)) {
    if (!grammarIds.has(match[1])) {
      problems.push(`lesson "${lessonIdAt(match.index)}" references unknown grammar topic: "${match[1]}"`);
    }
  }
}

console.log(`vocabulary entries: ${entryCount}`);
console.log(`unique headwords:   ${headwords.size}`);
console.log(`grammar topics:     ${grammarIds.size}`);
console.log(`lessons:            ${lessonCount}`);
console.log(`word references:    ${referencedWords}`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log("\ncontent OK");
