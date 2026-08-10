"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/state";
import { DECKS, LEVELS, WORDS, deckWords } from "@/content/words";
import { isKnown } from "@/lib/srs";
import type { CefrLevel, Word } from "@/lib/types";
import { Empty, SpeakButton } from "./ui";

type Filter = "all" | "starred" | "archived" | "learning" | "new";

export function Vocab() {
  const { progress, toggleStar, setArchived, resetCard } = useStore();
  const [query, setQuery] = useState("");
  const [deckId, setDeckId] = useState("all");
  const [level, setLevel] = useState<CefrLevel | "all">("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const glossLang = progress.settings.glossLang;

  const results = useMemo(() => {
    const base = deckId === "all" ? WORDS : deckWords(deckId);
    const custom = Object.values(progress.customWords);
    const seen = new Set(base.map((word) => word.id));
    const pool = [...base, ...custom.filter((word) => !seen.has(word.id))];
    const needle = query.trim().toLowerCase();

    return pool.filter((word) => {
      if (level !== "all" && word.level !== level) return false;

      const card = progress.cards[word.id];
      if (filter === "starred" && !card?.starred) return false;
      if (filter === "archived" && !card?.archived) return false;
      if (filter === "new" && card && card.reps > 0) return false;
      if (filter === "learning" && (!card || card.reps === 0 || card.archived)) return false;

      if (!needle) return true;
      return (
        word.sv.toLowerCase().includes(needle) ||
        word.de.toLowerCase().includes(needle) ||
        word.en.toLowerCase().includes(needle)
      );
    });
  }, [query, deckId, level, filter, progress.cards, progress.customWords]);

  const counts = useMemo(() => {
    let starred = 0;
    let archived = 0;
    let learning = 0;
    let known = 0;
    for (const card of Object.values(progress.cards)) {
      if (card.starred) starred += 1;
      if (card.archived) archived += 1;
      else if (card.reps > 0) learning += 1;
      if (isKnown(card)) known += 1;
    }
    return { starred, archived, learning, known };
  }, [progress.cards]);

  return (
    <div className="stack">
      <input
        className="input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`${WORDS.length} Wörter durchsuchen…`}
        type="search"
        autoCapitalize="off"
        autoCorrect="off"
      />

      <div className="tiles">
        <div className="tile">
          <div className="tile__value">{WORDS.length}</div>
          <div className="tile__label">Wörter</div>
        </div>
        <div className="tile">
          <div className="tile__value">{counts.learning}</div>
          <div className="tile__label">Am Lernen</div>
        </div>
        <div className="tile">
          <div className="tile__value">{counts.known}</div>
          <div className="tile__label">Sitzt</div>
        </div>
        <div className="tile">
          <div className="tile__value">{counts.archived}</div>
          <div className="tile__label">Archiv</div>
        </div>
      </div>

      <div className="chip-scroll">
        {(
          [
            ["all", "Alle"],
            ["new", "Neu"],
            ["learning", "Am Lernen"],
            ["starred", `⭐ ${counts.starred}`],
            ["archived", `📦 ${counts.archived}`],
          ] as Array<[Filter, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={filter === key ? "chip chip--on" : "chip"}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="chip-scroll">
        <button type="button" className={level === "all" ? "chip chip--on" : "chip"} onClick={() => setLevel("all")}>
          Alle Level
        </button>
        {LEVELS.map((entry) => (
          <button
            key={entry}
            type="button"
            className={level === entry ? "chip chip--on" : "chip"}
            onClick={() => setLevel(entry)}
          >
            {entry}
          </button>
        ))}
      </div>

      <div className="chip-scroll">
        <button type="button" className={deckId === "all" ? "chip chip--on" : "chip"} onClick={() => setDeckId("all")}>
          Alle Themen
        </button>
        {DECKS.map((deck) => (
          <button
            key={deck.id}
            type="button"
            className={deckId === deck.id ? "chip chip--on" : "chip"}
            onClick={() => setDeckId(deck.id)}
          >
            {deck.emoji} {deck.title}
          </button>
        ))}
      </div>

      <div className="small faint">{results.length} Treffer</div>

      {results.length === 0 ? (
        <Empty emoji="🔍" title="Nichts gefunden" body="Versuch einen anderen Suchbegriff oder Filter." />
      ) : (
        <div className="list">
          {results.slice(0, 300).map((word) => (
            <WordRow
              key={word.id}
              word={word}
              gloss={glossLang === "de" ? word.de : word.en}
              open={openId === word.id}
              onToggle={() => setOpenId((current) => (current === word.id ? null : word.id))}
              card={progress.cards[word.id]}
              onStar={() => toggleStar(word.id)}
              onArchive={(archived) => setArchived(word.id, archived)}
              onReset={() => resetCard(word.id)}
            />
          ))}
        </div>
      )}

      {results.length > 300 ? (
        <div className="small faint center">Nur die ersten 300 werden angezeigt. Such genauer.</div>
      ) : null}
    </div>
  );
}

function WordRow({
  word,
  gloss,
  open,
  onToggle,
  card,
  onStar,
  onArchive,
  onReset,
}: {
  word: Word;
  gloss: string;
  open: boolean;
  onToggle: () => void;
  card?: { reps: number; correct: number; starred: boolean; archived: boolean; intervalDays: number };
  onStar: () => void;
  onArchive: (archived: boolean) => void;
  onReset: () => void;
}) {
  return (
    <div style={{ boxShadow: "inset 0 1px 0 var(--hairline)" }}>
      <button type="button" className="list__item" onClick={onToggle}>
        <span className="list__body">
          <span className="list__title">
            {word.sv}
            {card?.starred ? " ⭐" : ""}
            {card?.archived ? " 📦" : ""}
          </span>
          <span className="list__sub">{gloss}</span>
        </span>
        <span className="chip chip--level">{word.level}</span>
      </button>

      {open ? (
        <div className="stack--sm fade-in" style={{ padding: "0 15px 14px" }}>
          {word.forms ? <div className="small muted" style={{ fontStyle: "italic" }}>{word.forms}</div> : null}
          <div className="small faint">
            {word.pos} · {word.en}
          </div>
          {word.note ? <div className="flashcard__note" style={{ maxWidth: "none" }}>{word.note}</div> : null}

          {card && card.reps > 0 ? (
            <div className="small muted">
              {card.correct}/{card.reps} richtig · Intervall {Math.round(card.intervalDays)} Tage
            </div>
          ) : (
            <div className="small faint">Noch nicht gelernt</div>
          )}

          <div className="row row--wrap" style={{ gap: 6 }}>
            <SpeakButton text={word.sv} />
            <button type="button" className="btn btn--ghost btn--sm" onClick={onStar}>
              {card?.starred ? "⭐ Markiert" : "☆ Markieren"}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => onArchive(!card?.archived)}>
              {card?.archived ? "📤 Zurückholen" : "📦 Archivieren"}
            </button>
            {card && card.reps > 0 ? (
              <button type="button" className="btn btn--ghost btn--sm" onClick={onReset}>
                ↺ Zurücksetzen
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
