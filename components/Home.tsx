"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/state";
import { WORDS } from "@/content/words";
import { UNITS } from "@/content/course";
import { isDue, isKnown, isNew } from "@/lib/srs";
import { dayKeyOffset, todayKey } from "@/lib/progress";
import { Bar, Ring } from "./ui";
import type { Tab } from "./tabs";

export function Home({ onGo, onOpenLesson }: { onGo: (tab: Tab) => void; onOpenLesson: (id: string) => void }) {
  const { progress } = useStore();

  const stats = useMemo(() => {
    const now = Date.now();
    let due = 0;
    let learning = 0;
    let known = 0;
    let archived = 0;
    let starred = 0;

    for (const word of WORDS) {
      const card = progress.cards[word.id];
      if (!card) continue;
      if (card.starred) starred += 1;
      if (card.archived) {
        archived += 1;
        continue;
      }
      if (isNew(card)) continue;
      learning += 1;
      if (isDue(card, now)) due += 1;
      if (isKnown(card)) known += 1;
    }

    const today = progress.days[todayKey()] ?? { reviews: 0, correct: 0, xp: 0, lessons: 0 };
    const lessonsDone = Object.values(progress.lessons).filter((lesson) => lesson.completed).length;
    const lessonsTotal = UNITS.reduce((sum, unit) => sum + unit.lessons.length, 0);

    return { due, learning, known, archived, starred, today, lessonsDone, lessonsTotal };
  }, [progress]);

  const upNext = useMemo(() => {
    for (const unit of UNITS) {
      for (const lesson of unit.lessons) {
        if (!progress.lessons[lesson.id]?.completed) return { unit, lesson };
      }
    }
    return null;
  }, [progress.lessons]);

  const goalPct = Math.min(1, stats.today.reviews / Math.max(1, progress.settings.dailyGoal));
  const doneToday = stats.today.lessons > 0;

  return (
    <div className="stack--lg">
      <div className="card row home-hero" style={{ gap: 18 }}>
        <Ring value={goalPct} label={`${stats.today.reviews}`} sub={`/ ${progress.settings.dailyGoal}`} />
        <div className="stack--sm" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "1.15rem", fontWeight: 650 }}>Hej {progress.name || "Tiffy"}! 🇸🇪</div>
          <div className="small muted">
            {doneToday
              ? "Lektion heute erledigt. Snyggt jobbat!"
              : "Noch keine Lektion heute — eine reicht schon."}
          </div>
          <div className="row home-hero__badges" style={{ gap: 6 }}>
            <span className="chip">🔥 {progress.streak} Tage</span>
            <span className="chip">⭐ {progress.xp} XP</span>
          </div>
        </div>
      </div>

      <div className="tiles">
        <div className="tile">
          <div className="tile__value">{stats.due}</div>
          <div className="tile__label">Fällig</div>
        </div>
        <div className="tile">
          <div className="tile__value">{stats.learning}</div>
          <div className="tile__label">Am Lernen</div>
        </div>
        <div className="tile">
          <div className="tile__value">{stats.known}</div>
          <div className="tile__label">Sitzt</div>
        </div>
        <div className="tile">
          <div className="tile__value">{WORDS.length}</div>
          <div className="tile__label">Wörter</div>
        </div>
      </div>

      {upNext ? (
        <div className="card stack">
          <div className="section-title">Nächste Lektion</div>
          <div>
            <div style={{ fontWeight: 650, fontSize: "1.08rem" }}>{upNext.lesson.title}</div>
            <div className="small muted">
              {upNext.unit.emoji} {upNext.unit.title}
            </div>
          </div>
          <button type="button" className="btn btn--primary btn--lg btn--block" onClick={() => onOpenLesson(upNext.lesson.id)}>
            Starten
          </button>
        </div>
      ) : null}

      {stats.due > 0 ? (
        <button type="button" className="btn btn--gold btn--lg btn--block" onClick={() => onGo("cards")}>
          {stats.due} Karten wiederholen
        </button>
      ) : null}

      <div className="stack--sm">
        <div className="row row--between">
          <span className="section-title">Kursfortschritt</span>
          <span className="tiny faint">
            {stats.lessonsDone}/{stats.lessonsTotal}
          </span>
        </div>
        <Bar value={stats.lessonsTotal ? stats.lessonsDone / stats.lessonsTotal : 0} gold />
      </div>

      <Heatmap days={progress.days} />

      <div className="stack--sm">
        <div className="section-title">Mehr</div>
        <div className="list">
          <button type="button" className="list__item" onClick={() => onGo("grammar")}>
            <span className="list__emoji">📘</span>
            <span className="list__body">
              <span className="list__title">Grammatik</span>
              <span className="list__sub">Alle Regeln, für Deutschsprachige erklärt</span>
            </span>
            <span className="list__chevron">›</span>
          </button>
          <button type="button" className="list__item" onClick={() => onGo("settings")}>
            <span className="list__emoji">⚙️</span>
            <span className="list__body">
              <span className="list__title">Einstellungen</span>
              <span className="list__sub">Erinnerungen, Ziele, Sync</span>
            </span>
            <span className="list__chevron">›</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Last 28 days of activity, most recent at the end. */
function Heatmap({ days }: { days: Record<string, { reviews: number; lessons: number }> }) {
  const cells = useMemo(() => {
    const out: Array<{ key: string; level: number }> = [];
    for (let offset = -27; offset <= 0; offset += 1) {
      const key = dayKeyOffset(offset);
      const day = days[key];
      const total = (day?.reviews ?? 0) + (day?.lessons ?? 0) * 10;
      const level = total === 0 ? 0 : total < 15 ? 1 : total < 40 ? 2 : 3;
      out.push({ key, level });
    }
    return out;
  }, [days]);

  return (
    <div className="stack--sm">
      <div className="section-title">Letzte 4 Wochen</div>
      <div className="heatmap">
        {cells.map((cell) => (
          <div key={cell.key} className="heatmap__cell" data-level={cell.level} title={cell.key} />
        ))}
      </div>
    </div>
  );
}
