import type { NextApiRequest, NextApiResponse } from "next";
import { checkRateLimit, getSession, makeSession } from "../../lib/store";
import { callOpenAIForTranslation } from "../../lib/openai";

function getIp(req: NextApiRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded;
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket.remoteAddress || "unknown";
}

function normalizeWord(word: string) {
  return word
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{M}\p{Nd}'-]/gu, "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const { sessionId, word, sentence } = body || {};
  let session = getSession(sessionId);
  if (!session) {
    session = makeSession(typeof sessionId === "string" ? sessionId : undefined);
  }

  const ip = getIp(req);
  if (!checkRateLimit(ip, sessionId)) {
    res.status(429).json({ error: "Rate limited" });
    return;
  }

  const cleanWord = (word || "").trim();
  if (!cleanWord) {
    res.status(400).json({ error: "Missing word" });
    return;
  }

  const cacheKey = normalizeWord(cleanWord);
  if (session.translationCache[cacheKey]) {
    res.json({ translation: session.translationCache[cacheKey], cached: true });
    return;
  }

  try {
    // Truncate sentence context for speed (max 100 chars around the word)
    let contextText = `Word: "${cleanWord}"`;
    if (sentence) {
      const wordIndex = sentence.toLowerCase().indexOf(cleanWord.toLowerCase());
      if (wordIndex !== -1) {
        const start = Math.max(0, wordIndex - 50);
        const end = Math.min(sentence.length, wordIndex + cleanWord.length + 50);
        const truncated = sentence.slice(start, end);
        contextText = `Word: "${cleanWord}"\nContext sentence: "${truncated}"`;
      }
    }
    const prompt = [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: [
              "You are a fast translator.",
              "Translate ONLY the single word provided to English.",
              "Use the sentence ONLY as context; do NOT translate the sentence.",
              "Return only the translated word or short phrase (1-4 words).",
              "No punctuation, no extra text, no explanations.",
            ].join(" "),
          },
        ],
      },
      {
        role: "user",
        content: [{ type: "text" as const, text: contextText }],
      },
    ];

    const translation = await callOpenAIForTranslation(prompt);
    // Extract only the first line and clean it aggressively
    const cleaned = translation
      .split(/\r?\n/)[0] // First line only
      .trim() // Remove whitespace
      .replace(/^[\"']|[\"']$/g, "") // Remove quotes
      .replace(/^[*\-]\s*/, "") // Remove simple bullet points
      .split(/[.,!?;:]/)[0] // Take only before punctuation
      .trim();

    const finalTranslation = cleaned || translation.split(/\r?\n/)[0]?.trim() || cleanWord;
    session.translationCache[cacheKey] = finalTranslation;
    res.json({ translation: finalTranslation, cached: false });
  } catch (err) {
    res.status(500).json({ error: "Translation failed" });
  }
}
