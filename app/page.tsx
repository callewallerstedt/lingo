"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Difficulty } from "../lib/store";
import { supabase } from "../lib/supabaseClient";
import { SCENARIOS, type ScenarioDefinition } from "../lib/scenarios";

const TASKS_PER_SCENARIO = 10;

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
  feedback?: FeedbackState;
};

type TooltipState = {
  word: string;
  translation: string;
  rect: DOMRect;
  loading?: boolean;
};

type FeedbackState = {
  status: "loading" | "ok" | "corrected" | "error";
  corrected?: string;
};

type VocabEntry = {
  key: string;
  word: string;
  translation: string;
  count: number;
  lastClicked: number;
};

type StudyEntry = {
  word: string;
  translation: string;
};

type StudyPack = {
  language: string;
  entries: StudyEntry[];
};

type ProgressMap = Record<string, number>;

type SuggestionPayload = {
  suggestion: string;
};

export default function Home() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [username, setUsername] = useState<string>("admin");
  const [password, setPassword] = useState<string>("admin");
  const [authError, setAuthError] = useState<string | null>(null);

  const [language, setLanguage] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [loadingProgress, setLoadingProgress] = useState<boolean>(false);

  const [view, setView] = useState<"dashboard" | "chat">("dashboard");
  const [activeScenario, setActiveScenario] = useState<ScenarioDefinition | null>(null);
  const [taskText, setTaskText] = useState<string>("");
  const [taskLoading, setTaskLoading] = useState<boolean>(false);
  const [taskChecking, setTaskChecking] = useState<boolean>(false);
  const [taskCompleted, setTaskCompleted] = useState<boolean>(false);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [rewardPoints, setRewardPoints] = useState<number>(0);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [loadingDots, setLoadingDots] = useState<string>("");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState<boolean>(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState<boolean>(false);

  const [vocabEntries, setVocabEntries] = useState<VocabEntry[]>([]);
  const [showVocabModal, setShowVocabModal] = useState<boolean>(false);
  const [vocabMode, setVocabMode] = useState<"list" | "cards">("list");
  const [vocabFront, setVocabFront] = useState<"word" | "translation">("word");
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [studyPack, setStudyPack] = useState<StudyPack | null>(null);
  const [studyMode, setStudyMode] = useState<"list" | "cards">("list");
  const [studyFront, setStudyFront] = useState<"word" | "translation">("word");
  const [studyFlipped, setStudyFlipped] = useState<Record<number, boolean>>({});
  const [studyLoading, setStudyLoading] = useState<boolean>(false);

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const activeTargetRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const ignoreWindowClickRef = useRef<boolean>(false);
  const messagesStateRef = useRef<Message[]>([]);
  const activeScenarioRef = useRef<ScenarioDefinition | null>(null);
  const taskRef = useRef<string>("");

  const clientCache = useMemo(() => new Map<string, string>(), []);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("linguachat_language");
    const savedVocab = localStorage.getItem("lingoarc_vocab");
    const savedFront = localStorage.getItem("lingoarc_vocab_front");
    const savedStudy = localStorage.getItem("lingoarc_study_pack");
    const savedUsername = localStorage.getItem("lingoarc_username");
    if (savedVocab) {
      try {
        const parsed = JSON.parse(savedVocab) as VocabEntry[];
        if (Array.isArray(parsed)) {
          setVocabEntries(parsed);
        }
      } catch {
        // Ignore malformed vocab cache
      }
    }
    if (savedStudy) {
      try {
        const parsed = JSON.parse(savedStudy) as StudyPack;
        if (parsed && typeof parsed.language === "string" && Array.isArray(parsed.entries)) {
          setStudyPack(parsed);
        }
      } catch {
        // Ignore malformed study cache
      }
    }
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
    if (savedFront === "translation" || savedFront === "word") {
      setVocabFront(savedFront);
    }
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  useEffect(() => {
    messagesStateRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeScenarioRef.current = activeScenario;
  }, [activeScenario]);

  useEffect(() => {
    taskRef.current = taskText;
  }, [taskText]);

  useEffect(() => {
    localStorage.setItem("lingoarc_vocab", JSON.stringify(vocabEntries));
  }, [vocabEntries]);

  useEffect(() => {
    if (studyPack) {
      localStorage.setItem("lingoarc_study_pack", JSON.stringify(studyPack));
    }
  }, [studyPack]);

  useEffect(() => {
    localStorage.setItem("lingoarc_vocab_front", vocabFront);
  }, [vocabFront]);

  useEffect(() => {
    if (language) {
      localStorage.setItem("linguachat_language", language);
    }
  }, [language]);

  useEffect(() => {
    if (!language) return;
    const savedStudy = localStorage.getItem("lingoarc_study_pack");
    if (!savedStudy) {
      setStudyPack(null);
      return;
    }
    try {
      const parsed = JSON.parse(savedStudy) as StudyPack;
      if (parsed && parsed.language === language) {
        setStudyPack(parsed);
      } else {
        setStudyPack(null);
      }
    } catch {
      setStudyPack(null);
    }
  }, [language]);

  useEffect(() => {
    const loadAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setAuthUser(data.session?.user ?? null);
      setAuthLoading(false);
    };

    void loadAuth();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUser) {
      setProgressMap({});
      setView("dashboard");
      setActiveScenario(null);
      setMessages([]);
      setSessionId(null);
      setTaskText("");
      setTaskCompleted(false);
      return;
    }
    setAuthError(null);
    void fetchProgress();
  }, [authUser]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ignoreWindowClickRef.current) {
        ignoreWindowClickRef.current = false;
        return;
      }
      if (activeTargetRef.current && activeTargetRef.current.contains(event.target as Node)) {
        return;
      }
      if (tooltipRef.current && tooltipRef.current.contains(event.target as Node)) {
        return;
      }
      setTooltip(null);
      activeTargetRef.current = null;
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingDots((prev) => {
        if (prev === "") return ".";
        if (prev === ".") return "..";
        if (prev === "..") return "...";
        return "";
      });
    }, 125);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchProgress() {
    if (!authUser) return;
    setLoadingProgress(true);
    try {
      const { data, error } = await supabase
        .from("scenario_progress")
        .select("scenario_id, completed_count")
        .eq("user_id", authUser.id);

      if (error) {
        return;
      }

      const map: ProgressMap = {};
      data?.forEach((row) => {
        map[row.scenario_id] = row.completed_count || 0;
      });
      setProgressMap(map);
    } finally {
      setLoadingProgress(false);
    }
  }

  async function handleLogin() {
    setAuthError(null);
    if (!username || !password) {
      setAuthError("Enter username and password.");
      return;
    }
    const email = username.includes("@") ? username : `${username}@lingoarc.local`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const signUp = await supabase.auth.signUp({ email, password });
      if (signUp.error) {
        setAuthError(signUp.error.message);
        return;
      }
      if (!signUp.data.session) {
        setAuthError("Check your inbox to confirm your email.");
        return;
      }
    }

    localStorage.setItem("lingoarc_username", username);
    await ensureProfile(email, username);
  }

  async function ensureProfile(email: string, name: string) {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return;

    await supabase.from("profiles").upsert({
      id: user.id,
      username: name || email.split("@")[0],
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  function totalPoints() {
    return Object.values(progressMap).reduce((sum, count) => sum + count, 0);
  }

  async function startScenarioChat(scenario: ScenarioDefinition) {
    if (!authUser) return;
    if (!language) {
      setAuthError("Choose a language before starting a scenario.");
      return;
    }

    clientCache.clear();
    setView("chat");
    setActiveScenario(scenario);
    setMessages([]);
    messagesStateRef.current = [];
    setInputValue("");
    setSuggestion(null);
    setShowSuggestionModal(false);
    setTaskCompleted(false);
    setTaskText("");
    setRewardPoints(0);

    const session = await createSession();
    if (!session) return;

    const task = await generateTask(scenario);
    const taskValue = task || "Complete a simple exchange.";

    setTaskText(taskValue);

    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session,
        language,
        difficulty,
        scenarioPreset: scenario.title,
        scenarioCustom: scenario.subtitle,
        scenarioRole: scenario.roleGuide,
        scenarioStart: scenario.startPrompt,
        task: taskValue,
      }),
    });

    setTimeout(() => {
      sendMessageWithRetry("__AI_START__", makeId(), "", 0, session);
    }, 150);
  }

  async function createSession() {
    try {
      const res = await fetch("/api/new", { method: "POST" });
      const data = await res.json();
      setSessionId(data.sessionId);
      return data.sessionId as string;
    } catch {
      return null;
    }
  }

  async function syncSessionContext(targetSessionId: string) {
    if (!activeScenarioRef.current || !language) return;
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: targetSessionId,
        language,
        difficulty,
        scenarioPreset: activeScenarioRef.current.title,
        scenarioCustom: activeScenarioRef.current.subtitle,
        scenarioRole: activeScenarioRef.current.roleGuide,
        scenarioStart: activeScenarioRef.current.startPrompt,
        task: taskRef.current,
      }),
    });
  }

  async function ensureChatSession() {
    if (sessionId) return sessionId;
    const created = await createSession();
    if (!created) return null;
    await syncSessionContext(created);
    return created;
  }

  async function generateTask(scenario: ScenarioDefinition) {
    if (!authUser || !language) return null;
    setTaskLoading(true);
    try {
      const { data } = await supabase
        .from("scenario_attempts")
        .select("task_text")
        .eq("user_id", authUser.id)
        .eq("scenario_id", scenario.id)
        .order("completed_at", { ascending: false })
        .limit(8);

      const previousTasks = data?.map((row) => row.task_text) ?? [];
      const res = await fetch("/api/generate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioTitle: scenario.title,
          scenarioSubtitle: scenario.subtitle,
          roleGuide: scenario.roleGuide,
          userRole: scenario.userRole,
          language,
          difficulty,
          previousTasks,
        }),
      });

      if (!res.ok) {
        return null;
      }

      const payload = (await res.json()) as { task: string };
      return payload.task || null;
    } finally {
      setTaskLoading(false);
    }
  }

  async function handleTaskCompleted() {
    if (!authUser || !activeScenarioRef.current) return;
    const scenarioId = activeScenarioRef.current.id;
    const currentCount = progressMap[scenarioId] || 0;
    const nextCount = currentCount + 1;

    await supabase.from("scenario_attempts").insert({
      user_id: authUser.id,
      scenario_id: scenarioId,
      task_text: taskRef.current || "",
    });

    await supabase.from("scenario_progress").upsert({
      user_id: authUser.id,
      scenario_id: scenarioId,
      completed_count: nextCount,
      updated_at: new Date().toISOString(),
    });

    setProgressMap((prev) => ({ ...prev, [scenarioId]: nextCount }));
    setRewardPoints(1);
    setShowTaskModal(true);
  }

  async function checkTaskCompletion(snapshot?: Message[]) {
    if (!activeScenarioRef.current || !language || taskChecking || taskCompleted) return;
    if (!taskRef.current) return;
    const messageSnapshot = snapshot ?? messagesStateRef.current;

    setTaskChecking(true);
    try {
      const res = await fetch("/api/check-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: taskRef.current,
          language,
          scenarioTitle: activeScenarioRef.current.title,
          roleGuide: activeScenarioRef.current.roleGuide,
          messages: messageSnapshot.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!res.ok) return;
      const data = (await res.json()) as { completed: boolean };
      if (data.completed) {
        setTaskCompleted(true);
        await handleTaskCompleted();
      }
    } finally {
      setTaskChecking(false);
    }
  }

  async function handleNextTask() {
    if (!activeScenarioRef.current) return;
    setShowTaskModal(false);
    await startScenarioChat(activeScenarioRef.current);
  }

  async function getSuggestion() {
    if (!sessionId || !activeScenarioRef.current || !language) return;

    setSuggestionLoading(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          scenario: activeScenarioRef.current.title,
          messages: messagesStateRef.current.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as SuggestionPayload;
        setSuggestion(data.suggestion);
        setShowSuggestionModal(true);
      }
    } finally {
      setSuggestionLoading(false);
    }
  }

  async function sendMessage() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setInputValue("");
    const userMessage: Message = {
      id: makeId(),
      role: "user",
      content: trimmed,
      feedback: { status: "loading" },
    };
    const previousAssistant = getLastAssistant(messagesStateRef.current);
    setMessages((prev) => [...prev, userMessage]);
    messagesStateRef.current = [...messagesStateRef.current, userMessage];

    void sendMessageWithRetry(trimmed, userMessage.id, previousAssistant, 0);
  }

  async function sendMessageWithRetry(
    text: string,
    messageId: string,
    previousAssistant: string,
    attempt: number,
    sessionOverride?: string
  ) {
    const activeSessionId = sessionOverride || (await ensureChatSession());
    if (!activeSessionId || !activeScenarioRef.current) return;

    const isStart = text === "__AI_START__" || text.startsWith("__AI_START__");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSessionId,
          message: text,
          start: isStart,
          language,
          difficulty,
          scenarioPreset: activeScenarioRef.current.title,
          scenarioCustom: activeScenarioRef.current.subtitle,
          scenarioRole: activeScenarioRef.current.roleGuide,
          scenarioStart: activeScenarioRef.current.startPrompt,
          task: taskRef.current,
          messages: messagesStateRef.current.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!res.ok) {
        if (res.status === 404 && attempt === 0) {
          const newSession = await createSession();
          if (newSession) {
            await syncSessionContext(newSession);
            void sendMessageWithRetry(text, messageId, previousAssistant, attempt + 1, newSession);
          }
          return;
        }
        const errorText = await res.text();
        const fallback = errorText || "Request failed. Try again.";
        setMessages((prev) => [...prev, { id: makeId(), role: "assistant", content: fallback }]);
        if (!isStart) {
          void requestFeedback(activeSessionId, messageId, text, previousAssistant);
        }
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let fullResponse = "";
      const assistantMessageId = makeId();

      const assistantMessage: Message = { id: assistantMessageId, role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMessage]);
      messagesStateRef.current = [...messagesStateRef.current, assistantMessage];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: fullResponse }
                : msg
            )
          );
          messagesStateRef.current = messagesStateRef.current.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: fullResponse } : msg
          );
        }
      } finally {
        reader.releaseLock();
      }

      if (!isStart) {
        void requestFeedback(activeSessionId, messageId, text, previousAssistant);
        void checkTaskCompletion(messagesStateRef.current);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", content: "Network error. Try again." },
      ]);
      if (text !== "__AI_START__") {
        void requestFeedback(activeSessionId, messageId, text, previousAssistant);
      }
    }
  }

  async function requestFeedback(
    activeSessionId: string,
    messageId: string,
    userText: string,
    previousAssistant: string
  ) {
    if (!language) return;

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSessionId, message: userText, previousAssistant }),
      });
      if (!res.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, feedback: { status: "error" } } : msg
          )
        );
        return;
      }
      const data = (await res.json()) as {
        status: "ok" | "corrected";
        corrected?: string;
      };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                feedback: {
                  status: data.status,
                  corrected: data.corrected || "",
                },
              }
            : msg
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, feedback: { status: "error" } } : msg
        )
      );
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function autoGrow() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  function renderAssistantContent(text: string) {
    return renderClickableTokens(text, "assist");
  }

  function renderClickableTokens(text: string, keyPrefix: string, wordClassName?: string) {
    const regex = /\s+|\p{L}[\p{L}\p{M}\p{Nd}\p{Pc}\p{Pd}]*|[^\s\p{L}]+/gu;
    const tokens = Array.from(text.matchAll(regex)).map((match) => match[0]);

    return tokens.map((token, index) => {
      const key = `${keyPrefix}-${index}`;
      if (/^\s+$/.test(token)) {
        return <span key={key}>{token}</span>;
      }
      if (/^\p{L}/u.test(token)) {
        return (
          <span
            key={key}
            className={`token word${wordClassName ? ` ${wordClassName}` : ""}`}
            onClick={(event) => onWordClick(event, event.currentTarget, token)}
          >
            {token}
          </span>
        );
      }
      return (
        <span key={key} className="token punct">
          {token}
        </span>
      );
    });
  }

  function renderCorrectedContent(text: string) {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    let groupIndex = 0;

    return parts.map((part) => {
      const key = `fb-${groupIndex++}`;
      if (part.startsWith("**") && part.endsWith("**")) {
        const content = part.slice(2, -2);
        return (
          <strong key={key} className="feedback-highlight">
            {renderClickableTokens(content, `${key}-b`, "feedback-highlight")}
          </strong>
        );
      }
      return <span key={key}>{renderClickableTokens(part, `${key}-n`)}</span>;
    });
  }

  async function onWordClick(event: React.MouseEvent<HTMLSpanElement>, target: HTMLSpanElement, word: string) {
    event.stopPropagation();
    ignoreWindowClickRef.current = true;
    if (!activeScenarioRef.current) return;
    const activeSessionId = await ensureChatSession();
    if (!activeSessionId) return;

    if (activeTargetRef.current === target && tooltip && !tooltip.loading) {
      setTooltip(null);
      activeTargetRef.current = null;
      return;
    }

    let sentence = "";
    const messageElement = target.closest(".message, .feedback");
    if (messageElement) {
      sentence = messageElement.textContent || "";
    }

    const cacheKey = normalizeWord(word);
    const cached = clientCache.get(cacheKey);
    if (cached) {
      activeTargetRef.current = target;
      setTooltip({ word, translation: cached, rect: target.getBoundingClientRect(), loading: false });
      upsertVocab(word, cached);
      return;
    }

    activeTargetRef.current = target;
    const loadingStart = Date.now();
    setTooltip({ word, translation: "", rect: target.getBoundingClientRect(), loading: true });

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSessionId, word, sentence }),
      });

      if (!res.ok) {
        setTooltip(null);
        return;
      }

      const data = (await res.json()) as { translation: string };
      if (!data.translation) {
        setTooltip(null);
        return;
      }

      clientCache.set(cacheKey, data.translation);
      upsertVocab(word, data.translation);
      const elapsed = Date.now() - loadingStart;
      if (elapsed < 350) {
        await new Promise((resolve) => setTimeout(resolve, 350 - elapsed));
      }
      activeTargetRef.current = target;
      setTooltip({ word, translation: data.translation, rect: target.getBoundingClientRect(), loading: false });
    } catch {
      setTooltip(null);
      activeTargetRef.current = null;
    }
  }

  function upsertVocab(word: string, translation: string) {
    const key = normalizeWord(word);
    if (!key) return;
    setVocabEntries((prev) => {
      const existing = prev.find((entry) => entry.key === key);
      if (existing) {
        return prev.map((entry) =>
          entry.key === key
            ? {
                ...entry,
                word,
                translation,
                count: entry.count + 1,
                lastClicked: Date.now(),
              }
            : entry
        );
      }
      return [
        ...prev,
        { key, word, translation, count: 1, lastClicked: Date.now() },
      ];
    });
  }

  function clearVocab() {
    setVocabEntries([]);
    setFlippedCards({});
  }

  function clearStudy() {
    setStudyPack(null);
    setStudyFlipped({});
  }

  function toggleCard(key: string) {
    setFlippedCards((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function toggleStudyCard(index: number) {
    setStudyFlipped((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }

  function makeId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeWord(word: string) {
    return word
      .toLocaleLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{L}\p{M}\p{Nd}'-]/gu, "");
  }

  function getLastAssistant(source: Message[]) {
    for (let i = source.length - 1; i >= 0; i -= 1) {
      if (source[i].role === "assistant") return source[i].content;
    }
    return "";
  }

  async function generateStudyWords(count: number) {
    if (!language || studyLoading) return;
    setStudyLoading(true);
    try {
      const existing = studyPack?.entries.map((entry) => entry.word) ?? [];
      const res = await fetch("/api/vocab-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, count, existing }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items: StudyEntry[] };
      if (!Array.isArray(data.items) || data.items.length === 0) return;

      setStudyPack((prev) => {
        const merged = [...(prev?.entries ?? []), ...data.items];
        return { language, entries: merged };
      });
    } finally {
      setStudyLoading(false);
    }
  }

  const sortedVocab = useMemo(() => {
    return vocabEntries.slice().sort((a, b) => b.lastClicked - a.lastClicked);
  }, [vocabEntries]);

  const dashboardCards = (
    <div className="scenario-grid">
      {SCENARIOS.map((scenario) => {
        const completedCount = progressMap[scenario.id] || 0;
        const progressRatio = Math.min(completedCount / TASKS_PER_SCENARIO, 1);
        const percent = Math.round(progressRatio * 100);
        return (
          <button
            key={scenario.id}
            type="button"
            className={`scenario-card ${completedCount >= TASKS_PER_SCENARIO ? "done" : ""}`}
            onClick={() => startScenarioChat(scenario)}
            disabled={!language}
            title={!language ? "Set a language first" : ""}
          >
            <div className="scenario-card-header">
              <div className="scenario-card-title">{scenario.title}</div>
              <div
                className="scenario-ring"
                style={{
                  background: `conic-gradient(var(--accent) ${percent}%, rgba(255,255,255,0.08) ${percent}% 100%)`,
                }}
              >
                <div className="scenario-ring-inner">
                  {completedCount}/{TASKS_PER_SCENARIO}
                </div>
              </div>
            </div>
            <div className="scenario-card-body">{scenario.subtitle}</div>
          </button>
        );
      })}
    </div>
  );

  const chatView = (
    <section className="chat-shell">
      <div className="chat-header">
        <button type="button" className="ghost" onClick={() => setView("dashboard")}>
          Back
        </button>
        <div className="chat-title">
          <div className="chat-title-main">{activeScenario?.title}</div>
          <div className="chat-title-sub">{activeScenario?.subtitle}</div>
        </div>
        <div className="chat-actions">
          <button type="button" className="ghost" onClick={() => setShowVocabModal(true)}>
            Vocabulary
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => getSuggestion()}
            disabled={suggestionLoading}
          >
            {suggestionLoading ? "Thinking" : "Hint"}
          </button>
        </div>
      </div>
      <div className="task-banner">
        <div className="task-label">Current task</div>
        <div className="task-text">{taskLoading ? "Generating task" : taskText || ""}</div>
        <div className={`task-status ${taskCompleted ? "done" : taskChecking ? "checking" : ""}`}>
          {taskCompleted ? "Completed" : taskChecking ? "Checking" : "In progress"}
        </div>
      </div>
      <div ref={messagesRef} className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.role}`}>
            <div className={`message ${msg.role}`}>
              {msg.role === "assistant" ? (
                msg.content.trim() === "" ? (
                  <div className="assistant-loading">
                    <span className="loading-dots">{loadingDots}</span>
                  </div>
                ) : (
                  renderAssistantContent(msg.content)
                )
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "user" && msg.feedback && (msg.feedback.status === "corrected" || msg.feedback.status === "ok" || msg.feedback.status === "loading") ? (
              <div className={`feedback ${msg.feedback.status}`}>
                {msg.feedback.status === "loading" ? (
                  <div className="feedback-loading">{loadingDots}</div>
                ) : msg.feedback.status === "ok" ? (
                  <span className="feedback-good">OK</span>
                ) : (
                  <span className="feedback-corrected">
                    {renderCorrectedContent(msg.feedback.corrected || "")}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <footer className="composer">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onInput={autoGrow}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type your message"
        />
        <button type="button" className="solid" onClick={sendMessage}>
          Send
        </button>
      </footer>
    </section>
  );

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <div className="brand-name">LingoArc</div>
          <div className="brand-tag">Scenario-based language practice</div>
        </div>
        {authUser ? (
          <div className="top-controls">
            <div className="field">
              <label className="label">Language</label>
              <input
                type="text"
                value={language || ""}
                onChange={(event) => setLanguage(event.target.value)}
                placeholder="Spanish, Japanese"
              />
            </div>
            <div className="field">
              <label className="label">Difficulty</label>
              <div className="segmented">
                <button
                  type="button"
                  className={`segmented-btn ${difficulty === "easy" ? "active" : ""}`}
                  onClick={() => setDifficulty("easy")}
                >
                  Easy
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${difficulty === "medium" ? "active" : ""}`}
                  onClick={() => setDifficulty("medium")}
                >
                  Medium
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${difficulty === "hard" ? "active" : ""}`}
                  onClick={() => setDifficulty("hard")}
                >
                  Hard
                </button>
              </div>
            </div>
            <div className="points-pill">Points {totalPoints()}</div>
            <button type="button" className="ghost" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        ) : null}
      </header>

      <main className="main-area">
        {authLoading ? (
          <div className="loading-panel">Loading</div>
        ) : !authUser ? (
          <div className="auth-panel">
            <h2>Welcome back</h2>
            <p>Sign in to track scenario progress and unlock rewards.</p>
            <div className="auth-field">
              <label className="label">Username</label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="admin"
              />
            </div>
            <div className="auth-field">
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="admin"
              />
            </div>
            {authError ? <div className="auth-error">{authError}</div> : null}
            <button type="button" className="solid" onClick={handleLogin}>
              Sign in
            </button>
            <div className="auth-note">
              Admin default: username "admin" and password "admin".
            </div>
          </div>
        ) : view === "dashboard" ? (
          <section className="dashboard">
            <section className="home-vocab">
              <div className="home-vocab-header">
                <div>
                  <h2>Vocabulary</h2>
                  <p>Top words to jump into conversations quickly.</p>
                </div>
                <div className="home-vocab-actions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => generateStudyWords(30)}
                    disabled={!language || studyLoading}
                  >
                    {studyLoading ? "Generating" : "Generate 30"}
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => generateStudyWords(10)}
                    disabled={!language || studyLoading}
                  >
                    {studyLoading ? "Generating" : "Generate 10 more"}
                  </button>
                  <button type="button" className="ghost" onClick={clearStudy}>
                    Clear
                  </button>
                </div>
              </div>
              <div className="home-vocab-controls">
                <div className="segmented">
                  <button
                    type="button"
                    className={`segmented-btn ${studyMode === "list" ? "active" : ""}`}
                    onClick={() => setStudyMode("list")}
                  >
                    List
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${studyMode === "cards" ? "active" : ""}`}
                    onClick={() => setStudyMode("cards")}
                  >
                    Flashcards
                  </button>
                </div>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setStudyFront((prev) => (prev === "word" ? "translation" : "word"));
                    setStudyFlipped({});
                  }}
                >
                  Start: {studyFront === "word" ? "Target" : "English"}
                </button>
              </div>
              {!language ? (
                <p className="dashboard-alert">Set a language above to generate vocabulary.</p>
              ) : !studyPack || studyPack.entries.length === 0 ? (
                <div className="home-vocab-empty">Generate a list to start studying.</div>
              ) : studyMode === "list" ? (
                <div className="vocab-list">
                  {studyPack.entries.map((entry, index) => (
                    <div key={`${entry.word}-${index}`} className="vocab-row">
                      <div className="vocab-word">{entry.word}</div>
                      <div className="vocab-translation">{entry.translation}</div>
                      <div className="vocab-count">#{index + 1}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="vocab-cards">
                  {studyPack.entries.map((entry, index) => {
                    const flipped = Boolean(studyFlipped[index]);
                    const frontText = studyFront === "word" ? entry.word : entry.translation;
                    const backText = studyFront === "word" ? entry.translation : entry.word;
                    return (
                      <button
                        key={`${entry.word}-${index}`}
                        type="button"
                        className={`vocab-card ${flipped ? "flipped" : ""}`}
                        onClick={() => toggleStudyCard(index)}
                        aria-pressed={flipped ? "true" : "false"}
                      >
                        <div className="vocab-card-face">
                          <div className={flipped ? "vocab-card-translation" : "vocab-card-word"}>
                            {flipped ? backText : frontText}
                          </div>
                          <div className="vocab-card-hint">
                            {flipped ? "Tap to hide" : "Tap to flip"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
            <div className="dashboard-header">
              <div>
                <h2>Pick a scenario</h2>
                <p>Complete tasks to fill each progress ring.</p>
                {!language ? (
                  <p className="dashboard-alert">Set a language above to start.</p>
                ) : null}
              </div>
              <div className="dashboard-meta">
                {loadingProgress ? "Syncing progress" : `Total points: ${totalPoints()}`}
              </div>
            </div>
            {dashboardCards}
          </section>
        ) : (
          chatView
        )}
      </main>

      {showSuggestionModal && suggestion ? (
        <div className="suggestion-modal-overlay" onClick={() => setShowSuggestionModal(false)}>
          <div className="suggestion-modal" onClick={(event) => event.stopPropagation()}>
            <div className="suggestion-modal-content">
              <div className="suggestion-modal-header">
                <span className="suggestion-title">Suggested next move</span>
              </div>
              <div className="suggestion-text">{suggestion}</div>
            </div>
          </div>
        </div>
      ) : null}

      {showTaskModal ? (
        <div className="completion-modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="completion-modal" onClick={(event) => event.stopPropagation()}>
            <div className="completion-title">Task completed</div>
            <div className="completion-body">You earned +{rewardPoints} point.</div>
            <div className="completion-actions">
              <button type="button" className="ghost" onClick={() => setShowTaskModal(false)}>
                Keep chatting
              </button>
              <button type="button" className="solid" onClick={handleNextTask}>
                Next task
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {tooltip ? (
        <div
          ref={tooltipRef}
          className="tooltip"
          style={{
            top: Math.max(8, tooltip.rect.top + window.scrollY - 42),
            left: tooltip.rect.left + window.scrollX + tooltip.rect.width / 2,
            transform: "translateX(-50%)",
          }}
        >
          {tooltip.loading ? <span className="tooltip-loading">{loadingDots}</span> : tooltip.translation}
        </div>
      ) : null}

      {showVocabModal ? (
        <div className="vocab-modal-overlay" onClick={() => setShowVocabModal(false)}>
          <div className="vocab-modal" onClick={(event) => event.stopPropagation()}>
            <div className="vocab-modal-header">
              <div className="vocab-title">Your Vocabulary</div>
              <div className="vocab-controls">
                <button
                  type="button"
                  className={`ghost vocab-tab ${vocabMode === "list" ? "active" : ""}`}
                  onClick={() => setVocabMode("list")}
                >
                  List
                </button>
                <button
                  type="button"
                  className={`ghost vocab-tab ${vocabMode === "cards" ? "active" : ""}`}
                  onClick={() => setVocabMode("cards")}
                >
                  Flashcards
                </button>
                <button
                  type="button"
                  className="ghost vocab-tab"
                  onClick={() => {
                    setVocabFront((prev) => (prev === "word" ? "translation" : "word"));
                    setFlippedCards({});
                  }}
                >
                  Start: {vocabFront === "word" ? "Target" : "English"}
                </button>
                <button type="button" className="ghost vocab-clear" onClick={clearVocab}>
                  Clear
                </button>
              </div>
            </div>
            <div className="vocab-modal-body">
              {vocabEntries.length === 0 ? (
                <div className="vocab-empty">Click words in the chat to save them here.</div>
              ) : vocabMode === "list" ? (
                <div className="vocab-list">
                  {sortedVocab.map((entry) => (
                      <div key={entry.key} className="vocab-row">
                        <div className="vocab-word">{entry.word}</div>
                        <div className="vocab-translation">{entry.translation}</div>
                        <div className="vocab-count">x{entry.count}</div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="vocab-cards">
                  {sortedVocab.map((entry) => {
                      const flipped = Boolean(flippedCards[entry.key]);
                      const frontText = vocabFront === "word" ? entry.word : entry.translation;
                      const backText = vocabFront === "word" ? entry.translation : entry.word;
                      return (
                        <button
                          key={entry.key}
                          type="button"
                          className={`vocab-card ${flipped ? "flipped" : ""}`}
                          onClick={() => toggleCard(entry.key)}
                          aria-pressed={flipped ? "true" : "false"}
                        >
                          <div className="vocab-card-face">
                            <div className={flipped ? "vocab-card-translation" : "vocab-card-word"}>
                              {flipped ? backText : frontText}
                            </div>
                            <div className="vocab-card-hint">
                              {flipped ? "Tap to hide" : "Tap to flip"}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
