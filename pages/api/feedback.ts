import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAI } from "../../lib/openai";
import { checkRateLimit, getSession } from "../../lib/store";

type FeedbackResult = {
  status: "ok" | "corrected";
  corrected: string;
};

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
  const { sessionId, message, previousAssistant } = body || {};

  if (!sessionId || typeof sessionId !== 'string') {
    res.status(400).json({ error: "Invalid sessionId" });
    return;
  }

  let session = getSession(sessionId);
  if (!session) {
    // Session was lost, skip feedback rather than recreate
    res.status(200).json({ status: "ok", corrected: "" });
    return;
  }
  if (!session.language) {
    res.status(400).json({ error: "Language not set" });
    return;
  }

  const ip = getIp(req);
  // Use a generic rate limit key since we don't have sessionId
  if (!checkRateLimit(ip, sessionId)) {
    res.status(429).json({ error: "Rate limited" });
    return;
  }

  const userMessage = (message || "").trim();
  if (!userMessage) {
    res.status(400).json({ error: "Empty message" });
    return;
  }

  const previous = (previousAssistant || "").trim();

  try {
    const prompt = [
      {
        role: "system",
        content: [
          {
            type: "text" as const,
            text: [
              "You are a language coach helping learners improve their language skills.",
              `Target language: ${session.language}.`,
              "Analyze the user's message for grammar, vocabulary, and natural phrasing.",
              "IMPORTANT: Ignore punctuation marks and capitalization completely when deciding if correction is needed.",
              "Provide corrections when you see: spelling errors, grammar mistakes, missing words, unnatural phrasing, wrong vocabulary.",
              "EXAMPLES - CORRECT these:",
              "- 'I goed to store' -> 'I went to the store'",
              "- 'I want eat pizza' -> 'I want to eat pizza'",
              "- 'very good food' -> 'the food is very good' (more natural)",
              "- 'he like apples' -> 'he likes apples'",
              "- 'what time is' -> 'what time is it'",
              "DO NOT correct just for: 'hello' vs 'Hello' vs 'hello!', missing periods, question marks, etc.",
              "If the message is perfectly correct in grammar/vocabulary (ignoring punctuation/case), respond with status 'ok'.",
              "If ANY improvement is needed, respond with status 'corrected' and provide exactly one natural, improved version.",
              "FORMAT the corrected text using markdown: put **bold** around the parts that were changed or corrected.",
              "For example: if user said 'I goed to store', corrected should be 'I **went** to the **store**'.",
              "Return only JSON, no extra text.",
              "Schema: {\"status\":\"ok\"|\"corrected\",\"corrected\":\"\"}.",
              "The corrected text must be in the target language and natural.",
            ].join(" "),
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text" as const,
            text: `Previous assistant message: ${previous || "(none)"}`,
          },
          {
            type: "text" as const,
            text: `User message: ${userMessage}`,
          },
        ],
      },
    ];

    const reply = await callOpenAI(prompt);
    let parsed: FeedbackResult | null = null;
    try {
      parsed = JSON.parse(reply) as FeedbackResult;
    } catch {
      const start = reply.indexOf("{");
      const end = reply.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(reply.slice(start, end + 1)) as FeedbackResult;
        } catch {
          parsed = null;
        }
      }
    }

    if (!parsed || (parsed.status !== "ok" && parsed.status !== "corrected")) {
      parsed = { status: "ok", corrected: "" };
    }

    res.json({
      status: parsed.status,
      corrected: (parsed.corrected || "").trim(),
    });
  } catch (err) {
    res.status(500).json({ error: "Feedback failed" });
  }
}
