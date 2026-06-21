import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAI, OPENAI_HEAVY_MODEL } from "../../lib/openai";

// Heavy task: structure a themed mini-course (a sequence of themes) for a learner.
// Uses the heavy model (gpt-5.5 by default) because course design benefits from
// stronger reasoning. The client then fills each theme via /api/surge-generate.

function parseJson(reply: string): { themes?: unknown[] } | null {
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
  const { language, goal, level, learningContext } = body || {};
  if (!language) {
    res.status(400).json({ error: "Missing language" });
    return;
  }
  const goalText = typeof goal === "string" && goal.trim() ? goal.trim() : "everyday conversational fluency";
  const contextText =
    learningContext && typeof learningContext === "object"
      ? JSON.stringify(learningContext).slice(0, 5000)
      : "No prior learning context.";

  const prompt = [
    {
      role: "system",
      content: [
        {
          type: "text" as const,
          text: [
            "You are an expert language-course designer.",
            "Design a focused, well-sequenced mini-course as strict JSON.",
            "Return 6-10 themes ordered from foundational to more advanced, each building on the last.",
            "Each theme is an object: { title (2-4 words), focus (one short sentence on what it teaches), count (8-12 suggested items) }.",
            `Tailor the path to the learner's goal and level.`,
            'Output only JSON: {"themes":[{"title":"...","focus":"...","count":10}]}',
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
            `Learner goal: ${goalText}`,
            `Level: ${level || "beginner"}`,
            `Existing learner context: ${contextText}`,
            "Avoid rebuilding material already mastered. Sequence the next gaps through advanced comprehension, register, argument, narration, idioms, and scenario production where appropriate.",
          ].join("\n"),
        },
      ],
    },
  ];

  try {
    const reply = await callOpenAI(prompt, { model: OPENAI_HEAVY_MODEL, reasoningEffort: "medium", verbosity: "low", maxCompletionTokens: 1200 });
    const parsed = parseJson(reply);
    const raw = Array.isArray(parsed?.themes) ? parsed!.themes : [];
    const themes = raw
      .map((t) => {
        const o = t as Record<string, unknown>;
        const title = typeof o.title === "string" ? o.title.trim() : "";
        const focus = typeof o.focus === "string" ? o.focus.trim() : "";
        const count = typeof o.count === "number" ? Math.max(6, Math.min(14, Math.floor(o.count))) : 10;
        return title ? { title, focus, count } : null;
      })
      .filter(Boolean)
      .slice(0, 10);
    res.json({ themes });
  } catch (error) {
    console.error("surge-course failed:", error);
    res.status(500).json({ error: "Failed to build course" });
  }
}
