"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { LESSON_CATEGORIES, LESSON_TOPICS, LESSONS_STORAGE_PREFIX, type LessonContent, type LessonTopic } from "../lib/lessons";

type LessonsMap = Record<string, LessonContent>;

type LessonsPanelProps = {
  language: string;
  onClose: () => void;
  loadRemote?: (language: string) => Promise<LessonsMap | null>;
  saveRemote?: (language: string, content: LessonContent) => void;
};

function storageKey(language: string): string {
  return `${LESSONS_STORAGE_PREFIX}${language.trim().toLowerCase() || "default"}`;
}

function loadLocal(language: string): LessonsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(language));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LessonsMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocal(language: string, map: LessonsMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(language), JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export default function LessonsPanel({ language, onClose, loadRemote, saveRemote }: LessonsPanelProps) {
  const [lessons, setLessons] = useState<LessonsMap>(() => loadLocal(language));
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  useEffect(() => {
    setLessons(loadLocal(language));
    setOpenId(null);
    let cancelled = false;
    (async () => {
      if (!loadRemote) return;
      try {
        const remote = await loadRemote(language);
        if (cancelled || !remote) return;
        setLessons((prev) => {
          const merged = { ...prev };
          for (const [id, content] of Object.entries(remote)) {
            if (!merged[id] || (content.createdAt || 0) >= (merged[id].createdAt || 0)) merged[id] = content;
          }
          saveLocal(language, merged);
          return merged;
        });
      } catch {
        /* keep local */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language, loadRemote]);

  const generate = async (topic: LessonTopic) => {
    if (busyId) return;
    setBusyId(topic.id);
    setErrorId(null);
    try {
      const res = await fetch("/api/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, title: topic.title, brief: topic.brief }),
      });
      if (!res.ok) throw new Error("bad response");
      const data = (await res.json()) as { markdown?: string };
      if (typeof data.markdown !== "string" || !data.markdown.trim()) throw new Error("empty");
      const content: LessonContent = { topicId: topic.id, language, markdown: data.markdown, createdAt: Date.now() };
      setLessons((prev) => {
        const next = { ...prev, [topic.id]: content };
        saveLocal(language, next);
        return next;
      });
      saveRemote?.(language, content);
      setOpenId(topic.id);
    } catch {
      setErrorId(topic.id);
    } finally {
      setBusyId(null);
    }
  };

  const open = openId ? lessons[openId] : null;
  const openTopic = openId ? LESSON_TOPICS.find((t) => t.id === openId) : null;

  const grouped = useMemo(
    () => LESSON_CATEGORIES.map((cat) => ({ cat, topics: LESSON_TOPICS.filter((t) => t.category === cat) })),
    []
  );

  return (
    <div className="lx-overlay" onClick={busyId ? undefined : onClose}>
      <LessonStyles />
      <div className="lx-modal" onClick={(e) => e.stopPropagation()}>
        {open && openTopic ? (
          <>
            <div className="lx-head">
              <button type="button" className="lx-back" onClick={() => setOpenId(null)}>
                ‹ Lessons
              </button>
              <button type="button" className="lx-regen" onClick={() => generate(openTopic)} disabled={busyId !== null}>
                {busyId === openTopic.id ? "Regenerating…" : "Regenerate"}
              </button>
            </div>
            <div className="lx-md">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {open.markdown}
              </ReactMarkdown>
            </div>
          </>
        ) : (
          <>
            <div className="lx-head">
              <div className="lx-title">Lessons</div>
              <button type="button" className="lx-close" onClick={onClose}>
                Close
              </button>
            </div>
            <p className="lx-sub">Structured grammar lessons for {language}, generated and saved for you.</p>
            {grouped.map(({ cat, topics }) => (
              <div key={cat} className="lx-group">
                <div className="lx-group-title">{cat}</div>
                <div className="lx-list">
                  {topics.map((t) => {
                    const has = Boolean(lessons[t.id]);
                    const busy = busyId === t.id;
                    return (
                      <div key={t.id} className={`lx-item ${has ? "done" : ""}`}>
                        <div className="lx-item-main" onClick={() => (has ? setOpenId(t.id) : generate(t))}>
                          <div className="lx-item-text">
                            <span className="lx-item-title">
                              {t.title}
                              {has && <span className="lx-dot" title="Saved" />}
                            </span>
                            <span className="lx-item-sub">{errorId === t.id ? "Couldn’t generate — needs an OpenAI key / connection." : t.subtitle}</span>
                          </div>
                        </div>
                        {has ? (
                          <button type="button" className="lx-view" onClick={() => setOpenId(t.id)}>
                            Open
                          </button>
                        ) : (
                          <button type="button" className="lx-gen" onClick={() => generate(t)} disabled={busy || busyId !== null}>
                            {busy ? <span className="lx-spin" /> : "Generate"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function LessonStyles() {
  return <style dangerouslySetInnerHTML={{ __html: LX_CSS }} />;
}

const LX_CSS = `
.lx-overlay{position:fixed;inset:0;background:rgba(11,14,23,.42);display:grid;place-items:start center;z-index:240;padding:14px;backdrop-filter:blur(3px);overflow:auto;animation:nx-in .2s;}
.lx-modal{background:var(--nx-surface,#fff);border:1px solid var(--nx-line,#eceef4);border-radius:22px;padding:18px;max-width:680px;width:100%;margin:14px auto;box-shadow:var(--nx-shadow,0 16px 36px -22px rgba(30,40,90,.28));}
.lx-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px;}
.lx-title{font-weight:800;font-size:18px;}
.lx-close,.lx-back,.lx-regen{background:var(--nx-surface2,#f5f7fb);border:1px solid var(--nx-line,#eceef4);color:var(--nx-ink,#0b0e17);border-radius:11px;padding:9px 14px;font-weight:600;font-size:14px;cursor:pointer;}
.lx-back{font-weight:700;}
.lx-regen{color:var(--nx-accent,#5b5bf6);}
.lx-sub{color:var(--nx-ink2,#6b7384);font-size:13px;margin:0 0 14px;}
.lx-group{margin-bottom:16px;}
.lx-group-title{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:var(--nx-ink2,#6b7384);margin-bottom:8px;}
.lx-list{display:flex;flex-direction:column;gap:8px;}
.lx-item{display:flex;align-items:center;gap:10px;border:1px solid var(--nx-line,#eceef4);border-radius:14px;padding:12px 14px;transition:border-color .15s;}
.lx-item.done{border-color:rgba(91,91,246,.3);background:linear-gradient(120deg,rgba(91,91,246,.04),transparent);}
.lx-item-main{flex:1;cursor:pointer;min-width:0;}
.lx-item-text{display:flex;flex-direction:column;gap:2px;}
.lx-item-title{font-weight:700;font-size:15px;display:flex;align-items:center;gap:7px;}
.lx-dot{width:7px;height:7px;border-radius:50%;background:var(--nx-accent,#5b5bf6);display:inline-block;}
.lx-item-sub{font-size:12.5px;color:var(--nx-ink2,#6b7384);}
.lx-gen,.lx-view{border:none;border-radius:11px;padding:10px 16px;font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap;min-width:96px;display:grid;place-items:center;}
.lx-gen{background:linear-gradient(135deg,var(--nx-accent,#5b5bf6),var(--nx-accent2,#22d3ee));color:#fff;}
.lx-view{background:var(--nx-surface2,#f5f7fb);border:1px solid var(--nx-line,#eceef4);color:var(--nx-ink,#0b0e17);}
.lx-gen:disabled{opacity:.6;cursor:default;}
.lx-spin{width:15px;height:15px;border-radius:50%;border:2px solid rgba(255,255,255,.5);border-top-color:#fff;animation:nx-spin .8s linear infinite;}

/* markdown */
.lx-md{font-size:15px;line-height:1.65;color:var(--nx-ink,#0b0e17);overflow-wrap:break-word;}
.lx-md h1{font-size:24px;font-weight:800;margin:4px 0 12px;letter-spacing:-0.02em;}
.lx-md h2{font-size:17px;font-weight:800;margin:22px 0 8px;padding-bottom:6px;border-bottom:1px solid var(--nx-line,#eceef4);}
.lx-md h3{font-size:15px;font-weight:700;margin:16px 0 6px;}
.lx-md p{margin:8px 0;}
.lx-md ul,.lx-md ol{margin:8px 0;padding-left:22px;}
.lx-md li{margin:5px 0;}
.lx-md strong{color:var(--nx-ink,#0b0e17);font-weight:700;}
.lx-md code{background:var(--nx-surface2,#f5f7fb);border:1px solid var(--nx-line,#eceef4);border-radius:6px;padding:1px 6px;font-size:13px;font-family:ui-monospace,monospace;}
.lx-md pre{background:var(--nx-surface2,#f5f7fb);border:1px solid var(--nx-line,#eceef4);border-radius:12px;padding:12px;overflow:auto;}
.lx-md pre code{background:none;border:none;padding:0;}
.lx-md blockquote{border-left:3px solid var(--nx-accent,#5b5bf6);margin:10px 0;padding:4px 0 4px 14px;color:var(--nx-ink2,#6b7384);}
.lx-md table{border-collapse:collapse;width:100%;margin:12px 0;font-size:14px;display:block;overflow-x:auto;}
.lx-md th,.lx-md td{border:1px solid var(--nx-line,#eceef4);padding:8px 12px;text-align:left;}
.lx-md th{background:var(--nx-surface2,#f5f7fb);font-weight:700;}
.lx-md tr:nth-child(even) td{background:rgba(245,247,251,.5);}
.lx-md a{color:var(--nx-accent,#5b5bf6);}
.lx-md hr{border:none;border-top:1px solid var(--nx-line,#eceef4);margin:16px 0;}
.lx-md .katex{font-size:1.05em;}
.lx-md .katex-display{overflow-x:auto;overflow-y:hidden;padding:4px 0;}
@media (max-width:420px){.lx-modal{padding:14px;border-radius:18px;}.lx-md h1{font-size:21px;}}
`;
