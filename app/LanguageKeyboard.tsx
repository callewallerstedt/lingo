"use client";

import { useMemo } from "react";

type LanguageKeyboardProps = {
  language: string;
  value: string;
  answer: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

const KEYBOARD_ROWS: Record<"en" | "it" | "sv", string[][]> = {
  en: [
    [..."qwertyuiop"],
    [..."asdfghjkl"],
    [..."zxcvbnm"],
  ],
  it: [
    [..."qwertyuiop"],
    [..."asdfghjkl"],
    [..."zxcvbnm"],
    ["à", "è", "é", "ì", "ò", "ù"],
  ],
  sv: [
    [..."qwertyuiopå"],
    [..."asdfghjklöä"],
    [..."zxcvbnm"],
  ],
};

function keyboardCode(language: string): "en" | "it" | "sv" {
  const normalized = language.trim().toLocaleLowerCase();
  if (normalized.includes("swed") || normalized.includes("svensk")) return "sv";
  if (normalized.includes("ital")) return "it";
  return "en";
}

function normalizeLetters(value: string): string {
  return value.toLocaleLowerCase().normalize("NFC");
}

export default function LanguageKeyboard({
  language,
  value,
  answer,
  disabled = false,
  onChange,
  onSubmit,
}: LanguageKeyboardProps) {
  const rows = KEYBOARD_ROWS[keyboardCode(language)];
  const remaining = useMemo(() => {
    const normalizedAnswer = normalizeLetters(answer);
    const normalizedValue = normalizeLetters(value);
    const prefixMatches = normalizedAnswer.startsWith(normalizedValue);
    return prefixMatches ? normalizedAnswer.slice(normalizedValue.length) : normalizedAnswer;
  }, [answer, value]);
  const needed = useMemo(() => new Set(Array.from(remaining)), [remaining]);

  return (
    <div className="nx-keyboard" aria-label={`${language} on-screen keyboard`}>
      {rows.map((row, rowIndex) => (
        <div className="nx-keyboard-row" key={`${row.join("")}-${rowIndex}`}>
          {row.map((key) => {
            const muted = remaining.length > 0 && !needed.has(key);
            return (
              <button
                type="button"
                className={`nx-key ${muted ? "muted" : "needed"}`}
                key={key}
                disabled={disabled || muted}
                onClick={() => onChange(`${value}${key}`)}
                aria-label={`Type ${key}`}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
      <div className="nx-keyboard-row nx-keyboard-actions">
        <button
          type="button"
          className={`nx-key space ${remaining.includes(" ") ? "needed" : "muted"}`}
          disabled={disabled || (remaining.length > 0 && !remaining.includes(" "))}
          onClick={() => onChange(`${value} `)}
        >
          space
        </button>
        <button
          type="button"
          className="nx-key control"
          disabled={disabled || !value}
          onClick={() => onChange(Array.from(value).slice(0, -1).join(""))}
          aria-label="Delete last character"
        >
          ⌫
        </button>
        <button type="button" className="nx-key enter" disabled={disabled || !value.trim()} onClick={onSubmit}>
          enter
        </button>
      </div>
    </div>
  );
}
