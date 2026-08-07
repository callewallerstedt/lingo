"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/state";
import { UNITS } from "@/content/course";
import { LEVELS } from "@/content/words";
import { Bar, LevelChip } from "./ui";
import type { CefrLevel } from "@/lib/types";

export function Course({ onOpenLesson }: { onOpenLesson: (id: string) => void }) {
  const { progress } = useStore();
  const [level, setLevel] = useState<CefrLevel | "all">("all");

  const units = useMemo(() => (level === "all" ? UNITS : UNITS.filter((unit) => unit.level === level)), [level]);

  const totals = useMemo(() => {
    const all = UNITS.flatMap((unit) => unit.lessons);
    const done = all.filter((lesson) => progress.lessons[lesson.id]?.completed).length;
    return { done, total: all.length };
  }, [progress.lessons]);

  // The next unfinished lesson, so there's always one obvious thing to tap.
  const upNext = useMemo(() => {
    for (const unit of UNITS) {
      for (const lesson of unit.lessons) {
        if (!progress.lessons[lesson.id]?.completed) return { unit, lesson };
      }
    }
    return null;
  }, [progress.lessons]);

  return (
    <div className="stack--lg">
      {upNext ? (
        <div className="card stack">
          <div className="section-title">Weiter geht&apos;s</div>
          <div>
            <div style={{ fontWeight: 650, fontSize: "1.1rem" }}>{upNext.lesson.title}</div>
            <div className="small muted">
              {upNext.unit.emoji} {upNext.unit.title} · {upNext.lesson.titleDe}
            </div>
          </div>
          <button
            type="button"
            className="btn btn--primary btn--lg btn--block"
            onClick={() => onOpenLesson(upNext.lesson.id)}
          >
            Lektion starten
          </button>
        </div>
      ) : (
        <div className="card center stack">
          <div style={{ fontSize: "2.4rem" }}>🏆</div>
          <strong>Alle Lektionen geschafft!</strong>
          <div className="small muted">Wiederhole mit Flashcards oder üb im Chat weiter.</div>
        </div>
      )}

      <div className="stack--sm">
        <div className="row row--between">
          <span className="section-title">Fortschritt</span>
          <span className="tiny faint">
            {totals.done}/{totals.total}
          </span>
        </div>
        <Bar value={totals.total ? totals.done / totals.total : 0} gold />
      </div>

      <div className="chip-scroll">
        <button type="button" className={level === "all" ? "chip chip--on" : "chip"} onClick={() => setLevel("all")}>
          Alle
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

      {units.map((unit) => {
        const done = unit.lessons.filter((lesson) => progress.lessons[lesson.id]?.completed).length;
        return (
          <div key={unit.id} className="stack--sm">
            <div className="row row--between">
              <div className="row" style={{ gap: 8 }}>
                <span style={{ fontSize: "1.25rem" }}>{unit.emoji}</span>
                <div>
                  <div style={{ fontWeight: 650 }}>{unit.title}</div>
                  <div className="tiny muted">{unit.titleDe}</div>
                </div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <LevelChip level={unit.level} />
                <span className="tiny faint">
                  {done}/{unit.lessons.length}
                </span>
              </div>
            </div>

            <div className="list">
              {unit.lessons.map((lesson) => {
                const state = progress.lessons[lesson.id];
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    className="list__item"
                    onClick={() => onOpenLesson(lesson.id)}
                  >
                    <span className="list__emoji">{state?.completed ? "✅" : "▫️"}</span>
                    <span className="list__body">
                      <span className="list__title">{lesson.title}</span>
                      <span className="list__sub">
                        {lesson.titleDe}
                        {state?.completed ? ` · ${Math.round(state.best * 100)}%` : ""}
                      </span>
                    </span>
                    <span className="list__chevron">›</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
