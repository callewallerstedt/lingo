import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAI, OPENAI_HEAVY_MODEL } from "../../lib/openai";

// Generates a full, self-contained grammar lesson as Markdown (+ LaTeX where
// genuinely useful). Uses the heavy model (gpt-5.5 by default) because good
// pedagogical structuring benefits from stronger reasoning.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const { language, title, brief } = body || {};
  if (!language || !title || !brief) {
    res.status(400).json({ error: "Missing language, title or brief" });
    return;
  }

  const prompt = [
    {
      role: "system",
      content: [
        {
          type: "text" as const,
          text: [
            `You are an expert ${language} teacher writing a single, self-contained lesson for an English-speaking beginner/early-intermediate learner.`,
            "Write the explanations in clear English, but put every example, word, and phrase in the target language followed by its English translation in parentheses.",
            "Output GitHub-Flavored Markdown ONLY — no surrounding code fences, no preamble, no closing remarks about being an AI.",
            "Structure the lesson with this shape, using Markdown headings:",
            "# <Lesson title>",
            "a one-sentence friendly intro;",
            "## How it works — a clear explanation;",
            "## Forms — use a Markdown table for conjugations/declensions (one row per person/case);",
            "## Examples — a bulleted list of 6-8 natural sentences, each: **target sentence** — English translation;",
            "## Good to know — 3-5 bullet tips, common mistakes, and false friends;",
            "## Quick practice — 3-4 short prompts the learner can try (with answers hidden under a short 'Answer:' line).",
            "Use LaTeX with $...$ (inline) or $$...$$ (block) ONLY where a formula/pattern is genuinely clearer (e.g. an ending pattern like $stem + are \\to stem + o$). Do not force LaTeX.",
            "Keep it focused and practical: aim for something a learner can absorb in a few minutes. Bold key target-language terms.",
            "Be accurate; never invent forms. If something is irregular, say so explicitly.",
          ].join(" "),
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "text" as const,
          text: [`Target language: ${language}`, `Lesson title: ${title}`, `Cover this: ${brief}`].join("\n"),
        },
      ],
    },
  ];

  try {
    const markdown = await callOpenAI(prompt, {
      model: OPENAI_HEAVY_MODEL,
      reasoningEffort: "medium",
      verbosity: "high",
      maxCompletionTokens: 2600,
    });
    const cleaned = markdown
      .replace(/^```(?:markdown)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    if (!cleaned) {
      res.status(502).json({ error: "Empty lesson" });
      return;
    }
    res.json({ markdown: cleaned });
  } catch (error) {
    console.error("lesson generation failed:", error);
    res.status(500).json({ error: "Failed to generate lesson" });
  }
}
