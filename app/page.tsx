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
  starred?: boolean;
};

type StudyEntry = {
  word: string;
  translation: string;
  starred?: boolean;
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
  const [profileName, setProfileName] = useState<string>("");
  const [languageOptions, setLanguageOptions] = useState<string[]>([]);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [newLanguageInput, setNewLanguageInput] = useState<string>("");
  const [addLanguageOpen, setAddLanguageOpen] = useState<boolean>(false);

  const [language, setLanguage] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [loadingProgress, setLoadingProgress] = useState<boolean>(false);

  const [view, setView] = useState<"dashboard" | "chat" | "common" | "scenario-vocab" | "scenario-detail">("dashboard");
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
  const [longPressActive, setLongPressActive] = useState<boolean>(false);

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
  const [scenarioVocabMap, setScenarioVocabMap] = useState<Record<string, StudyPack>>({});
  const [scenarioVocabMode, setScenarioVocabMode] = useState<"list" | "cards">("list");
  const [scenarioVocabFront, setScenarioVocabFront] = useState<"word" | "translation">("word");
  const [scenarioVocabFlipped, setScenarioVocabFlipped] = useState<Record<number, boolean>>({});
  const [scenarioVocabLoading, setScenarioVocabLoading] = useState<boolean>(false);
  const [activeScenarioVocab, setActiveScenarioVocab] = useState<ScenarioDefinition | null>(null);
  const [showStarredOnly, setShowStarredOnly] = useState<boolean>(false);
  const [showStudyStarredOnly, setShowStudyStarredOnly] = useState<boolean>(false);
  const [showScenarioStarredOnly, setShowScenarioStarredOnly] = useState<boolean>(false);

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const activeTargetRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const ignoreWindowClickRef = useRef<boolean>(false);
  const messagesStateRef = useRef<Message[]>([]);
  const activeScenarioRef = useRef<ScenarioDefinition | null>(null);
  const taskRef = useRef<string>("");
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);

  const clientCache = useMemo(() => new Map<string, string>(), []);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("linguachat_language");
    const savedVocab = localStorage.getItem("lingoarc_vocab");
    const savedFront = localStorage.getItem("lingoarc_vocab_front");
    const savedStudy = localStorage.getItem("lingoarc_study_pack");
    const savedScenarioVocab = localStorage.getItem("lingoarc_scenario_vocab");
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
    if (savedScenarioVocab) {
      try {
        const parsed = JSON.parse(savedScenarioVocab) as Record<string, StudyPack>;
        if (parsed && typeof parsed === "object") {
          setScenarioVocabMap(parsed);
        }
      } catch {
        // Ignore malformed scenario vocab cache
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
    localStorage.setItem("lingoarc_scenario_vocab", JSON.stringify(scenarioVocabMap));
  }, [scenarioVocabMap]);


  useEffect(() => {
    localStorage.setItem("lingoarc_vocab_front", vocabFront);
  }, [vocabFront]);

  useEffect(() => {
    if (language) {
      localStorage.setItem("linguachat_language", language);
    }
  }, [language]);

  useEffect(() => {
    if (!authUser || !language) return;
    if (languageOptions.length && !languageOptions.includes(language)) {
      void saveLanguagePreference(language);
    }
  }, [authUser, language, languageOptions]);

  useEffect(() => {
    if (!language) return;
    if (authUser) {
      void loadUserVocab(language);
      return;
    }
    const savedStudy = localStorage.getItem("lingoarc_study_pack");
    if (!savedStudy) {
      setStudyPack(null);
    } else {
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
    }

    const savedScenarioVocab = localStorage.getItem("lingoarc_scenario_vocab");
    if (!savedScenarioVocab) {
      setScenarioVocabMap({});
      return;
    }
    try {
      const parsed = JSON.parse(savedScenarioVocab) as Record<string, StudyPack>;
      if (parsed && typeof parsed === "object") {
        const filtered: Record<string, StudyPack> = {};
        Object.entries(parsed).forEach(([key, value]) => {
          if (value?.language === language) {
            filtered[key] = value;
          }
        });
        setScenarioVocabMap(filtered);
      }
    } catch {
      setScenarioVocabMap({});
    }
  }, [authUser, language]);

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
      setLanguage(null);
      setLanguageOptions([]);
      setStudyPack(null);
      setScenarioVocabMap({});
      setProfileName("");
      return;
    }
    setAuthError(null);
    void fetchProgress();
    void loadProfile();
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

  async function loadProfile() {
    if (!authUser) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("username, languages, active_language")
      .eq("id", authUser.id)
      .single();

    if (error) {
      await ensureProfile(authUser.email || "user@lingoarc.local", username || "user");
      setLanguageOptions([]);
      if (language) {
        await saveLanguagePreference(language);
        setShowLanguageModal(false);
      } else {
        setShowLanguageModal(true);
      }
      return;
    }

    if (typeof data?.username === "string") {
      setProfileName(data.username);
    }

    const storedLanguages = Array.isArray(data?.languages) ? data?.languages : [];
    const normalizedLanguages = data?.active_language && !storedLanguages.includes(data.active_language)
      ? [...storedLanguages, data.active_language]
      : storedLanguages;
    setLanguageOptions(normalizedLanguages);
    if (data?.active_language) {
      setLanguage(data.active_language);
      setShowLanguageModal(false);
      return;
    }

    if (storedLanguages.length === 1) {
      await saveLanguagePreference(storedLanguages[0], storedLanguages);
      return;
    }

    const savedLanguage = localStorage.getItem("linguachat_language");
    if (savedLanguage) {
      await saveLanguagePreference(savedLanguage, storedLanguages);
      return;
    }

    if (!language) {
      setShowLanguageModal(true);
    }
  }

  async function saveLanguagePreference(value: string, existing?: string[]) {
    if (!authUser) return;
    const nextValue = value.trim();
    if (!nextValue) return;
    const nextLanguages = Array.from(new Set([...(existing ?? languageOptions), nextValue]));
    setLanguage(nextValue);
    setLanguageOptions(nextLanguages);
    setShowLanguageModal(false);
    setAddLanguageOpen(false);
    setNewLanguageInput("");
    await supabase.from("profiles").upsert({
      id: authUser.id,
      username: username || authUser.email?.split("@")[0] || "user",
      languages: nextLanguages,
      active_language: nextValue,
    });
    setProfileName(username || authUser.email?.split("@")[0] || "user");
  }

  async function loadUserVocab(activeLanguage: string) {
    if (!authUser) return;
    const { data, error } = await supabase
      .from("user_vocab")
      .select("scope, scenario_id, word_key, word, translation, starred, count, last_clicked")
      .eq("user_id", authUser.id)
      .eq("language", activeLanguage);

    if (error) {
      return;
    }

    const chatEntries: VocabEntry[] = [];
    const commonEntries: StudyEntry[] = [];
    const scenarioMap: Record<string, StudyPack> = {};

    (data || []).forEach((row) => {
      if (row.scope === "chat") {
        chatEntries.push({
          key: row.word_key,
          word: row.word,
          translation: row.translation,
          count: row.count || 1,
          lastClicked: row.last_clicked ? Date.parse(row.last_clicked) : Date.now(),
          starred: Boolean(row.starred),
        });
        return;
      }
      const entry = {
        word: row.word,
        translation: row.translation,
        starred: Boolean(row.starred),
      };
      if (row.scope === "common") {
        commonEntries.push(entry);
      } else if (row.scope === "scenario" && row.scenario_id) {
        if (!scenarioMap[row.scenario_id]) {
          scenarioMap[row.scenario_id] = { language: activeLanguage, entries: [] };
        }
        scenarioMap[row.scenario_id].entries.push(entry);
      }
    });

    setVocabEntries(chatEntries);
    if (commonEntries.length) {
      setStudyPack({ language: activeLanguage, entries: commonEntries });
    } else {
      setStudyPack(null);
    }
    setScenarioVocabMap(scenarioMap);
  }

  async function upsertUserVocab(rows: Array<{
    scope: "chat" | "common" | "scenario";
    scenarioId?: string | null;
    wordKey: string;
    word: string;
    translation: string;
    starred: boolean;
    count?: number;
    lastClicked?: number;
  }>) {
    if (!authUser || !language) return;
    if (!rows.length) return;
    const payload = rows.map((row) => ({
      user_id: authUser.id,
      language,
      scope: row.scope,
      scenario_id: row.scenarioId || null,
      word_key: row.wordKey,
      word: row.word,
      translation: row.translation,
      starred: row.starred,
      count: row.count ?? 1,
      last_clicked: new Date(row.lastClicked ?? Date.now()).toISOString(),
    }));
    await supabase.from("user_vocab").upsert(payload, {
      onConflict: "user_id,language,scope,scenario_id,word_key",
    });
  }

  async function deleteUserVocab(scope: "chat" | "common" | "scenario", wordKey: string, scenarioId?: string | null) {
    if (!authUser || !language) return;
    let query = supabase
      .from("user_vocab")
      .delete()
      .eq("user_id", authUser.id)
      .eq("language", language)
      .eq("scope", scope)
      .eq("word_key", wordKey);
    if (scenarioId) {
      query = query.eq("scenario_id", scenarioId);
    } else {
      query = query.is("scenario_id", null);
    }
    await query;
  }

  async function clearUserVocabScope(scope: "common" | "scenario", scenarioId?: string | null) {
    if (!authUser || !language) return;
    let query = supabase
      .from("user_vocab")
      .delete()
      .eq("user_id", authUser.id)
      .eq("language", language)
      .eq("scope", scope);
    if (scope === "scenario" && scenarioId) {
      query = query.eq("scenario_id", scenarioId);
    }
    await query;
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

  async function manualCompleteTask() {
    if (taskCompleted || taskChecking) return;
    setTaskCompleted(true);
    await handleTaskCompleted();
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
    sessionOverride?: string,
    continueDepth = 0
  ) {
    const activeSessionId = sessionOverride || (await ensureChatSession());
    if (!activeSessionId || !activeScenarioRef.current) return;

    const isStart = text === "__AI_START__" || text.startsWith("__AI_START__");
    const isContinue = text === "__AI_CONTINUE__";

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

      const shouldContinue = fullResponse.includes("[[NEXT]]");
      const cleanedResponse = fullResponse.replace(/\s*\[\[NEXT\]\]\s*$/g, "").trimEnd();
      if (cleanedResponse !== fullResponse) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: cleanedResponse }
              : msg
          )
        );
        messagesStateRef.current = messagesStateRef.current.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, content: cleanedResponse } : msg
        );
      }

      if (!isStart) {
        void requestFeedback(activeSessionId, messageId, text, previousAssistant);
        void checkTaskCompletion(messagesStateRef.current);
        if (shouldContinue && !isContinue && continueDepth < 1) {
          void sendMessageWithRetry("__AI_CONTINUE__", makeId(), "", 0, activeSessionId, continueDepth + 1);
        }
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

  function handleSendPointerDown() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
    }
    longPressTriggeredRef.current = false;
    setLongPressActive(true);
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setLongPressActive(false);
      void manualCompleteTask();
    }, 2000);
  }

  function handleSendPointerUp() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
    }
    setLongPressActive(false);
  }

  function handleSendClick() {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    void sendMessage();
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
    const existing = vocabEntries.find((entry) => entry.key === key);
    const nextCount = existing ? existing.count + 1 : 1;
    const nextStar = existing ? Boolean(existing.starred) : false;
    const nextClicked = Date.now();
    setVocabEntries((prev) => {
      const current = prev.find((entry) => entry.key === key);
      if (current) {
        return prev.map((entry) =>
          entry.key === key
            ? {
                ...entry,
                word,
                translation,
                count: nextCount,
                lastClicked: nextClicked,
                starred: entry.starred,
              }
            : entry
        );
      }
      return [
        ...prev,
        { key, word, translation, count: nextCount, lastClicked: nextClicked, starred: false },
      ];
    });

    void upsertUserVocab([
      {
        scope: "chat",
        scenarioId: null,
        wordKey: key,
        word,
        translation,
        starred: nextStar,
        count: nextCount,
        lastClicked: nextClicked,
      },
    ]);
  }

  function clearVocab() {
    setVocabEntries([]);
    setFlippedCards({});
  }

  function deleteVocabEntry(key: string) {
    const target = vocabEntries.find((entry) => entry.key === key);
    setVocabEntries((prev) => prev.filter((entry) => entry.key !== key));
    setFlippedCards((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (target) {
      void deleteUserVocab("chat", target.key);
    }
  }

  function toggleVocabStar(key: string) {
    const target = vocabEntries.find((entry) => entry.key === key);
    setVocabEntries((prev) =>
      prev.map((entry) =>
        entry.key === key ? { ...entry, starred: !entry.starred } : entry
      )
    );
    if (target) {
      void upsertUserVocab([
        {
          scope: "chat",
          scenarioId: null,
          wordKey: target.key,
          word: target.word,
          translation: target.translation,
          starred: !target.starred,
          count: target.count,
          lastClicked: target.lastClicked,
        },
      ]);
    }
  }

  function clearStudy() {
    setStudyPack(null);
    setStudyFlipped({});
    void clearUserVocabScope("common");
  }

  function toggleStudyStar(index: number) {
    const target = studyPack?.entries[index];
    setStudyPack((prev) => {
      if (!prev) return prev;
      const next = prev.entries.map((entry, i) =>
        i === index ? { ...entry, starred: !entry.starred } : entry
      );
      return { ...prev, entries: next };
    });
    if (target) {
      void upsertUserVocab([
        {
          scope: "common",
          scenarioId: null,
          wordKey: normalizeWord(target.word),
          word: target.word,
          translation: target.translation,
          starred: !target.starred,
          count: 1,
          lastClicked: Date.now(),
        },
      ]);
    }
  }

  function clearScenarioVocab() {
    if (!activeScenarioVocab) return;
    setScenarioVocabMap((prev) => {
      const next = { ...prev };
      delete next[activeScenarioVocab.id];
      return next;
    });
    setScenarioVocabFlipped({});
    void clearUserVocabScope("scenario", activeScenarioVocab.id);
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

  function toggleScenarioCard(index: number) {
    setScenarioVocabFlipped((prev) => ({
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

  function deleteStudyEntry(index: number) {
    const target = studyPack?.entries[index];
    setStudyPack((prev) => {
      if (!prev) return prev;
      const next = prev.entries.filter((_, i) => i !== index);
      return { ...prev, entries: next };
    });
    setStudyFlipped((prev) => {
      const next: Record<number, boolean> = {};
      Object.keys(prev).forEach((key) => {
        const idx = Number(key);
        if (Number.isNaN(idx) || idx === index) return;
        next[idx > index ? idx - 1 : idx] = prev[idx];
      });
      return next;
    });
    if (target) {
      void deleteUserVocab("common", normalizeWord(target.word));
    }
  }

  function toggleScenarioStar(index: number, scenarioId: string) {
    const target = scenarioVocabMap[scenarioId]?.entries[index];
    setScenarioVocabMap((prev) => {
      const current = prev[scenarioId];
      if (!current) return prev;
      const nextEntries = current.entries.map((entry, i) =>
        i === index ? { ...entry, starred: !entry.starred } : entry
      );
      return { ...prev, [scenarioId]: { ...current, entries: nextEntries } };
    });
    if (target) {
      void upsertUserVocab([
        {
          scope: "scenario",
          scenarioId,
          wordKey: normalizeWord(target.word),
          word: target.word,
          translation: target.translation,
          starred: !target.starred,
          count: 1,
          lastClicked: Date.now(),
        },
      ]);
    }
  }

  function deleteScenarioEntry(index: number) {
    if (!activeScenarioVocab) return;
    const scenarioId = activeScenarioVocab.id;
    const target = scenarioVocabMap[scenarioId]?.entries[index];
    setScenarioVocabMap((prev) => {
      const current = prev[scenarioId];
      if (!current) return prev;
      const nextEntries = current.entries.filter((_, i) => i !== index);
      return { ...prev, [scenarioId]: { ...current, entries: nextEntries } };
    });
    setScenarioVocabFlipped((prev) => {
      const next: Record<number, boolean> = {};
      Object.keys(prev).forEach((key) => {
        const idx = Number(key);
        if (Number.isNaN(idx) || idx === index) return;
        next[idx > index ? idx - 1 : idx] = prev[idx];
      });
      return next;
    });
    if (target) {
      void deleteUserVocab("scenario", normalizeWord(target.word), scenarioId);
    }
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
      const incoming = data.items.map((item) => ({ ...item, starred: item.starred ?? false }));

      setStudyPack((prev) => {
        const merged = [...(prev?.entries ?? []), ...incoming];
        return { language, entries: merged };
      });

      const rows = incoming
        .map((item) => ({
          scope: "common" as const,
          scenarioId: null,
          wordKey: normalizeWord(item.word),
          word: item.word,
          translation: item.translation,
          starred: Boolean(item.starred),
          count: 1,
          lastClicked: Date.now(),
        }))
        .filter((row) => row.wordKey);
      void upsertUserVocab(rows);
    } finally {
      setStudyLoading(false);
    }
  }

  async function generateScenarioWords(count: number, scenario: ScenarioDefinition) {
    if (!language || scenarioVocabLoading) return;
    setScenarioVocabLoading(true);
    try {
      const scenarioId = scenario.id;
      const existing = scenarioVocabMap[scenarioId]?.entries.map((entry) => entry.word) ?? [];
      const res = await fetch("/api/vocab-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          count,
          existing,
          scenarioTitle: scenario.title,
          scenarioDetail: scenario.subtitle,
          roleGuide: scenario.roleGuide,
          userRole: scenario.userRole,
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items: StudyEntry[] };
      if (!Array.isArray(data.items) || data.items.length === 0) return;
      const incoming = data.items.map((item) => ({ ...item, starred: item.starred ?? false }));

      setScenarioVocabMap((prev) => {
        const current = prev[scenarioId];
        const merged = [...(current?.entries ?? []), ...incoming];
        return { ...prev, [scenarioId]: { language, entries: merged } };
      });

      const rows = incoming
        .map((item) => ({
          scope: "scenario" as const,
          scenarioId,
          wordKey: normalizeWord(item.word),
          word: item.word,
          translation: item.translation,
          starred: Boolean(item.starred),
          count: 1,
          lastClicked: Date.now(),
        }))
        .filter((row) => row.wordKey);
      void upsertUserVocab(rows);
    } finally {
      setScenarioVocabLoading(false);
    }
  }

  const sortedVocab = useMemo(() => {
    return vocabEntries.slice().sort((a, b) => b.lastClicked - a.lastClicked);
  }, [vocabEntries]);

  const filteredVocab = useMemo(() => {
    if (!showStarredOnly) return sortedVocab;
    return sortedVocab.filter((entry) => entry.starred);
  }, [sortedVocab, showStarredOnly]);

  const dashboardCards = (
    <div className="scenario-grid">
      {SCENARIOS.map((scenario) => {
        const completedCount = progressMap[scenario.id] || 0;
        const progressRatio = Math.min(completedCount / TASKS_PER_SCENARIO, 1);
        const percent = Math.round(progressRatio * 100);
        const isDisabled = !language;
        return (
          <button
            key={scenario.id}
            type="button"
            className={`scenario-card ${completedCount >= TASKS_PER_SCENARIO ? "done" : ""}`}
            onClick={() => startScenarioChat(scenario)}
            disabled={isDisabled}
            title={isDisabled ? "Set a language first" : ""}
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

  const commonWordsView = (
    <section className="chat-shell">
      <div className="chat-header">
        <button type="button" className="ghost" onClick={() => setView("dashboard")}>
          Back
        </button>
        <div className="chat-title">
          <div className="chat-title-main">Common words</div>
          <div className="chat-title-sub">Build a foundation of everyday vocabulary.</div>
        </div>
      </div>
      <div className="task-banner">
        <div className="task-label">Study list</div>
        <div className="task-text">
          {studyPack?.entries.length ? `${studyPack.entries.length} words ready` : "Generate a list to begin."}
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
        <button
          type="button"
          className="ghost"
          onClick={() => setShowStudyStarredOnly((prev) => !prev)}
        >
          {showStudyStarredOnly ? "Show all" : "Starred only"}
        </button>
      </div>
      {!language ? (
        <p className="dashboard-alert">Set a language above to generate vocabulary.</p>
      ) : !studyPack || studyPack.entries.length === 0 ? (
        <div className="home-vocab-empty">Generate a list to start studying.</div>
      ) : studyMode === "list" ? (
        <div className="vocab-list">
          {(showStudyStarredOnly
            ? studyPack.entries.map((entry, index) => ({ entry, index })).filter((item) => item.entry.starred)
            : studyPack.entries.map((entry, index) => ({ entry, index }))
          ).map(({ entry, index }) => (
            <div key={`${entry.word}-${index}`} className="vocab-row">
              <div className="vocab-word">{entry.word}</div>
              <div className="vocab-translation">{entry.translation}</div>
              <div className="vocab-actions">
                <button type="button" className="ghost" onClick={() => toggleStudyStar(index)}>
                  {entry.starred ? "Unstar" : "Star"}
                </button>
                <button type="button" className="ghost" onClick={() => deleteStudyEntry(index)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="vocab-cards">
          {(showStudyStarredOnly
            ? studyPack.entries.map((entry, index) => ({ entry, index })).filter((item) => item.entry.starred)
            : studyPack.entries.map((entry, index) => ({ entry, index }))
          ).map(({ entry, index }) => {
            const flipped = Boolean(studyFlipped[index]);
            const frontText = studyFront === "word" ? entry.word : entry.translation;
            const backText = studyFront === "word" ? entry.translation : entry.word;
            return (
                <div key={`${entry.word}-${index}`} className="vocab-card-wrap">
                  <div
                    className={`vocab-card ${flipped ? "flipped" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleStudyCard(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleStudyCard(index);
                      }
                    }}
                    aria-pressed={flipped ? "true" : "false"}
                  >
                    <div className="vocab-card-actions">
                      <button
                        type="button"
                        className={`vocab-card-icon ${entry.starred ? "active" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleStudyStar(index);
                        }}
                        aria-label="Star"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M12 3.5l2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6L3.27 9.85l6.03-.88L12 3.5z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="vocab-card-icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteStudyEntry(index);
                        }}
                        aria-label="Delete"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M6 6l12 12M18 6L6 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="vocab-card-face">
                      <div className={flipped ? "vocab-card-translation" : "vocab-card-word"}>
                        {flipped ? backText : frontText}
                      </div>
                      <div className="vocab-card-hint">
                        {flipped ? "Tap to hide" : "Tap to flip"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </section>
  );

  const scenarioVocabView = (
    <section className="chat-shell">
      <div className="chat-header">
        <button type="button" className="ghost" onClick={() => setView("dashboard")}>
          Back
        </button>
        <div className="chat-title">
          <div className="chat-title-main">Scenario vocabulary</div>
          <div className="chat-title-sub">Pick a scenario to study its words.</div>
        </div>
      </div>
      <div className="scenario-grid">
        {SCENARIOS.map((scenario) => {
          const count = scenarioVocabMap[scenario.id]?.entries.length || 0;
          return (
            <button
              key={scenario.id}
              type="button"
              className="scenario-card"
              onClick={() => {
                setActiveScenarioVocab(scenario);
                setScenarioVocabFlipped({});
                setView("scenario-detail");
              }}
            >
              <div className="scenario-card-header">
                <div className="scenario-card-title">{scenario.title}</div>
                <div className="scenario-ring">
                  <div className="scenario-ring-inner">{count}</div>
                </div>
              </div>
              <div className="scenario-card-body">{scenario.subtitle}</div>
            </button>
          );
        })}
      </div>
    </section>
  );

  const scenarioDetailView = activeScenarioVocab ? (
    <section className="chat-shell">
      <div className="chat-header">
        <button type="button" className="ghost" onClick={() => setView("scenario-vocab")}>
          Back
        </button>
        <div className="chat-title">
          <div className="chat-title-main">{activeScenarioVocab.title} vocabulary</div>
          <div className="chat-title-sub">{activeScenarioVocab.subtitle}</div>
        </div>
      </div>
      <div className="task-banner">
        <div className="task-label">Scenario words</div>
        <div className="task-text">
          {scenarioVocabMap[activeScenarioVocab.id]?.entries.length
            ? `${scenarioVocabMap[activeScenarioVocab.id].entries.length} words ready`
            : "Generate a list to begin."}
        </div>
        <div className="home-vocab-actions">
          <button
            type="button"
            className="ghost"
            onClick={() => generateScenarioWords(20, activeScenarioVocab)}
            disabled={!language || scenarioVocabLoading}
          >
            {scenarioVocabLoading ? "Generating" : "Generate 20"}
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => generateScenarioWords(10, activeScenarioVocab)}
            disabled={!language || scenarioVocabLoading}
          >
            {scenarioVocabLoading ? "Generating" : "Generate 10 more"}
          </button>
          <button type="button" className="ghost" onClick={clearScenarioVocab}>
            Clear
          </button>
        </div>
      </div>
      <div className="home-vocab-controls">
        <div className="segmented">
          <button
            type="button"
            className={`segmented-btn ${scenarioVocabMode === "list" ? "active" : ""}`}
            onClick={() => setScenarioVocabMode("list")}
          >
            List
          </button>
          <button
            type="button"
            className={`segmented-btn ${scenarioVocabMode === "cards" ? "active" : ""}`}
            onClick={() => setScenarioVocabMode("cards")}
          >
            Flashcards
          </button>
        </div>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setScenarioVocabFront((prev) => (prev === "word" ? "translation" : "word"));
            setScenarioVocabFlipped({});
          }}
        >
          Start: {scenarioVocabFront === "word" ? "Target" : "English"}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => setShowScenarioStarredOnly((prev) => !prev)}
        >
          {showScenarioStarredOnly ? "Show all" : "Starred only"}
        </button>
      </div>
      {!language ? (
        <p className="dashboard-alert">Set a language above to generate vocabulary.</p>
      ) : scenarioVocabMap[activeScenarioVocab.id]?.entries?.length ? (
        scenarioVocabMode === "list" ? (
          <div className="vocab-list">
            {(showScenarioStarredOnly
              ? scenarioVocabMap[activeScenarioVocab.id].entries
                  .map((entry, index) => ({ entry, index }))
                  .filter((item) => item.entry.starred)
              : scenarioVocabMap[activeScenarioVocab.id].entries.map((entry, index) => ({ entry, index }))
            ).map(({ entry, index }) => (
              <div key={`${entry.word}-${index}`} className="vocab-row">
                <div className="vocab-word">{entry.word}</div>
                <div className="vocab-translation">{entry.translation}</div>
                <div className="vocab-actions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => toggleScenarioStar(index, activeScenarioVocab.id)}
                  >
                    {entry.starred ? "Unstar" : "Star"}
                  </button>
                  <button type="button" className="ghost" onClick={() => deleteScenarioEntry(index)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="vocab-cards">
            {(showScenarioStarredOnly
              ? scenarioVocabMap[activeScenarioVocab.id].entries
                  .map((entry, index) => ({ entry, index }))
                  .filter((item) => item.entry.starred)
              : scenarioVocabMap[activeScenarioVocab.id].entries.map((entry, index) => ({ entry, index }))
            ).map(({ entry, index }) => {
              const flipped = Boolean(scenarioVocabFlipped[index]);
              const frontText = scenarioVocabFront === "word" ? entry.word : entry.translation;
              const backText = scenarioVocabFront === "word" ? entry.translation : entry.word;
              return (
                <div key={`${entry.word}-${index}`} className="vocab-card-wrap">
                  <div
                    className={`vocab-card ${flipped ? "flipped" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleScenarioCard(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleScenarioCard(index);
                      }
                    }}
                    aria-pressed={flipped ? "true" : "false"}
                  >
                    <div className="vocab-card-actions">
                      <button
                        type="button"
                        className={`vocab-card-icon ${entry.starred ? "active" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleScenarioStar(index, activeScenarioVocab.id);
                        }}
                        aria-label="Star"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M12 3.5l2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6L3.27 9.85l6.03-.88L12 3.5z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="vocab-card-icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteScenarioEntry(index);
                        }}
                        aria-label="Delete"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M6 6l12 12M18 6L6 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="vocab-card-face">
                      <div className={flipped ? "vocab-card-translation" : "vocab-card-word"}>
                        {flipped ? backText : frontText}
                      </div>
                      <div className="vocab-card-hint">
                        {flipped ? "Tap to hide" : "Tap to flip"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="home-vocab-empty">Generate words for this scenario.</div>
      )}
    </section>
  ) : null;

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
        <button
          type="button"
          className={`solid ${longPressActive ? "pressing" : ""}`}
          onClick={handleSendClick}
          onPointerDown={handleSendPointerDown}
          onPointerUp={handleSendPointerUp}
          onPointerLeave={handleSendPointerUp}
          onPointerCancel={handleSendPointerUp}
        >
          {longPressActive ? "Hold to complete" : "Send"}
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
              <select
                value={language || ""}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "__add__") {
                    setAddLanguageOpen(true);
                    return;
                  }
                  setAddLanguageOpen(false);
                  if (value) {
                    void saveLanguagePreference(value);
                  }
                }}
              >
                {languageOptions.length === 0 ? (
                  <option value="">Select language</option>
                ) : null}
                {languageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value="__add__">+ Add new language</option>
              </select>
              {addLanguageOpen ? (
                <div className="language-add">
                  <input
                    type="text"
                    value={newLanguageInput}
                    onChange={(event) => setNewLanguageInput(event.target.value)}
                    placeholder="Add language"
                  />
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => void saveLanguagePreference(newLanguageInput)}
                  >
                    Save
                  </button>
                </div>
              ) : null}
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
            <div className="logged-in">
              Logged in as {profileName || username || authUser.email}
            </div>
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
                  <p>Jump into learning with common words and scenario vocab.</p>
                </div>
              </div>
              <div className="scenario-grid">
                <button type="button" className="scenario-card" onClick={() => setView("common")}>
                  <div className="scenario-card-header">
                    <div className="scenario-card-title">Common words</div>
                  </div>
                  <div className="scenario-card-body">Top 30 everyday words. Generate more anytime.</div>
                </button>
                <button
                  type="button"
                  className="scenario-card"
                  onClick={() => setView("scenario-vocab")}
                >
                  <div className="scenario-card-header">
                    <div className="scenario-card-title">Scenario vocabulary</div>
                  </div>
                  <div className="scenario-card-body">Browse and generate words per scenario.</div>
                </button>
              </div>
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
        ) : view === "common" ? (
          commonWordsView
        ) : view === "scenario-vocab" ? (
          scenarioVocabView
        ) : view === "scenario-detail" ? (
          scenarioDetailView
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

      {showLanguageModal && authUser ? (
        <div className="vocab-modal-overlay" onClick={() => {}}>
          <div className="vocab-modal" onClick={(event) => event.stopPropagation()}>
            <div className="vocab-modal-header">
              <div className="vocab-title">Choose your language</div>
            </div>
            <div className="vocab-modal-body">
              {languageOptions.length ? (
                <div className="vocab-list">
                  {languageOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="vocab-row"
                      onClick={() => void saveLanguagePreference(option)}
                    >
                      <div className="vocab-word">{option}</div>
                      <div className="vocab-translation">Select</div>
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="language-add">
                <input
                  type="text"
                  value={newLanguageInput}
                  onChange={(event) => setNewLanguageInput(event.target.value)}
                  placeholder="Add a language"
                />
                <button
                  type="button"
                  className="solid"
                  onClick={() => void saveLanguagePreference(newLanguageInput)}
                >
                  Save
                </button>
              </div>
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
                <button
                  type="button"
                  className="ghost vocab-tab"
                  onClick={() => setShowStarredOnly((prev) => !prev)}
                >
                  {showStarredOnly ? "Show all" : "Starred only"}
                </button>
                <button type="button" className="ghost vocab-clear" onClick={clearVocab}>
                  Clear
                </button>
              </div>
            </div>
            <div className="vocab-modal-body">
              {filteredVocab.length === 0 ? (
                <div className="vocab-empty">Click words in the chat to save them here.</div>
              ) : vocabMode === "list" ? (
                <div className="vocab-list">
                  {filteredVocab.map((entry) => (
                      <div key={entry.key} className="vocab-row">
                        <div className="vocab-word">{entry.word}</div>
                        <div className="vocab-translation">{entry.translation}</div>
                        <div className="vocab-actions">
                          <button type="button" className="ghost" onClick={() => toggleVocabStar(entry.key)}>
                            {entry.starred ? "Unstar" : "Star"}
                          </button>
                          <span className="vocab-count">x{entry.count}</span>
                          <button type="button" className="ghost" onClick={() => deleteVocabEntry(entry.key)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="vocab-cards">
                  {filteredVocab.map((entry) => {
                      const flipped = Boolean(flippedCards[entry.key]);
                      const frontText = vocabFront === "word" ? entry.word : entry.translation;
                      const backText = vocabFront === "word" ? entry.translation : entry.word;
                      return (
                        <div key={entry.key} className="vocab-card-wrap">
                          <div
                            className={`vocab-card ${flipped ? "flipped" : ""}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleCard(entry.key)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                toggleCard(entry.key);
                              }
                            }}
                            aria-pressed={flipped ? "true" : "false"}
                          >
                            <div className="vocab-card-actions">
                              <button
                                type="button"
                                className={`vocab-card-icon ${entry.starred ? "active" : ""}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleVocabStar(entry.key);
                                }}
                                aria-label="Star"
                              >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                  <path
                                    d="M12 3.5l2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6L3.27 9.85l6.03-.88L12 3.5z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="vocab-card-icon"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteVocabEntry(entry.key);
                                }}
                                aria-label="Delete"
                              >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                  <path
                                    d="M6 6l12 12M18 6L6 18"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </button>
                            </div>
                            <div className="vocab-card-face">
                              <div className={flipped ? "vocab-card-translation" : "vocab-card-word"}>
                                {flipped ? backText : frontText}
                              </div>
                              <div className="vocab-card-hint">
                                {flipped ? "Tap to hide" : "Tap to flip"}
                              </div>
                            </div>
                          </div>
                        </div>
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
