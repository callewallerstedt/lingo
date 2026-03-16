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
  const { language, count, existing, known, recent, support, difficulty } = body || {};

  if (!language || typeof count !== "number") {
    res.status(400).json({ error: "Missing language or count" });
    return;
  }

  const safeCount = Math.max(5, Math.min(15, Math.floor(count)));
  const existingList = Array.isArray(existing) ? existing.slice(-80) : [];
  const knownList = Array.isArray(known) ? known.slice(-120) : [];
  const recentList = Array.isArray(recent) ? recent.slice(-80) : [];
  const supportList = Array.isArray(support) ? support.slice(-120) : [];

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
            supportList.length >= 8
              ? "Include one or two ultra-common short phrases or tiny sentences used in daily speech."
              : "Keep phrases very rare unless they are unavoidable ultra-basic expressions.",
            "Every item must have text, translation, and itemType.",
            "itemType must be either word or phrase.",
            "translation must be concise natural English only.",
            "Choose items that appear in everyday conversation and early sentence building.",
            "Never return a translation in the target language.",
            "Never return text and translation that mean the same written form.",
            supportList.length >= 8
              ? "If you include a phrase or tiny sentence, build it only from words in the support vocabulary list or universally basic function words."
              : "If support vocabulary is small, prefer standalone words over phrases.",
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
            supportList.length ? `Support vocabulary for phrases:\n${supportList.map((item: string) => `- ${item}`).join("\n")}` : "Support vocabulary for phrases: none",
          ].join("\n\n"),
        },
      ],
    },
  ];

  try {
    const reply = await callOpenAI(prompt);
    let parsed:
      | {
          items?: Array<{
            text?: string;
            word?: string;
            phrase?: string;
            translation?: string;
            meaning?: string;
            english?: string;
            itemType?: "word" | "phrase";
            item_type?: "word" | "phrase";
            type?: "word" | "phrase";
          }>;
        }
      | null = null;
    try {
      parsed = JSON.parse(reply) as {
        items?: Array<{
          text?: string;
          word?: string;
          phrase?: string;
          translation?: string;
          meaning?: string;
          english?: string;
          itemType?: "word" | "phrase";
          item_type?: "word" | "phrase";
          type?: "word" | "phrase";
        }>;
      };
    } catch {
      const start = reply.indexOf("{");
      const end = reply.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(reply.slice(start, end + 1)) as {
            items?: Array<{
              text?: string;
              word?: string;
              phrase?: string;
              translation?: string;
              meaning?: string;
              english?: string;
              itemType?: "word" | "phrase";
              item_type?: "word" | "phrase";
              type?: "word" | "phrase";
            }>;
          };
        } catch {
          parsed = null;
        }
      }
    }

    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    const seen = new Set<string>();
    const cleaned: SurgeApiItem[] = [];

    for (const item of items) {
      const textSource =
        typeof item?.text === "string"
          ? item.text
          : typeof item?.word === "string"
            ? item.word
            : typeof item?.phrase === "string"
              ? item.phrase
              : "";
      const translationSource =
        typeof item?.translation === "string"
          ? item.translation
          : typeof item?.meaning === "string"
            ? item.meaning
            : typeof item?.english === "string"
              ? item.english
              : "";
      const text = textSource.trim();
      const translation = translationSource.trim();
      const inferredType =
        item?.itemType === "phrase" || item?.item_type === "phrase" || item?.type === "phrase"
          ? "phrase"
          : text.includes(" ")
            ? "phrase"
            : "word";
      const itemType = inferredType;
      const itemKey = normalizeSurgeKey(text);
      const normalizedTranslation = normalizeSurgeKey(translation);
      if (!text || !translation || !itemKey || seen.has(itemKey)) continue;
      if (normalizedTranslation === itemKey) continue;
      seen.add(itemKey);
      cleaned.push({ text, translation, itemType, itemKey });
      if (cleaned.length >= safeCount) break;
    }

    if (!cleaned.length) {
      console.error("Surge items parsed empty:", reply);
    }

    res.json({ items: cleaned });
  } catch (error) {
    console.error("Failed to generate surge items:", error);
    res.status(500).json({ error: "Failed to generate surge items" });
  }
}
