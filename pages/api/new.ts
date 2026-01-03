import type { NextApiRequest, NextApiResponse } from "next";
import { makeSession, recordMessage } from "../../lib/store";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Create a fresh session (saving disabled, so no persistence issues)
  const session = makeSession();

  // Ensure the session has no messages (should be empty from makeSession)
  if (session.messages.length > 0) {
    console.error("New session should have no messages but has:", session.messages.length);
    session.messages = [];
  }

  console.log("New session created:", session.id, "messages count:", session.messages.length);

  // Don't add any default messages - let the frontend control the conversation start
  res.json({
    sessionId: session.id,
    session: {
      language: session.language,
      scenarioPreset: session.scenarioPreset,
      scenarioCustom: session.scenarioCustom,
      difficulty: session.difficulty,
      messages: [], // Start with empty messages
    },
  });
}
