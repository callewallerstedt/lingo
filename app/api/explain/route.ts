import { NextRequest, NextResponse } from "next/server";
import { callOpenAI } from "@/lib/openai";
import { EXPLAIN_SYSTEM } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { question?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const question = (body.question || "").trim().slice(0, 500);
  if (!question) return NextResponse.json({ error: "no question" }, { status: 400 });

  const context = (body.context || "").trim().slice(0, 500);
  const prompt = context ? `Kontext: ${context}\n\nFrage: ${question}` : question;

  try {
    const answer = await callOpenAI(
      [
        { role: "system", content: [{ type: "text", text: EXPLAIN_SYSTEM }] },
        { role: "user", content: [{ type: "text", text: prompt }] },
      ],
      { reasoningEffort: "low", verbosity: "low", maxCompletionTokens: 300, promptCacheKey: "neolingo-explain" },
    );
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("explain failed", err);
    return NextResponse.json({ error: "explain failed" }, { status: 502 });
  }
}
