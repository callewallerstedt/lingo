"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type Phase = "idle" | "live" | "ending";

function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export function Talking({ onExit }: { onExit: () => void }) {
  const { progress } = useStore();
  const topic = useMemo(() => pickTalkingTopic(), []);
  const model = useMemo(() => xai.experimental_realtime(TALKING_MODEL), []);
  const name = progress.name || "Tiffy";

  const [showTranscript, setShowTranscript] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const kickedOff = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  const instructions = useMemo(() => talkingInstructions(topic, name), [topic, name]);

  const realtime = useRealtime({
    model,
    api: { token: "/api/talking/token" },
    sessionConfig: {
      instructions,
      voice: TALKING_VOICE,
      turnDetection: {
        type: "server-vad",
        silenceDurationMs: 1000,
        threshold: 0.5,
      },
      // Mapped straight into xAI session.update (see buildXaiSessionConfig).
      providerOptions: {
        reasoning: { effort: "none" },
        audio: {
          output: { speed: 0.78 },
        },
      },
    },
    onError: (err) => {
      console.error("talking realtime error", err);
      setError(err.message || "Något gick fel.");
      setPhase("idle");
    },
  });

  const connected = realtime.status === "connected";
  const listening = connected && realtime.isCapturing && !realtime.isPlaying;
  const speaking = connected && realtime.isPlaying;

  useEffect(() => {
    if (!showTranscript || !logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [realtime.messages, showTranscript]);

  // Once the socket is up and the mic is live, ask Grok to open the interview.
  useEffect(() => {
    if (realtime.status !== "connected" || !realtime.isCapturing || kickedOff.current) return;
    kickedOff.current = true;
    realtime.requestResponse();
  }, [realtime]);

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

  const start = async () => {
    setError(null);
    setPhase("live");
    kickedOff.current = false;

    try {
      await realtime.connect();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micRef.current = stream;
      realtime.startAudioCapture(stream);
    } catch (err) {
      console.error("talking start failed", err);
      setError(
        err instanceof Error && /Permission|NotAllowed/i.test(err.message)
          ? "Mikrofonzugriff benötigt — bitte erlauben und nochmal tippen."
          : "Kunde inte starta. Försök igen.",
      );
      stopSession();
    }
  };

  const stopSession = () => {
    setPhase("ending");
    try {
      realtime.stopAudioCapture();
      realtime.stopPlayback();
      realtime.disconnect();
    } catch {
      // ignore
    }
    micRef.current?.getTracks().forEach((track) => track.stop());
    micRef.current = null;
    kickedOff.current = false;
    setPhase("idle");
  };

  const statusLabel =
    realtime.status === "connecting"
      ? "Ansluter…"
      : speaking
        ? "Grok pratar…"
        : listening
          ? "Din tur — prata"
          : connected
            ? "Redo"
            : phase === "live"
              ? "Startar…"
              : "Tryck för att börja";

  return (
    <div className="talk">
      <div className="topbar">
        <button type="button" className="icon-btn icon-btn--plain" onClick={onExit} aria-label="Zurück">
          ‹
        </button>
        <h1>
          {topic.emoji} Prata
        </h1>
        <button
          type="button"
          className={showTranscript ? "icon-btn icon-btn--on" : "icon-btn icon-btn--plain"}
          onClick={() => setShowTranscript((value) => !value)}
          aria-label={showTranscript ? "Text ausblenden" : "Text zeigen"}
          aria-pressed={showTranscript}
          title="Transkript"
        >
          Aa
        </button>
      </div>

      <div className="talk__stage">
        <div className="talk__topic">
          <div className="talk__topic-title">{topic.title}</div>
          <div className="small muted">{topic.titleDe} · Grok Voice</div>
        </div>

        <div
          className={[
            "talk__orb",
            speaking ? "talk__orb--speaking" : "",
            listening ? "talk__orb--listening" : "",
            realtime.status === "connecting" ? "talk__orb--pulse" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden
        >
          <span>{speaking ? "🔊" : listening ? "🎙️" : "🇸🇪"}</span>
        </div>

        <div className="talk__status">{statusLabel}</div>
        <p className="talk__hint small muted">
          {connected
            ? "Sprich auf Schwedisch. Grok interviewt dich langsam und deutlich."
            : "Echtzeit-Gespräch auf Schwedisch — klar, langsam, mit schönem Akzent."}
        </p>

        {error ? <div className="talk__error">{error}</div> : null}

        {showTranscript ? (
          <div className="talk__transcript card" ref={logRef}>
            <div className="row row--between" style={{ marginBottom: 8 }}>
              <span className="section-title">Transkript</span>
              <span className="tiny faint">{realtime.messages.length} turer</span>
            </div>
            {realtime.messages.length === 0 ? (
              <div className="small muted">Här syns vad Grok säger och vad du sagt.</div>
            ) : (
              <div className="talk__log">
                {realtime.messages.map((message) => {
                  const text = messageText(message);
                  if (!text) return null;
                  const mine = message.role === "user";
                  return (
                    <div
                      key={message.id}
                      className={mine ? "bubble bubble--me" : "bubble bubble--them"}
                    >
                      {text}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="talk__controls">
        {!connected ? (
          <button type="button" className="btn btn--primary btn--lg btn--block" onClick={() => void start()}>
            Starta samtal
          </button>
        ) : (
          <button type="button" className="btn btn--danger btn--lg btn--block" onClick={stopSession}>
            Avsluta
          </button>
        )}
        <button
          type="button"
          className="btn btn--ghost btn--block"
          onClick={() => setShowTranscript((value) => !value)}
        >
          {showTranscript ? "Dölj text" : "Visa text"}
        </button>
      </div>
    </div>
  );
}
