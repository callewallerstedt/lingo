import { NextRequest, NextResponse } from "next/server";
import { callOpenAI } from "@/lib/openai";
import { TRANSLATE_SYSTEM } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const text = (body.text || "").trim().slice(0, 800);
  if (!text) return NextResponse.json({ error: "no text" }, { status: 400 });

  try {
    const translation = await callOpenAI(
      [
        { role: "system", content: [{ type: "text", text: TRANSLATE_SYSTEM }] },
        { role: "user", content: [{ type: "text", text }] },
      ],
      { reasoningEffort: "none", verbosity: "low", maxCompletionTokens: 300, promptCacheKey: "neolingo-translate" },
    );
    return NextResponse.json({ translation });
  } catch (err) {
    console.error("translate failed", err);
    return NextResponse.json({ error: "translate failed" }, { status: 502 });
  }
}
