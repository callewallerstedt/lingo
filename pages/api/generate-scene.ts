import type { NextApiRequest, NextApiResponse } from "next";
import { OPENAI_MODEL } from "../../lib/openai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const { scenario, language } = body || {};

  // Scene generation doesn't require session persistence
  if (!scenario || !language) {
    res.status(400).json({ error: "Missing scenario or language" });
    return;
  }

  try {
    const prompt: Array<{ role: string; content: Array<{ type: "text"; text: string }> }> = [
      {
        role: "system",
        content: [
          {
            type: "text" as const,
            text: [
              "You are a scene setter for a language practice chat.",
              "Generate ONE concise task instruction (1 sentence, max 12 words).",
              "Use imperative phrasing (e.g., \"Order a coffee and a pastry\"), not \"You...\".",
              "Make it a plausible interaction for this scenario (staff, relative, interviewer).",
              "Focus on what the learner should do/say next in this situation.",
              "Avoid unrelated details like time, mood, or scenery.",
            ].join(" "),
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text" as const,
            text: `Create a realistic, task-focused scene for: ${scenario}.`,
          },
        ],
      },
    ];

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: prompt,
        temperature: 1.0,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI error: ${response.status} ${text}`);
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content || "";
    const sceneDescription = output.split(/\r?\n/)[0]?.trim() || output.trim();

    res.json({ sceneDescription });
  } catch (err) {
    console.error("Scene generation error:", err);
    res.status(500).json({ error: "Failed to generate scene" });
  }
}
