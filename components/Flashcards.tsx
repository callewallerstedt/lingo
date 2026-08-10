"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/state";
import { DECKS, WORDS, deckWords } from "@/content/words";
import { gradePreview, isDue, isNew, type Grade } from "@/lib/srs";
import type { CardState, Word } from "@/lib/types";
import { speak } from "@/lib/audio";
import { Empty, SpeakButton } from "./ui";

type Mode = "sv-de" | "de-sv";

/**
 * Build the review queue: everything due first (oldest due date leads), then a
 * capped number of unseen cards. Archived cards never appear.
 */
function buildQueue(
  pool: Word[],
  cards: Record<string, CardState>,
  newPerDay: number,
  starredOnly: boolean,
): Word[] {
  const now = Date.now();
  const due: Word[] = [];
  const fresh: Word[] = [];

  for (const word of pool) {
    const card = cards[word.id];
    if (card?.archived) continue;
    if (starredOnly && !card?.starred) continue;

    if (isNew(card)) {
      fresh.push(word);
    } else if (isDue(card, now)) {
      due.push(word);
    }
  }

  due.sort((a, b) => (cards[a.id]?.due ?? 0) - (cards[b.id]?.due ?? 0));
  return [...due, ...fresh.slice(0, newPerDay)];
}

export function Flashcards() {
  const { progress, cardFor, gradeCard, toggleStar, setArchived } = useStore();
  const [deckId, setDeckId] = useState<string>("all");
  const [mode, setMode] = useState<Mode>("sv-de");
  const [starredOnly, setStarredOnly] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [index, setIndex] = useState(0);

  const glossLang = progress.settings.glossLang;

  const pool = useMemo(() => {
    const base = deckId === "all" ? WORDS : deckWords(deckId);
    const custom = Object.values(progress.customWords);
    if (!custom.length) return base;
    // Talk-saved words aren't in a deck; keep them available in every filter.
    const seen = new Set(base.map((word) => word.id));
    return [...base, ...custom.filter((word) => !seen.has(word.id))];
  }, [deckId, progress.customWords]);

  const queue = useMemo(
    () => buildQueue(pool, progress.cards, progress.settings.newPerDay, starredOnly),
    // Rebuilding on every card change would reshuffle mid-session, so the queue
    // is deliberately keyed only to the deck and filters. `index` walks it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool, deckId, starredOnly, progress.settings.newPerDay],
  );

  const word = queue[index];
  const card = word ? cardFor(word.id) : null;

  // Reset position when the deck or filter changes.
  useEffect(() => {
    setIndex(0);
    setRevealed(false);
  }, [deckId, starredOnly, mode]);

  const gloss = word ? (glossLang === "de" ? word.de : word.en) : "";

  const autoPlay = progress.settings.autoPlayAudio;
  useEffect(() => {
    if (!word || !autoPlay) return;
    if (mode === "sv-de") {
      void speak(word.sv).catch(() => {});
    }
  }, [word, mode, autoPlay]);

  const advance = useCallback(() => {
    setRevealed(false);
    setIndex((current) => current + 1);
  }, []);

  const onGrade = (grade: Grade) => {
    if (!word) return;
    gradeCard(word.id, grade);
    advance();
  };

  const onArchive = () => {
    if (!word) return;
    setArchived(word.id, true);
    advance();
  };

  // Keyboard shortcuts, for when she's on a laptop.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!word) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (!revealed) setRevealed(true);
        else onGrade("good");
        return;
      }
      if (!revealed) return;
      if (event.key === "1") onGrade("again");
      if (event.key === "2") onGrade("hard");
      if (event.key === "3") onGrade("good");
      if (event.key === "4") onGrade("easy");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const dueCount = queue.length - index;

  if (!word) {
    return (
      <div className="stack">
        <DeckPicker deckId={deckId} setDeckId={setDeckId} />
        <Empty
          emoji="🎉"
          title="Inga kort kvar!"
          body={
            starredOnly
              ? "Keine markierten Karten fällig. Schalte den Stern-Filter aus."
              : "Alles für heute geschafft. Komm später zurück oder wähle ein anderes Deck."
          }
        />
        {starredOnly ? (
          <button type="button" className="btn btn--ghost btn--block" onClick={() => setStarredOnly(false)}>
            Alle Karten zeigen
          </button>
        ) : null}
      </div>
    );
  }

  const preview = gradePreview(card!);
  const front = mode === "sv-de" ? word.sv : gloss;
  const back = mode === "sv-de" ? gloss : word.sv;

  return (
    <div className="stack">
      <DeckPicker deckId={deckId} setDeckId={setDeckId} />

      <div className="row row--between small muted">
        <span>{dueCount} kvar</span>
        <div className="row" style={{ gap: 6 }}>
          <button
            type="button"
            className={starredOnly ? "chip chip--on" : "chip"}
            onClick={() => setStarredOnly((value) => !value)}
          >
            ⭐ Markiert
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => setMode((value) => (value === "sv-de" ? "de-sv" : "sv-de"))}
          >
            {mode === "sv-de" ? "SV → DE" : "DE → SV"}
          </button>
        </div>
      </div>

      <div className="deck">
        {/* The whole card is the reveal target; the button below is for reach. */}
        <div
          className="flashcard fade-in"
          key={word.id}
          onClick={() => !revealed && setRevealed(true)}
          role={revealed ? undefined : "button"}
          tabIndex={revealed ? undefined : 0}
          onKeyDown={(event) => {
            if (!revealed && (event.key === "Enter" || event.key === " ")) setRevealed(true);
          }}
        >
          <div className="flashcard__meta">
            <button
              type="button"
              className={card!.starred ? "icon-btn icon-btn--on" : "icon-btn"}
              onClick={() => toggleStar(word.id)}
              aria-label={card!.starred ? "Stern entfernen" : "Karte markieren"}
            >
              ⭐
            </button>
            <div className="spacer" />
            <span className="chip">
              {isNew(card!) ? "neu" : `${card!.reps}×`}
            </span>
            <span className="chip chip--level">{word.level}</span>
          </div>

          <div className="flashcard__front">{front}</div>

          {revealed ? (
            <>
              <div className="flashcard__back fade-in">{back}</div>
              {word.forms ? <div className="flashcard__forms">{word.forms}</div> : null}
              <div className="row" style={{ gap: 6 }}>
                <SpeakButton text={word.sv} />
                <SpeakButton text={word.sv} slow />
              </div>
              {word.note ? <div className="flashcard__note">{word.note}</div> : null}
            </>
          ) : (
            <div className="tiny faint">Tippen zum Aufdecken</div>
          )}
        </div>

        {revealed ? (
          <>
            <div className="grades">
              <button type="button" className="grade grade--again" onClick={() => onGrade("again")}>
                Nochmal
                <span className="grade__hint">{preview.again}</span>
              </button>
              <button type="button" className="grade grade--hard" onClick={() => onGrade("hard")}>
                Schwer
                <span className="grade__hint">{preview.hard}</span>
              </button>
              <button type="button" className="grade grade--good" onClick={() => onGrade("good")}>
                Gut
                <span className="grade__hint">{preview.good}</span>
              </button>
              <button type="button" className="grade grade--easy" onClick={() => onGrade("easy")}>
                Einfach
                <span className="grade__hint">{preview.easy}</span>
              </button>
            </div>
            <button type="button" className="btn btn--quiet btn--block" onClick={onArchive}>
              ✓ Kann ich — archivieren
            </button>
          </>
        ) : (
          <button type="button" className="btn btn--primary btn--lg btn--block" onClick={() => setRevealed(true)}>
            Antwort zeigen
          </button>
        )}
      </div>

      <div className="card card--tight small muted">
        <div className="row row--between">
          <span>Gelernt insgesamt</span>
          <strong>{card!.correct}/{card!.reps}</strong>
        </div>
        {card!.reps > 0 ? (
          <div className="row row--between" style={{ marginTop: 4 }}>
            <span>Nächste Wiederholung</span>
            <strong>{card!.intervalDays >= 1 ? `${Math.round(card!.intervalDays)} Tage` : "heute"}</strong>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DeckPicker({ deckId, setDeckId }: { deckId: string; setDeckId: (id: string) => void }) {
  return (
    <div className="chip-scroll">
      <button type="button" className={deckId === "all" ? "chip chip--on" : "chip"} onClick={() => setDeckId("all")}>
        Alle
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
  );
}
