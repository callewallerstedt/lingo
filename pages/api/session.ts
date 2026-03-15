import type { NextApiRequest, NextApiResponse } from "next";
import {
  getSession,
  makeSession,
  saveSessions,
  isPlausibleLanguage,
  clampDifficulty,
  clampChatMode,
} from "../../lib/store";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const {
    sessionId,
    language,
    scenarioPreset,
    scenarioCustom,
    scenarioRole,
    scenarioStart,
    task,
    difficulty,
    chatMode,
    buddyContext,
  } = body || {};
  let session = getSession(sessionId);
  const wasCreated = !session;

  if (!session) {
    session = makeSession(typeof sessionId === "string" ? sessionId : undefined);
  }

  // Update session properties if provided
  if (language !== undefined && isPlausibleLanguage(language)) session.language = language;
  if (scenarioPreset !== undefined) session.scenarioPreset = scenarioPreset;
  if (scenarioCustom !== undefined) session.scenarioCustom = scenarioCustom;
  if (scenarioRole !== undefined) session.scenarioRole = scenarioRole;
  if (scenarioStart !== undefined) session.scenarioStart = scenarioStart;
  if (task !== undefined) session.task = task;
  if (difficulty !== undefined) session.difficulty = clampDifficulty(difficulty);
  if (chatMode !== undefined) session.chatMode = clampChatMode(chatMode);
  if (buddyContext !== undefined) session.buddyContext = typeof buddyContext === "string" ? buddyContext : "";

  // Always save the session after any updates
  saveSessions();
  console.log("Saved session:", sessionId, "messages count:", session.messages.length);

  res.json({
    sessionId: session.id,
    created: wasCreated,
    session: {
      language: session.language,
      chatMode: session.chatMode,
      scenarioPreset: session.scenarioPreset,
      scenarioCustom: session.scenarioCustom,
      buddyContext: session.buddyContext,
      difficulty: session.difficulty,
      messages: session.messages,
    },
  });
}
