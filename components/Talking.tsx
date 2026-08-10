"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { experimental_useRealtime as useRealtime } from "@ai-sdk/react";
import { xai } from "@ai-sdk/xai";
import { useStore } from "@/lib/state";
import {
  CUSTOM_TOPIC_ID,
  TALKING_MODEL,
  TALKING_TIP,
  TALKING_TOPICS,
  TALKING_VOICE,
  getTalkingTopic,
  makeCustomTopic,
  talkingInstructions,
  type TalkingTopic,
} from "@/lib/talking";

type Phase = "idle" | "starting" | "live";

type TranscriptLine = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

/** Keep the fullest transcript for an item, and stitch VAD-split user chunks. */
function upsertUserLine(lines: TranscriptLine[], itemId: string, text: string): TranscriptLine[] {
  const existingIndex = lines.findIndex((line) => line.id === itemId && line.role === "user");
  if (existingIndex >= 0) {
    const existing = lines[existingIndex]!;
    // xAI "updated" events are cumulative; keep the longer/newer string.
    if (text.length < existing.text.length && existing.text.startsWith(text)) return lines;
    const copy = [...lines];
    copy[existingIndex] = { ...existing, text };
    return copy;
  }

  const last = lines[lines.length - 1];
  if (last?.role === "user") {
    // Server VAD often commits mid-sentence; glue onto the open user turn.
    const merged = `${last.text} ${text}`.replace(/\s+/g, " ").trim();
    return [...lines.slice(0, -1), { ...last, id: itemId || last.id, text: merged }];
  }

  return [...lines, { id: itemId, role: "user", text }];
}

function readTranscript(event: { type: string; [key: string]: unknown }): { itemId: string; text: string } | null {
  const raw = (event.raw && typeof event.raw === "object" ? event.raw : event) as Record<string, unknown>;
  const text = String(raw.transcript ?? event.transcript ?? "").trim();
  if (!text) return null;
  const itemId = String(raw.item_id ?? event.itemId ?? `u-${Date.now()}`);
  return { itemId, text };
}

type WordBubble = {
  key: string;
  word: string;
  translation: string;
  loading: boolean;
  /** Viewport anchor for a fixed overlay so it isn't clipped by tips/scroll. */
  x: number;
  y: number;
};

const wordCache = new Map<string, string>();

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

function tokenize(text: string): Array<{ type: "word" | "gap"; value: string }> {
  const parts = text.split(/(\s+|[.,!?;:…"""''()\[\]{}])/u);
  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      type: /[A-Za-zÀ-ÖØ-öø-ÿÅÄÖåäö]+/u.test(part) ? ("word" as const) : ("gap" as const),
      value: part,
    }));
}

function TappableLine({
  text,
  mine,
  activeKey,
  onWordTap,
}: {
  text: string;
  mine: boolean;
  activeKey: string | null;
  onWordTap: (key: string, word: string, anchor: DOMRect) => void;
}) {
  const tokens = useMemo(() => tokenize(text), [text]);

  return (
    <div className={mine ? "bubble bubble--me talk-line" : "bubble bubble--them talk-line"}>
      {tokens.map((token, index) => {
        if (token.type === "gap") {
          return <span key={`g-${index}`}>{token.value}</span>;
        }

        const key = `${token.value.toLocaleLowerCase("sv")}-${index}-${text.slice(0, 12)}`;
        const active = activeKey === key;

        return (
          <button
            key={key}
            type="button"
            className={active ? "talk-word talk-word--on" : "talk-word"}
            onClick={(event) => {
              event.stopPropagation();
              const rect = event.currentTarget.getBoundingClientRect();
              onWordTap(key, token.value, rect);
            }}
          >
            {token.value}
          </button>
        );
      })}
    </div>
  );
}

export function Talking({ onExit }: { onExit: () => void }) {
  const { progress } = useStore();
  const model = useMemo(() => xai.experimental_realtime(TALKING_MODEL), []);
  const name = progress.name || "Tiffy";

  const [topicId, setTopicId] = useState(TALKING_TOPICS[0]!.id);
  const [customText, setCustomText] = useState("");
  const [showTranscript, setShowTranscript] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [localLines, setLocalLines] = useState<TranscriptLine[]>([]);
  const [partialAssistant, setPartialAssistant] = useState("");
  const [bubble, setBubble] = useState<WordBubble | null>(null);
  const [muted, setMuted] = useState(false);

  const topic: TalkingTopic = useMemo(() => {
    if (topicId === CUSTOM_TOPIC_ID) return makeCustomTopic(customText);
    return getTalkingTopic(topicId) ?? makeCustomTopic(customText);
  }, [topicId, customText]);

  // Keep this object identity stable for the whole screen lifetime. Topic/custom
  // text is applied with a session-update after connect — if sessionConfig
  // changes, useRealtime tears down the WebSocket and the call gets weird.
  const sessionConfig = useMemo(
    () => ({
      instructions: "Du är en svensk samtalspartner. Vänta på ämnet.",
      voice: TALKING_VOICE,
      turnDetection: {
        type: "server-vad" as const,
        silenceDurationMs: 1500,
        threshold: 0.55,
      },
      providerOptions: {
        reasoning: { effort: "none" },
        audio: {
          input: {
            // grok-transcribe emits cumulative "updated" events — needed for full turns.
            transcription: {
              model: "grok-transcribe",
              language_hint: "sv",
            },
          },
        },
      },
    }),
    [],
  );

  const topicConfig = useCallback(
    (selected: TalkingTopic) => ({
      instructions: talkingInstructions(selected, name),
      voice: TALKING_VOICE,
      turnDetection: {
        type: "server-vad" as const,
        // A bit more patience so mid-sentence pauses don't truncate her turn.
        silenceDurationMs: 1500,
        threshold: 0.55,
      },
      providerOptions: {
        reasoning: { effort: "none" },
        audio: {
          input: {
            transcription: {
              model: "grok-transcribe",
              language_hint: "sv",
            },
          },
        },
      },
    }),
    [name],
  );

  const micRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);
  const kickedOffRef = useRef(false);
  const statusRef = useRef("disconnected");
  const logRef = useRef<HTMLDivElement>(null);
  const assistantItemRef = useRef<string | null>(null);
  const firstResponseDoneRef = useRef(false);

  const scrollTranscriptToBottom = useCallback(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const onError = useCallback((err: Error) => {
    console.error("talking realtime error", err);
    setError(err.message || "Något gick fel.");
    startingRef.current = false;
    kickedOffRef.current = false;
    setPhase("idle");
  }, []);

  const onEvent = useCallback((event: { type: string; [key: string]: unknown }) => {
    if (event.type === "response-done") {
      firstResponseDoneRef.current = true;
      return;
    }

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
          // Deduplicate near-identical openings if the model glitches once.
          if (
            lines.length > 0 &&
            lines[lines.length - 1]?.role === "assistant" &&
            lines[lines.length - 1]?.text === text
          ) {
            return lines;
          }
          return [...lines, { id: itemId, role: "assistant", text }];
        });
      }
      return;
    }

    if (event.type === "input-transcription-completed") {
      const parsed = readTranscript(event);
      if (!parsed) return;
      setLocalLines((lines) => upsertUserLine(lines, parsed.itemId, parsed.text));
      return;
    }

    // xAI sends cumulative updates as *.updated (mapped to custom by the SDK).
    if (
      event.type === "custom" &&
      (event.rawType === "conversation.item.input_audio_transcription.updated" ||
        event.rawType === "conversation.item.input_audio_transcription.delta")
    ) {
      const parsed = readTranscript(event);
      if (!parsed) return;
      setLocalLines((lines) => upsertUserLine(lines, parsed.itemId, parsed.text));
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
  const listening = live && !muted && realtime.isCapturing && !realtime.isPlaying;

  const setMicEnabled = useCallback((enabled: boolean) => {
    const stream = micRef.current;
    if (!stream) return;
    for (const track of stream.getAudioTracks()) {
      track.enabled = enabled;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      setMicEnabled(!next);
      if (next) {
        try {
          realtime.clearAudioBuffer();
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, [realtime, setMicEnabled]);

  // Prefer our event-built lines only — mixing with SDK messages caused the
  // opening line to flash twice then disappear.
  const transcriptLines = localLines;

  // Pin to the latest line before paint and again after layout settles.
  useLayoutEffect(() => {
    if (!showTranscript) return;
    scrollTranscriptToBottom();
  }, [transcriptLines, partialAssistant, showTranscript, scrollTranscriptToBottom]);

  useEffect(() => {
    if (!showTranscript) return;
    const id = window.requestAnimationFrame(scrollTranscriptToBottom);
    return () => window.cancelAnimationFrame(id);
  }, [transcriptLines, partialAssistant, showTranscript, scrollTranscriptToBottom]);

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
    setBubble(null);
    setMuted(false);
    setPhase("idle");
  }, [realtime]);

  const start = async () => {
    if (startingRef.current || phase === "live" || realtime.status === "connected") return;
    if (topicId === CUSTOM_TOPIC_ID && !customText.trim()) {
      setError("Skriv vad ni ska prata om, eller välj ett ämne.");
      return;
    }

    startingRef.current = true;
    kickedOffRef.current = false;
    firstResponseDoneRef.current = false;
    setError(null);
    setPhase("starting");
    setLocalLines([]);
    setPartialAssistant("");
    setBubble(null);
    setMuted(false);

    const selectedTopic = topic;

    try {
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

      // Apply the chosen topic only after the socket is up (keeps sessionConfig stable).
      realtime.sendEvent({
        type: "session-update",
        config: topicConfig(selectedTopic),
      });

      await new Promise((resolve) => window.setTimeout(resolve, 280));

      // Open once with the mic OFF — capturing during the first reply made VAD
      // hear echo and trigger a second overlapping response.
      if (!kickedOffRef.current) {
        kickedOffRef.current = true;
        realtime.requestResponse();
      }

      try {
        await waitFor(() => firstResponseDoneRef.current, { timeoutMs: 20000 });
      } catch {
        // If the done event is late, still open the mic so she can talk.
      }

      await new Promise((resolve) => window.setTimeout(resolve, 200));
      realtime.startAudioCapture(stream);

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

  const onWordTap = async (key: string, word: string, anchor: DOMRect) => {
    if (bubble?.key === key) {
      setBubble(null);
      return;
    }

    const normalized = word.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
    if (!normalized) return;

    const x = anchor.left + anchor.width / 2;
    const y = anchor.top;

    const cacheKey = normalized.toLocaleLowerCase("sv");
    const cached = wordCache.get(cacheKey);
    if (cached) {
      setBubble({ key, word: normalized, translation: cached, loading: false, x, y });
      return;
    }

    setBubble({ key, word: normalized, translation: "", loading: true, x, y });
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // English/German → Swedish; Swedish → German (so she can drop in EN words).
        body: JSON.stringify({ text: normalized, mode: "talk-word" }),
      });
      const data = (await response.json()) as { translation?: string };
      const translation = (data.translation || "").trim() || "—";
      wordCache.set(cacheKey, translation);
      setBubble((current) =>
        current?.key === key
          ? { key, word: normalized, translation, loading: false, x, y }
          : current,
      );
    } catch {
      setBubble((current) =>
        current?.key === key
          ? { key, word: normalized, translation: "Ingen översättning", loading: false, x, y }
          : current,
      );
    }
  };

  const statusLabel =
    phase === "starting" || realtime.status === "connecting"
      ? "Startar…"
      : live && muted
        ? "Mic av"
        : speaking
          ? "Grok pratar"
          : listening
            ? "Din tur"
            : live
              ? "Igång"
              : "Redo";

  const topicLocked = phase !== "idle";

  return (
    <div
      className="talk"
      onClick={() => {
        if (bubble) setBubble(null);
      }}
    >
      <div className="topbar">
        <button type="button" className="icon-btn icon-btn--plain" onClick={onExit} aria-label="Zurück">
          ‹
        </button>
        <span className="topbar__titles">
          <h1>Prata</h1>
          <span className="topbar__sub">
            {statusLabel}
            {live ? " · tydlig svenska" : " · Grok Think Fast"}
          </span>
        </span>
        <button
          type="button"
          className={showTranscript ? "talk__toggle talk__toggle--on" : "talk__toggle"}
          onClick={(event) => {
            event.stopPropagation();
            setShowTranscript((value) => !value);
          }}
          aria-pressed={showTranscript}
        >
          Text {showTranscript ? "på" : "av"}
        </button>
      </div>

      <div className="talk__toolbar">
        <label className="talk__select-label">
          <span className="tiny faint">Ämne</span>
          <select
            className="talk__select"
            value={topicId}
            disabled={topicLocked}
            onChange={(event) => setTopicId(event.target.value)}
            onClick={(event) => event.stopPropagation()}
          >
            {TALKING_TOPICS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.emoji} {entry.title} — {entry.titleDe}
              </option>
            ))}
            <option value={CUSTOM_TOPIC_ID}>✏️ Eget ämne — Eigenes Thema</option>
          </select>
        </label>

        {topicId === CUSTOM_TOPIC_ID ? (
          <input
            className="input talk__custom"
            value={customText}
            disabled={topicLocked}
            onChange={(event) => setCustomText(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            placeholder="T.ex. hundar, semester, jobbintervju…"
            maxLength={160}
          />
        ) : null}

        <div className="talk__tip" onClick={(event) => event.stopPropagation()}>
          <span className="talk__tip-label">Tips</span>
          <span>{TALKING_TIP}</span>
        </div>
      </div>

      {error ? (
        <div className="talk__error" style={{ margin: "0 var(--gutter) 8px" }}>
          {error}
        </div>
      ) : null}

      {showTranscript ? (
        <div className="talk__transcript" ref={logRef} onClick={() => setBubble(null)}>
          {transcriptLines.length === 0 && !partialAssistant ? (
            <div className="talk__empty">
              <div className="talk__empty-title">{topic.emoji} {topic.title}</div>
              <div className="small muted">
                Tryck start — sen syns allt ni säger här. Tryck på svenska ord för tyska, eller engelska ord för svenska.
              </div>
            </div>
          ) : (
            <div className="talk__log">
              {transcriptLines.map((line) => (
                <TappableLine
                  key={`${line.role}-${line.id}`}
                  text={line.text}
                  mine={line.role === "user"}
                  activeKey={bubble?.key ?? null}
                  onWordTap={onWordTap}
                />
              ))}
              {partialAssistant ? (
                <TappableLine
                  text={partialAssistant}
                  mine={false}
                  activeKey={bubble?.key ?? null}
                  onWordTap={onWordTap}
                />
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <div className="talk__stage talk__stage--compact">
          <div
            className={[
              "talk__orb",
              speaking ? "talk__orb--speaking" : "",
              listening ? "talk__orb--listening" : "",
              phase === "starting" ? "talk__orb--pulse" : "",
              live ? "talk__orb--live" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden
          >
            <span>{speaking ? "🔊" : listening ? "🎙️" : "🇸🇪"}</span>
          </div>
          <div className="talk__status" data-live={live ? "true" : "false"}>
            {statusLabel}
          </div>
        </div>
      )}

      <div className="talk__controls" onClick={(event) => event.stopPropagation()}>
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
          <div className="talk__controls-row">
            <button
              type="button"
              className={muted ? "btn btn--gold btn--lg talk__mute" : "btn btn--ghost btn--lg talk__mute"}
              onClick={toggleMute}
              aria-pressed={muted}
              aria-label={muted ? "Slå på mikrofonen" : "Tysta mikrofonen"}
            >
              {muted ? "🔇 Mic av" : "🎤 Mic på"}
            </button>
            <button type="button" className="btn btn--danger btn--lg talk__end" onClick={stopSession}>
              Avsluta
            </button>
          </div>
        )}
      </div>

      {bubble ? (
        <div
          className={
            !bubble.loading && bubble.translation.length > 18
              ? "talk-word-bubble talk-word-bubble--fixed talk-word-bubble--wrap"
              : "talk-word-bubble talk-word-bubble--fixed"
          }
          style={{ left: bubble.x, top: bubble.y }}
          role="status"
          onClick={(event) => event.stopPropagation()}
        >
          {bubble.loading ? "…" : bubble.translation || "—"}
        </div>
      ) : null}
    </div>
  );
}
