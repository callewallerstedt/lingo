import { NextRequest, NextResponse } from "next/server";
import { callOpenAI } from "@/lib/openai";
import { GRADE_SYSTEM } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Second-chance grader. The client checks answers locally first (normalised
 * string compare against the answer plus its alternates); this only runs when
 * that fails, so a valid paraphrase isn't marked wrong. Keeps token spend
 * proportional to actual near-misses.
 */
export async function POST(req: NextRequest) {
  let body: { answer?: string; expected?: string; prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const answer = (body.answer || "").trim().slice(0, 300);
  const expected = (body.expected || "").trim().slice(0, 300);
  if (!answer || !expected) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const prompt = [
    body.prompt ? `Task: ${body.prompt}` : "",
    `Reference answer: ${expected}`,
    `Learner's answer: ${answer}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const raw = await callOpenAI(
      [
        { role: "system", content: [{ type: "text", text: GRADE_SYSTEM }] },
        { role: "user", content: [{ type: "text", text: prompt }] },
      ],
      { reasoningEffort: "low", verbosity: "low", maxCompletionTokens: 150, promptCacheKey: "neolingo-grade" },
    );

    const parsed = parseJson(raw);
    return NextResponse.json({
      correct: Boolean(parsed?.correct),
      note: typeof parsed?.note === "string" ? parsed.note : "",
    });
  } catch (err) {
    console.error("grade failed", err);
    // Fail open: a grader outage shouldn't tell the learner they're wrong.
    return NextResponse.json({ correct: false, note: "" });
  }
}

function parseJson(raw: string): { correct?: boolean; note?: string } | null {
  try {
    return JSON.parse(raw);
  } catch {
    // Models occasionally wrap JSON in prose or a code fence.
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}
