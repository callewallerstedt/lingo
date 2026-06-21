"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  initialOpenId?: string | null;
  completedIds?: string[];
  onToggleComplete?: (topicId: string) => void;
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

export default function LessonsPanel({
  language,
  onClose,
  loadRemote,
  saveRemote,
  initialOpenId = null,
  completedIds = [],
  onToggleComplete,
}: LessonsPanelProps) {
  const [lessons, setLessons] = useState<LessonsMap>(() => loadLocal(language));
  const [openId, setOpenId] = useState<string | null>(initialOpenId);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [remoteChecked, setRemoteChecked] = useState(false);
  const loadRemoteRef = useRef(loadRemote);
  const saveRemoteRef = useRef(saveRemote);

  useEffect(() => {
    loadRemoteRef.current = loadRemote;
  }, [loadRemote]);

  useEffect(() => {
    saveRemoteRef.current = saveRemote;
  }, [saveRemote]);

  useEffect(() => {
    setLessons(loadLocal(language));
    setOpenId(initialOpenId);
    setRemoteChecked(false);
    let cancelled = false;
    (async () => {
      const load = loadRemoteRef.current;
      if (!load) {
        setRemoteChecked(true);
        return;
      }
      try {
        const remote = await load(language);
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
      } finally {
        if (!cancelled) setRemoteChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialOpenId, language]);

  const generate = useCallback(async (topic: LessonTopic) => {
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
      saveRemoteRef.current?.(language, content);
      setOpenId(topic.id);
    } catch {
      setErrorId(topic.id);
    } finally {
      setBusyId(null);
    }
  }, [busyId, language]);

  const open = openId ? lessons[openId] : null;
  const openTopic = openId ? LESSON_TOPICS.find((t) => t.id === openId) : null;

  useEffect(() => {
    if (!openId || !openTopic || open || busyId || !remoteChecked || errorId === openTopic.id) return;
    void generate(openTopic);
  }, [busyId, errorId, generate, open, openId, openTopic, remoteChecked]);

  const grouped = useMemo(
    () => LESSON_CATEGORIES.map((cat) => ({ cat, topics: LESSON_TOPICS.filter((t) => t.category === cat) })),
    []
  );

  return (
    <div className="lx-overlay" onClick={busyId ? undefined : onClose}>
      <LessonStyles />
      <div className="lx-modal" onClick={(e) => e.stopPropagation()}>
        {openTopic ? (
          <>
            <div className="lx-head">
              <button type="button" className="lx-back" onClick={() => setOpenId(null)}>
                ‹ Lessons
              </button>
              <div className="lx-head-actions">
                {open && onToggleComplete && (
                  <button
                    type="button"
                    className={`lx-complete ${completedIds.includes(openTopic.id) ? "done" : ""}`}
                    onClick={() => onToggleComplete(openTopic.id)}
                  >
                    {completedIds.includes(openTopic.id) ? "Completed ✓" : "Mark complete"}
                  </button>
                )}
                <button type="button" className="lx-regen" onClick={() => generate(openTopic)} disabled={busyId !== null}>
                  {busyId === openTopic.id ? (
                    <span className="lx-busy-label">
                      <span className="lx-spin dark" aria-hidden="true" />
                      {open ? "Regenerating" : "Generating"}
                    </span>
                  ) : (
                    open ? "Regenerate" : "Generate"
                  )}
                </button>
              </div>
            </div>
            <div className="lx-md">
              {open ? (
                <InteractiveLessonMarkdown markdown={open.markdown} title={openTopic.title} />
              ) : (
                <div className="lx-empty-state">
                  {errorId === openTopic.id ? (
                    <>
                      <strong>Couldn&apos;t generate this lesson.</strong>
                      <span>Check the connection/OpenAI key, then tap Generate.</span>
                    </>
                  ) : (
                    <>
                      <span className="lx-spin dark" aria-hidden="true" />
                      <strong>{remoteChecked ? "Generating lesson" : "Checking saved lesson"}</strong>
                      <span>{openTopic.title}</span>
                    </>
                  )}
                </div>
              )}
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
                        <button
                          type="button"
                          className="lx-item-main"
                          onClick={() => (has ? setOpenId(t.id) : generate(t))}
                          disabled={busyId !== null && !busy}
                        >
                          <div className="lx-item-text">
                            <span className="lx-item-title">
                              {t.title}
                              {has && <span className="lx-dot" title="Saved" />}
                            </span>
                            <span className="lx-item-sub">{errorId === t.id ? "Couldn’t generate — needs an OpenAI key / connection." : t.subtitle}</span>
                          </div>
                        </button>
                        {has ? (
                          <button type="button" className="lx-view" onClick={() => setOpenId(t.id)}>
                            Open
                          </button>
                        ) : (
                          <button type="button" className="lx-gen" onClick={() => generate(t)} disabled={busy || busyId !== null}>
                            {busy ? (
                              <span className="lx-busy-label">
                                <span className="lx-spin" aria-hidden="true" />
                                Generating
                              </span>
                            ) : (
                              "Generate"
                            )}
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

function MarkdownBlock({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} skipHtml>
      {children}
    </ReactMarkdown>
  );
}

function decodeLegacyEntities(value: string): string {
  let decoded = value;
  for (let index = 0; index < 3; index += 1) {
    const next = decoded
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
}

function legacyAnswerToMarkdown(value: string): string {
  return decodeLegacyEntities(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/gi, "")
    .replace(/<\/(?:p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .replace(/[ \t]+/g, " ");
}

function normalizeLessonSource(markdown: string): string {
  let source = decodeLegacyEntities(markdown).replace(/<br\s*\/?>/gi, "\n");
  source = source.replace(
    /<details\b[^>]*>[\s\S]*?<summary\b[^>]*>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/gi,
    (_match, body: string) => `\nAnswer: ${legacyAnswerToMarkdown(body)}\n`
  );
  source = source.replace(
    /<p\b[^>]*>\s*Answer:\s*([\s\S]*?)<\/p>/gi,
    (_match, body: string) => `\nAnswer: ${legacyAnswerToMarkdown(body)}\n`
  );
  source = source.replace(
    /<button\b[^>]*>\s*(?:show\s+answer|answer)\s*<\/button>\s*([\s\S]*?)(?=\n\s*(?:\d+[.)]\s+|[-*]\s+|#{1,6}\s+|<button\b|<details\b)|$)/gi,
    (_match, body: string) => `\nAnswer: ${legacyAnswerToMarkdown(body)}\n`
  );
  source = source
    .replace(/<summary\b[^>]*>\s*(?:show\s+answer|answer)\s*<\/summary>/gi, "\nAnswer: ")
    .replace(/<\/?details\b[^>]*>/gi, "\n")
    .replace(/<button\b[^>]*>\s*(?:show\s+answer|answer)\s*<\/button>/gi, "\nAnswer: ")
    .replace(/<\/?(?:p|div|section|article|span)\b[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return source.replace(/\n{4,}/g, "\n\n\n");
}

function InteractiveLessonMarkdown({ markdown, title }: { markdown: string; title: string }) {
  const normalizedMarkdown = normalizeLessonSource(markdown);
  const source = /(^|\n)##\s+Quick practice\b/i.test(normalizedMarkdown)
    ? normalizedMarkdown
    : `${normalizedMarkdown}\n\n## Quick practice\n\n1. Write one short example using ${title}.\nAnswer: Compare your sentence with the Forms and Examples sections above.\n\n2. Change that example to a different person or number.\nAnswer: Check that the subject and form agree with the reference table.\n\n3. Say the same idea as a question or negative sentence.\nAnswer: Use the question or negation pattern explained in this lesson.`;
  const blocks: Array<{ type: "markdown" | "answer"; value: string }> = [];
  const buffer: string[] = [];
  let answerBuffer: string[] | null = null;
  let inPractice = false;
  const flush = () => {
    const value = buffer.join("\n").trim();
    if (value) blocks.push({ type: "markdown", value });
    buffer.length = 0;
  };
  const flushAnswer = () => {
    if (!answerBuffer) return;
    const value = answerBuffer.join("\n").trim();
    if (value) blocks.push({ type: "answer", value });
    answerBuffer = null;
  };
  const isPracticeBoundary = (line: string) =>
    /^\s*(?:\d+[.)]\s+|[-*]\s+|#{1,6}\s+)/.test(line) || /^##\s+Quick practice\b/i.test(line.trim());
  for (const line of source.split("\n")) {
    if (answerBuffer && isPracticeBoundary(line)) {
      flushAnswer();
    }
    if (/^##\s+Quick practice\b/i.test(line.trim())) inPractice = true;
    const answer = inPractice ? line.match(/^\s*Answer:\s*(.*)\s*$/i) : null;
    if (answer) {
      flush();
      flushAnswer();
      answerBuffer = [answer[1]];
    } else if (answerBuffer) {
      answerBuffer.push(line);
    } else {
      buffer.push(line);
    }
  }
  flushAnswer();
  flush();
  return (
    <>
      {blocks.map((block, index) =>
        block.type === "answer" ? (
          <details className="lx-answer" key={`${block.type}-${index}`}>
            <summary>Show answer</summary>
            <div className="lx-answer-body">
              <MarkdownBlock>{block.value}</MarkdownBlock>
            </div>
          </details>
        ) : (
          <MarkdownBlock key={`${block.type}-${index}`}>{block.value}</MarkdownBlock>
        )
      )}
    </>
  );
}

function LessonStyles() {
  return <style dangerouslySetInnerHTML={{ __html: LX_CSS }} />;
}

const LX_CSS = `
.lx-overlay{position:fixed;inset:0;background:rgba(11,14,23,.42);display:grid;place-items:start center;z-index:240;padding:max(14px,env(safe-area-inset-top)) 14px max(14px,env(safe-area-inset-bottom));backdrop-filter:blur(3px);overflow:auto;overscroll-behavior:contain;animation:nx-in .2s;}
.lx-modal{background:var(--nx-surface,#fff);border:1px solid var(--nx-line,#eceef4);border-radius:22px;padding:18px;max-width:680px;width:100%;max-height:calc(100dvh - max(28px,env(safe-area-inset-top)) - max(28px,env(safe-area-inset-bottom)));margin:0 auto;box-shadow:var(--nx-shadow,0 16px 36px -22px rgba(30,40,90,.28));overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}
.lx-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px;position:sticky;top:-18px;z-index:3;background:var(--nx-surface,#fff);padding:18px 0 10px;}
.lx-title{font-weight:800;font-size:18px;}
.lx-close,.lx-back,.lx-regen,.lx-complete{background:var(--nx-surface2,#f5f7fb);border:1px solid var(--nx-line,#eceef4);color:var(--nx-ink,#0b0e17);border-radius:11px;padding:9px 14px;font-weight:600;font-size:14px;cursor:pointer;min-height:42px;}
.lx-back{font-weight:700;}
.lx-regen{color:var(--nx-accent,#5b5bf6);}
.lx-head-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;}
.lx-complete.done{color:#047857;background:rgba(16,185,129,.09);border-color:rgba(16,185,129,.24);}
.lx-sub{color:var(--nx-ink2,#6b7384);font-size:13px;margin:0 0 14px;}
.lx-group{margin-bottom:16px;}
.lx-group-title{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:var(--nx-ink2,#6b7384);margin-bottom:8px;}
.lx-list{display:flex;flex-direction:column;gap:8px;}
.lx-item{display:flex;align-items:center;gap:10px;border:1px solid var(--nx-line,#eceef4);border-radius:14px;padding:12px 14px;transition:border-color .15s;}
.lx-item.done{border-color:rgba(91,91,246,.3);background:linear-gradient(120deg,rgba(91,91,246,.04),transparent);}
.lx-item-main{flex:1;cursor:pointer;min-width:0;background:transparent;border:0;color:inherit;text-align:left;padding:0;border-radius:8px;}
.lx-item-main:disabled{cursor:default;}
.lx-item-text{display:flex;flex-direction:column;gap:2px;}
.lx-item-title{font-weight:700;font-size:15px;display:flex;align-items:center;gap:7px;}
.lx-dot{width:7px;height:7px;border-radius:50%;background:var(--nx-accent,#5b5bf6);display:inline-block;}
.lx-item-sub{font-size:12.5px;color:var(--nx-ink2,#6b7384);}
.lx-gen,.lx-view{border:none;border-radius:11px;padding:10px 16px;font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap;min-width:104px;min-height:42px;display:grid;place-items:center;}
.lx-gen{background:linear-gradient(135deg,var(--nx-accent,#5b5bf6),var(--nx-accent2,#22d3ee));color:#fff;}
.lx-view{background:var(--nx-surface2,#f5f7fb);border:1px solid var(--nx-line,#eceef4);color:var(--nx-ink,#0b0e17);}
.lx-gen:disabled{opacity:.6;cursor:default;}
.lx-busy-label{display:inline-flex;align-items:center;justify-content:center;gap:8px;}
.lx-spin{width:15px;height:15px;border-radius:50%;border:2px solid rgba(255,255,255,.5);border-top-color:#fff;animation:lx-spin .8s linear infinite;flex:0 0 auto;}
.lx-spin.dark{border-color:rgba(91,91,246,.22);border-top-color:var(--nx-accent,#5b5bf6);}
@keyframes lx-spin{to{transform:rotate(360deg);}}
.lx-empty-state{min-height:240px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;color:var(--nx-ink2,#6b7384);border:1px dashed var(--nx-line,#eceef4);border-radius:16px;background:var(--nx-surface2,#f5f7fb);padding:24px;}
.lx-empty-state strong{color:var(--nx-ink,#0b0e17);font-size:16px;}

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
.lx-answer{margin:10px 0 14px;border:1px solid var(--nx-line,#eceef4);border-radius:13px;background:var(--nx-surface2,#f5f7fb);overflow:hidden;}
.lx-answer summary{cursor:pointer;padding:12px 14px;color:var(--nx-accent,#5b5bf6);font-weight:750;list-style:none;display:flex;align-items:center;justify-content:space-between;}
.lx-answer summary::-webkit-details-marker{display:none;}
.lx-answer summary::after{content:"+";font-size:20px;line-height:1;}
.lx-answer[open] summary::after{content:"−";}
.lx-answer-body{padding:0 14px 12px;border-top:1px solid var(--nx-line,#eceef4);}
@media (max-width:640px){
  .lx-overlay{padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);background:var(--nx-surface,#fff);backdrop-filter:none;overflow:hidden;}
  .lx-modal{max-width:none;max-height:none;height:calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom));border:0;border-radius:0;padding:14px 14px 28px;margin:0;box-shadow:none;}
  .lx-head{top:-14px;padding:14px 0 10px;}
  .lx-head-actions{gap:6px;}
  .lx-complete,.lx-regen{padding-inline:10px;font-size:12.5px;}
  .lx-item{align-items:stretch;padding:12px;gap:8px;}
  .lx-item-main{display:flex;align-items:center;}
  .lx-gen,.lx-view{min-width:92px;padding-inline:12px;}
  .lx-md h1{font-size:21px;}
}
@media (max-width:360px){
  .lx-item{flex-direction:column;}
  .lx-gen,.lx-view{width:100%;}
}
`;
