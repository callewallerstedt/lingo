import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAI } from "../../lib/openai";

type CompletionResult = {
  completed: boolean;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const { task, language, scenarioTitle, roleGuide, messages } = body || {};

  if (!task || !language || !Array.isArray(messages)) {
    res.status(400).json({ error: "Missing task, language, or messages" });
    return;
  }

  const history = messages
    .slice(-20)
    .map((msg: any) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const prompt = [
    {
      role: "system",
      content: [
        {
          type: "text" as const,
          text: [
            "You are a strict evaluator of task completion in a roleplay chat.",
            "Decide if the user has fully completed the task based on the conversation.",
            "The task must be fully completed; partial attempts are not enough.",
            "Return only JSON: {\"completed\": true|false}.",
            "No extra text.",
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
            `Scenario: ${scenarioTitle || "Unknown"}`,
            roleGuide ? `Role guide: ${roleGuide}` : "",
            `Target language: ${language}`,
            `Task: ${task}`,
            "Conversation:",
            history,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    },
  ];

  try {
    const reply = await callOpenAI(prompt);
    let parsed: CompletionResult | null = null;
    try {
      parsed = JSON.parse(reply) as CompletionResult;
    } catch {
      const start = reply.indexOf("{");
      const end = reply.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(reply.slice(start, end + 1)) as CompletionResult;
        } catch {
          parsed = null;
        }
      }
    }

    if (!parsed || typeof parsed.completed !== "boolean") {
      parsed = { completed: false };
    }

    res.json({ completed: parsed.completed });
  } catch (err) {
    res.status(500).json({ error: "Failed to check task" });
  }
}
