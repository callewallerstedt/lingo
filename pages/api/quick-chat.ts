import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAI } from "../../lib/openai";

type QuickHistoryItem = {
  role: "user" | "assistant";
  text: string;
};

function normalizeQuickText(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(/[\s\p{P}\p{S}]+/gu, " ")
    .trim();
}

function sanitizeQuickBody(mode: string | undefined, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (mode === "answer") return trimmed;
  return /^(check if|correct\b|fix\b|translate\b|say\b|how do you say\b|is ['"].+['"] correct)/i.test(trimmed)
    ? ""
    : trimmed;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const language = typeof body?.language === "string" ? body.language.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const profileSummary = typeof body?.profileSummary === "string" ? body.profileSummary.trim() : "";
  const history = Array.isArray(body?.history)
    ? body.history
        .filter(
          (item): item is QuickHistoryItem =>
            item &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.text === "string"
        )
        .slice(-14)
    : [];

  if (!language || !message) {
    res.status(400).json({ error: "Missing language or message" });
    return;
  }

  const system = [
    `You are a floating quick language helper for a learner studying ${language}.`,
    "Be concise. No yapping. Keep replies efficient and short.",
    "Return valid JSON only.",
    "You help in four main modes:",
    "1. translation: if the user writes in English, translate it into the target language.",
    "2. correction: if the user writes in the target language, judge if it is good, then give a cleaner version if needed.",
    "3. answer: if the user asks a short question about the language, answer briefly in English.",
    "4. tts: if the user asks you to say something, or asks you to say your last sentence, return the exact target-language text to speak.",
    "Use English for explanations and notes unless the user explicitly asks otherwise.",
    "If the user writes in the target language, briefly say whether it is good, and if needed provide a better version and one short reason.",
    "If the user writes in English, give one best natural translation, not a long list.",
    "If you return target-language text, make it natural and common.",
    "For TTS requests, set mode to tts and fill ttsText with the exact text to speak.",
    "If the user says 'say ...', 'how do you say ...', or asks to hear the last sentence, treat it as a tts request.",
    "If you mention a target-language sentence in a correction or translation, include it in targetText so the UI can show it clearly.",
    "Do not repeat the user's request as commentary. Never write lines like 'Check if...' or 'Correct the order...'.",
    "If targetText and improved would be the same sentence, leave improved empty.",
    "JSON schema:",
    '{"mode":"translation|correction|answer|tts","title":"short label","text":"short English explanation","targetText":"optional target-language text","translation":"optional English translation","verdict":"ok|fix|note","improved":"optional corrected target-language version","note":"optional very short note","ttsText":"optional exact text to speak"}',
  ].join(" ");

  const historyText = history.length
    ? history.map((item) => `${item.role === "assistant" ? "Assistant" : "User"}: ${item.text}`).join("\n")
    : "No prior quick-chat history.";

  const userPrompt = [
    `Learner profile: ${profileSummary || "No extra progress summary provided."}`,
    `Quick chat history:\n${historyText}`,
    `Latest user message: ${message}`,
  ].join("\n\n");

  try {
    const reply = await callOpenAI([
      {
        role: "system",
        content: [{ type: "text", text: system }],
      },
      {
        role: "user",
        content: [{ type: "text", text: userPrompt }],
      },
    ]);

    let parsed:
      | {
          mode?: "translation" | "correction" | "answer" | "tts";
          title?: string;
          text?: string;
          targetText?: string;
          translation?: string;
          verdict?: "ok" | "fix" | "note";
          improved?: string;
          note?: string;
          ttsText?: string;
        }
      | null = null;

    try {
      parsed = JSON.parse(reply);
    } catch {
      const start = reply.indexOf("{");
      const end = reply.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        parsed = JSON.parse(reply.slice(start, end + 1));
      }
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid quick chat payload");
    }

    const targetText = typeof parsed.targetText === "string" ? parsed.targetText.trim() : "";
    const improved = typeof parsed.improved === "string" ? parsed.improved.trim() : "";
    const dedupedImproved =
      improved && normalizeQuickText(improved) !== normalizeQuickText(targetText) ? improved : "";

    res.status(200).json({
      mode:
        parsed.mode === "translation" || parsed.mode === "correction" || parsed.mode === "tts"
          ? parsed.mode
          : "answer",
      title: typeof parsed.title === "string" ? parsed.title.trim() : "Quick help",
      text: sanitizeQuickBody(parsed.mode, typeof parsed.text === "string" ? parsed.text : ""),
      targetText,
      translation: typeof parsed.translation === "string" ? parsed.translation.trim() : "",
      verdict:
        parsed.verdict === "ok" || parsed.verdict === "fix" || parsed.verdict === "note"
          ? parsed.verdict
          : null,
      improved: dedupedImproved,
      note: typeof parsed.note === "string" ? parsed.note.trim() : "",
      ttsText: typeof parsed.ttsText === "string" ? parsed.ttsText.trim() : "",
    });
  } catch (error) {
    console.error("Quick chat failed:", error);
    res.status(500).json({ error: "Quick chat failed" });
  }
}
