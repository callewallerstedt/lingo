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
    const translation = await callOpenAI(
      [
        { role: "system", content: [{ type: "text", text: system }] },
        { role: "user", content: [{ type: "text", text }] },
      ],
      {
        reasoningEffort: "none",
        verbosity: "low",
        maxCompletionTokens: mode === "talk-word" ? 48 : 300,
        promptCacheKey: `neolingo-translate-${mode}`,
      },
    );
    return NextResponse.json({ translation });
  } catch (err) {
    console.error("translate failed", err);
    return NextResponse.json({ error: "translate failed" }, { status: 502 });
  }
}
