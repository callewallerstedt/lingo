import { NextRequest, NextResponse } from "next/server";
import { callOpenAITTS } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSTRUCTIONS =
  "Speak natural, standard Swedish (rikssvenska) with a clear, friendly tone. Neutral Stockholm accent. Don't over-enunciate.";

export async function POST(req: NextRequest) {
  let body: { text?: string; slow?: boolean; voice?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const text = (body.text || "").trim().slice(0, 600);
  if (!text) return NextResponse.json({ error: "no text" }, { status: 400 });

  try {
    const audio = await callOpenAITTS({
      input: text,
      voice: body.voice || "nova",
      instructions: INSTRUCTIONS,
      // Slow mode for the "play it again, slower" button on flashcards.
      speed: body.slow ? 0.75 : 1,
    });

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        // Same word gets replayed constantly; let the browser keep it.
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("tts failed", err);
    return NextResponse.json({ error: "tts failed" }, { status: 502 });
  }
}
