import type { NextApiRequest, NextApiResponse } from "next";
import { getSession, saveSessions } from "../../lib/store";
import { callOpenAI } from "../../lib/openai";

function getIp(req: NextApiRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded;
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket.remoteAddress || "unknown";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const { sessionId, scenario, messages } = body || {};
  const session = getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const ip = getIp(req);
  // Note: Skipping rate limit for suggestions as they're helpful and not frequent

  if (!session.language) {
    res.status(400).json({ error: "Language not set" });
    return;
  }

  try {
    const conversationHistory = messages && messages.length > 0
      ? messages.slice(-6).map((msg: any) => `${msg.role}: ${msg.content}`).join("\n")
      : "No conversation started yet";

    const prompt = [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: `You are a language learning coach. Based on the scenario and conversation so far, suggest ONE specific conversational response or phrase that the user should practice saying next. Make it relevant to the current conversation context and scenario. Keep it concise (1 short sentence, max 15 words) and natural. Focus on what they should actually say in the conversation, not learning goals.`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Language: ${session.language}
Scenario: ${scenario}
Conversation so far:
${conversationHistory}

What should they practice next?`,
          },
        ],
      },
    ];

    const response = await callOpenAI(prompt);
    const suggestion = response.split(/\r?\n/)[0].trim();

    res.json({ suggestion });
  } catch (err) {
    console.error("Suggestion error:", err);
    res.status(500).json({ error: "Failed to generate suggestion" });
  }
}
