"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/state";
import { FREE_CHAT, SCENARIOS, type Scenario } from "@/content/scenarios";
import type { ChatTurn } from "@/lib/types";
import { recordClip, speak, stopRecording, transcribe } from "@/lib/audio";
import { LevelChip } from "./ui";

/**
 * The model appends corrections as `[[FIX]] wrong -> right -- reason`. Split
 * them out so the conversation bubble stays in character and the correction
 * gets its own visually distinct treatment.
 */
function splitFix(text: string): { body: string; fix?: { wrong: string; right: string; why: string } } {
  const index = text.indexOf("[[FIX]]");
  if (index === -1) return { body: text.trim() };

  const body = text.slice(0, index).trim();
  const raw = text.slice(index + "[[FIX]]".length).trim();

  const [correction, why = ""] = raw.split("--");
  const [wrong = "", right = ""] = correction.split("->");

  if (!wrong.trim() || !right.trim()) return { body: text.replace("[[FIX]]", "").trim() };

  return { body, fix: { wrong: wrong.trim(), right: right.trim(), why: why.trim() } };
}

export function Chat() {
  const [scenario, setScenario] = useState<Scenario | null>(null);

  if (!scenario) return <ScenarioPicker onPick={setScenario} />;
  // Keyed by scenario so switching scenes starts a genuinely fresh conversation.
  return <Conversation key={scenario.id} scenario={scenario} onExit={() => setScenario(null)} />;
}

function ScenarioPicker({ onPick }: { onPick: (scenario: Scenario) => void }) {
  return (
    <div className="stack--lg">
      <button type="button" className="card list__item" onClick={() => onPick(FREE_CHAT)} style={{ borderRadius: "var(--radius)" }}>
        <span className="list__emoji">{FREE_CHAT.emoji}</span>
        <span className="list__body">
          <span className="list__title">{FREE_CHAT.title}</span>
          <span className="list__sub">{FREE_CHAT.blurb}</span>
        </span>
        <span className="list__chevron">›</span>
      </button>

      <div className="stack--sm">
        <div className="section-title">Szenarien</div>
        <div className="list">
          {SCENARIOS.map((entry) => (
            <button key={entry.id} type="button" className="list__item" onClick={() => onPick(entry)}>
              <span className="list__emoji">{entry.emoji}</span>
              <span className="list__body">
                <span className="list__title">{entry.title}</span>
                <span className="list__sub">{entry.blurb}</span>
              </span>
              <LevelChip level={entry.level} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Conversation({ scenario, onExit }: { scenario: Scenario; onExit: () => void }) {
  const { progress } = useStore();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const level = highestLevel(progress);

  const scrollDown = () => {
    requestAnimationFrame(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    });
  };

  const send = async (history: ChatTurn[]) => {
    setBusy(true);
    setStreaming("");
    let text = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          level,
          turns: history.map((turn) => ({ role: turn.role, content: turn.content })),
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("no stream");
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setStreaming(text);
        scrollDown();
      }
    } catch {
      text = "Förlåt, något gick fel. Försök igen.";
    }

    setStreaming("");
    setTurns((current) => [...current, { role: "assistant", content: text, at: Date.now() }]);
    setBusy(false);
    scrollDown();

    if (progress.settings.autoPlayAudio) {
      const { body } = splitFix(text);
      void speak(body).catch(() => {});
    }
  };

  // Let the AI open the scene.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void send([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    const content = draft.trim();
    if (!content || busy) return;
    const next: ChatTurn[] = [...turns, { role: "user", content, at: Date.now() }];
    setTurns(next);
    setDraft("");
    scrollDown();
    await send(next);
  };

  const record = async () => {
    if (recording) {
      stopRecording();
      return;
    }
    setRecording(true);
    try {
      const blob = await recordClip();
      setRecording(false);
      setBusy(true);
      const text = await transcribe(blob);
      setDraft((current) => (current ? `${current} ${text}` : text));
    } catch {
      setRecording(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chat">
      <div className="topbar">
        <button type="button" className="icon-btn icon-btn--plain" onClick={onExit} aria-label="Zurück">
          ‹
        </button>
        <h1>
          {scenario.emoji} {scenario.title}
        </h1>
        <button type="button" className="icon-btn icon-btn--plain" onClick={() => setShowGoals((value) => !value)} aria-label="Ziele">
          🎯
        </button>
      </div>

      {showGoals ? (
        <div className="card card--tight fade-in" style={{ margin: "10px 12px 0" }}>
          <div className="section-title">Ziele</div>
          <ul className="keypoints small">
            {scenario.goals.map((goal) => (
              <li key={goal}>{goal}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="chat__log" ref={logRef}>
        {turns.map((turn, index) => (
          <Turn key={index} turn={turn} />
        ))}

        {streaming ? <div className="bubble bubble--them">{splitFix(streaming).body}</div> : null}

        {busy && !streaming ? (
          <div className="bubble bubble--them">
            <span className="typing">
              <span />
              <span />
              <span />
            </span>
          </div>
        ) : null}
      </div>

      <div className="hint-bar">
        {scenario.phrases.map((phrase) => (
          <button
            key={phrase.sv}
            type="button"
            className="hint"
            onClick={() => setDraft((current) => (current ? `${current} ${phrase.sv}` : phrase.sv))}
            title={phrase.de}
          >
            {phrase.sv}
          </button>
        ))}
      </div>

      <div className="composer">
        <button
          type="button"
          className={recording ? "icon-btn icon-btn--on" : "icon-btn"}
          onClick={record}
          aria-label={recording ? "Aufnahme stoppen" : "Sprechen"}
        >
          {recording ? "⏹" : "🎤"}
        </button>
        <textarea
          className="input"
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="Skriv på svenska…"
          disabled={busy && !draft}
        />
        <button type="button" className="icon-btn" onClick={submit} disabled={!draft.trim() || busy} aria-label="Senden">
          ↑
        </button>
      </div>
    </div>
  );
}

function Turn({ turn }: { turn: ChatTurn }) {
  const [translation, setTranslation] = useState(turn.translation || "");
  const [loading, setLoading] = useState(false);

  if (turn.role === "user") {
    return <div className="bubble bubble--me">{turn.content}</div>;
  }

  const { body, fix } = splitFix(turn.content);

  const translate = async () => {
    if (translation || loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body }),
      });
      const data = (await response.json()) as { translation?: string };
      setTranslation(data.translation || "");
    } catch {
      setTranslation("Übersetzung nicht verfügbar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bubble bubble--them">
        {body}
        {translation ? <div className="bubble__translation">{translation}</div> : null}
      </div>
      <div className="bubble__tools">
        <button type="button" className="icon-btn" onClick={() => void speak(body)} aria-label="Vorlesen">
          🔊
        </button>
        <button type="button" className="icon-btn" onClick={translate} aria-label="Übersetzen">
          {loading ? "…" : "🇩🇪"}
        </button>
      </div>
      {fix ? (
        <div className="fix">
          <span className="fix__wrong">{fix.wrong}</span> → <span className="fix__right">{fix.right}</span>
          {fix.why ? <div style={{ marginTop: 4 }}>{fix.why}</div> : null}
        </div>
      ) : null}
    </>
  );
}

/** Pick a chat difficulty from how far through the course she is. */
function highestLevel(progress: ReturnType<typeof useStore>["progress"]): "A1" | "A2" | "B1" | "B2" | "C1" {
  const done = Object.values(progress.lessons).filter((lesson) => lesson.completed).length;
  if (done >= 45) return "C1";
  if (done >= 32) return "B2";
  if (done >= 20) return "B1";
  if (done >= 9) return "A2";
  return "A1";
}
