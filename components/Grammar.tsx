"use client";

import { useMemo, useState } from "react";
import { GRAMMAR, getGrammar } from "@/content/grammar";
import type { GrammarTopic } from "@/content/grammar";
import { LEVELS } from "@/content/words";
import type { CefrLevel } from "@/lib/types";
import { LevelChip, SpeakButton } from "./ui";

export function Grammar({ topicId, onOpen }: { topicId: string | null; onOpen: (id: string | null) => void }) {
  const [level, setLevel] = useState<CefrLevel | "all">("all");
  const [query, setQuery] = useState("");

  const topic = topicId ? getGrammar(topicId) : undefined;

  const topics = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return GRAMMAR.filter((entry) => {
      if (level !== "all" && entry.level !== level) return false;
      if (!needle) return true;
      return (
        entry.title.toLowerCase().includes(needle) ||
        entry.titleDe.toLowerCase().includes(needle) ||
        entry.blurb.toLowerCase().includes(needle)
      );
    });
  }, [level, query]);

  if (topic) return <TopicView topic={topic} onBack={() => onOpen(null)} />;

  return (
    <div className="stack">
      <input
        className="input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Grammatik durchsuchen…"
        type="search"
      />

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

      <div className="list">
        {topics.map((entry) => (
          <button key={entry.id} type="button" className="list__item" onClick={() => onOpen(entry.id)}>
            <span className="list__body">
              <span className="list__title">{entry.title}</span>
              <span className="list__sub">{entry.titleDe}</span>
            </span>
            <LevelChip level={entry.level} />
            <span className="list__chevron">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TopicView({ topic, onBack }: { topic: GrammarTopic; onBack: () => void }) {
  return (
    <div className="stack--lg fade-in">
      <button type="button" className="btn btn--quiet" onClick={onBack} style={{ alignSelf: "flex-start" }}>
        ‹ Alle Themen
      </button>

      <div className="stack--sm">
        <div className="row" style={{ gap: 8 }}>
          <LevelChip level={topic.level} />
        </div>
        <h2>{topic.title}</h2>
        <div className="muted">{topic.titleDe}</div>
        <p className="muted">{topic.blurb}</p>
      </div>

      <div className="card">
        <div className="section-title">Das Wichtigste</div>
        <ul className="keypoints">
          {topic.keyPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>

      {topic.sections.map((section) => (
        <div key={section.heading} className="stack">
          <h3 style={{ fontSize: "1.05rem" }}>{section.heading}</h3>
          <p className="prose muted">{section.body}</p>

          {section.table ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {section.table.head.map((cell, index) => (
                      <th key={index}>{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {section.examples?.length ? (
            <div className="stack--sm">
              {section.examples.map((example, index) => (
                <div key={index} className={example.wrong ? "example example--wrong" : "example"}>
                  <div className="row row--between">
                    <span className="example__sv">
                      {example.wrong ? "✗ " : ""}
                      {example.sv}
                    </span>
                    {!example.wrong ? <SpeakButton text={example.sv} plain /> : null}
                  </div>
                  {example.de && example.de !== "—" ? <span className="example__de">{example.de}</span> : null}
                  {example.note ? <span className="example__note">{example.note}</span> : null}
                </div>
              ))}
            </div>
          ) : null}

          {section.germanTrap ? (
            <div className="trap">
              <span className="trap__label">Für Deutschsprachige</span>
              {section.germanTrap}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
