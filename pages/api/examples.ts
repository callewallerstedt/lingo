import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAI } from "../../lib/openai";

type ExamplePayload = {
  sentences: string[];
  forms: string[];
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
            "Use the target language for all sentences.",
            "Provide 3 to 4 short, natural sentences using the word in different forms or roles.",
            "Also provide a short list of the forms used (e.g., plural, past, polite form).",
            "Return only JSON: {\"sentences\": [\"...\"], \"forms\": [\"...\"]}",
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

    const sentences = Array.isArray(parsed?.sentences) ? parsed?.sentences : [];
    const forms = Array.isArray(parsed?.forms) ? parsed?.forms : [];
    res.json({ sentences, forms });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate examples" });
  }
}
