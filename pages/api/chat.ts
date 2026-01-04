import type { NextApiRequest, NextApiResponse } from "next";
import {
  systemPrompt,
  checkRateLimit,
  buildHistory,
  getSession,
  recordMessage,
  makeSession,
  roleStartPrompt,
  clampDifficulty,
  isPlausibleLanguage,
} from "../../lib/store";
import { callOpenAI, callOpenAIStreaming } from "../../lib/openai";

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
  const {
    sessionId,
    message,
    start,
    language,
    scenarioPreset,
    scenarioCustom,
    scenarioRole,
    scenarioStart,
    task,
    difficulty,
    messages: clientMessages,
  } = body || {};

  let session = getSession(sessionId);
  if (!session) {
    // Recreate session if it doesn't exist (similar to session API)
    session = makeSession(typeof sessionId === "string" ? sessionId : undefined);
  }

  if (typeof language === "string" && isPlausibleLanguage(language)) {
    session.language = language.trim();
  }
  if (typeof scenarioPreset === "string") {
    session.scenarioPreset = scenarioPreset;
  }
  if (typeof scenarioCustom === "string") {
    session.scenarioCustom = scenarioCustom;
  }
  if (typeof scenarioRole === "string") {
    session.scenarioRole = scenarioRole;
  }
  if (typeof scenarioStart === "string") {
    session.scenarioStart = scenarioStart;
  }
  if (typeof task === "string") {
    session.task = task;
  }
  if (typeof difficulty === "string") {
    session.difficulty = clampDifficulty(difficulty);
  }

  if (Array.isArray(clientMessages) && clientMessages.length > 0) {
    const normalized = clientMessages
      .filter(
        (msg) =>
          msg &&
          (msg.role === "user" || msg.role === "assistant") &&
          typeof msg.content === "string"
      )
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date().toISOString(),
      }));

    if (normalized.length > session.messages.length) {
      session.messages = normalized;
    }
  }

  const userMessage = (message || "").trim();
  const isContinue = userMessage === "__AI_CONTINUE__";
  const isStart = Boolean(start) || userMessage.startsWith("__AI_START__");

  if (!session.language) {
    res.status(400).json({ error: "Language not set" });
    return;
  }

  const ip = getIp(req);
  if (!checkRateLimit(ip, sessionId)) {
    res.status(429).json({ error: "Rate limited" });
    return;
  }

  if (isStart) {
    const systemPromptText = systemPrompt(session);

    // Set up streaming response
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const messages = [
      {
        role: "system",
        content: [{ type: "text" as const, text: systemPromptText }],
      },
      {
        role: "user",
        content: [
          {
            type: "text" as const,
            text: [
              roleStartPrompt(session),
              "Keep it realistic and concise.",
              `Use ${session.language} only.`,
            ].join(" "),
          },
        ],
      },
    ];

    let fullReply = "";
    try {
      for await (const chunk of callOpenAIStreaming(messages)) {
        fullReply += chunk;
        res.write(chunk);
      }
    } catch (streamError) {
      console.error("AI start streaming error:", streamError);
      // Fallback to regular API
      const aiResponse = await callOpenAI(messages);
      fullReply = aiResponse || "";
      res.write(fullReply);
    }

    recordMessage(session, "assistant", fullReply);
    res.end();
    return;
  }

  if (!userMessage) {
    res.status(400).json({ error: "Empty message" });
    return;
  }

  let skipRecordUser = false;
  if (Array.isArray(clientMessages) && clientMessages.length > 0) {
    const last = clientMessages[clientMessages.length - 1];
    if (last?.role === "user" && typeof last.content === "string" && last.content.trim() === userMessage) {
      skipRecordUser = true;
    }
  }
  if (isContinue) {
    skipRecordUser = true;
  }

  if (!skipRecordUser) {
    recordMessage(session, "user", userMessage);
  }

  try {
    const history = buildHistory(session);

    const messages = [
      {
        role: "system",
        content: [{ type: "text" as const, text: systemPrompt(session) }],
      },
      ...history,
    ];
    if (isContinue) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text" as const,
            text: "Continue the scene with the next natural step. Keep it concise.",
          },
        ],
      });
    }

    // Set up streaming response
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    let fullReply = "";
    try {
      for await (const chunk of callOpenAIStreaming(messages)) {
        fullReply += chunk;
        res.write(chunk);
      }
    } catch (streamError) {
      console.error("Streaming error:", streamError);
      // If streaming fails, fall back to regular API
      const reply = await callOpenAI(messages);
      fullReply = reply || "";
      res.write(fullReply);
    }

    if (!fullReply.trim()) {
      throw new Error("Empty reply");
    }

    recordMessage(session, "assistant", fullReply);
    res.end();
  } catch (err) {
    const fallback = "Network error. Try again.";
    recordMessage(session, "assistant", fallback);
    res.status(500).json({ reply: fallback, error: "OpenAI failed" });
  }
}
