import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAI } from "../../lib/openai";

type VocabItem = {
  word: string;
  translation: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const { language, count, existing, scenarioTitle, scenarioDetail, roleGuide, userRole } = body || {};

  if (!language || typeof count !== "number") {
    res.status(400).json({ error: "Missing language or count" });
    return;
  }

  const safeCount = Math.max(5, Math.min(30, Math.floor(count)));
  const avoidList =
    Array.isArray(existing) && existing.length
      ? existing.slice(-60).map((word: string) => `- ${word}`).join("\n")
      : "None";

  const prompt = [
    {
      role: "system",
      content: [
        {
          type: "text" as const,
          text: [
            "Generate a compact list of common everyday words for language learners.",
            `Return exactly ${safeCount} items.`,
            "Each item must be JSON with keys word and translation.",
            "Word must be in the target language, translation in English.",
            "Choose practical, high-frequency vocabulary.",
            "If a scenario is provided, bias toward words commonly used in that setting.",
            "Avoid duplicates and avoid the words in the avoid list.",
            "Output only JSON: {\"items\":[{\"word\":\"...\",\"translation\":\"...\"}]}",
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
            scenarioTitle ? `Scenario: ${scenarioTitle}` : "",
            scenarioDetail ? `Scenario detail: ${scenarioDetail}` : "",
            roleGuide ? `Role guide: ${roleGuide}` : "",
            userRole ? `Learner role: ${userRole}` : "",
            `Avoid words:\n${avoidList}`,
          ].join("\n"),
        },
      ],
    },
  ];

  try {
    const reply = await callOpenAI(prompt);
    let parsed: { items?: VocabItem[] } | null = null;
    try {
      parsed = JSON.parse(reply) as { items?: VocabItem[] };
    } catch {
      const start = reply.indexOf("{");
      const end = reply.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(reply.slice(start, end + 1)) as { items?: VocabItem[] };
        } catch {
          parsed = null;
        }
      }
    }

    const items = Array.isArray(parsed?.items) ? parsed?.items : [];
    const cleaned = items
      .filter((item) => item && typeof item.word === "string" && typeof item.translation === "string")
      .slice(0, safeCount);

    res.json({ items: cleaned });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate vocab" });
  }
}
