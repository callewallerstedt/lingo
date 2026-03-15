import type { NextApiRequest, NextApiResponse } from "next";
import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAI } from "../../lib/openai";
import { normalizeSurgeKey } from "../../lib/surge";

type SurgeApiItem = {
  text: string;
  translation: string;
  itemType: "word" | "phrase";
  itemKey: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const { language, count, existing, known, recent, difficulty } = body || {};

  if (!language || typeof count !== "number") {
    res.status(400).json({ error: "Missing language or count" });
    return;
  }

  const safeCount = Math.max(5, Math.min(15, Math.floor(count)));
  const existingList = Array.isArray(existing) ? existing.slice(-80) : [];
  const knownList = Array.isArray(known) ? known.slice(-120) : [];
  const recentList = Array.isArray(recent) ? recent.slice(-80) : [];

  const prompt = [
    {
      role: "system",
      content: [
        {
          type: "text" as const,
          text: [
            "Generate the most important beginner language items for fast recall practice.",
            `Return exactly ${safeCount} items as JSON.`,
            "Most items must be single high-frequency words.",
            "Include a smaller number of ultra-common short phrases used in daily speech.",
            "Every item must have text, translation, and itemType.",
            "itemType must be either word or phrase.",
            "translation must be concise natural English.",
            "Choose items that appear in everyday conversation and early sentence building.",
            difficulty === "hard"
              ? "You may include slightly broader daily-life items, but keep them essential."
              : "Keep the set extremely basic and practical.",
            "Avoid duplicates.",
            "Avoid anything already listed as existing, known, or recent.",
            "Output only JSON like {\"items\":[{\"text\":\"...\",\"translation\":\"...\",\"itemType\":\"word\"}]}",
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
            existingList.length ? `Existing items:\n${existingList.map((item: string) => `- ${item}`).join("\n")}` : "Existing items: none",
            knownList.length ? `Known items:\n${knownList.map((item: string) => `- ${item}`).join("\n")}` : "Known items: none",
            recentList.length ? `Recent items:\n${recentList.map((item: string) => `- ${item}`).join("\n")}` : "Recent items: none",
          ].join("\n\n"),
        },
      ],
    },
  ];

  try {
    const reply = await callOpenAI(prompt);
    let parsed: { items?: Array<{ text?: string; translation?: string; itemType?: "word" | "phrase" }> } | null = null;
    try {
      parsed = JSON.parse(reply) as { items?: Array<{ text?: string; translation?: string; itemType?: "word" | "phrase" }> };
    } catch {
      const start = reply.indexOf("{");
      const end = reply.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(reply.slice(start, end + 1)) as { items?: Array<{ text?: string; translation?: string; itemType?: "word" | "phrase" }> };
        } catch {
          parsed = null;
        }
      }
    }

    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    const seen = new Set<string>();
    const cleaned: SurgeApiItem[] = [];

    for (const item of items) {
      const text = typeof item?.text === "string" ? item.text.trim() : "";
      const translation = typeof item?.translation === "string" ? item.translation.trim() : "";
      const itemType = item?.itemType === "phrase" ? "phrase" : "word";
      const itemKey = normalizeSurgeKey(text);
      if (!text || !translation || !itemKey || seen.has(itemKey)) continue;
      seen.add(itemKey);
      cleaned.push({ text, translation, itemType, itemKey });
      if (cleaned.length >= safeCount) break;
    }

    res.json({ items: cleaned });
  } catch (error) {
    console.error("Failed to generate surge items:", error);
    res.status(500).json({ error: "Failed to generate surge items" });
  }
}
