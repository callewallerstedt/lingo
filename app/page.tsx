"use client";

import { useEffect, useMemo, useState } from "react";
import { StoreProvider, useStore } from "@/lib/state";
import { WORDS } from "@/content/words";
import { isDue } from "@/lib/srs";
import { Home } from "@/components/Home";
import { Course } from "@/components/Course";
import { LessonPlayer } from "@/components/LessonPlayer";
import { Flashcards } from "@/components/Flashcards";
import { Vocab } from "@/components/Vocab";
import { Grammar } from "@/components/Grammar";
import { Chat } from "@/components/Chat";
import { Settings } from "@/components/Settings";
import { NAV_TABS, TAB_TITLES, type Tab } from "@/components/tabs";

export default function Page() {
  // Deliberately no Suspense boundary here. StoreProvider flips `ready` in a
  // mount effect; a boundary between it and <App> lets the provider hydrate
  // first, so App's first client render would disagree with the server HTML.
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}

function App() {
  const { ready, syncState } = useStore();
  const [tab, setTab] = useState<Tab>("home");
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [grammarId, setGrammarId] = useState<string | null>(null);

  // Deep links from the manifest shortcuts and push notifications (/?tab=cards).
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested && ["home", "course", "cards", "vocab", "chat", "grammar", "settings"].includes(requested)) {
      setTab(requested as Tab);
    }
  }, []);

  const openLesson = (id: string) => {
    setLessonId(id);
    setTab("course");
  };

  const go = (next: Tab) => {
    setLessonId(null);
    setGrammarId(null);
    setTab(next);
  };

  if (!ready) {
    return (
      <div className="app">
        <div className="screen center" style={{ paddingTop: "35dvh" }}>
          <div style={{ fontSize: "2.4rem" }}>🇸🇪</div>
          <div className="muted small" style={{ marginTop: 8 }}>
            Laddar…
          </div>
        </div>
      </div>
    );
  }

  // The lesson player and chat own the full screen, nav bar included.
  if (lessonId) {
    return (
      <div className="app">
        <LessonPlayer lessonId={lessonId} onExit={() => setLessonId(null)} onOpenLesson={openLesson} />
      </div>
    );
  }

  if (tab === "chat") {
    return (
      <div className="app">
        <div className="screen screen--flush" style={{ height: "100dvh" }}>
          <Chat />
        </div>
        <Nav tab={tab} onGo={go} />
      </div>
    );
  }

  const heading = TAB_TITLES[tab];

  return (
    <div className="app">
      <header className="topbar">
        <span style={{ fontSize: "1.3rem" }}>🇸🇪</span>
        <h1>{heading.title}</h1>
        <span className="topbar__sub">{heading.sub}</span>
        <span className="sync-dot" data-state={syncState} title={`Sync: ${syncState}`} />
      </header>

      <main className={tab === "vocab" || tab === "grammar" ? "screen screen--wide" : "screen"}>
        {tab === "home" ? <Home onGo={go} onOpenLesson={openLesson} /> : null}
        {tab === "course" ? <Course onOpenLesson={openLesson} /> : null}
        {tab === "cards" ? <Flashcards /> : null}
        {tab === "vocab" ? <Vocab /> : null}
        {tab === "grammar" ? <Grammar topicId={grammarId} onOpen={setGrammarId} /> : null}
        {tab === "settings" ? <Settings /> : null}
      </main>

      <Nav tab={tab} onGo={go} />
    </div>
  );
}

function Nav({ tab, onGo }: { tab: Tab; onGo: (next: Tab) => void }) {
  const { progress } = useStore();

  const dueCount = useMemo(() => {
    const now = Date.now();
    let count = 0;
    for (const word of WORDS) {
      const card = progress.cards[word.id];
      if (card && card.reps > 0 && isDue(card, now)) count += 1;
    }
    return count;
  }, [progress.cards]);

  return (
    <nav className="nav">
      {NAV_TABS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="nav__item"
          aria-current={tab === item.id ? "page" : undefined}
          onClick={() => onGo(item.id)}
        >
          <span className="nav__icon">
            {item.icon}
            {item.id === "cards" && dueCount > 0 ? (
              <span className="nav__badge">{dueCount > 99 ? "99+" : dueCount}</span>
            ) : null}
          </span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
