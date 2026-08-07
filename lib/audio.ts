"use client";

/**
 * Swedish TTS playback. Responses are cached as object URLs because the same
 * words get replayed constantly in a flashcard session, and each miss is an
 * API call.
 */

const cache = new Map<string, string>();
let current: HTMLAudioElement | null = null;

function keyFor(text: string, slow: boolean) {
  return `${slow ? "slow" : "normal"}:${text}`;
}

export async function speak(text: string, options: { slow?: boolean } = {}): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const slow = Boolean(options.slow);
  const key = keyFor(trimmed, slow);

  // Cut off whatever's already playing so rapid taps don't overlap.
  if (current) {
    current.pause();
    current = null;
  }

  let url = cache.get(key);
  if (!url) {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed, slow }),
    });
    if (!response.ok) throw new Error("tts failed");
    const blob = await response.blob();
    url = URL.createObjectURL(blob);
    cache.set(key, url);
  }

  const audio = new Audio(url);
  current = audio;
  await audio.play().catch(() => {
    // iOS blocks playback until the user has interacted with the page. Nothing
    // to do here; the next tap will work.
  });
}

export function stopSpeaking() {
  if (current) {
    current.pause();
    current = null;
  }
}

let activeRecorder: MediaRecorder | null = null;

/**
 * Starts recording and resolves with the clip once `stopRecording()` is called
 * (or `maxMs` elapses, so a forgotten recording can't run forever).
 */
export async function recordClip(maxMs = 15000): Promise<Blob> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];
  activeRecorder = recorder;

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      stream.getTracks().forEach((track) => track.stop());
      if (activeRecorder === recorder) activeRecorder = null;
    };
    const timer = setTimeout(() => stopRecording(), maxMs);

    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      cleanup();
      resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
    };
    recorder.onerror = (event) => {
      cleanup();
      reject(event);
    };

    recorder.start();
  });
}

export function stopRecording() {
  if (activeRecorder && activeRecorder.state !== "inactive") {
    activeRecorder.stop();
  }
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  // Safari only does mp4; Chrome and Firefox prefer webm.
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export async function transcribe(blob: Blob, expected?: string): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "clip.webm");
  if (expected) form.append("expected", expected);

  const response = await fetch("/api/transcribe", { method: "POST", body: form });
  if (!response.ok) throw new Error("transcribe failed");
  const data = (await response.json()) as { text?: string };
  return data.text || "";
}
