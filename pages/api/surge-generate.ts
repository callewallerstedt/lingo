import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAI } from "../../lib/openai";

type GenItem = {
  text: string;
  translation: string;
  itemType: "word" | "phrase" | "sentence";
  cue?: string;
  note?: string;
  theme: string;
};

function coerceType(value: unknown, text: string): GenItem["itemType"] {
  if (value === "sentence" || value === "phrase" || value === "word") return value;
  const words = text.trim().split(/\s+/).length;
  if (words >= 4) return "sentence";
  if (words >= 2) return "phrase";
  return "word";
}

function parseJson(reply: string): { items?: unknown[] } | null {
  try {
    return JSON.parse(reply);
  } catch {
    const start = reply.indexOf("{");
    const end = reply.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(reply.slice(start, end + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const { language, theme, count, existing, level, learningContext, purpose } = body || {};
  if (!language) {
    res.status(400).json({ error: "Missing language" });
    return;
  }

  const safeCount = Math.max(4, Math.min(16, Math.floor(typeof count === "number" ? count : 10)));
  const themeText = typeof theme === "string" && theme.trim() ? theme.trim() : "";
  const existingList = Array.isArray(existing) ? existing.slice(-120) : [];
  const proficiency = level === "advanced" ? "advanced" : level === "intermediate" || level === "hard" ? "intermediate" : "beginner";
  const context = learningContext && typeof learningContext === "object" ? learningContext as Record<string, unknown> : {};
  const known = Array.isArray(context.known) ? context.known.slice(-60) : [];
  const mastered = Array.isArray(context.mastered) ? context.mastered.slice(-40) : [];
  const struggling = Array.isArray(context.struggling) ? context.struggling.slice(-24) : [];
  const completedLessons = Array.isArray(context.completedLessons) ? context.completedLessons.slice(-20) : [];
  const recentThemes = Array.isArray(context.recentThemes) ? context.recentThemes.slice(-10) : [];
  const focus = typeof context.focus === "string" ? context.focus : "";

  const prompt = [
    {
      role: "system",
      content: [
        {
          type: "text" as const,
          text: [
            "You generate vocabulary study material for a spaced-repetition language app.",
            `Return exactly ${safeCount} items as strict JSON.`,
            themeText
              ? `Every item must clearly belong to the theme: "${themeText}".`
              : "Pick the most useful everyday items for a learner building toward fluency.",
            proficiency === "advanced"
              ? "Target B2-C2 depth: natural collocations, idioms, register, connectors, precise verbs, nuanced sentences, and realistic scenario replies."
              : proficiency === "intermediate"
                ? "Target A2-B1 growth: practical vocabulary plus sentence production, useful grammar patterns, and realistic everyday scenarios."
                : "Favor high-frequency A1-A2 material, core verbs, pronouns, daily needs, and immediately useful short sentences.",
            proficiency === "beginner"
              ? "Mix mostly core words and phrases with 2-3 short full sentences."
              : "Include at least 4 full natural sentences or scenario replies, with the rest as high-value words and collocations.",
            "For sentence or scenario items, include cue: a concise English situation or instruction that prompts the learner to produce the target sentence (for example, 'At a café, politely order a cappuccino.').",
            "Each item is an object with keys: text (target language), translation (concise natural English), itemType (word|phrase|sentence), cue, note, theme.",
            "note is one short 'good to know' tip: gender/article, irregular conjugation, usage, or a false-friend warning. Keep it under 140 characters. Omit only if truly nothing useful.",
            `theme must be a short 2-4 word category${themeText ? ` (use "${themeText}")` : ""}.`,
            "translation must be English only, never the target language.",
            "Never duplicate the avoid list. No transliteration unless the language uses a non-Latin script.",
            purpose === "upcoming"
              ? "These items are an adaptive upcoming queue. Build directly beyond what is known, revisit weak themes without duplicating exact words, and include deeper production when mastery is strong."
              : "Build a coherent pack that fits the learner's current knowledge.",
            'Output only JSON: {"items":[{"text":"...","translation":"...","itemType":"word","cue":"...","note":"...","theme":"..."}]}',
          ].join(" "),
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "text" as const,
          text: [
            `Target language: ${language}`,
            `Current proficiency: ${proficiency}`,
            themeText ? `Theme: ${themeText}` : "Theme: learner's most useful next items",
            existingList.length ? `Avoid these (already known):\n${existingList.map((w: string) => `- ${w}`).join("\n")}` : "Avoid list: none",
            known.length ? `Strong or recently known material to build from:\n${known.map((w: string) => `- ${w}`).join("\n")}` : "",
            mastered.length ? `Mastered material (do not repeat directly; combine it into harder language):\n${mastered.map((w: string) => `- ${w}`).join("\n")}` : "",
            struggling.length ? `Weak material to reinforce through related contexts:\n${struggling.map((w: string) => `- ${w}`).join("\n")}` : "",
            completedLessons.length ? `Completed grammar lessons: ${completedLessons.join(", ")}` : "",
            recentThemes.length ? `Recent themes: ${recentThemes.join(", ")}` : "",
            focus ? `Adaptive focus: ${focus}` : "",
          ].join("\n\n"),
        },
      ],
    },
  ];

  try {
    const reply = await callOpenAI(prompt, { verbosity: "low", maxCompletionTokens: 1400 });
    const parsed = parseJson(reply);
    const rawItems = Array.isArray(parsed?.items) ? parsed!.items : [];
    const seen = new Set<string>();
    const items: GenItem[] = [];
    for (const raw of rawItems) {
      const it = raw as Record<string, unknown>;
      const text = typeof it.text === "string" ? it.text.trim() : "";
      const translation = typeof it.translation === "string" ? it.translation.trim() : "";
      if (!text || !translation) continue;
      const key = text.toLocaleLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        text,
        translation,
        itemType: coerceType(it.itemType ?? it.type, text),
        cue: typeof it.cue === "string" && it.cue.trim() ? it.cue.trim() : undefined,
        note: typeof it.note === "string" && it.note.trim() ? it.note.trim() : undefined,
        theme: typeof it.theme === "string" && it.theme.trim() ? it.theme.trim() : themeText || "General",
      });
      if (items.length >= safeCount) break;
    }
    res.json({ items });
  } catch (error) {
    console.error("surge-generate failed:", error);
    res.status(500).json({ error: "Failed to generate material" });
  }
}
