import { NextRequest, NextResponse } from "next/server";
import { callOpenAITranscription } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad form data" }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "no audio" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "audio too large" }, { status: 413 });
  }

  // The expected sentence steers the transcriber toward the right words, which
  // matters a lot for a beginner's accent.
  const expected = String(form.get("expected") || "").slice(0, 300);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await callOpenAITranscription({
      audioBuffer: buffer,
      mimeType: file.type,
      language: "sv",
      prompt: expected || undefined,
    });
    return NextResponse.json({ text });
  } catch (err) {
    console.error("transcribe failed", err);
    return NextResponse.json({ error: "transcribe failed" }, { status: 502 });
  }
}
