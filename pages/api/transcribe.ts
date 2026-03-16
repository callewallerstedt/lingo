import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAITranscription } from "../../lib/openai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const audioBase64 = typeof body?.audioBase64 === "string" ? body.audioBase64 : "";
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "audio/webm";
  const language = typeof body?.language === "string" ? body.language.trim() : "";

  if (!audioBase64) {
    res.status(400).json({ error: "Missing audio" });
    return;
  }

  try {
    const cleaned = audioBase64.includes(",") ? audioBase64.split(",").pop() || "" : audioBase64;
    const audioBuffer = Buffer.from(cleaned, "base64");
    if (!audioBuffer.length) {
      res.status(400).json({ error: "Missing recorded audio" });
      return;
    }
    const text = await callOpenAITranscription({
      audioBuffer,
      mimeType,
      prompt: language
        ? `The user may speak in English or ${language}. Return clean text only.`
        : "Return clean text only.",
    });
    res.status(200).json({ text });
  } catch (error) {
    console.error("Transcription failed:", error);
    res.status(500).json({
      error: error instanceof Error && error.message.trim() ? error.message.trim() : "Failed to transcribe audio",
    });
  }
}
