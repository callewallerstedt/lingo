"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Difficulty } from "../lib/store";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { SCENARIOS, type ScenarioDefinition } from "../lib/scenarios";
import {
  SURGE_PROGRESS_KEY_PREFIX,
  SURGE_SESSION_KEY,
  createEmptySurgeSession,
  dedupeSurgeItems,
  getDirectionForStage,
  getNextReviewAtForStage,
  normalizeSurgeAnswer,
  normalizeSurgeKey,
  shuffleList,
  uniqueStrings,
  type SurgeDirection,
  type SurgeItem,
  type SurgePhase,
  type SurgeProgressRecord,
  type SurgeSession,
  type SurgeStatus,
} from "../lib/surge";

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
  archived?: boolean;
};

type StudyEntry = {
  word: string;
  translation: string;
  starred?: boolean;
  archived?: boolean;
};

type StudyPack = {
  language: string;
  entries: StudyEntry[];
  archived?: boolean;
};

type ProgressMap = Record<string, number>;

type SuggestionPayload = {
  suggestion: string;
};

type VocabScope = "chat" | "common" | "scenario" | "topic" | "surge" | "example";
type ExampleScope = "chat" | "common" | "scenario" | "topic";
type ThemeMode = "dark" | "light";
type ChatMode = "scenario" | "buddy";

type ExampleItem = {
  label: string;
  sentence: string;
  translation: string;
};

type BuddyProfileSnapshot = {
  summary: string;
  knownItems: string[];
  learningItems: string[];
  recentItems: string[];
  scenarioProgress: string[];
  knownCount: number;
  learningCount: number;
  recentCount: number;
  dueCount: number;
  masteredCount: number;
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
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const [language, setLanguage] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [loadingProgress, setLoadingProgress] = useState<boolean>(false);

  const [view, setView] = useState<
    "dashboard" | "chat" | "common" | "scenario-vocab" | "scenario-detail" | "topic-detail" | "surge"
  >("dashboard");
  const [activeScenario, setActiveScenario] = useState<ScenarioDefinition | null>(null);
  const [taskText, setTaskText] = useState<string>("");
  const [taskLoading, setTaskLoading] = useState<boolean>(false);
  const [taskChecking, setTaskChecking] = useState<boolean>(false);
  const [taskCompleted, setTaskCompleted] = useState<boolean>(false);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [rewardPoints, setRewardPoints] = useState<number>(0);
  const [chatMode, setChatMode] = useState<ChatMode>("scenario");

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
  const [topicVocabMap, setTopicVocabMap] = useState<Record<string, StudyPack>>({});
  const [topicVocabMode, setTopicVocabMode] = useState<"list" | "cards">("list");
  const [topicVocabFront, setTopicVocabFront] = useState<"word" | "translation">("word");
  const [topicVocabFlipped, setTopicVocabFlipped] = useState<Record<number, boolean>>({});
  const [topicVocabLoading, setTopicVocabLoading] = useState<boolean>(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [showTopicStarredOnly, setShowTopicStarredOnly] = useState<boolean>(false);
  const [showTopicModal, setShowTopicModal] = useState<boolean>(false);
  const [topicInput, setTopicInput] = useState<string>("");
  const [exampleMap, setExampleMap] = useState<Record<string, ExampleItem[]>>({});
  const [exampleLoading, setExampleLoading] = useState<Record<string, boolean>>({});
  const [speechLoadingKey, setSpeechLoadingKey] = useState<string | null>(null);
  const [speechPlayingKey, setSpeechPlayingKey] = useState<string | null>(null);
  const [exampleModal, setExampleModal] = useState<{
    word: string;
    items: ExampleItem[];
    scope: ExampleScope;
    scenarioId?: string | null;
  } | null>(null);
  const [scenarioVocabMap, setScenarioVocabMap] = useState<Record<string, StudyPack>>({});
  const [scenarioVocabMode, setScenarioVocabMode] = useState<"list" | "cards">("list");
  const [scenarioVocabFront, setScenarioVocabFront] = useState<"word" | "translation">("word");
  const [scenarioVocabFlipped, setScenarioVocabFlipped] = useState<Record<number, boolean>>({});
  const [scenarioVocabLoading, setScenarioVocabLoading] = useState<boolean>(false);
  const [activeScenarioVocab, setActiveScenarioVocab] = useState<ScenarioDefinition | null>(null);
  const [showStarredOnly, setShowStarredOnly] = useState<boolean>(false);
  const [showStudyStarredOnly, setShowStudyStarredOnly] = useState<boolean>(false);
  const [showStudyArchivedOnly, setShowStudyArchivedOnly] = useState<boolean>(false);
  const [showScenarioStarredOnly, setShowScenarioStarredOnly] = useState<boolean>(false);
  const [holdDeleteId, setHoldDeleteId] = useState<string | null>(null);
  const [surgeProgressMap, setSurgeProgressMap] = useState<Record<string, SurgeProgressRecord>>({});
  const [surgeSession, setSurgeSession] = useState<SurgeSession | null>(null);
  const [surgeLoading, setSurgeLoading] = useState<boolean>(false);
  const [surgeError, setSurgeError] = useState<string | null>(null);
  const [surgeSavedAt, setSurgeSavedAt] = useState<number>(0);

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const surgeInputRef = useRef<HTMLInputElement | null>(null);
  const surgeTypingPanelRef = useRef<HTMLDivElement | null>(null);
  const activeTargetRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const ignoreWindowClickRef = useRef<boolean>(false);
  const messagesStateRef = useRef<Message[]>([]);
  const activeScenarioRef = useRef<ScenarioDefinition | null>(null);
  const chatModeRef = useRef<ChatMode>("scenario");
  const buddyProfileRef = useRef<BuddyProfileSnapshot | null>(null);
  const taskRef = useRef<string>("");
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);
  const archiveTimerRef = useRef<number | null>(null);
  const archiveTriggeredRef = useRef<boolean>(false);
  const speechCacheRef = useRef<Map<string, string>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const uiAudioContextRef = useRef<AudioContext | null>(null);

  const clientCache = useMemo(() => new Map<string, string>(), []);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("linguachat_language");
    const savedVocab = localStorage.getItem("lingoarc_vocab");
    const savedFront = localStorage.getItem("lingoarc_vocab_front");
    const savedStudy = localStorage.getItem("lingoarc_study_pack");
    const savedScenarioVocab = localStorage.getItem("lingoarc_scenario_vocab");
    const savedTopicVocab = localStorage.getItem("lingoarc_topic_vocab");
    const savedUsername = localStorage.getItem("lingoarc_username");
    const savedTheme = localStorage.getItem("lingoarc_theme");
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
    if (savedTopicVocab) {
      try {
        const parsed = JSON.parse(savedTopicVocab) as Record<string, StudyPack>;
        if (parsed && typeof parsed === "object") {
          setTopicVocabMap(parsed);
        }
      } catch {
        // Ignore malformed topic vocab cache
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
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      speechCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      speechCacheRef.current.clear();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("lingoarc_theme", theme);
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    messagesStateRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeScenarioRef.current = activeScenario;
  }, [activeScenario]);

  useEffect(() => {
    chatModeRef.current = chatMode;
  }, [chatMode]);

  useEffect(() => {
    taskRef.current = taskText;
  }, [taskText]);

  function formatBuddyFocusItem(text: string, translation: string) {
    const nextText = text.trim();
    const nextTranslation = translation.trim();
    if (!nextText) return "";
    return nextTranslation ? `${nextText} = ${nextTranslation}` : nextText;
  }

  function pushBuddyUnique(items: string[], value: string) {
    const nextValue = value.trim();
    if (!nextValue || items.includes(nextValue)) {
      return;
    }
    items.push(nextValue);
  }

  const buddyProfileSnapshot = useMemo<BuddyProfileSnapshot>(() => {
    const knownItems: string[] = [];
    const learningItems: string[] = [];
    const recentItems: string[] = [];
    const scenarioProgress = SCENARIOS
      .map((scenario) => ({
        title: scenario.title,
        count: progressMap[scenario.id] || 0,
      }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .map((entry) => `${entry.title} ${entry.count}/${TASKS_PER_SCENARIO}`)
      .slice(0, 6);

    const surgeRecords = Object.values(surgeProgressMap).sort((a, b) => {
      const aScore = (a.status === "known" ? 100 : 0) + a.stage;
      const bScore = (b.status === "known" ? 100 : 0) + b.stage;
      return bScore - aScore;
    });

    surgeRecords.forEach((record) => {
      const formatted = formatBuddyFocusItem(record.itemText, record.translation);
      if (!formatted) return;
      if (record.status === "known" || record.stage >= 6) {
        pushBuddyUnique(knownItems, formatted);
        return;
      }
      pushBuddyUnique(learningItems, formatted);
    });

    const savedEntries: Array<StudyEntry | VocabEntry> = [
      ...vocabEntries.filter((entry) => !entry.archived),
      ...(studyPack?.entries.filter((entry) => !entry.archived) ?? []),
      ...Object.values(scenarioVocabMap).flatMap((pack) => pack.entries.filter((entry) => !entry.archived)),
      ...Object.values(topicVocabMap).flatMap((pack) => pack.entries.filter((entry) => !entry.archived)),
    ];

    savedEntries.forEach((entry) => {
      const formatted = formatBuddyFocusItem(entry.word, entry.translation);
      if (!formatted) return;
      if (entry.starred) {
        pushBuddyUnique(knownItems, formatted);
        return;
      }
      pushBuddyUnique(learningItems, formatted);
    });

    dedupeSurgeItems([
      ...(surgeSession?.activeRound ?? []),
      ...(surgeSession?.reviewQueue ?? []),
      ...(surgeSession?.typingQueue ?? []),
      ...((surgeSession?.delayedReviewQueue ?? []).map((entry) => entry.item)),
    ]).forEach((item) => {
      pushBuddyUnique(recentItems, formatBuddyFocusItem(item.text, item.translation));
    });

    (surgeSession?.recentlySeen ?? []).forEach((itemKey) => {
      const record = surgeProgressMap[itemKey];
      if (!record) return;
      pushBuddyUnique(recentItems, formatBuddyFocusItem(record.itemText, record.translation));
    });

    const dueCount = surgeRecords.filter(
      (record) => record.status !== "known" && Boolean(record.nextReviewAt) && (record.nextReviewAt || 0) <= Date.now()
    ).length;
    const masteredCount = surgeRecords.filter(
      (record) => record.status === "known" || record.stage >= 6
    ).length;

    const summary = [
      `Learner: ${profileName || username || "Learner"}.`,
      language ? `Target language: ${language}.` : "",
      difficulty ? `Difficulty: ${difficulty}.` : "",
      knownItems.length ? `Strong items: ${knownItems.slice(0, 12).join("; ")}.` : "Strong items: none marked strong yet.",
      learningItems.length ? `Current learning items: ${learningItems.slice(0, 14).join("; ")}.` : "Current learning items: just getting started.",
      recentItems.length ? `Recently practiced: ${recentItems.slice(0, 8).join("; ")}.` : "",
      scenarioProgress.length ? `Scenario progress: ${scenarioProgress.join("; ")}.` : "",
      `Surge due now: ${dueCount}. Surge mastered: ${masteredCount}.`,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      summary,
      knownItems: knownItems.slice(0, 16),
      learningItems: learningItems.slice(0, 20),
      recentItems: recentItems.slice(0, 10),
      scenarioProgress,
      knownCount: knownItems.length,
      learningCount: learningItems.length,
      recentCount: recentItems.length,
      dueCount,
      masteredCount,
    };
  }, [
    difficulty,
    language,
    profileName,
    progressMap,
    scenarioVocabMap,
    studyPack,
    surgeProgressMap,
    surgeSession,
    topicVocabMap,
    username,
    vocabEntries,
  ]);

  useEffect(() => {
    buddyProfileRef.current = buddyProfileSnapshot;
  }, [buddyProfileSnapshot]);

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
    localStorage.setItem("lingoarc_topic_vocab", JSON.stringify(topicVocabMap));
  }, [topicVocabMap]);

  useEffect(() => {
    if (!language) {
      return;
    }
    if (!surgeSession || surgeSession.language !== language) {
      localStorage.removeItem(SURGE_SESSION_KEY);
      return;
    }
    localStorage.setItem(SURGE_SESSION_KEY, JSON.stringify(surgeSession));
  }, [language, surgeSession]);

  useEffect(() => {
    if (!language) return;
    localStorage.setItem(
      `${SURGE_PROGRESS_KEY_PREFIX}${language}`,
      JSON.stringify(surgeProgressMap)
    );
  }, [language, surgeProgressMap]);


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
    const savedSurgeProgress = localStorage.getItem(`${SURGE_PROGRESS_KEY_PREFIX}${language}`);
    if (savedSurgeProgress) {
      try {
        const parsed = JSON.parse(savedSurgeProgress) as Record<string, SurgeProgressRecord>;
        if (parsed && typeof parsed === "object") {
          setSurgeProgressMap(parsed);
        }
      } catch {
        setSurgeProgressMap({});
      }
    } else {
      setSurgeProgressMap({});
    }

    if (authUser) {
      void loadUserVocab(language);
      void loadSurgeProgress(language);
      const savedSession = localStorage.getItem(SURGE_SESSION_KEY);
      if (!savedSession) {
        setSurgeSession(null);
      } else {
        try {
          const parsed = JSON.parse(savedSession) as SurgeSession;
          if (parsed && parsed.language === language) {
            setSurgeSession({
              ...createEmptySurgeSession(language),
              ...parsed,
              language,
              activeRound: Array.isArray(parsed.activeRound) ? parsed.activeRound : [],
              reserve: Array.isArray(parsed.reserve) ? parsed.reserve : [],
              reviewQueue: Array.isArray(parsed.reviewQueue) ? parsed.reviewQueue : [],
              typingQueue: Array.isArray(parsed.typingQueue) ? parsed.typingQueue : [],
              delayedReviewQueue: Array.isArray(parsed.delayedReviewQueue) ? parsed.delayedReviewQueue : [],
              recentlySeen: Array.isArray(parsed.recentlySeen) ? parsed.recentlySeen : [],
              previewSeenKeys: Array.isArray(parsed.previewSeenKeys) ? parsed.previewSeenKeys : [],
              matchTargets: Array.isArray(parsed.matchTargets) ? parsed.matchTargets : [],
              matchTranslations: Array.isArray(parsed.matchTranslations) ? parsed.matchTranslations : [],
              matchedKeys: Array.isArray(parsed.matchedKeys) ? parsed.matchedKeys : [],
            });
          } else {
            localStorage.removeItem(SURGE_SESSION_KEY);
            setSurgeSession(null);
          }
        } catch {
          localStorage.removeItem(SURGE_SESSION_KEY);
          setSurgeSession(null);
        }
      }
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
    } else {
      try {
        const parsed = JSON.parse(savedScenarioVocab) as Record<string, StudyPack>;
        if (parsed && typeof parsed === "object") {
          const filtered: Record<string, StudyPack> = {};
          Object.entries(parsed).forEach(([key, value]) => {
            if (value?.language === language) {
              const mergedEntries = mergeUniqueEntries([], value.entries || []).merged;
              filtered[key] = {
                ...value,
                entries: mergedEntries,
                archived: mergedEntries.length ? mergedEntries.every((entry) => entry.archived) : false,
              };
            }
          });
          setScenarioVocabMap(filtered);
        }
      } catch {
        setScenarioVocabMap({});
      }
    }

    const savedTopicVocab = localStorage.getItem("lingoarc_topic_vocab");
    if (!savedTopicVocab) {
      setTopicVocabMap({});
      return;
    }
    try {
      const parsed = JSON.parse(savedTopicVocab) as Record<string, StudyPack>;
      if (parsed && typeof parsed === "object") {
        const filtered: Record<string, StudyPack> = {};
        Object.entries(parsed).forEach(([key, value]) => {
          if (value?.language === language) {
            filtered[key] = {
              ...value,
              entries: mergeUniqueEntries([], value.entries || []).merged,
            };
          }
        });
        setTopicVocabMap(filtered);
      }
    } catch {
      setTopicVocabMap({});
    }
    setSurgeProgressMap({});
    setSurgeSession(null);
  }, [authUser, language]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      setAuthError("Missing Supabase config. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;
    const authTimeout = window.setTimeout(() => {
      if (!isMounted) return;
      setAuthLoading(false);
      setAuthError((prev) => prev || "Authentication timed out. Supabase may still be waking up. Refresh and try again.");
    }, 12000);

    const clearAuthTimeout = () => window.clearTimeout(authTimeout);

    const loadAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        setAuthUser(data.session?.user ?? null);
      } catch {
        if (!isMounted) return;
        setAuthError("Failed to initialize authentication. Check your Supabase environment variables.");
      } finally {
        clearAuthTimeout();
        if (!isMounted) return;
        setAuthLoading(false);
      }
    };

    void loadAuth();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      clearAuthTimeout();
      if (!isMounted) return;
      setAuthUser(session?.user ?? null);
      setAuthLoading(false);
    });
    unsubscribe = () => data.subscription.unsubscribe();

    return () => {
      isMounted = false;
      clearAuthTimeout();
      unsubscribe?.();
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
      setTopicVocabMap({});
      setSurgeProgressMap({});
      setSurgeSession(null);
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
    if (!isSupabaseConfigured) {
      setAuthError("Missing Supabase config. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");
      return;
    }
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
      .select("scope, scenario_id, word_key, word, translation, starred, count, last_clicked, archived")
      .eq("user_id", authUser.id)
      .eq("language", activeLanguage);

    if (error) {
      return;
    }

    const chatEntries: VocabEntry[] = [];
    const commonEntries: StudyEntry[] = [];
    const scenarioMap: Record<string, StudyPack> = {};
    const topicMap: Record<string, StudyPack> = {};

    (data || []).forEach((row) => {
      const isArchived = Boolean(row.archived);
      if (row.scope === "chat") {
        chatEntries.push({
          key: row.word_key,
          word: row.word,
          translation: row.translation,
          count: row.count || 1,
          lastClicked: row.last_clicked ? Date.parse(row.last_clicked) : Date.now(),
          starred: Boolean(row.starred),
          archived: Boolean(row.archived),
        });
        return;
      }
      const entry = {
        word: row.word,
        translation: row.translation,
        starred: Boolean(row.starred),
        archived: Boolean(row.archived),
      };
      if (row.scope === "common") {
        commonEntries.push(entry);
      } else if (row.scope === "scenario" && row.scenario_id) {
        if (!scenarioMap[row.scenario_id]) {
          scenarioMap[row.scenario_id] = { language: activeLanguage, entries: [], archived: false };
        }
        scenarioMap[row.scenario_id].entries.push(entry);
      } else if (row.scope === "topic" && row.scenario_id) {
        if (!topicMap[row.scenario_id]) {
          topicMap[row.scenario_id] = { language: activeLanguage, entries: [] };
        }
        topicMap[row.scenario_id].entries.push(entry);
      }
    });

    setVocabEntries(chatEntries);
    const dedupedCommon = mergeUniqueEntries([], commonEntries).merged;
    if (dedupedCommon.length) {
      setStudyPack({ language: activeLanguage, entries: dedupedCommon });
    } else {
      setStudyPack(null);
    }
    const dedupedScenarioMap: Record<string, StudyPack> = {};
    Object.entries(scenarioMap).forEach(([key, pack]) => {
      dedupedScenarioMap[key] = {
        ...pack,
        entries: mergeUniqueEntries([], pack.entries).merged,
      };
    });
    Object.values(dedupedScenarioMap).forEach((pack) => {
      pack.archived = pack.entries.length ? pack.entries.every((entry) => entry.archived) : false;
    });
    setScenarioVocabMap(dedupedScenarioMap);
    const dedupedTopicMap: Record<string, StudyPack> = {};
    Object.entries(topicMap).forEach(([key, pack]) => {
      dedupedTopicMap[key] = {
        ...pack,
        entries: mergeUniqueEntries([], pack.entries).merged,
      };
    });
    setTopicVocabMap(dedupedTopicMap);
  }

  async function loadSurgeProgress(activeLanguage: string) {
    if (!authUser) return;
    const { data, error } = await supabase
      .from("surge_progress")
      .select(
        "item_key, item_text, translation, item_type, status, stage, times_seen, times_correct, last_result, last_direction, last_reviewed_at, next_review_at, created_at, updated_at"
      )
      .eq("user_id", authUser.id)
      .eq("language", activeLanguage);

    if (error) {
      return;
    }

    const nextMap: Record<string, SurgeProgressRecord> = {};
    (data || []).forEach((row) => {
      if (!row.item_key) return;
      nextMap[row.item_key] = {
        itemKey: row.item_key,
        itemText: row.item_text,
        translation: row.translation,
        itemType: row.item_type === "phrase" ? "phrase" : "word",
        status: row.status === "known" ? "known" : "learning",
        stage: Number.isFinite(row.stage) ? Math.max(0, Math.min(6, Number(row.stage))) : 0,
        timesSeen: Number(row.times_seen) || 0,
        timesCorrect: Number(row.times_correct) || 0,
        lastResult: row.last_result === "wrong" ? "wrong" : row.last_result === "correct" ? "correct" : null,
        lastDirection:
          row.last_direction === "english_to_target" || row.last_direction === "target_to_english"
            ? row.last_direction
            : null,
        lastReviewedAt: row.last_reviewed_at ? Date.parse(row.last_reviewed_at) : null,
        nextReviewAt: row.next_review_at ? Date.parse(row.next_review_at) : null,
        createdAt: row.created_at ? Date.parse(row.created_at) : null,
        updatedAt: row.updated_at ? Date.parse(row.updated_at) : null,
      };
    });
    setSurgeProgressMap(nextMap);
  }

  async function upsertSurgeProgress(records: SurgeProgressRecord[]) {
    if (!authUser || !language || !records.length) return;
    const payload = records.map((record) => ({
      user_id: authUser.id,
      language,
      item_key: record.itemKey,
      item_text: record.itemText,
      translation: record.translation,
      item_type: record.itemType,
      status: record.status,
      stage: record.stage,
      times_seen: record.timesSeen,
      times_correct: record.timesCorrect,
      last_result: record.lastResult ?? null,
      last_direction: record.lastDirection ?? null,
      last_reviewed_at: record.lastReviewedAt ? new Date(record.lastReviewedAt).toISOString() : null,
      next_review_at: record.nextReviewAt ? new Date(record.nextReviewAt).toISOString() : null,
      created_at: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date(record.updatedAt ?? Date.now()).toISOString(),
    }));
    await supabase.from("surge_progress").upsert(payload, {
      onConflict: "user_id,language,item_key",
    });
  }

  async function upsertUserVocab(rows: Array<{
    scope: "chat" | "common" | "scenario" | "topic";
    scenarioId?: string | null;
    wordKey: string;
    word: string;
    translation: string;
    starred: boolean;
    count?: number;
    lastClicked?: number;
    archived?: boolean;
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
      archived: row.archived ?? false,
    }));
    await supabase.from("user_vocab").upsert(payload, {
      onConflict: "user_id,language,scope,scenario_id,word_key",
    });
  }

  async function deleteUserVocab(
    scope: "chat" | "common" | "scenario" | "topic",
    wordKey: string,
    scenarioId?: string | null
  ) {
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

  async function clearUserVocabScope(scope: "common" | "scenario" | "topic", scenarioId?: string | null) {
    if (!authUser || !language) return;
    let query = supabase
      .from("user_vocab")
      .delete()
      .eq("user_id", authUser.id)
      .eq("language", language)
      .eq("scope", scope);
    if ((scope === "scenario" || scope === "topic") && scenarioId) {
      query = query.eq("scenario_id", scenarioId);
    }
    await query;
  }

  async function archiveScenarioVocab(scenarioId: string) {
    if (!authUser || !language) return;
    await supabase
      .from("user_vocab")
      .update({ archived: true })
      .eq("user_id", authUser.id)
      .eq("language", language)
      .eq("scope", "scenario")
      .eq("scenario_id", scenarioId);
    setScenarioVocabMap((prev) => ({
      ...prev,
      [scenarioId]: {
        ...(prev[scenarioId] || { language, entries: [] }),
        entries: (prev[scenarioId]?.entries || []).map((entry) => ({ ...entry, archived: true })),
        archived: true,
      },
    }));
  }

  async function archiveScenarioVocabUnstarred(scenarioId: string) {
    if (!authUser || !language) return;
    const entries = scenarioVocabMap[scenarioId]?.entries || [];
    const remaining = entries.filter((entry) => entry.starred);
    const toArchive = entries.filter((entry) => !entry.starred);
    if (!toArchive.length) {
      await archiveScenarioVocab(scenarioId);
      return;
    }
    const keys = toArchive.map((entry) => normalizeWord(entry.word)).filter(Boolean);
    if (keys.length) {
      await supabase
        .from("user_vocab")
        .update({ archived: true })
        .eq("user_id", authUser.id)
        .eq("language", language)
        .eq("scope", "scenario")
        .eq("scenario_id", scenarioId)
        .in("word_key", keys);
    }
    setScenarioVocabMap((prev) => ({
      ...prev,
      [scenarioId]: {
        language,
        entries: entries.map((entry) => ({
          ...entry,
          archived: entry.starred ? entry.archived : true,
        })),
        archived: remaining.length === 0,
      },
    }));
  }

  async function archiveCommonUnstarred() {
    if (!authUser || !language || !studyPack) return;
    const remaining = studyPack.entries.filter((entry) => entry.starred);
    const toArchive = studyPack.entries.filter((entry) => !entry.starred);
    const keys = toArchive.map((entry) => normalizeWord(entry.word)).filter(Boolean);
    if (keys.length) {
      await supabase
        .from("user_vocab")
        .update({ archived: true })
        .eq("user_id", authUser.id)
        .eq("language", language)
        .eq("scope", "common")
        .in("word_key", keys);
    }
    setStudyPack({
      language: studyPack.language,
      entries: studyPack.entries.map((entry) => ({
        ...entry,
        archived: entry.starred ? entry.archived : true,
      })),
    });
  }

  async function archiveChatUnstarred() {
    if (!authUser || !language) return;
    const remaining = vocabEntries.filter((entry) => entry.starred);
    const toArchive = vocabEntries.filter((entry) => !entry.starred);
    const keys = toArchive.map((entry) => entry.key).filter(Boolean);
    if (keys.length) {
      await supabase
        .from("user_vocab")
        .update({ archived: true })
        .eq("user_id", authUser.id)
        .eq("language", language)
        .eq("scope", "chat")
        .in("word_key", keys);
    }
    setVocabEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        archived: entry.starred ? entry.archived : true,
      }))
    );
  }

  async function archiveTopicUnstarred(topic: string) {
    if (!authUser || !language) return;
    const current = topicVocabMap[topic];
    if (!current) return;
    const remaining = current.entries.filter((entry) => entry.starred);
    const toArchive = current.entries.filter((entry) => !entry.starred);
    const keys = toArchive.map((entry) => normalizeWord(entry.word)).filter(Boolean);
    if (keys.length) {
      await supabase
        .from("user_vocab")
        .update({ archived: true })
        .eq("user_id", authUser.id)
        .eq("language", language)
        .eq("scope", "topic")
        .eq("scenario_id", topic)
        .in("word_key", keys);
    }
    setTopicVocabMap((prev) => ({
      ...prev,
      [topic]: {
        language: current.language,
        entries: current.entries.map((entry) => ({
          ...entry,
          archived: entry.starred ? entry.archived : true,
        })),
      },
    }));
    setTopicVocabFlipped({});
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
    setChatMode("scenario");
    chatModeRef.current = "scenario";
    setView("chat");
    setActiveScenario(scenario);
    activeScenarioRef.current = scenario;
    setMessages([]);
    messagesStateRef.current = [];
    setInputValue("");
    setSuggestion(null);
    setShowSuggestionModal(false);
    setShowTaskModal(false);
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
        chatMode: "scenario",
        scenarioPreset: scenario.title,
        scenarioCustom: scenario.subtitle,
        scenarioRole: scenario.roleGuide,
        scenarioStart: scenario.startPrompt,
        task: taskValue,
        buddyContext: "",
      }),
    });

    setTimeout(() => {
      sendMessageWithRetry("__AI_START__", makeId(), "", 0, session);
    }, 150);
  }

  async function startBuddyChat(forceNew = false) {
    if (!authUser) return;
    if (!language) {
      setAuthError("Choose a language before opening Buddy.");
      return;
    }

    const hasExistingBuddy =
      chatModeRef.current === "buddy" &&
      Boolean(sessionId) &&
      messagesStateRef.current.length > 0;

    setChatMode("buddy");
    chatModeRef.current = "buddy";
    setView("chat");
    setActiveScenario(null);
    activeScenarioRef.current = null;
    setSuggestion(null);
    setShowSuggestionModal(false);
    setShowTaskModal(false);
    setTaskCompleted(false);
    setTaskText("");
    setRewardPoints(0);
    setAuthError(null);

    if (!forceNew && hasExistingBuddy && sessionId) {
      await syncSessionContext(sessionId, "buddy");
      return;
    }

    clientCache.clear();
    setMessages([]);
    messagesStateRef.current = [];
    setInputValue("");
    setSessionId(null);

    const session = await createSession();
    if (!session) return;

    await syncSessionContext(session, "buddy");

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

  async function syncSessionContext(targetSessionId: string, modeOverride?: ChatMode) {
    if (!language) return;
    const nextMode = modeOverride ?? chatModeRef.current;

    if (nextMode === "buddy") {
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: targetSessionId,
          language,
          difficulty,
          chatMode: "buddy",
          scenarioPreset: "Buddy",
          scenarioCustom: "Adaptive language buddy chat",
          scenarioRole: "",
          scenarioStart: "",
          task: null,
          buddyContext: buddyProfileRef.current?.summary || buddyProfileSnapshot.summary,
        }),
      });
      return;
    }

    if (!activeScenarioRef.current) return;
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: targetSessionId,
        language,
        difficulty,
        chatMode: "scenario",
        scenarioPreset: activeScenarioRef.current.title,
        scenarioCustom: activeScenarioRef.current.subtitle,
        scenarioRole: activeScenarioRef.current.roleGuide,
        scenarioStart: activeScenarioRef.current.startPrompt,
        task: taskRef.current,
        buddyContext: "",
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

  function sendUserText(rawText: string) {
    const trimmed = rawText.trim();
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

  async function sendMessage() {
    sendUserText(inputValue);
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
    const activeChatMode = chatModeRef.current;
    const scenario = activeScenarioRef.current;
    if (!activeSessionId) return;
    if (activeChatMode === "scenario" && !scenario) return;

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
          chatMode: activeChatMode,
          scenarioPreset: activeChatMode === "buddy" ? "Buddy" : scenario?.title,
          scenarioCustom: activeChatMode === "buddy" ? "Adaptive language buddy chat" : scenario?.subtitle,
          scenarioRole: activeChatMode === "buddy" ? "" : scenario?.roleGuide,
          scenarioStart: activeChatMode === "buddy" ? "" : scenario?.startPrompt,
          task: activeChatMode === "buddy" ? null : taskRef.current,
          buddyContext:
            activeChatMode === "buddy"
              ? buddyProfileRef.current?.summary || buddyProfileSnapshot.summary
              : "",
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
            await syncSessionContext(newSession, activeChatMode);
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
        if (activeChatMode === "scenario") {
          void checkTaskCompletion(messagesStateRef.current);
        }
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

  function startArchiveHold(id: string, onHold: () => void) {
    if (archiveTimerRef.current !== null) {
      window.clearTimeout(archiveTimerRef.current);
    }
    archiveTriggeredRef.current = false;
    setHoldDeleteId(id);
    archiveTimerRef.current = window.setTimeout(() => {
      archiveTriggeredRef.current = true;
      onHold();
      setHoldDeleteId(null);
    }, 2000);
  }

  function endArchiveHold(id: string, onTap: () => void) {
    if (holdDeleteId !== id) return;
    if (archiveTimerRef.current !== null) {
      window.clearTimeout(archiveTimerRef.current);
    }
    if (!archiveTriggeredRef.current) {
      onTap();
    }
    archiveTriggeredRef.current = false;
    setHoldDeleteId(null);
  }

  function cancelArchiveHold(id: string) {
    if (holdDeleteId !== id) return;
    if (archiveTimerRef.current !== null) {
      window.clearTimeout(archiveTimerRef.current);
    }
    archiveTriggeredRef.current = false;
    setHoldDeleteId(null);
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

  function renderClickableTokens(
    text: string,
    keyPrefix: string,
    wordClassName?: string,
    context?: { scope?: "chat" | "common" | "scenario" | "topic"; scenarioId?: string | null; sentence?: string }
  ) {
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
            onClick={(event) => onWordClick(event, event.currentTarget, token, context)}
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

  async function onWordClick(
    event: React.MouseEvent<HTMLSpanElement>,
    target: HTMLSpanElement,
    word: string,
    context?: { scope?: "chat" | "common" | "scenario" | "topic"; scenarioId?: string | null; sentence?: string }
  ) {
    event.stopPropagation();
    ignoreWindowClickRef.current = true;
    const activeSessionId = await ensureChatSession();
    if (!activeSessionId) return;

    if (activeTargetRef.current === target && tooltip && !tooltip.loading) {
      setTooltip(null);
      activeTargetRef.current = null;
      return;
    }

    let sentence = context?.sentence || "";
    if (!sentence) {
      const messageElement = target.closest(".message, .feedback");
      if (messageElement) {
        sentence = messageElement.textContent || "";
      }
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
      addWordToList(
        word,
        data.translation,
        context?.scope || "chat",
        context?.scenarioId || null
      );
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
                archived: false,
              }
            : entry
        );
      }
      return [
        ...prev,
        { key, word, translation, count: nextCount, lastClicked: nextClicked, starred: false, archived: false },
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
        archived: false,
      },
    ]);
  }

  function addWordToList(
    word: string,
    translation: string,
    scope: "chat" | "common" | "scenario" | "topic",
    scenarioId?: string | null
  ) {
    if (scope === "chat") {
      upsertVocab(word, translation);
      return;
    }
    if (scope === "common") {
      const key = normalizeWord(word);
      setStudyPack((prev) => {
        const entries = prev?.entries || [];
        const index = entries.findIndex((entry) => normalizeWord(entry.word) === key);
        if (index !== -1) {
          const nextEntries = entries.map((entry, idx) =>
            idx === index
              ? { ...entry, translation: translation || entry.translation, archived: false }
              : entry
          );
          return { language: language || "", entries: nextEntries };
        }
        const nextEntries = [...entries, { word, translation, starred: false, archived: false }];
        return { language: language || "", entries: nextEntries };
      });
      if (key) {
        void upsertUserVocab([
          {
            scope: "common",
            scenarioId: null,
            wordKey: key,
            word,
            translation,
            starred: false,
            count: 1,
            lastClicked: Date.now(),
            archived: false,
          },
        ]);
      }
      return;
    }
    if (scope === "scenario" && scenarioId) {
      const key = normalizeWord(word);
      setScenarioVocabMap((prev) => {
        const current = prev[scenarioId]?.entries || [];
        const index = current.findIndex((entry) => normalizeWord(entry.word) === key);
        if (index !== -1) {
          const nextEntries = current.map((entry, idx) =>
            idx === index
              ? { ...entry, translation: translation || entry.translation, archived: false }
              : entry
          );
          return {
            ...prev,
            [scenarioId]: { language: language || "", entries: nextEntries, archived: false },
          };
        }
        const nextEntries = [...current, { word, translation, starred: false, archived: false }];
        return {
          ...prev,
          [scenarioId]: { language: language || "", entries: nextEntries, archived: false },
        };
      });
      if (key) {
        void upsertUserVocab([
          {
            scope: "scenario",
            scenarioId,
            wordKey: key,
            word,
            translation,
            starred: false,
            count: 1,
            lastClicked: Date.now(),
            archived: false,
          },
        ]);
      }
      return;
    }
    if (scope === "topic" && scenarioId) {
      const key = normalizeWord(word);
      setTopicVocabMap((prev) => {
        const current = prev[scenarioId]?.entries || [];
        const index = current.findIndex((entry) => normalizeWord(entry.word) === key);
        if (index !== -1) {
          const nextEntries = current.map((entry, idx) =>
            idx === index
              ? { ...entry, translation: translation || entry.translation, archived: false }
              : entry
          );
          return {
            ...prev,
            [scenarioId]: { language: language || "", entries: nextEntries },
          };
        }
        const nextEntries = [...current, { word, translation, starred: false, archived: false }];
        return {
          ...prev,
          [scenarioId]: { language: language || "", entries: nextEntries },
        };
      });
      if (key) {
        void upsertUserVocab([
          {
            scope: "topic",
            scenarioId,
            wordKey: key,
            word,
            translation,
            starred: false,
            count: 1,
            lastClicked: Date.now(),
            archived: false,
          },
        ]);
      }
    }
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

  async function archiveVocabEntry(key: string) {
    if (!authUser || !language) return;
    const target = vocabEntries.find((entry) => entry.key === key);
    if (!target) return;
    setVocabEntries((prev) =>
      prev.map((entry) => (entry.key === key ? { ...entry, archived: true } : entry))
    );
    await supabase
      .from("user_vocab")
      .update({ archived: true })
      .eq("user_id", authUser.id)
      .eq("language", language)
      .eq("scope", "chat")
      .eq("word_key", key);
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
          archived: Boolean(target.archived),
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
          archived: Boolean(target.archived),
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

  function mergeUniqueEntries(current: StudyEntry[], incoming: StudyEntry[]) {
    const merged = current.map((entry) => ({
      ...entry,
      starred: Boolean(entry.starred),
      archived: Boolean(entry.archived),
    }));
    const indexByKey = new Map<string, number>();
    merged.forEach((entry, index) => {
      const key = normalizeWord(entry.word);
      if (key) {
        indexByKey.set(key, index);
      }
    });
    const added: StudyEntry[] = [];
    incoming.forEach((entry) => {
      const key = normalizeWord(entry.word);
      if (!key) return;
      const existingIndex = indexByKey.get(key);
      if (existingIndex === undefined) {
        const next = {
          ...entry,
          starred: Boolean(entry.starred),
          archived: Boolean(entry.archived),
        };
        indexByKey.set(key, merged.length);
        merged.push(next);
        added.push(next);
        return;
      }
      const currentEntry = merged[existingIndex];
      merged[existingIndex] = {
        ...currentEntry,
        translation: entry.translation || currentEntry.translation,
        starred: currentEntry.starred || Boolean(entry.starred),
        archived: currentEntry.archived || Boolean(entry.archived),
      };
    });
    return { merged, added };
  }

  function exampleKey(scope: ExampleScope, word: string, scenarioId?: string | null) {
    const base = normalizeWord(word) || word.toLowerCase();
    return `${scope}:${scenarioId || "none"}:${base}`;
  }

  function speechKey(scope: VocabScope, word: string, scenarioId?: string | null) {
    const base = normalizeWord(word) || word.toLowerCase();
    return `${language || "none"}:${scope}:${scenarioId || "none"}:${base}`;
  }

  async function playFlashcardAudio(scope: VocabScope, word: string, scenarioId?: string | null) {
    const trimmedWord = word.trim();
    if (!language || !trimmedWord) return;

    const key = speechKey(scope, trimmedWord, scenarioId);
    if (speechLoadingKey === key) return;

    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;

    if (speechPlayingKey === key) {
      audio.pause();
      audio.currentTime = 0;
      setSpeechPlayingKey(null);
      return;
    }

    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }

    let audioUrl = speechCacheRef.current.get(key);

    if (!audioUrl) {
      setSpeechLoadingKey(key);
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, text: trimmedWord }),
        });

        if (!res.ok) return;

        const blob = await res.blob();
        if (!blob.size) return;

        audioUrl = URL.createObjectURL(blob);
        speechCacheRef.current.set(key, audioUrl);
      } finally {
        setSpeechLoadingKey((current) => (current === key ? null : current));
      }
    }

    if (!audioUrl) return;

    audio.onended = () => {
      setSpeechPlayingKey((current) => (current === key ? null : current));
    };

    audio.src = audioUrl;
    audio.currentTime = 0;
    setSpeechPlayingKey(key);

    try {
      await audio.play();
    } catch {
      setSpeechPlayingKey((current) => (current === key ? null : current));
    }
  }

  function toSurgeItem(record: SurgeProgressRecord): SurgeItem {
    return {
      itemKey: record.itemKey,
      text: record.itemText,
      translation: record.translation,
      itemType: record.itemType,
    };
  }

  function syncSurgeRecord(item: SurgeItem, updater: (current: SurgeProgressRecord) => SurgeProgressRecord) {
    const now = Date.now();
    let nextRecord: SurgeProgressRecord | null = null;
    setSurgeProgressMap((prev) => {
      const current = prev[item.itemKey] || {
        itemKey: item.itemKey,
        itemText: item.text,
        translation: item.translation,
        itemType: item.itemType,
        status: "learning" as const,
        stage: 0,
        timesSeen: 0,
        timesCorrect: 0,
        lastResult: null,
        lastDirection: null,
        lastReviewedAt: null,
        nextReviewAt: null,
        createdAt: now,
        updatedAt: now,
      };
      nextRecord = updater({
        ...current,
        itemText: item.text || current.itemText,
        translation: item.translation || current.translation,
        itemType: item.itemType || current.itemType,
        updatedAt: now,
      });
      return nextRecord ? { ...prev, [item.itemKey]: nextRecord } : prev;
    });
    if (nextRecord) {
      void upsertSurgeProgress([nextRecord]);
      setSurgeSavedAt(now);
    }
    return nextRecord;
  }

  function getSurgeUsedKeys(session: SurgeSession, options?: { includeReserve?: boolean }) {
    const includeReserve = options?.includeReserve ?? true;
    return new Set(
      [
        ...session.activeRound.map((item) => item.itemKey),
        ...(includeReserve ? session.reserve.map((item) => item.itemKey) : []),
        ...session.reviewQueue.map((item) => item.itemKey),
        ...session.typingQueue.map((item) => item.itemKey),
        ...session.delayedReviewQueue.map((item) => item.item.itemKey),
        ...session.recentlySeen,
      ].filter(Boolean)
    );
  }

  function getDueSurgeItems(exclude: Set<string>) {
    const now = Date.now();
    return Object.values(surgeProgressMap)
      .filter((record) => record.status !== "known")
      .filter((record) => Boolean(record.nextReviewAt) && (record.nextReviewAt || 0) <= now)
      .filter((record) => !exclude.has(record.itemKey))
      .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0))
      .map((record) => toSurgeItem(record));
  }

  async function fetchSurgeBatch(session: SurgeSession, count = 10) {
    if (!language) return [];
    const knownTexts = Object.values(surgeProgressMap)
      .filter((record) => record.status === "known")
      .map((record) => record.itemText);
    const existingTexts = [
      ...session.activeRound.map((item) => item.text),
      ...session.reserve.map((item) => item.text),
      ...session.reviewQueue.map((item) => item.text),
      ...session.typingQueue.map((item) => item.text),
      ...session.delayedReviewQueue.map((item) => item.item.text),
    ];
    const recentTexts = session.recentlySeen
      .map((key) => surgeProgressMap[key]?.itemText || session.activeRound.find((item) => item.itemKey === key)?.text)
      .filter(Boolean) as string[];

    const res = await fetch("/api/surge-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        count,
        existing: uniqueStrings(existingTexts),
        known: uniqueStrings(knownTexts),
        recent: uniqueStrings(recentTexts),
        difficulty,
      }),
    });

    if (!res.ok) {
      let message = "Failed to load Surge items.";
      try {
        const data = (await res.json()) as { error?: string };
        if (typeof data?.error === "string" && data.error.trim()) {
          message = data.error.trim();
        }
      } catch {
        // Ignore parse errors and keep fallback message.
      }
      throw new Error(message);
    }

    const data = (await res.json()) as {
      items?: Array<{ text: string; translation: string; itemType: "word" | "phrase"; itemKey: string }>;
    };

    const cleaned = dedupeSurgeItems(
      Array.isArray(data.items)
        ? data.items
            .filter(
              (item) =>
                item &&
                typeof item.text === "string" &&
                typeof item.translation === "string" &&
                typeof item.itemKey === "string"
            )
            .map((item) => ({
              itemKey: item.itemKey || normalizeSurgeKey(item.text),
              text: item.text.trim(),
              translation: item.translation.trim(),
              itemType: item.itemType === "phrase" ? "phrase" : "word",
            }))
        : []
    );

    if (!cleaned.length) {
      throw new Error("Surge did not receive any usable study items.");
    }

    return cleaned;
  }

  async function ensureSurgeReserve(session: SurgeSession) {
    if (session.reserve.length >= 5) return session;
    const fetched = await fetchSurgeBatch(session, 10);
    const usedKeys = getSurgeUsedKeys(session);
    const mergedReserve = dedupeSurgeItems([
      ...session.reserve,
      ...fetched.filter((item) => !usedKeys.has(item.itemKey)),
    ]);
    return {
      ...session,
      reserve: mergedReserve,
    };
  }

  async function fillSurgeRound(session: SurgeSession, baseRound: SurgeItem[] = []) {
    let nextSession = { ...session, activeRound: [...baseRound] };
    while (nextSession.activeRound.length < 5) {
      const usedKeys = getSurgeUsedKeys(nextSession, { includeReserve: false });
      nextSession.activeRound.forEach((item) => usedKeys.add(item.itemKey));
      const due = getDueSurgeItems(usedKeys);
      if (due.length) {
        nextSession = {
          ...nextSession,
          activeRound: [...nextSession.activeRound, due[0]],
        };
        continue;
      }

      nextSession = await ensureSurgeReserve(nextSession);
      const nextReserveItem = nextSession.reserve.find((item) => !usedKeys.has(item.itemKey));
      if (!nextReserveItem) break;
      nextSession = {
        ...nextSession,
        reserve: nextSession.reserve.filter((item) => item.itemKey !== nextReserveItem.itemKey),
        activeRound: [...nextSession.activeRound, nextReserveItem],
      };
    }
    return nextSession;
  }

  function createMatchSession(session: SurgeSession) {
    const keys = session.activeRound.map((item) => item.itemKey);
    return {
      ...session,
      phase: "match" as const,
      matchTargets: shuffleList(keys),
      matchTranslations: shuffleList(keys),
      matchedKeys: [],
      selectedTargetKey: null,
      selectedTranslationKey: null,
    };
  }

  function createTypingSession(session: SurgeSession, queue: SurgeItem[]) {
    return {
      ...session,
      phase: "typing" as const,
      typingQueue: dedupeSurgeItems(queue),
      delayedReviewQueue: [],
      typingInput: "",
      typingFeedback: null,
      selectedTargetKey: null,
      selectedTranslationKey: null,
    };
  }

  async function buildNextSurgeRound(session: SurgeSession, roundItems: SurgeItem[] = []) {
    const filled = await fillSurgeRound(
      {
        ...session,
        phase: "preview",
        activeRound: [],
        previewIndex: 0,
        previewRevealed: false,
        previewSeenKeys: [],
        matchTargets: [],
        matchTranslations: [],
        matchedKeys: [],
        selectedTargetKey: null,
        selectedTranslationKey: null,
        typingQueue: [],
        delayedReviewQueue: [],
        typingInput: "",
        typingFeedback: null,
      },
      roundItems
    );
    return {
      ...filled,
      recentlySeen: uniqueStrings([
        ...filled.recentlySeen,
        ...filled.activeRound.map((item) => item.itemKey),
      ]).slice(-120),
    };
  }

  async function startSurgeSession(forceNew = false) {
    if (!authUser || !language) {
      setSurgeError("Choose a language before starting Surge.");
      setView("surge");
      return;
    }
    setView("surge");
    setSurgeLoading(true);
    setSurgeError(null);
    try {
      if (!forceNew && surgeSession && surgeSession.language === language) {
        return;
      }
      let nextSession = createEmptySurgeSession(language);
      nextSession = await ensureSurgeReserve(nextSession);
      nextSession = await buildNextSurgeRound(nextSession);
      if (!nextSession.activeRound.length) {
        setSurgeError("Surge could not load new items right now.");
        return;
      }
      setSurgeSession(nextSession);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Surge could not load new items right now.";
      setSurgeError(message);
    } finally {
      setSurgeLoading(false);
    }
  }

  function getCurrentSurgePrompt(session: SurgeSession | null) {
    if (!session) return null;
    if (session.phase === "preview") {
      return session.activeRound[session.previewIndex] || null;
    }
    if (session.phase === "typing") {
      return session.typingQueue[0] || null;
    }
    return null;
  }

  function noteSurgeExposure(item: SurgeItem) {
    syncSurgeRecord(item, (current) => ({
      ...current,
      status: current.status,
      timesSeen: current.timesSeen + 1,
      updatedAt: Date.now(),
    }));
  }

  async function revealSurgePreview() {
    if (!surgeSession) return;
    const current = surgeSession.activeRound[surgeSession.previewIndex];
    if (!current) return;
    let nextSession = surgeSession;
    if (!surgeSession.previewSeenKeys.includes(current.itemKey)) {
      noteSurgeExposure(current);
      nextSession = {
        ...surgeSession,
        previewSeenKeys: [...surgeSession.previewSeenKeys, current.itemKey],
      };
    }
    setSurgeSession({
      ...nextSession,
      previewRevealed: true,
    });
  }

  async function toggleSurgePreview() {
    if (!surgeSession) return;
    if (surgeSession.previewRevealed) {
      setSurgeSession({
        ...surgeSession,
        previewRevealed: false,
      });
      return;
    }
    await revealSurgePreview();
  }

  async function advanceSurgePreview() {
    if (!surgeSession) return;
    const isLast = surgeSession.previewIndex >= surgeSession.activeRound.length - 1;
    if (!isLast) {
      setSurgeSession({
        ...surgeSession,
        previewIndex: surgeSession.previewIndex + 1,
        previewRevealed: false,
      });
      return;
    }
    setSurgeSession(createMatchSession(surgeSession));
  }

  async function markSurgeKnown(item: SurgeItem) {
    if (!surgeSession) return;
    const now = Date.now();
    syncSurgeRecord(item, (current) => ({
      ...current,
      status: "known",
      nextReviewAt: null,
      lastReviewedAt: now,
      updatedAt: now,
    }));

    let nextSession: SurgeSession = {
      ...surgeSession,
      activeRound: surgeSession.activeRound.filter((entry) => entry.itemKey !== item.itemKey),
      reserve: surgeSession.reserve.filter((entry) => entry.itemKey !== item.itemKey),
      reviewQueue: surgeSession.reviewQueue.filter((entry) => entry.itemKey !== item.itemKey),
      typingQueue: surgeSession.typingQueue.filter((entry) => entry.itemKey !== item.itemKey),
      delayedReviewQueue: surgeSession.delayedReviewQueue.filter((entry) => entry.item.itemKey !== item.itemKey),
      matchedKeys: surgeSession.matchedKeys.filter((key) => key !== item.itemKey),
      matchTargets: surgeSession.matchTargets.filter((key) => key !== item.itemKey),
      matchTranslations: surgeSession.matchTranslations.filter((key) => key !== item.itemKey),
      selectedTargetKey: surgeSession.selectedTargetKey === item.itemKey ? null : surgeSession.selectedTargetKey,
      selectedTranslationKey:
        surgeSession.selectedTranslationKey === item.itemKey ? null : surgeSession.selectedTranslationKey,
      recentlySeen: surgeSession.recentlySeen.filter((key) => key !== item.itemKey),
      previewSeenKeys: surgeSession.previewSeenKeys.filter((key) => key !== item.itemKey),
    };

    if (nextSession.phase === "preview") {
      nextSession = await buildNextSurgeRound(nextSession, nextSession.activeRound);
      nextSession.previewIndex = Math.min(nextSession.previewIndex, Math.max(nextSession.activeRound.length - 1, 0));
      nextSession.previewRevealed = false;
    } else if (nextSession.phase === "typing") {
      if (!nextSession.typingQueue.length) {
        if (nextSession.delayedReviewQueue.length) {
          nextSession = {
            ...nextSession,
            typingQueue: nextSession.delayedReviewQueue.map((entry) => entry.item),
            delayedReviewQueue: [],
          };
        } else {
          nextSession = await buildNextSurgeRound(nextSession);
        }
      }
    }

    if (!nextSession.activeRound.length && nextSession.phase === "preview") {
      nextSession = await buildNextSurgeRound(nextSession);
    }

    setSurgeSession(nextSession);
  }

  function getSurgeDirection(item: SurgeItem) {
    const stage = surgeProgressMap[item.itemKey]?.stage ?? 0;
    return getDirectionForStage(stage);
  }

  function releaseDelayedReviews(session: SurgeSession) {
    const ready: SurgeItem[] = [];
    const delayed = session.delayedReviewQueue
      .map((entry) => ({
        ...entry,
        remainingSkips: entry.remainingSkips - 1,
      }))
      .filter((entry) => {
        if (entry.remainingSkips <= 0) {
          ready.push(entry.item);
          return false;
        }
        return true;
      });

    return {
      ...session,
      delayedReviewQueue: delayed,
      typingQueue: [...session.typingQueue, ...ready],
    };
  }

  async function completeSurgeTypedStep() {
    if (!surgeSession) return;
    let nextSession: SurgeSession = {
      ...surgeSession,
      typingQueue: surgeSession.typingQueue.slice(1),
      typingInput: "",
      typingFeedback: null,
    };
    nextSession = releaseDelayedReviews(nextSession);
    if (nextSession.typingQueue.length) {
      setSurgeSession(nextSession);
      return;
    }
    if (nextSession.delayedReviewQueue.length) {
      const delayedItems = nextSession.delayedReviewQueue.map((entry) => entry.item);
      setSurgeSession({
        ...nextSession,
        typingQueue: delayedItems,
        delayedReviewQueue: [],
      });
      return;
    }
    const rebuilt = await buildNextSurgeRound(nextSession);
    setSurgeSession(rebuilt);
  }

  async function submitSurgeTypedAnswer() {
    if (!surgeSession) return;
    const current = surgeSession.typingQueue[0];
    if (!current || surgeSession.typingFeedback) return;
    const currentRecord = surgeProgressMap[current.itemKey];
    const direction = getDirectionForStage(currentRecord?.stage ?? 0);
    const mode = direction === "target_to_english" ? "english" : "target";
    const submitted = normalizeSurgeAnswer(surgeSession.typingInput, mode);
    const expected = normalizeSurgeAnswer(
      direction === "target_to_english" ? current.translation : current.text,
      mode
    );
    const now = Date.now();

    noteSurgeExposure(current);

    if (submitted && submitted === expected) {
      syncSurgeRecord(current, (record) => {
        const nextStage = Math.min(record.stage + 1, 6);
        return {
          ...record,
          stage: nextStage,
          timesCorrect: record.timesCorrect + 1,
          lastResult: "correct",
          lastDirection: direction,
          lastReviewedAt: now,
          nextReviewAt: getNextReviewAtForStage(nextStage, now),
          updatedAt: now,
        };
      });
      setSurgeSession({
        ...surgeSession,
        typingFeedback: {
          status: "correct",
          expected: direction === "target_to_english" ? current.translation : current.text,
          direction,
        },
      });
      return;
    }

    syncSurgeRecord(current, (record) => {
      const nextStage = Math.max(record.stage - 1, 0);
      return {
        ...record,
        stage: nextStage,
        lastResult: "wrong",
        lastDirection: direction,
        lastReviewedAt: now,
        nextReviewAt: now + (nextStage <= 2 ? 10 * 60 * 1000 : 24 * 60 * 60 * 1000),
        updatedAt: now,
      };
    });

    setSurgeSession({
      ...surgeSession,
      delayedReviewQueue: [...surgeSession.delayedReviewQueue, { item: current, remainingSkips: 2 }],
      typingFeedback: {
        status: "wrong",
        expected: direction === "target_to_english" ? current.translation : current.text,
        direction,
      },
    });
  }

  function handleSurgeTypingShortcut(event: React.KeyboardEvent<HTMLElement | HTMLInputElement>) {
    if (!surgeSession || surgeSession.phase !== "typing") return;
    const isInputTarget =
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target instanceof HTMLElement && event.target.isContentEditable);

    if (event.key === "Enter") {
      event.preventDefault();
      if (surgeSession.typingFeedback) {
        void completeSurgeTypedStep();
      } else {
        void submitSurgeTypedAnswer();
      }
      return;
    }

    if (event.key === " " && (surgeSession.typingFeedback || !isInputTarget)) {
      event.preventDefault();
      if (surgeSession.typingFeedback) {
        void completeSurgeTypedStep();
      } else {
        void submitSurgeTypedAnswer();
      }
    }
  }

  function playUiClickThock() {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const context = uiAudioContextRef.current ?? new AudioContextCtor();
    uiAudioContextRef.current = context;

    const scheduleThock = () => {
      const start = context.currentTime;
      const master = context.createGain();
      master.gain.setValueAtTime(0.0001, start);
      master.gain.exponentialRampToValueAtTime(0.26, start + 0.002);
      master.gain.exponentialRampToValueAtTime(0.0001, start + 0.07);
      master.connect(context.destination);

      const noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.04), context.sampleRate);
      const channel = noiseBuffer.getChannelData(0);
      for (let i = 0; i < channel.length; i += 1) {
        channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
      }

      const noise = context.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseFilter = context.createBiquadFilter();
      noiseFilter.type = "lowpass";
      noiseFilter.frequency.setValueAtTime(900, start);
      noiseFilter.Q.value = 0.7;
      const noiseGain = context.createGain();
      noiseGain.gain.setValueAtTime(0.0001, start);
      noiseGain.gain.exponentialRampToValueAtTime(0.65, start + 0.0015);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.035);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(master);
      noise.start(start);
      noise.stop(start + 0.04);

      const body = context.createOscillator();
      body.type = "sine";
      body.frequency.setValueAtTime(120, start);
      body.frequency.exponentialRampToValueAtTime(74, start + 0.05);
      const bodyGain = context.createGain();
      bodyGain.gain.setValueAtTime(0.0001, start);
      bodyGain.gain.exponentialRampToValueAtTime(0.18, start + 0.002);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);
      body.connect(bodyGain);
      bodyGain.connect(master);
      body.start(start);
      body.stop(start + 0.055);
    };

    if (context.state === "suspended") {
      void context.resume().then(scheduleThock).catch(() => {});
      return;
    }

    scheduleThock();
  }

  function handleAppPointerDownCapture(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest("input, textarea, select, option")) return;
    const interactive = target.closest("button, [role='button'], a, .token.word");
    if (interactive instanceof HTMLElement) {
      if (interactive.hasAttribute("disabled") || interactive.getAttribute("aria-disabled") === "true") return;
    }
    playUiClickThock();
  }

  async function completeSurgeMatchRound() {
    if (!surgeSession) return;
    const nextReviewQueue = dedupeSurgeItems([...surgeSession.reviewQueue, ...surgeSession.activeRound]).filter(
      (item) => surgeProgressMap[item.itemKey]?.status !== "known"
    );
    const nextCycleCount = surgeSession.cycleCount + 1;
    let nextSession: SurgeSession = {
      ...surgeSession,
      cycleCount: nextCycleCount,
      reviewQueue: nextReviewQueue,
      selectedTargetKey: null,
      selectedTranslationKey: null,
      matchedKeys: surgeSession.activeRound.map((item) => item.itemKey),
    };

    if (nextCycleCount % 2 === 0 && nextReviewQueue.length) {
      nextSession = createTypingSession(nextSession, nextReviewQueue);
      nextSession.reviewQueue = [];
      setSurgeSession(nextSession);
      return;
    }

    nextSession.reviewQueue = nextReviewQueue;
    nextSession = await buildNextSurgeRound(nextSession);
    setSurgeSession(nextSession);
  }

  async function chooseSurgeMatch(side: "target" | "translation", key: string) {
    if (!surgeSession || surgeSession.phase !== "match") return;
    if (surgeSession.matchedKeys.includes(key)) return;
    const nextSession = {
      ...surgeSession,
      selectedTargetKey: side === "target" ? key : surgeSession.selectedTargetKey,
      selectedTranslationKey: side === "translation" ? key : surgeSession.selectedTranslationKey,
    };

    if (!nextSession.selectedTargetKey || !nextSession.selectedTranslationKey) {
      setSurgeSession(nextSession);
      return;
    }

    if (nextSession.selectedTargetKey === nextSession.selectedTranslationKey) {
      const matchedKeys = [...nextSession.matchedKeys, nextSession.selectedTargetKey];
      const completed = matchedKeys.length >= nextSession.activeRound.length;
      const resolvedSession = {
        ...nextSession,
        matchedKeys,
        selectedTargetKey: null,
        selectedTranslationKey: null,
      };
      setSurgeSession(resolvedSession);
      if (completed) {
        window.setTimeout(() => {
          void completeSurgeMatchRound();
        }, 220);
      }
      return;
    }

    setSurgeSession(nextSession);
    window.setTimeout(() => {
      setSurgeSession((current) => {
        if (!current || current.phase !== "match") return current;
        return {
          ...current,
          selectedTargetKey: null,
          selectedTranslationKey: null,
        };
      });
    }, 260);
  }

  async function generateExamples(scope: ExampleScope, word: string, scenarioId?: string | null) {
    if (!language) return;
    const key = exampleKey(scope, word, scenarioId);
    const cached = exampleMap[key];
    if (cached && cached.length) {
      setExampleModal({ word, items: cached, scope, scenarioId });
      return;
    }
    if (exampleLoading[key]) return;
    setExampleLoading((prev) => ({ ...prev, [key]: true }));
    setExampleModal({ word, items: [], scope, scenarioId });
    try {
      const res = await fetch("/api/examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, word }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: ExampleItem[] };
      const items = Array.isArray(data.items)
        ? data.items.filter(
            (item) =>
              item &&
              typeof item.label === "string" &&
              typeof item.sentence === "string" &&
              typeof item.translation === "string"
          )
        : [];
      setExampleMap((prev) => ({ ...prev, [key]: items }));
      if (items.length) {
        setExampleModal({ word, items, scope, scenarioId });
      }
    } finally {
      setExampleLoading((prev) => ({ ...prev, [key]: false }));
    }
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

  async function archiveStudyEntry(index: number) {
    if (!authUser || !language || !studyPack) return;
    const target = studyPack.entries[index];
    if (!target) return;
    setStudyPack((prev) => {
      if (!prev) return prev;
      const next = prev.entries.map((entry, i) =>
        i === index ? { ...entry, archived: true } : entry
      );
      return { ...prev, entries: next };
    });
    await supabase
      .from("user_vocab")
      .update({ archived: true })
      .eq("user_id", authUser.id)
      .eq("language", language)
      .eq("scope", "common")
      .eq("word_key", normalizeWord(target.word));
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
          archived: Boolean(target.archived),
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

  async function archiveScenarioEntry(index: number) {
    if (!authUser || !language || !activeScenarioVocab) return;
    const scenarioId = activeScenarioVocab.id;
    const target = scenarioVocabMap[scenarioId]?.entries[index];
    if (!target) return;
    setScenarioVocabMap((prev) => {
      const current = prev[scenarioId];
      if (!current) return prev;
      const nextEntries = current.entries.map((entry, i) =>
        i === index ? { ...entry, archived: true } : entry
      );
      const allArchived = nextEntries.every((entry) => entry.archived);
      return { ...prev, [scenarioId]: { ...current, entries: nextEntries, archived: allArchived } };
    });
    await supabase
      .from("user_vocab")
      .update({ archived: true })
      .eq("user_id", authUser.id)
      .eq("language", language)
      .eq("scope", "scenario")
      .eq("scenario_id", scenarioId)
      .eq("word_key", normalizeWord(target.word));
  }

  function createTopicVocab(topic: string) {
    const trimmed = topic.trim();
    if (!trimmed) return;
    setTopicVocabMap((prev) => {
      if (prev[trimmed]) return prev;
      return { ...prev, [trimmed]: { language: language || "", entries: [] } };
    });
    setActiveTopic(trimmed);
    setTopicVocabFlipped({});
    setTopicVocabMode("list");
    setShowTopicStarredOnly(false);
    setShowTopicModal(false);
    setTopicInput("");
    setView("topic-detail");
  }

  function deleteTopicEntry(index: number) {
    if (!activeTopic) return;
    const target = topicVocabMap[activeTopic]?.entries[index];
    setTopicVocabMap((prev) => {
      const current = prev[activeTopic];
      if (!current) return prev;
      const nextEntries = current.entries.filter((_, i) => i !== index);
      return { ...prev, [activeTopic]: { ...current, entries: nextEntries } };
    });
    setTopicVocabFlipped((prev) => {
      const next: Record<number, boolean> = {};
      Object.keys(prev).forEach((key) => {
        const idx = Number(key);
        if (Number.isNaN(idx) || idx === index) return;
        next[idx > index ? idx - 1 : idx] = prev[idx];
      });
      return next;
    });
    if (target) {
      void deleteUserVocab("topic", normalizeWord(target.word), activeTopic);
    }
  }

  async function archiveTopicEntry(index: number) {
    if (!authUser || !language || !activeTopic) return;
    const target = topicVocabMap[activeTopic]?.entries[index];
    if (!target) return;
    setTopicVocabMap((prev) => {
      const current = prev[activeTopic];
      if (!current) return prev;
      const nextEntries = current.entries.map((entry, i) =>
        i === index ? { ...entry, archived: true } : entry
      );
      return { ...prev, [activeTopic]: { ...current, entries: nextEntries } };
    });
    await supabase
      .from("user_vocab")
      .update({ archived: true })
      .eq("user_id", authUser.id)
      .eq("language", language)
      .eq("scope", "topic")
      .eq("scenario_id", activeTopic)
      .eq("word_key", normalizeWord(target.word));
  }

  function toggleTopicStar(index: number) {
    if (!activeTopic) return;
    const target = topicVocabMap[activeTopic]?.entries[index];
    setTopicVocabMap((prev) => {
      const current = prev[activeTopic];
      if (!current) return prev;
      const nextEntries = current.entries.map((entry, i) =>
        i === index ? { ...entry, starred: !entry.starred } : entry
      );
      return { ...prev, [activeTopic]: { ...current, entries: nextEntries } };
    });
    if (target) {
      void upsertUserVocab([
        {
          scope: "topic",
          scenarioId: activeTopic,
          wordKey: normalizeWord(target.word),
          word: target.word,
          translation: target.translation,
          starred: !target.starred,
          count: 1,
          lastClicked: Date.now(),
          archived: Boolean(target.archived),
        },
      ]);
    }
  }

  function clearTopicVocab() {
    if (!activeTopic) return;
    setTopicVocabMap((prev) => {
      const next = { ...prev };
      delete next[activeTopic];
      return next;
    });
    setTopicVocabFlipped({});
    void clearUserVocabScope("topic", activeTopic);
  }

  function toggleTopicCard(index: number) {
    setTopicVocabFlipped((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }

  async function generateStudyWords(count: number, level?: "core" | "advanced") {
    if (!language || studyLoading) return;
    setStudyLoading(true);
    try {
      const existingEntries = studyPack?.entries ?? [];
      const existing = existingEntries.map((entry) => entry.word);
      const res = await fetch("/api/vocab-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, count, existing, level }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items: StudyEntry[] };
      if (!Array.isArray(data.items) || data.items.length === 0) return;
      const incoming = data.items.map((item) => ({ ...item, starred: item.starred ?? false }));
      const { merged, added } = mergeUniqueEntries(existingEntries, incoming);

      setStudyPack({ language, entries: merged });

      const rows = added
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
      const existingEntries = scenarioVocabMap[scenarioId]?.entries ?? [];
      const existing = existingEntries.map((entry) => entry.word);
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
      const { merged, added } = mergeUniqueEntries(existingEntries, incoming);

      setScenarioVocabMap((prev) => ({
        ...prev,
        [scenarioId]: { language, entries: merged, archived: false },
      }));

      const rows = added
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

  async function generateTopicWords(count: number, topic: string) {
    if (!language || topicVocabLoading) return;
    setTopicVocabLoading(true);
    try {
      const existingEntries = topicVocabMap[topic]?.entries ?? [];
      const existing = existingEntries.map((entry) => entry.word);
      const res = await fetch("/api/vocab-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          count,
          existing,
          scenarioTitle: topic,
          scenarioDetail: `Topic: ${topic}`,
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items: StudyEntry[] };
      if (!Array.isArray(data.items) || data.items.length === 0) return;
      const incoming = data.items.map((item) => ({ ...item, starred: item.starred ?? false }));
      const { merged, added } = mergeUniqueEntries(existingEntries, incoming);

      setTopicVocabMap((prev) => ({
        ...prev,
        [topic]: { language, entries: merged },
      }));

      const rows = added
        .map((item) => ({
          scope: "topic" as const,
          scenarioId: topic,
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
      setTopicVocabLoading(false);
    }
  }

  const sortedVocab = useMemo(() => {
    return vocabEntries
      .filter((entry) => !entry.archived)
      .slice()
      .sort((a, b) => b.lastClicked - a.lastClicked);
  }, [vocabEntries]);

  const topicList = useMemo(() => {
    return Object.keys(topicVocabMap).sort((a, b) => a.localeCompare(b));
  }, [topicVocabMap]);

  useEffect(() => {
    if (surgeSession?.phase === "typing" && !surgeSession.typingFeedback) {
      surgeInputRef.current?.focus();
      surgeTypingPanelRef.current?.blur();
    }
    if (surgeSession?.phase === "typing" && surgeSession.typingFeedback) {
      surgeTypingPanelRef.current?.focus();
    }
  }, [surgeSession]);

  const targetLabel = language || "Target";
  const isBuddyChat = chatMode === "buddy";
  const hasBuddyConversation = isBuddyChat && messages.length > 0;
  const surgeDueCount = useMemo(() => {
    const now = Date.now();
    return Object.values(surgeProgressMap).filter(
      (record) => record.status !== "known" && Boolean(record.nextReviewAt) && (record.nextReviewAt || 0) <= now
    ).length;
  }, [surgeProgressMap]);
  const surgeMasteredCount = useMemo(() => {
    return Object.values(surgeProgressMap).filter(
      (record) => record.status === "known" || record.stage >= 6
    ).length;
  }, [surgeProgressMap]);
  const surgeInSessionCount = useMemo(() => {
    if (!surgeSession) return 0;
    return dedupeSurgeItems([
      ...surgeSession.activeRound,
      ...surgeSession.reserve,
      ...surgeSession.reviewQueue,
      ...surgeSession.typingQueue,
      ...surgeSession.delayedReviewQueue.map((entry) => entry.item),
    ]).length;
  }, [surgeSession]);
  const buddyQuickActions = useMemo(
    () => [
      {
        label: "Quiz me",
        prompt: `Give me a quick recall check in ${language || "the target language"} using the words I am still learning. One prompt at a time.`,
      },
      {
        label: "Mini chat",
        prompt: `Start a tiny everyday conversation in ${language || "the target language"}. Keep it simple and correct me briefly if needed.`,
      },
      {
        label: "Translate",
        prompt: "Give me three very common words or short phrases to translate, one at a time.",
      },
      {
        label: "Review weak words",
        prompt: "Use my recent and weak words. Ask me short questions so I have to actively recall them.",
      },
    ],
    [language]
  );
  const currentSurgePrompt = useMemo(() => getCurrentSurgePrompt(surgeSession), [surgeSession]);
  const studyVisibleItems = useMemo(() => {
    const entries = studyPack?.entries ?? [];
    return entries
      .map((entry, index) => ({ entry, index }))
      .filter((item) => (showStudyArchivedOnly ? item.entry.archived : !item.entry.archived))
      .filter((item) => (showStudyStarredOnly ? item.entry.starred : true));
  }, [studyPack, showStudyArchivedOnly, showStudyStarredOnly]);

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

  const surgeView = (
    <section className="surge-shell">
      <div className="subtle-back">
        <button type="button" className="ghost subtle-back-btn" onClick={() => setView("dashboard")}>
          Back
        </button>
      </div>

      <div className="surge-header">
        <div>
          <div className="surge-kicker">Surge</div>
          <h2>Stay in flow and build recall fast.</h2>
          <p>
            Preview five items, match them, then bring older items back through active recall.
          </p>
        </div>
        <div className="surge-status">
          <div className="surge-status-pill">Due now {surgeDueCount}</div>
          <div className="surge-status-pill">In session {surgeInSessionCount}</div>
          <div className="surge-status-pill">Mastered {surgeMasteredCount}</div>
        </div>
      </div>

      {!language ? (
        <div className="surge-panel">
          <div className="home-vocab-empty">Choose a language before starting Surge.</div>
        </div>
      ) : surgeLoading ? (
        <div className="surge-panel">
          <div className="home-vocab-empty">Loading Surge...</div>
        </div>
      ) : !surgeSession ? (
        <div className="surge-panel surge-empty">
          <div>
            <h3>Ready for a fast vocab sprint?</h3>
            <p>
              {surgeError
                ? surgeError
                : "Surge mixes previews, matching, and spaced recall so you can keep moving without setup."}
            </p>
          </div>
          <button type="button" className="solid" onClick={() => void startSurgeSession(true)}>
            {surgeError ? "Try again" : "Start Surge"}
          </button>
        </div>
      ) : surgeSession.phase === "preview" && currentSurgePrompt ? (
        <div className="surge-panel surge-preview">
          <div className="surge-progress">
            <span>Preview</span>
            <span>
              {surgeSession.previewIndex + 1}/{surgeSession.activeRound.length}
            </span>
          </div>
          <button
            type="button"
            className={`surge-card ${surgeSession.previewRevealed ? "revealed" : ""}`}
            onClick={() => {
              void toggleSurgePreview();
            }}
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                void toggleSurgePreview();
              }
            }}
          >
            <div className="surge-card-label">Meaning</div>
            <div className="surge-card-translation">{currentSurgePrompt.translation}</div>
            <div className="surge-card-label">Target</div>
            <div className="surge-card-word">
              {surgeSession.previewRevealed ? currentSurgePrompt.text : "Tap to reveal"}
            </div>
          </button>
          <div className="surge-actions">
            <button
              type="button"
              className="ghost"
              onClick={() => void playFlashcardAudio("surge", currentSurgePrompt.text)}
            >
              Pronounce
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => void markSurgeKnown(currentSurgePrompt)}
            >
              I know this...
            </button>
            <button
              type="button"
              className="solid"
              onClick={() =>
                surgeSession.previewRevealed ? void advanceSurgePreview() : void revealSurgePreview()
              }
            >
              {surgeSession.previewRevealed ? "Next" : "Reveal"}
            </button>
          </div>
        </div>
      ) : surgeSession.phase === "match" ? (
        <div className="surge-panel surge-match">
          <div className="surge-progress">
            <span>Match the pairs</span>
            <span>
              {surgeSession.matchedKeys.length}/{surgeSession.activeRound.length}
            </span>
          </div>
          <div className="surge-match-grid">
            <div className="surge-match-column">
              {surgeSession.matchTargets.map((key) => {
                const item = surgeSession.activeRound.find((entry) => entry.itemKey === key);
                if (!item) return null;
                const isMatched = surgeSession.matchedKeys.includes(key);
                const isSelected = surgeSession.selectedTargetKey === key;
                return (
                  <button
                    key={`target-${key}`}
                    type="button"
                    className={`surge-match-card${isMatched ? " matched" : ""}${isSelected ? " selected" : ""}`}
                    onClick={() => void chooseSurgeMatch("target", key)}
                    disabled={isMatched}
                  >
                    {item.text}
                  </button>
                );
              })}
            </div>
            <div className="surge-match-column">
              {surgeSession.matchTranslations.map((key) => {
                const item = surgeSession.activeRound.find((entry) => entry.itemKey === key);
                if (!item) return null;
                const isMatched = surgeSession.matchedKeys.includes(key);
                const isSelected = surgeSession.selectedTranslationKey === key;
                return (
                  <button
                    key={`translation-${key}`}
                    type="button"
                    className={`surge-match-card${isMatched ? " matched" : ""}${isSelected ? " selected" : ""}`}
                    onClick={() => void chooseSurgeMatch("translation", key)}
                    disabled={isMatched}
                  >
                    {item.translation}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : surgeSession.phase === "typing" && currentSurgePrompt ? (
        <div
          ref={surgeTypingPanelRef}
          className="surge-panel surge-typing"
          tabIndex={-1}
          onKeyDown={handleSurgeTypingShortcut}
        >
          <div className="surge-progress">
            <span>{getSurgeDirection(currentSurgePrompt) === "target_to_english" ? "Type English" : `Type ${targetLabel}`}</span>
            <span>{surgeSession.typingQueue.length} left</span>
          </div>
          <div className="surge-prompt-card">
            <div className="surge-card-label">
              {getSurgeDirection(currentSurgePrompt) === "target_to_english" ? targetLabel : "English"}
            </div>
            <div className="surge-prompt-text">
              {getSurgeDirection(currentSurgePrompt) === "target_to_english"
                ? currentSurgePrompt.text
                : currentSurgePrompt.translation}
            </div>
            <div className="surge-prompt-sub">
              {getSurgeDirection(currentSurgePrompt) === "target_to_english"
                ? "Type the English meaning."
                : `Type the answer in ${targetLabel}.`}
            </div>
          </div>
          <div className="surge-input-wrap">
            <input
              ref={surgeInputRef}
              type="text"
              value={surgeSession.typingInput}
              onChange={(event) =>
                setSurgeSession((current) =>
                  current
                    ? {
                        ...current,
                        typingInput: event.target.value,
                      }
                    : current
                )
              }
              onKeyDown={(event) => {
                handleSurgeTypingShortcut(event);
              }}
              placeholder={
                getSurgeDirection(currentSurgePrompt) === "target_to_english"
                  ? "Type the English meaning"
                  : `Type in ${targetLabel}`
              }
              disabled={Boolean(surgeSession.typingFeedback)}
            />
          </div>
          {surgeSession.typingFeedback ? (
            <div className={`surge-feedback ${surgeSession.typingFeedback.status}`}>
              {surgeSession.typingFeedback.status === "correct" ? "Correct" : "Not quite"}
              <span>{surgeSession.typingFeedback.expected}</span>
            </div>
          ) : null}
          <div className="surge-actions">
            <button
              type="button"
              className="ghost"
              onClick={() => void playFlashcardAudio("surge", currentSurgePrompt.text)}
            >
              Pronounce
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => void markSurgeKnown(currentSurgePrompt)}
            >
              I know this...
            </button>
            <button
              type="button"
              className="solid"
              onClick={() =>
                surgeSession.typingFeedback ? void completeSurgeTypedStep() : void submitSurgeTypedAnswer()
              }
            >
              {surgeSession.typingFeedback ? "Continue" : "Check"}
            </button>
          </div>
        </div>
      ) : (
        <div className="surge-panel">
          <div className="home-vocab-empty">{surgeError || "Surge is ready when you are."}</div>
        </div>
      )}

      {surgeSavedAt ? (
        <div className="surge-footnote">Progress saved {new Date(surgeSavedAt).toLocaleTimeString()}</div>
      ) : null}
    </section>
  );

  const commonWordsView = (
    <section className="chat-shell vocab-shell">
      <div className="subtle-back">
        <button type="button" className="ghost subtle-back-btn" onClick={() => setView("dashboard")}>
          Back
        </button>
      </div>
      <div className="vocab-tabs">
        <button
          type="button"
          className={`vocab-tab-btn ${studyMode === "list" ? "active" : ""}`}
          onClick={() => setStudyMode("list")}
        >
          List
        </button>
        <button
          type="button"
          className={`vocab-tab-btn ${studyMode === "cards" ? "active" : ""}`}
          onClick={() => setStudyMode("cards")}
        >
          Flashcards
        </button>
      </div>
      <div className="task-banner vocab-banner">
        <div className="vocab-toolbar">
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setStudyFront((prev) => (prev === "word" ? "translation" : "word"));
              setStudyFlipped({});
            }}
          >
            Start: {studyFront === "word" ? targetLabel : "English"}
          </button>
          <div className="vocab-toolbar-divider" />
          <div className="action-fab" aria-label="Generate words">
            <button type="button" className="ghost action-fab-main">
              Generate
            </button>
            <div className="action-fab-menu">
              <button
                type="button"
                className="ghost action-fab-item"
                onClick={() => generateStudyWords(30)}
                disabled={!language || studyLoading}
              >
                {studyLoading ? "Generating" : "Generate 30"}
              </button>
              <button
                type="button"
                className="ghost action-fab-item"
                onClick={() => generateStudyWords(10)}
                disabled={!language || studyLoading}
              >
                {studyLoading ? "Generating" : "Generate 10 more"}
              </button>
              <button
                type="button"
                className="ghost action-fab-item"
                onClick={() => generateStudyWords(10, "advanced")}
                disabled={!language || studyLoading}
              >
                {studyLoading ? "Generating" : "Important harder words"}
              </button>
            </div>
          </div>
          <button type="button" className="ghost" onClick={() => void archiveCommonUnstarred()}>
            Archive all but starred
          </button>
          <button type="button" className="ghost" onClick={clearStudy}>
            Clear
          </button>
          <div className="toolbar-right">
            <button
              type="button"
              className={`toolbar-archive-toggle ${showStudyArchivedOnly ? "active" : ""}`}
              onClick={() => setShowStudyArchivedOnly((prev) => !prev)}
              aria-label={showStudyArchivedOnly ? "Show active words" : "Show archived words"}
              aria-pressed={showStudyArchivedOnly}
              title={showStudyArchivedOnly ? "Show active" : "Show archived"}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 7h16M6 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7M9 7V5h6v2M9.5 12h5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Archived</span>
            </button>
            <button
              type="button"
              className={`toolbar-star-toggle ${showStudyStarredOnly ? "active" : ""}`}
              onClick={() => setShowStudyStarredOnly((prev) => !prev)}
              aria-label={showStudyStarredOnly ? "Show all words" : "Show starred only"}
              aria-pressed={showStudyStarredOnly}
              title={showStudyStarredOnly ? "Show all" : "Show starred only"}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 3.5l2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6L3.27 9.85l6.03-.88L12 3.5z"
                  fill="currentColor"
                />
              </svg>
              <span>Starred</span>
            </button>
          </div>
        </div>
      </div>
      {!language ? (
        <p className="dashboard-alert">Set a language above to generate vocabulary.</p>
      ) : !studyPack || studyVisibleItems.length === 0 ? (
        <div className="home-vocab-empty">
          {showStudyArchivedOnly ? "No archived words yet." : "Generate a list to start studying."}
        </div>
      ) : studyMode === "list" ? (
        <div className="vocab-list">
          {studyVisibleItems.map(({ entry, index }) => (
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
                  {studyVisibleItems.map(({ entry, index }) => {
                    const flipped = Boolean(studyFlipped[index]);
                    const frontText = studyFront === "word" ? entry.word : entry.translation;
                    const backText = studyFront === "word" ? entry.translation : entry.word;
                    const key = exampleKey("common", entry.word);
                    const pronunciationKey = speechKey("common", entry.word);
                    const speechActive =
                      speechPlayingKey === pronunciationKey || speechLoadingKey === pronunciationKey;
                    const holdId = `common-${index}`;
                    // examples are shown in a modal
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
                              className={`vocab-card-icon ${speechActive ? "active" : ""}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                void playFlashcardAudio("common", entry.word);
                              }}
                              aria-label={speechLoadingKey === pronunciationKey ? "Loading pronunciation" : "Pronounce"}
                              title={speechLoadingKey === pronunciationKey ? "Loading pronunciation" : "Pronounce"}
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                  d="M5 14h3l4 4V6L8 10H5zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="vocab-card-icon"
                              onClick={(event) => {
                                event.stopPropagation();
                                void generateExamples("common", entry.word);
                              }}
                              aria-label="Examples"
                            >
                              Ex
                            </button>
                      <button
                        type="button"
                        className={`vocab-card-icon ${holdDeleteId === holdId ? "holding" : ""}`}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          if (event.button !== 0) return;
                          startArchiveHold(holdId, () => deleteStudyEntry(index));
                        }}
                        onPointerUp={(event) => {
                          event.stopPropagation();
                          if (event.button !== 0) return;
                          endArchiveHold(holdId, () => void archiveStudyEntry(index));
                        }}
                        onPointerLeave={(event) => {
                          event.stopPropagation();
                          cancelArchiveHold(holdId);
                        }}
                        onPointerCancel={(event) => {
                          event.stopPropagation();
                          cancelArchiveHold(holdId);
                        }}
                        aria-label="Archive (hold to delete)"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M4 7h16M6 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7M9 7V5h6v2M9.5 12h5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
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
          const pack = scenarioVocabMap[scenario.id];
          const isArchived = Boolean(pack?.archived);
          const count = pack?.entries.filter((entry) => !entry.archived).length || 0;
          return (
            <button
              key={scenario.id}
              type="button"
              className={`scenario-card${isArchived ? " archived" : ""}`}
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
    <section className="chat-shell vocab-shell">
      <div className="chat-header">
        <button type="button" className="ghost" onClick={() => setView("scenario-vocab")}>
          Back
        </button>
        <div className="chat-title">
          <div className="chat-title-main">{activeScenarioVocab.title} vocabulary</div>
          <div className="chat-title-sub">{activeScenarioVocab.subtitle}</div>
        </div>
      </div>
      <div className="task-banner vocab-banner">
        <div className="task-label">Scenario words</div>
        <div className="task-text">
          {scenarioVocabMap[activeScenarioVocab.id]?.entries.filter((entry) => !entry.archived).length
            ? `${scenarioVocabMap[activeScenarioVocab.id].entries.filter((entry) => !entry.archived).length} words ready`
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
          <button
            type="button"
            className="ghost"
            onClick={() => void archiveScenarioVocabUnstarred(activeScenarioVocab.id)}
          >
            Archive all but starred
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
          Start: {scenarioVocabFront === "word" ? targetLabel : "English"}
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
      ) : scenarioVocabMap[activeScenarioVocab.id]?.entries?.filter((entry) => !entry.archived).length ? (
        scenarioVocabMode === "list" ? (
          <div className="vocab-list">
            {(showScenarioStarredOnly
              ? scenarioVocabMap[activeScenarioVocab.id].entries
                  .map((entry, index) => ({ entry, index }))
                  .filter((item) => !item.entry.archived)
                  .filter((item) => item.entry.starred)
              : scenarioVocabMap[activeScenarioVocab.id].entries
                  .map((entry, index) => ({ entry, index }))
                  .filter((item) => !item.entry.archived)
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
                  .filter((item) => !item.entry.archived)
                  .filter((item) => item.entry.starred)
              : scenarioVocabMap[activeScenarioVocab.id].entries
                  .map((entry, index) => ({ entry, index }))
                  .filter((item) => !item.entry.archived)
            ).map(({ entry, index }) => {
              const flipped = Boolean(scenarioVocabFlipped[index]);
              const frontText = scenarioVocabFront === "word" ? entry.word : entry.translation;
              const backText = scenarioVocabFront === "word" ? entry.translation : entry.word;
              const key = exampleKey("scenario", entry.word, activeScenarioVocab.id);
              const pronunciationKey = speechKey("scenario", entry.word, activeScenarioVocab.id);
              const speechActive =
                speechPlayingKey === pronunciationKey || speechLoadingKey === pronunciationKey;
              const holdId = `scenario-${activeScenarioVocab.id}-${index}`;
              // examples are shown in a modal
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
                        className={`vocab-card-icon ${speechActive ? "active" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          void playFlashcardAudio("scenario", entry.word, activeScenarioVocab.id);
                        }}
                        aria-label={speechLoadingKey === pronunciationKey ? "Loading pronunciation" : "Pronounce"}
                        title={speechLoadingKey === pronunciationKey ? "Loading pronunciation" : "Pronounce"}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M5 14h3l4 4V6L8 10H5zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="vocab-card-icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          void generateExamples("scenario", entry.word, activeScenarioVocab.id);
                        }}
                        aria-label="Examples"
                      >
                        Ex
                      </button>
                      <button
                        type="button"
                        className={`vocab-card-icon ${holdDeleteId === holdId ? "holding" : ""}`}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          if (event.button !== 0) return;
                          startArchiveHold(holdId, () => deleteScenarioEntry(index));
                        }}
                        onPointerUp={(event) => {
                          event.stopPropagation();
                          if (event.button !== 0) return;
                          endArchiveHold(holdId, () => void archiveScenarioEntry(index));
                        }}
                        onPointerLeave={(event) => {
                          event.stopPropagation();
                          cancelArchiveHold(holdId);
                        }}
                        onPointerCancel={(event) => {
                          event.stopPropagation();
                          cancelArchiveHold(holdId);
                        }}
                        aria-label="Archive (hold to delete)"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M4 7h16M6 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7M9 7V5h6v2M9.5 12h5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
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

  const topicDetailView = activeTopic ? (
    <section className="chat-shell vocab-shell">
      <div className="chat-header">
        <button type="button" className="ghost" onClick={() => setView("dashboard")}>
          Back
        </button>
        <div className="chat-title">
          <div className="chat-title-main">{activeTopic} vocabulary</div>
          <div className="chat-title-sub">Custom topic words.</div>
        </div>
      </div>
      <div className="task-banner vocab-banner">
        <div className="task-label">Topic list</div>
        <div className="task-text">
          {topicVocabMap[activeTopic]?.entries.filter((entry) => !entry.archived).length
            ? `${topicVocabMap[activeTopic].entries.filter((entry) => !entry.archived).length} words ready`
            : "Generate a list to begin."}
        </div>
        <div className="home-vocab-actions">
          <button
            type="button"
            className="ghost"
            onClick={() => generateTopicWords(20, activeTopic)}
            disabled={!language || topicVocabLoading}
          >
            {topicVocabLoading ? "Generating" : "Generate 20"}
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => generateTopicWords(10, activeTopic)}
            disabled={!language || topicVocabLoading}
          >
            {topicVocabLoading ? "Generating" : "Generate 10 more"}
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => void archiveTopicUnstarred(activeTopic)}
          >
            Archive all but starred
          </button>
          <button type="button" className="ghost" onClick={clearTopicVocab}>
            Clear
          </button>
        </div>
      </div>
      <div className="home-vocab-controls">
        <div className="segmented">
          <button
            type="button"
            className={`segmented-btn ${topicVocabMode === "list" ? "active" : ""}`}
            onClick={() => setTopicVocabMode("list")}
          >
            List
          </button>
          <button
            type="button"
            className={`segmented-btn ${topicVocabMode === "cards" ? "active" : ""}`}
            onClick={() => setTopicVocabMode("cards")}
          >
            Flashcards
          </button>
        </div>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setTopicVocabFront((prev) => (prev === "word" ? "translation" : "word"));
            setTopicVocabFlipped({});
          }}
        >
          Start: {topicVocabFront === "word" ? targetLabel : "English"}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => setShowTopicStarredOnly((prev) => !prev)}
        >
          {showTopicStarredOnly ? "Show all" : "Starred only"}
        </button>
      </div>
      {!language ? (
        <p className="dashboard-alert">Set a language above to generate vocabulary.</p>
      ) : topicVocabMap[activeTopic]?.entries?.filter((entry) => !entry.archived).length ? (
        topicVocabMode === "list" ? (
          <div className="vocab-list">
            {(showTopicStarredOnly
              ? topicVocabMap[activeTopic].entries
                  .map((entry, index) => ({ entry, index }))
                  .filter((item) => !item.entry.archived)
                  .filter((item) => item.entry.starred)
              : topicVocabMap[activeTopic].entries
                  .map((entry, index) => ({ entry, index }))
                  .filter((item) => !item.entry.archived)
            ).map(({ entry, index }) => (
              <div key={`${entry.word}-${index}`} className="vocab-row">
                <div className="vocab-word">{entry.word}</div>
                <div className="vocab-translation">{entry.translation}</div>
                <div className="vocab-actions">
                  <button type="button" className="ghost" onClick={() => toggleTopicStar(index)}>
                    {entry.starred ? "Unstar" : "Star"}
                  </button>
                  <button type="button" className="ghost" onClick={() => deleteTopicEntry(index)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="vocab-cards">
            {(showTopicStarredOnly
              ? topicVocabMap[activeTopic].entries
                  .map((entry, index) => ({ entry, index }))
                  .filter((item) => !item.entry.archived)
                  .filter((item) => item.entry.starred)
              : topicVocabMap[activeTopic].entries
                  .map((entry, index) => ({ entry, index }))
                  .filter((item) => !item.entry.archived)
            ).map(({ entry, index }) => {
              const flipped = Boolean(topicVocabFlipped[index]);
              const frontText = topicVocabFront === "word" ? entry.word : entry.translation;
              const backText = topicVocabFront === "word" ? entry.translation : entry.word;
              const pronunciationKey = speechKey("topic", entry.word, activeTopic);
              const speechActive =
                speechPlayingKey === pronunciationKey || speechLoadingKey === pronunciationKey;
              const holdId = `topic-${activeTopic}-${index}`;
              return (
                <div key={`${entry.word}-${index}`} className="vocab-card-wrap">
                  <div
                    className={`vocab-card ${flipped ? "flipped" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleTopicCard(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleTopicCard(index);
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
                          toggleTopicStar(index);
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
                        className={`vocab-card-icon ${speechActive ? "active" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          void playFlashcardAudio("topic", entry.word, activeTopic);
                        }}
                        aria-label={speechLoadingKey === pronunciationKey ? "Loading pronunciation" : "Pronounce"}
                        title={speechLoadingKey === pronunciationKey ? "Loading pronunciation" : "Pronounce"}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M5 14h3l4 4V6L8 10H5zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="vocab-card-icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          void generateExamples("topic", entry.word, activeTopic);
                        }}
                        aria-label="Examples"
                      >
                        Ex
                      </button>
                      <button
                        type="button"
                        className={`vocab-card-icon ${holdDeleteId === holdId ? "holding" : ""}`}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          if (event.button !== 0) return;
                          startArchiveHold(holdId, () => deleteTopicEntry(index));
                        }}
                        onPointerUp={(event) => {
                          event.stopPropagation();
                          if (event.button !== 0) return;
                          endArchiveHold(holdId, () => void archiveTopicEntry(index));
                        }}
                        onPointerLeave={(event) => {
                          event.stopPropagation();
                          cancelArchiveHold(holdId);
                        }}
                        onPointerCancel={(event) => {
                          event.stopPropagation();
                          cancelArchiveHold(holdId);
                        }}
                        aria-label="Archive (hold to delete)"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M4 7h16M6 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7M9 7V5h6v2M9.5 12h5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
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
        <div className="home-vocab-empty">Generate words for this topic.</div>
      )}
    </section>
  ) : null;

  const chatView = (
    <section className={`chat-shell ${isBuddyChat ? "buddy-shell" : ""}`}>
      <div className="chat-header">
        <button type="button" className="ghost" onClick={() => setView("dashboard")}>
          Back
        </button>
        <div className="chat-title">
          <div className="chat-title-main">{isBuddyChat ? "Buddy" : activeScenario?.title}</div>
          <div className="chat-title-sub">
            {isBuddyChat
              ? "Adaptive chat, tiny drills, and quick active recall."
              : activeScenario?.subtitle}
          </div>
        </div>
        <div className="chat-actions">
          <button type="button" className="ghost" onClick={() => setShowVocabModal(true)}>
            Vocabulary
          </button>
          {isBuddyChat ? (
            <button type="button" className="ghost" onClick={() => void startBuddyChat(true)}>
              New chat
            </button>
          ) : (
            <button
              type="button"
              className="ghost"
              onClick={() => getSuggestion()}
              disabled={suggestionLoading}
            >
              {suggestionLoading ? "Thinking" : "Hint"}
            </button>
          )}
        </div>
      </div>

      {isBuddyChat ? (
        <div className="task-banner buddy-banner">
          <div className="task-label">Buddy focus</div>
          <div className="buddy-status-row">
            <span className="surge-status-pill">Learning {buddyProfileSnapshot.learningCount}</span>
            <span className="surge-status-pill">Strong {buddyProfileSnapshot.knownCount}</span>
            <span className="surge-status-pill">Recent {buddyProfileSnapshot.recentCount}</span>
          </div>
          <div className="task-text">
            Buddy already knows what you have practiced and what still needs work. Pick a path or just reply.
          </div>
          <div className="buddy-quick-actions">
            {buddyQuickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className="ghost buddy-chip"
                onClick={() => sendUserText(action.prompt)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="task-banner">
          <div className="task-label">Current task</div>
          <div className="task-text">{taskLoading ? "Generating task" : taskText || ""}</div>
          <div className={`task-status ${taskCompleted ? "done" : taskChecking ? "checking" : ""}`}>
            {taskCompleted ? "Completed" : taskChecking ? "Checking" : "In progress"}
          </div>
        </div>
      )}
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
          placeholder={isBuddyChat ? "Reply or ask for a quiz" : "Type your message"}
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
    <div className="app-shell" onPointerDownCapture={handleAppPointerDownCapture}>
      <header className="top-bar">
        <div className="brand">
          <button type="button" className="brand-button" onClick={() => setView("dashboard")}>
            <span className="brand-name">NeoLingo</span>
            <span className="brand-tag">Calm practice. Fast progress.</span>
          </button>
        </div>

        <div className="header-controls">
          <div className="control-item compact">
            <label className="control-label">Theme</label>
            <div className="difficulty-controls theme-toggle" role="tablist" aria-label="Theme">
              <button
                type="button"
                className={`difficulty-btn ${theme === "dark" ? "active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                Dark
              </button>
              <button
                type="button"
                className={`difficulty-btn ${theme === "light" ? "active" : ""}`}
                onClick={() => setTheme("light")}
              >
                Light
              </button>
            </div>
          </div>

          {authUser ? (
            <>
              <div className="control-group">
                <div className="control-item">
                  <label className="control-label">Language</label>
                  <select
                    className="control-select"
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
                        className="language-input"
                        value={newLanguageInput}
                        onChange={(event) => setNewLanguageInput(event.target.value)}
                        placeholder="Add language"
                      />
                      <button
                        type="button"
                        className="language-save-btn"
                        onClick={() => void saveLanguagePreference(newLanguageInput)}
                      >
                        Save
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="control-item">
                  <label className="control-label">Difficulty</label>
                  <div className="difficulty-controls">
                    <button
                      type="button"
                      className={`difficulty-btn ${difficulty === "easy" ? "active" : ""}`}
                      onClick={() => setDifficulty("easy")}
                    >
                      Easy
                    </button>
                    <button
                      type="button"
                      className={`difficulty-btn ${difficulty === "medium" ? "active" : ""}`}
                      onClick={() => setDifficulty("medium")}
                    >
                      Medium
                    </button>
                    <button
                      type="button"
                      className={`difficulty-btn ${difficulty === "hard" ? "active" : ""}`}
                      onClick={() => setDifficulty("hard")}
                    >
                      Hard
                    </button>
                  </div>
                </div>
              </div>

              <div className="user-section">
                <div className="user-info">
                  <span className="user-points">Points {totalPoints()}</span>
                  <span className="user-name">{profileName || username || authUser.email}</span>
                </div>
                <button type="button" className="signout-btn" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            </>
          ) : null}
        </div>
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
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setShowTopicModal(true)}
                >
                  + New topic
                </button>
              </div>
              <div className="scenario-grid">
                <button
                  type="button"
                  className="scenario-card"
                  onClick={() => void startBuddyChat(!hasBuddyConversation)}
                  disabled={!language}
                >
                  <div className="scenario-card-header">
                    <div className="scenario-card-title">Buddy</div>
                    <div className="scenario-ring">
                      <div className="scenario-ring-inner">{buddyProfileSnapshot.learningCount}</div>
                    </div>
                  </div>
                  <div className="scenario-card-body">
                    Adaptive chats, quick translations, and tiny recall checks with your learned words.
                  </div>
                  <div className="scenario-card-meta">
                    {hasBuddyConversation ? "Continue Buddy" : "Open Buddy"} · Learning {buddyProfileSnapshot.learningCount} · Strong {buddyProfileSnapshot.knownCount}
                  </div>
                </button>
                <button
                  type="button"
                  className="scenario-card"
                  onClick={() => void startSurgeSession(!surgeSession)}
                  disabled={!language || surgeLoading}
                >
                  <div className="scenario-card-header">
                    <div className="scenario-card-title">Surge</div>
                    <div className="scenario-ring">
                      <div className="scenario-ring-inner">{surgeDueCount}</div>
                    </div>
                  </div>
                  <div className="scenario-card-body">
                    {surgeSession ? "Continue smart spaced recall." : "Start a fast core-vocab flow."}
                  </div>
                  <div className="scenario-card-meta">
                    {surgeSession ? "Continue Surge" : "Start Surge"} · In session {surgeInSessionCount} · Mastered {surgeMasteredCount}
                  </div>
                </button>
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
                {topicList.map((topic) => {
                  const count = topicVocabMap[topic]?.entries.filter((entry) => !entry.archived).length || 0;
                  return (
                    <button
                      key={topic}
                      type="button"
                      className="scenario-card"
                      onClick={() => {
                        setActiveTopic(topic);
                        setTopicVocabFlipped({});
                        setView("topic-detail");
                      }}
                    >
                      <div className="scenario-card-header">
                        <div className="scenario-card-title">{topic}</div>
                        <div className="scenario-ring">
                          <div className="scenario-ring-inner">{count}</div>
                        </div>
                      </div>
                      <div className="scenario-card-body">Custom topic vocabulary.</div>
                    </button>
                  );
                })}
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
        ) : view === "topic-detail" ? (
          topicDetailView
        ) : view === "surge" ? (
          surgeView
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

      {showTopicModal ? (
        <div
          className="vocab-modal-overlay"
          onClick={() => {
            setShowTopicModal(false);
            setTopicInput("");
          }}
        >
          <div className="vocab-modal" onClick={(event) => event.stopPropagation()}>
            <div className="vocab-modal-header">
              <div className="vocab-title">New vocabulary topic</div>
              <button
                type="button"
                className="ghost vocab-clear"
                onClick={() => {
                  setShowTopicModal(false);
                  setTopicInput("");
                }}
              >
                Close
              </button>
            </div>
            <div className="vocab-modal-body">
              <div className="language-add">
                <input
                  type="text"
                  className="language-input"
                  value={topicInput}
                  onChange={(event) => setTopicInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      createTopicVocab(topicInput);
                    }
                  }}
                  placeholder="e.g. Travel planning, Fitness, Office work"
                />
                <button
                  type="button"
                  className="language-save-btn"
                  onClick={() => createTopicVocab(topicInput)}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {exampleModal ? (
        <div
          className="vocab-modal-overlay"
          onClick={() => {
            setExampleModal(null);
            setTooltip(null);
            activeTargetRef.current = null;
          }}
        >
          <div className="vocab-modal" onClick={(event) => event.stopPropagation()}>
            <div className="vocab-modal-header">
              <div className="vocab-title">Examples for {exampleModal.word}</div>
              <button
                type="button"
                className="ghost vocab-clear"
                onClick={() => {
                  setExampleModal(null);
                  setTooltip(null);
                  activeTargetRef.current = null;
                }}
              >
                Close
              </button>
            </div>
            <div className="vocab-modal-body">
              {exampleModal.items.length ? (
                <div className="vocab-examples-list">
                  <div className="vocab-examples-note">
                    Tap any word in the example sentence to save it to your study list.
                  </div>
                  {exampleModal.items.map((item, index) => {
                    return (
                      <div key={`${exampleModal.word}-${index}`} className="vocab-example-line">
                        <div className="vocab-example-top">
                          <div className="vocab-example-label">{item.label}</div>
                          <button
                            type="button"
                            className="ghost vocab-example-audio"
                            onClick={() => void playFlashcardAudio("example", item.sentence)}
                          >
                            Hear it
                          </button>
                        </div>
                        <div className="vocab-example-sentence">
                          {renderClickableTokens(item.sentence, `ex-${index}`, undefined, {
                              scope: exampleModal.scope,
                              scenarioId: exampleModal.scenarioId,
                              sentence: item.sentence,
                            })}
                        </div>
                        <div className="vocab-example-translation">{item.translation}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="vocab-examples">Generating examples...</div>
              )}
            </div>
          </div>
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
                  Start: {vocabFront === "word" ? targetLabel : "English"}
                </button>
                <button
                  type="button"
                  className="ghost vocab-tab"
                  onClick={() => setShowStarredOnly((prev) => !prev)}
                >
                  {showStarredOnly ? "Show all" : "Starred only"}
                </button>
                <button
                  type="button"
                  className="ghost vocab-tab"
                  onClick={() => void archiveChatUnstarred()}
                >
                  Archive unstarred
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
                      const key = exampleKey("chat", entry.word);
                      const pronunciationKey = speechKey("chat", entry.word);
                      const speechActive =
                        speechPlayingKey === pronunciationKey || speechLoadingKey === pronunciationKey;
                      const holdId = `chat-${entry.key}`;
                      // examples are shown in a modal
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
                                className={`vocab-card-icon ${speechActive ? "active" : ""}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void playFlashcardAudio("chat", entry.word);
                                }}
                                aria-label={speechLoadingKey === pronunciationKey ? "Loading pronunciation" : "Pronounce"}
                                title={speechLoadingKey === pronunciationKey ? "Loading pronunciation" : "Pronounce"}
                              >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                  <path
                                    d="M5 14h3l4 4V6L8 10H5zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="vocab-card-icon"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void generateExamples("chat", entry.word);
                                }}
                                aria-label="Examples"
                              >
                                Ex
                              </button>
                              <button
                                type="button"
                                className={`vocab-card-icon ${holdDeleteId === holdId ? "holding" : ""}`}
                                onPointerDown={(event) => {
                                  event.stopPropagation();
                                  if (event.button !== 0) return;
                                  startArchiveHold(holdId, () => deleteVocabEntry(entry.key));
                                }}
                                onPointerUp={(event) => {
                                  event.stopPropagation();
                                  if (event.button !== 0) return;
                                  endArchiveHold(holdId, () => void archiveVocabEntry(entry.key));
                                }}
                                onPointerLeave={(event) => {
                                  event.stopPropagation();
                                  cancelArchiveHold(holdId);
                                }}
                                onPointerCancel={(event) => {
                                  event.stopPropagation();
                                  cancelArchiveHold(holdId);
                                }}
                                aria-label="Archive (hold to delete)"
                              >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                  <path
                                    d="M4 7h16M6 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7M9 7V5h6v2M9.5 12h5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
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
