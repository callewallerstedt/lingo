import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAI } from "../../lib/openai";

type ExamplePayload = {
  items: Array<{
    label: string;
    sentence: string;
    translation: string;
  }>;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const { language, word } = body || {};

  if (!language || !word) {
    res.status(400).json({ error: "Missing language or word" });
    return;
  }

  const prompt = [
    {
      role: "system",
      content: [
        {
          type: "text" as const,
          text: [
            "Generate example sentences for a single vocabulary word.",
            "Use the target language for all example sentences.",
            "Add a short natural English translation for every example sentence.",
            "Provide 4 to 6 short, natural sentences using the word in different forms or roles.",
            "Each item must have label, sentence, and translation fields.",
            "Label must be a clear form name like Singular, Plural, Definite, Past, Polite, Question.",
            "Always include Singular and Plural as two of the lines (label them exactly).",
            "If the language doesn't mark plural/singular, still provide two lines labeled Singular and Plural using the base form.",
            "Include a Question line when it makes sense; otherwise use another common form (Definite, Past, Polite, Formal, Informal).",
            "If the language uses definiteness, include Definite as one of the lines.",
            "Keep translations concise and idiomatic, not word-by-word unless necessary.",
            "Return only JSON like:",
            "{\"items\":[{\"label\":\"Singular\",\"sentence\":\"...\",\"translation\":\"...\"}]}",
          ].join(" "),
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "text" as const,
          text: `Target language: ${language}\nWord: ${word}`,
        },
      ],
    },
  ];

  try {
    const reply = await callOpenAI(prompt);
    let parsed: ExamplePayload | null = null;
    try {
      parsed = JSON.parse(reply) as ExamplePayload;
    } catch {
      const start = reply.indexOf("{");
      const end = reply.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(reply.slice(start, end + 1)) as ExamplePayload;
        } catch {
          parsed = null;
        }
      }
    }

    const items = Array.isArray(parsed?.items)
      ? parsed.items.filter(
          (item) =>
            item &&
            typeof item.label === "string" &&
            typeof item.sentence === "string" &&
            typeof item.translation === "string"
        )
      : [];
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate examples" });
  }
}
