import { NextRequest, NextResponse } from "next/server";
import { callOpenAI } from "@/lib/openai";
import { TALK_WORD_TRANSLATE_SYSTEM, TRANSLATE_SYSTEM } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  text?: string;
  /** "sv-de" (default) or "talk-word" for English/German→Swedish, Swedish→German. */
  mode?: "sv-de" | "talk-word";
};

function parseTalkWordPayload(raw: string): { sv: string; de: string; en: string; show: string } | null {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const data = JSON.parse(trimmed.slice(start, end + 1)) as {
      sv?: string;
      de?: string;
      en?: string;
      show?: string;
    };
    const sv = (data.sv || "").trim();
    const de = (data.de || "").trim();
    const en = (data.en || "").trim();
    const show = (data.show || "").trim();
    if (!sv || !de || !show) return null;
    return { sv, de, en: en || de, show };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const text = (body.text || "").trim().slice(0, 800);
  if (!text) return NextResponse.json({ error: "no text" }, { status: 400 });

  const mode = body.mode === "talk-word" ? "talk-word" : "sv-de";
  const system = mode === "talk-word" ? TALK_WORD_TRANSLATE_SYSTEM : TRANSLATE_SYSTEM;

  try {
    const output = await callOpenAI(
      [
        { role: "system", content: [{ type: "text", text: system }] },
        { role: "user", content: [{ type: "text", text }] },
      ],
      {
        reasoningEffort: "none",
        verbosity: "low",
        maxCompletionTokens: mode === "talk-word" ? 100 : 300,
        promptCacheKey: `neolingo-translate-${mode}`,
      },
    );

    if (mode === "talk-word") {
      const parsed = parseTalkWordPayload(output);
      if (parsed) {
        return NextResponse.json({
          translation: parsed.show,
          sv: parsed.sv,
          de: parsed.de,
          en: parsed.en,
        });
      }
      // Fallback if the model ignored JSON.
      return NextResponse.json({ translation: output, sv: text, de: output, en: text });
    }

    return NextResponse.json({ translation: output });
  } catch (err) {
    console.error("translate failed", err);
    return NextResponse.json({ error: "translate failed" }, { status: 502 });
  }
}
