"use client";

import { useState } from "react";
import { speak } from "@/lib/audio";

export function Switch({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="switch"
      onClick={() => onChange(!checked)}
    />
  );
}

export function Bar({ value, gold }: { value: number; gold?: boolean }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={gold ? "bar__fill bar__fill--gold" : "bar__fill"} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ value, label, sub }: { value: number; label: string; sub?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className="ring" style={{ ["--pct" as string]: pct }}>
      <div className="ring__inner">
        <div>
          <div className="ring__value">{label}</div>
          {sub ? <div className="tiny faint">{sub}</div> : null}
        </div>
      </div>
    </div>
  );
}

/** Speaker button that plays Swedish TTS. Long-press or shift-click for slow. */
export function SpeakButton({ text, slow, plain }: { text: string; slow?: boolean; plain?: boolean }) {
  const [busy, setBusy] = useState(false);

  const play = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await speak(text, { slow });
    } catch {
      // Offline or TTS is down — silently skip rather than blocking the drill.
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={plain ? "icon-btn icon-btn--plain" : "icon-btn"}
      onClick={play}
      aria-label={slow ? `Play "${text}" slowly` : `Play "${text}"`}
    >
      {busy ? "…" : slow ? "🐢" : "🔊"}
    </button>
  );
}

export function Empty({ emoji, title, body }: { emoji: string; title: string; body?: string }) {
  return (
    <div className="empty">
      <div className="empty__emoji">{emoji}</div>
      <div style={{ fontWeight: 600 }}>{title}</div>
      {body ? <div className="small" style={{ marginTop: 6 }}>{body}</div> : null}
    </div>
  );
}

export function LevelChip({ level }: { level: string }) {
  return <span className="chip chip--level">{level}</span>;
}
