import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAI } from "../../lib/openai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const { scenarioTitle, scenarioSubtitle, roleGuide, userRole, language, difficulty, previousTasks } = body || {};

  if (!scenarioTitle || !language) {
    res.status(400).json({ error: "Missing scenarioTitle or language" });
    return;
  }

  const avoidList =
    Array.isArray(previousTasks) && previousTasks.length
      ? previousTasks.slice(-8).map((task) => `- ${task}`).join("\n")
      : "None";

  const prompt = [
    {
      role: "system",
      content: [
        {
          type: "text" as const,
          text: [
            "You create a single, realistic task for a language practice roleplay.",
            "Return exactly ONE short imperative sentence (max 12 words).",
            "Write the task in English only.",
            "Do NOT translate the task into the target language.",
            "Use only ASCII letters, numbers, spaces, and basic punctuation.",
            "Keep it concrete and plausible for the scenario.",
            "Avoid repeating the tasks in the avoid list.",
            "Use simple, common words suitable for language learners.",
            "The task is for the learner's role, not the staff role.",
            "Output only the task sentence, no quotes or extra text.",
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
            `Scenario: ${scenarioTitle}`,
            scenarioSubtitle ? `Scenario detail: ${scenarioSubtitle}` : "",
            roleGuide ? `Role guide: ${roleGuide}` : "",
            `Learner role: ${typeof userRole === "string" && userRole ? userRole : "guest/customer"}`,
            difficulty ? `Difficulty: ${difficulty}` : "",
            `Avoid tasks:\n${avoidList}`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    },
  ];

  try {
    const task = await callOpenAI(prompt);
    const line = task.split(/\r?\n/)[0].trim();
    res.json({ task: line });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate task" });
  }
}
