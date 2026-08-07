"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/state";
import { buildLessonQueue, getLesson, nextLessonId, unitOf } from "@/content/course";
import type { Exercise } from "@/content/course";
import { getGrammar } from "@/content/grammar";
import { recordClip, speak, stopRecording, transcribe } from "@/lib/audio";
import { Bar, SpeakButton } from "./ui";

/**
 * Compare a learner's typed answer to the reference. Deliberately forgiving:
 * case, punctuation and missing å/ä/ö all get normalised away, because typing
 * Swedish diacritics on a German keyboard is a hardware problem, not a language
 * one.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:"']/g, "")
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ");
}

function matches(answer: string, expected: string, alts: string[] = []): boolean {
  const given = normalize(answer);
  if (!given) return false;
  return [expected, ...alts].some((candidate) => normalize(candidate) === given);
}

type Verdict = { correct: boolean; note?: string } | null;

export function LessonPlayer({
  lessonId,
  onExit,
  onOpenLesson,
}: {
  lessonId: string;
  onExit: () => void;
  onOpenLesson: (id: string) => void;
}) {
  const { progress, completeLesson } = useStore();
  const lesson = getLesson(lessonId);
  const unit = unitOf(lessonId);

  const queue = useMemo(
    () => (lesson ? buildLessonQueue(lesson, progress.settings.glossLang) : []),
    // Regenerating mid-lesson would reshuffle the queue under her, so this is
    // built once per lesson.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lessonId],
  );

  const [step, setStep] = useState(-1); // -1 shows the intro
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [done, setDone] = useState(false);

  if (!lesson) {
    return (
      <div className="screen">
        <p>Lektion nicht gefunden.</p>
        <button type="button" className="btn btn--ghost" onClick={onExit}>
          Zurück
        </button>
      </div>
    );
  }

  const exercise = queue[step];

  const submit = (correct: boolean, note?: string) => {
    setVerdict({ correct, note });
    setScore((current) => ({ right: current.right + (correct ? 1 : 0), total: current.total + 1 }));
  };

  const next = () => {
    setVerdict(null);
    if (step + 1 >= queue.length) {
      const finalScore = score.total ? score.right / score.total : 0;
      completeLesson(lessonId, finalScore);
      setDone(true);
    } else {
      setStep((current) => current + 1);
    }
  };

  if (done) {
    const pct = score.total ? Math.round((score.right / score.total) * 100) : 0;
    const followUp = nextLessonId(lessonId);
    return (
      <div className="screen stack--lg fade-in">
        <div className="card center stack">
          <div style={{ fontSize: "3rem" }}>{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
          <h2>Klart!</h2>
          <div className="muted">
            {score.right} von {score.total} richtig ({pct}%)
          </div>
          <Bar value={score.total ? score.right / score.total : 0} gold />
        </div>
        <div className="stack">
          {followUp ? (
            <button type="button" className="btn btn--primary btn--lg btn--block" onClick={() => onOpenLesson(followUp)}>
              Nächste Lektion
            </button>
          ) : null}
          <button type="button" className="btn btn--ghost btn--block" onClick={onExit}>
            Zurück zum Kurs
          </button>
        </div>
      </div>
    );
  }

  if (step === -1) {
    const grammar = lesson.grammarId ? getGrammar(lesson.grammarId) : undefined;
    return (
      <div className="screen stack--lg fade-in">
        <div className="stack--sm">
          <div className="section-title">{unit?.title}</div>
          <h2>{lesson.title}</h2>
          <div className="muted">{lesson.titleDe}</div>
        </div>
        <div className="card prose">{lesson.intro}</div>
        {grammar ? (
          <div className="card card--tight">
            <div className="section-title">Grammatik</div>
            <div className="small">{grammar.title} — {grammar.titleDe}</div>
          </div>
        ) : null}
        <div className="card card--tight">
          <div className="section-title">In dieser Lektion</div>
          <div className="small muted">
            {queue.length} Übungen · {lesson.words.length} neue Wörter
          </div>
        </div>
        <button type="button" className="btn btn--primary btn--lg btn--block" onClick={() => setStep(0)}>
          Los geht&apos;s
        </button>
        <button type="button" className="btn btn--quiet btn--block" onClick={onExit}>
          Abbrechen
        </button>
      </div>
    );
  }

  return (
    <div className="screen stack--lg">
      <div className="row" style={{ gap: 12 }}>
        <button type="button" className="icon-btn icon-btn--plain" onClick={onExit} aria-label="Beenden">
          ✕
        </button>
        <div style={{ flex: 1 }}>
          <Bar value={step / queue.length} />
        </div>
        <span className="tiny faint">
          {step + 1}/{queue.length}
        </span>
      </div>

      <ExerciseView
        key={step}
        exercise={exercise}
        verdict={verdict}
        onSubmit={submit}
        autoPlay={progress.settings.autoPlayAudio}
      />

      {verdict ? (
        <button type="button" className="btn btn--primary btn--lg btn--block fade-in" onClick={next}>
          Weiter
        </button>
      ) : null}
    </div>
  );
}

function ExerciseView({
  exercise,
  verdict,
  onSubmit,
  autoPlay,
}: {
  exercise: Exercise;
  verdict: Verdict;
  onSubmit: (correct: boolean, note?: string) => void;
  autoPlay: boolean;
}) {
  switch (exercise.kind) {
    case "choice":
      return <ChoiceExercise exercise={exercise} verdict={verdict} onSubmit={onSubmit} />;
    case "translate":
      return <TypedExercise exercise={exercise} verdict={verdict} onSubmit={onSubmit} />;
    case "blank":
      return <TypedExercise exercise={exercise} verdict={verdict} onSubmit={onSubmit} />;
    case "order":
      return <OrderExercise exercise={exercise} verdict={verdict} onSubmit={onSubmit} />;
    case "listen":
      return <ListenExercise exercise={exercise} verdict={verdict} onSubmit={onSubmit} autoPlay={autoPlay} />;
    case "speak":
      return <SpeakExercise exercise={exercise} verdict={verdict} onSubmit={onSubmit} />;
    default:
      return null;
  }
}

function Feedback({ verdict, answer }: { verdict: Verdict; answer?: string }) {
  if (!verdict) return null;
  return (
    <div className={verdict.correct ? "feedback feedback--right fade-in" : "feedback feedback--wrong fade-in"}>
      {verdict.correct ? "Richtig!" : "Nicht ganz."}
      {!verdict.correct && answer ? (
        <>
          {" "}
          Richtige Antwort: <span className="feedback__answer">{answer}</span>
        </>
      ) : null}
      {verdict.note ? <div style={{ marginTop: 6 }}>{verdict.note}</div> : null}
    </div>
  );
}

function ChoiceExercise({
  exercise,
  verdict,
  onSubmit,
}: {
  exercise: Extract<Exercise, { kind: "choice" }>;
  verdict: Verdict;
  onSubmit: (correct: boolean, note?: string) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  const choose = (index: number) => {
    if (verdict) return;
    setPicked(index);
    onSubmit(index === exercise.answer, exercise.explain);
  };

  return (
    <div className="exercise fade-in">
      <div className="exercise__kicker">Wähle die richtige Antwort</div>
      <div className="exercise__prompt">{exercise.prompt}</div>
      <div className="options">
        {exercise.options.map((option, index) => {
          let className = "option";
          if (verdict) {
            if (index === exercise.answer) className += " option--right";
            else if (index === picked) className += " option--wrong";
          } else if (index === picked) {
            className += " option--picked";
          }
          return (
            <button key={option + index} type="button" className={className} onClick={() => choose(index)}>
              {option}
            </button>
          );
        })}
      </div>
      <Feedback verdict={verdict} />
    </div>
  );
}

function TypedExercise({
  exercise,
  verdict,
  onSubmit,
}: {
  exercise: Extract<Exercise, { kind: "translate" | "blank" }>;
  verdict: Verdict;
  onSubmit: (correct: boolean, note?: string) => void;
}) {
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);

  const isTranslate = exercise.kind === "translate";
  const kicker = isTranslate
    ? exercise.direction === "de-sv"
      ? "Übersetze ins Schwedische"
      : "Übersetze ins Deutsche"
    : "Fülle die Lücke";

  const check = async () => {
    if (verdict || checking) return;
    const alts = exercise.alts ?? [];

    if (matches(value, exercise.answer, alts)) {
      onSubmit(true, exercise.explain);
      return;
    }

    // Local compare failed — ask the grader before calling it wrong, so a valid
    // paraphrase still counts.
    setChecking(true);
    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: value, expected: exercise.answer, prompt: exercise.prompt }),
      });
      const data = (await response.json()) as { correct?: boolean; note?: string };
      onSubmit(Boolean(data.correct), data.note || exercise.explain);
    } catch {
      onSubmit(false, exercise.explain);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="exercise fade-in">
      <div className="exercise__kicker">{kicker}</div>
      <div className="exercise__prompt">{exercise.prompt}</div>
      {exercise.hint ? <div className="small faint">{exercise.hint}</div> : null}
      <input
        className="input input--lg"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void check();
        }}
        placeholder="Deine Antwort…"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={Boolean(verdict)}
      />
      <SpecialChars onInsert={(char) => setValue((current) => current + char)} disabled={Boolean(verdict)} />
      {!verdict ? (
        <button type="button" className="btn btn--primary btn--block" onClick={check} disabled={!value.trim() || checking}>
          {checking ? "Prüfe…" : "Prüfen"}
        </button>
      ) : null}
      <Feedback verdict={verdict} answer={exercise.answer} />
      {verdict?.correct === false ? <SpeakButton text={exercise.answer} /> : null}
    </div>
  );
}

/** Å Ä Ö aren't on a German keyboard layout, so give her tappable buttons. */
function SpecialChars({ onInsert, disabled }: { onInsert: (char: string) => void; disabled?: boolean }) {
  return (
    <div className="row" style={{ gap: 6 }}>
      {["å", "ä", "ö"].map((char) => (
        <button
          key={char}
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => onInsert(char)}
          disabled={disabled}
        >
          {char}
        </button>
      ))}
    </div>
  );
}

function OrderExercise({
  exercise,
  verdict,
  onSubmit,
}: {
  exercise: Extract<Exercise, { kind: "order" }>;
  verdict: Verdict;
  onSubmit: (correct: boolean, note?: string) => void;
}) {
  const shuffled = useMemo(
    () => [...exercise.tokens].sort(() => Math.random() - 0.5),
    [exercise],
  );
  const [pool, setPool] = useState<string[]>(shuffled);
  const [built, setBuilt] = useState<string[]>([]);

  const take = (index: number) => {
    if (verdict) return;
    setBuilt((current) => [...current, pool[index]]);
    setPool((current) => current.filter((_, i) => i !== index));
  };

  const putBack = (index: number) => {
    if (verdict) return;
    setPool((current) => [...current, built[index]]);
    setBuilt((current) => current.filter((_, i) => i !== index));
  };

  const check = () => {
    if (verdict) return;
    onSubmit(matches(built.join(" "), exercise.answer), exercise.explain);
  };

  return (
    <div className="exercise fade-in">
      <div className="exercise__kicker">Bring die Wörter in die richtige Reihenfolge</div>
      <div className="exercise__prompt">{exercise.prompt}</div>

      <div className="tokens">
        {built.map((token, index) => (
          <button key={`${token}-${index}`} type="button" className="token" onClick={() => putBack(index)}>
            {token}
          </button>
        ))}
      </div>

      <div className="row row--wrap" style={{ gap: 8 }}>
        {pool.map((token, index) => (
          <button key={`${token}-${index}`} type="button" className="token" onClick={() => take(index)}>
            {token}
          </button>
        ))}
      </div>

      {!verdict ? (
        <button type="button" className="btn btn--primary btn--block" onClick={check} disabled={!built.length}>
          Prüfen
        </button>
      ) : null}
      <Feedback verdict={verdict} answer={exercise.answer} />
    </div>
  );
}

function ListenExercise({
  exercise,
  verdict,
  onSubmit,
  autoPlay,
}: {
  exercise: Extract<Exercise, { kind: "listen" }>;
  verdict: Verdict;
  onSubmit: (correct: boolean, note?: string) => void;
  autoPlay: boolean;
}) {
  const [value, setValue] = useState("");
  const played = useRef(false);

  useEffect(() => {
    if (!autoPlay || played.current) return;
    played.current = true;
    void speak(exercise.sv).catch(() => {});
  }, [exercise.sv, autoPlay]);

  const check = () => {
    if (verdict) return;
    onSubmit(matches(value, exercise.sv), exercise.explain);
  };

  return (
    <div className="exercise fade-in">
      <div className="exercise__kicker">Hör zu und schreibe es auf</div>
      <div className="row" style={{ gap: 8, justifyContent: "center", padding: "12px 0" }}>
        <SpeakButton text={exercise.sv} />
        <SpeakButton text={exercise.sv} slow />
      </div>
      <input
        className="input input--lg"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") check();
        }}
        placeholder="Was hörst du?"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={Boolean(verdict)}
      />
      <SpecialChars onInsert={(char) => setValue((current) => current + char)} disabled={Boolean(verdict)} />
      {!verdict ? (
        <button type="button" className="btn btn--primary btn--block" onClick={check} disabled={!value.trim()}>
          Prüfen
        </button>
      ) : null}
      {verdict ? (
        <>
          <Feedback verdict={verdict} answer={exercise.sv} />
          <div className="small muted">{exercise.de}</div>
        </>
      ) : null}
    </div>
  );
}

function SpeakExercise({
  exercise,
  verdict,
  onSubmit,
}: {
  exercise: Extract<Exercise, { kind: "speak" }>;
  verdict: Verdict;
  onSubmit: (correct: boolean, note?: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [heard, setHeard] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setError("");
    setRecording(true);
    try {
      const blob = await recordClip();
      setRecording(false);
      setBusy(true);
      const text = await transcribe(blob, exercise.sv);
      setHeard(text);
      onSubmit(matches(text, exercise.sv));
    } catch {
      setRecording(false);
      setError("Mikrofon nicht verfügbar. Du kannst diese Übung überspringen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="exercise fade-in">
      <div className="exercise__kicker">Sprich den Satz laut</div>
      <div className="exercise__prompt">{exercise.sv}</div>
      <div className="small muted">{exercise.de}</div>
      <div className="row" style={{ gap: 8 }}>
        <SpeakButton text={exercise.sv} />
        <SpeakButton text={exercise.sv} slow />
      </div>

      {!verdict ? (
        recording ? (
          <button type="button" className="btn btn--danger btn--lg btn--block" onClick={() => stopRecording()}>
            ⏹ Aufnahme stoppen
          </button>
        ) : (
          <button type="button" className="btn btn--primary btn--lg btn--block" onClick={start} disabled={busy}>
            {busy ? "Verarbeite…" : "🎤 Aufnehmen"}
          </button>
        )
      ) : null}

      {error ? <div className="small muted">{error}</div> : null}
      {heard ? <div className="small muted">Gehört: „{heard}“</div> : null}
      <Feedback verdict={verdict} answer={exercise.sv} />
      {!verdict && !recording && !busy ? (
        <button type="button" className="btn btn--quiet btn--block" onClick={() => onSubmit(true)}>
          Überspringen
        </button>
      ) : null}
    </div>
  );
}
