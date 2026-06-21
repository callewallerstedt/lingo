import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAI } from "../../lib/openai";

type GenItem = {
  text: string;
  translation: string;
  itemType: "word" | "phrase" | "sentence";
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
  const { language, theme, count, existing, level } = body || {};
  if (!language) {
    res.status(400).json({ error: "Missing language" });
    return;
  }

  const safeCount = Math.max(4, Math.min(16, Math.floor(typeof count === "number" ? count : 10)));
  const themeText = typeof theme === "string" && theme.trim() ? theme.trim() : "";
  const existingList = Array.isArray(existing) ? existing.slice(-120) : [];
  const harder = level === "advanced" || level === "hard";

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
            harder
              ? "Aim for intermediate, genuinely useful items (B1-ish), not only the absolute basics."
              : "Favor high-frequency, practical items a learner needs early.",
            "Mix mostly words with a few short phrases and 2-3 full natural sentences.",
            "Each item is an object with keys: text (target language), translation (concise natural English), itemType (word|phrase|sentence), note, theme.",
            "note is one short 'good to know' tip: gender/article, irregular conjugation, usage, or a false-friend warning. Keep it under 140 characters. Omit only if truly nothing useful.",
            `theme must be a short 2-4 word category${themeText ? ` (use "${themeText}")` : ""}.`,
            "translation must be English only, never the target language.",
            "Never duplicate the avoid list. No transliteration unless the language uses a non-Latin script.",
            'Output only JSON: {"items":[{"text":"...","translation":"...","itemType":"word","note":"...","theme":"..."}]}',
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
            themeText ? `Theme: ${themeText}` : "Theme: learner's most useful next items",
            existingList.length ? `Avoid these (already known):\n${existingList.map((w: string) => `- ${w}`).join("\n")}` : "Avoid list: none",
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
