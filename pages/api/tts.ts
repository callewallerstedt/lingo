import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAITTS } from "../../lib/openai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const language = typeof body?.language === "string" ? body.language.trim() : "";
  const variant = body?.variant === "slow" ? "slow" : "natural";

  if (!text || !language) {
    res.status(400).json({ error: "Missing text or language" });
    return;
  }

  try {
    const audio = await callOpenAITTS({
      input: text,
      instructions:
        variant === "slow"
          ? `Pronounce this ${language} text clearly, gently, and learner-friendly, with careful articulation and crisp separation between words. Speak only the provided text.`
          : `Pronounce this ${language} text naturally, smoothly, and confidently, like a fluent local speaker in everyday conversation. Speak only the provided text.`,
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(Buffer.from(audio));
  } catch (error) {
    console.error("TTS failed:", error);
    res.status(500).json({ error: "Failed to generate speech" });
  }
}
