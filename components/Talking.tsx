"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { experimental_useRealtime as useRealtime } from "@ai-sdk/react";
import { xai } from "@ai-sdk/xai";
import type { UIMessage } from "ai";
import { useStore } from "@/lib/state";
import {
  TALKING_MODEL,
  TALKING_VOICE,
  pickTalkingTopic,
  talkingInstructions,
} from "@/lib/talking";

type Phase = "idle" | "starting" | "live";

type TranscriptLine = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

function waitFor(
  check: () => boolean,
  { timeoutMs = 15000, intervalMs = 40 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (check()) {
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error("timeout"));
        return;
      }
      window.setTimeout(tick, intervalMs);
    };
    tick();
  });
}

export function Talking({ onExit }: { onExit: () => void }) {
  const { progress } = useStore();
  const topic = useMemo(() => pickTalkingTopic(), []);
  const model = useMemo(() => xai.experimental_realtime(TALKING_MODEL), []);
  const name = progress.name || "Tiffy";
  const instructions = useMemo(() => talkingInstructions(topic, name), [topic, name]);

  // Must be referentially stable — useRealtime recreates the whole session
  // whenever sessionConfig identity changes, which caused double-speak / stuck UI.
  const sessionConfig = useMemo(
    () => ({
      instructions,
      voice: TALKING_VOICE,
      turnDetection: {
        type: "server-vad" as const,
        silenceDurationMs: 1100,
        threshold: 0.55,
      },
      providerOptions: {
        reasoning: { effort: "none" },
        audio: {
          output: { speed: 0.78 },
          input: {
            // Ask xAI for user speech transcripts so the toggle has content.
            transcription: {},
          },
        },
      },
    }),
    [instructions],
  );

  const [showTranscript, setShowTranscript] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [localLines, setLocalLines] = useState<TranscriptLine[]>([]);
  const [partialAssistant, setPartialAssistant] = useState("");

  const micRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);
  const kickedOffRef = useRef(false);
  const statusRef = useRef("disconnected");
  const logRef = useRef<HTMLDivElement>(null);
  const assistantItemRef = useRef<string | null>(null);

  const onError = useCallback((err: Error) => {
    console.error("talking realtime error", err);
    setError(err.message || "Något gick fel.");
    startingRef.current = false;
    kickedOffRef.current = false;
    setPhase("idle");
  }, []);

  const onEvent = useCallback((event: { type: string; [key: string]: unknown }) => {
    if (event.type === "audio-transcript-delta") {
      const itemId = String(event.itemId ?? "assistant");
      const delta = String(event.delta ?? "");
      if (!delta) return;
      if (assistantItemRef.current !== itemId) {
        assistantItemRef.current = itemId;
        setPartialAssistant(delta);
      } else {
        setPartialAssistant((current) => current + delta);
      }
      return;
    }

    if (event.type === "audio-transcript-done") {
      const text = String(event.transcript ?? "").trim();
      const itemId = String(event.itemId ?? `a-${Date.now()}`);
      assistantItemRef.current = null;
      setPartialAssistant("");
      if (text) {
        setLocalLines((lines) => {
          if (lines.some((line) => line.id === itemId && line.role === "assistant")) return lines;
          return [...lines, { id: itemId, role: "assistant", text }];
        });
      }
      return;
    }

    if (event.type === "input-transcription-completed") {
      const text = String(event.transcript ?? "").trim();
      const itemId = String(event.itemId ?? `u-${Date.now()}`);
      if (!text) return;
      setLocalLines((lines) => {
        if (lines.some((line) => line.id === itemId && line.role === "user")) return lines;
        return [...lines, { id: itemId, role: "user", text }];
      });
    }
  }, []);

  const realtime = useRealtime({
    model,
    api: { token: "/api/talking/token" },
    sessionConfig,
    onError,
    onEvent,
  });

  statusRef.current = realtime.status;

  const connected = realtime.status === "connected";
  const live = phase === "live" && connected;
  const speaking = live && realtime.isPlaying;
  const listening = live && realtime.isCapturing && !realtime.isPlaying;

  // Prefer SDK messages; fall back to our event-built lines if empty.
  const transcriptLines = useMemo(() => {
    const fromMessages: TranscriptLine[] = realtime.messages
      .map((message) => {
        const text = messageText(message);
        if (!text) return null;
        if (message.role !== "user" && message.role !== "assistant") return null;
        return { id: message.id, role: message.role, text };
      })
      .filter((line): line is TranscriptLine => Boolean(line));

    return fromMessages.length > 0 ? fromMessages : localLines;
  }, [realtime.messages, localLines]);

  useEffect(() => {
    if (!showTranscript || !logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [transcriptLines, partialAssistant, showTranscript]);

  useEffect(() => {
    return () => {
      try {
        realtime.stopAudioCapture();
        realtime.stopPlayback();
        realtime.disconnect();
      } catch {
        // ignore teardown races
      }
      micRef.current?.getTracks().forEach((track) => track.stop());
      micRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopSession = useCallback(() => {
    startingRef.current = false;
    kickedOffRef.current = false;
    try {
      realtime.cancelResponse();
      realtime.stopAudioCapture();
      realtime.stopPlayback();
      realtime.disconnect();
    } catch {
      // ignore
    }
    micRef.current?.getTracks().forEach((track) => track.stop());
    micRef.current = null;
    assistantItemRef.current = null;
    setPartialAssistant("");
    setPhase("idle");
  }, [realtime]);

  const start = async () => {
    if (startingRef.current || phase === "live" || realtime.status === "connected") return;
    startingRef.current = true;
    kickedOffRef.current = false;
    setError(null);
    setPhase("starting");
    setLocalLines([]);
    setPartialAssistant("");

    try {
      // Mic first — needs a user gesture, and we want permission before the socket.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micRef.current = stream;

      await realtime.connect();
      await waitFor(() => statusRef.current === "connected" || statusRef.current === "error");
      if (statusRef.current !== "connected") {
        throw new Error("Kunde inte ansluta till Grok.");
      }

      // Brief pause so session.update settles before the first response.create.
      await new Promise((resolve) => window.setTimeout(resolve, 250));

      realtime.startAudioCapture(stream);

      if (!kickedOffRef.current) {
        kickedOffRef.current = true;
        realtime.requestResponse();
      }

      setPhase("live");
      startingRef.current = false;
    } catch (err) {
      console.error("talking start failed", err);
      setError(
        err instanceof Error && /Permission|NotAllowed/i.test(err.message)
          ? "Mikrofonzugriff benötigt — bitte erlauben und nochmal tippen."
          : err instanceof Error
            ? err.message
            : "Kunde inte starta. Försök igen.",
      );
      stopSession();
    }
  };

  const statusLabel =
    phase === "starting" || realtime.status === "connecting"
      ? "Startar samtalet…"
      : speaking
        ? "Grok pratar…"
        : listening
          ? "Din tur — prata nu"
          : live
            ? "Samtalet är igång"
            : "Tryck för att börja";

  return (
    <div className="talk">
      <div className="topbar">
        <button type="button" className="icon-btn icon-btn--plain" onClick={onExit} aria-label="Zurück">
          ‹
        </button>
        <span className="topbar__titles">
          <h1>
            {topic.emoji} Prata
          </h1>
          <span className="topbar__sub">{topic.title} · Grok Think Fast</span>
        </span>
        <button
          type="button"
          className={showTranscript ? "talk__toggle talk__toggle--on" : "talk__toggle"}
          onClick={() => setShowTranscript((value) => !value)}
          aria-pressed={showTranscript}
        >
          Text {showTranscript ? "på" : "av"}
        </button>
      </div>

      <div className="talk__stage">
        <div
          className={[
            "talk__orb",
            speaking ? "talk__orb--speaking" : "",
            listening ? "talk__orb--listening" : "",
            phase === "starting" || realtime.status === "connecting" ? "talk__orb--pulse" : "",
            live ? "talk__orb--live" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden
        >
          <span>{speaking ? "🔊" : listening ? "🎙️" : live ? "●" : "🇸🇪"}</span>
        </div>

        <div className="talk__status" data-live={live ? "true" : "false"}>
          {statusLabel}
        </div>
        <p className="talk__hint small muted">
          {live
            ? "Sprich auf Schwedisch. Grok interviewt dich langsam und deutlich."
            : "Echtzeit-Gespräch auf Schwedisch — klar, langsam, mit schönem Akzent."}
        </p>

        <label className="talk__switch">
          <input
            type="checkbox"
            checked={showTranscript}
            onChange={(event) => setShowTranscript(event.target.checked)}
          />
          <span>Visa transkript</span>
        </label>

        {error ? <div className="talk__error">{error}</div> : null}

        {showTranscript ? (
          <div className="talk__transcript card" ref={logRef}>
            <div className="row row--between" style={{ marginBottom: 8 }}>
              <span className="section-title">Transkript</span>
              <span className="tiny faint">
                {transcriptLines.length}
                {partialAssistant ? "+" : ""} turer
              </span>
            </div>
            {transcriptLines.length === 0 && !partialAssistant ? (
              <div className="small muted">Här syns vad Grok säger och vad du sagt.</div>
            ) : (
              <div className="talk__log">
                {transcriptLines.map((line) => (
                  <div
                    key={`${line.role}-${line.id}`}
                    className={line.role === "user" ? "bubble bubble--me" : "bubble bubble--them"}
                  >
                    {line.text}
                  </div>
                ))}
                {partialAssistant ? <div className="bubble bubble--them">{partialAssistant}</div> : null}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="talk__controls">
        {!live ? (
          <button
            type="button"
            className="btn btn--primary btn--lg btn--block"
            onClick={() => void start()}
            disabled={phase === "starting"}
          >
            {phase === "starting" ? "Startar…" : "Starta samtal"}
          </button>
        ) : (
          <button type="button" className="btn btn--danger btn--lg btn--block" onClick={stopSession}>
            Avsluta
          </button>
        )}
      </div>
    </div>
  );
}
