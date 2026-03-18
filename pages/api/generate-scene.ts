import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAI } from "../../lib/openai";

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

    const output = await callOpenAI(prompt, {
      reasoningEffort: "none",
      verbosity: "low",
      maxCompletionTokens: 48,
    });
    const sceneDescription = output.split(/\r?\n/)[0]?.trim() || output.trim();

    res.json({ sceneDescription });
  } catch (err) {
    console.error("Scene generation error:", err);
    res.status(500).json({ error: "Failed to generate scene" });
  }
}
