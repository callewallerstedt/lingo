"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Difficulty } from "../lib/store";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { SCENARIOS, type ScenarioDefinition } from "../lib/scenarios";
import {
  DEFAULT_SURGE_MODE_PREFERENCES,
  SURGE_MODE_KEY,
  SURGE_PROGRESS_KEY_PREFIX,
  SURGE_SESSION_KEY,
  createEmptySurgeSession,
  dedupeSurgeItems,
  getDirectionForStage,
  getNextReviewAtForStage,
  matchesSurgeAnswer,
  normalizeSurgeAnswer,
  normalizeSurgeKey,
  normalizeSurgeModePreferences,
  shuffleList,
  uniqueStrings,
  type SurgeDirection,
  type SurgeItem,
  type SurgeModePreferences,
  type SurgePhase,
  type SurgeProgressRecord,
  type SurgeSession,
  type SurgeSessionSnapshot,
  type SurgeStatus,
} from "../lib/surge";
import {
  JOURNEY_CHAPTERS,
  JOURNEY_MODE_LABELS,
  JOURNEY_STEP_LABELS,
  JOURNEY_STEP_ORDER,
  JOURNEY_STORAGE_KEY_PREFIX,
  collectJourneyLearnedSentences,
  createEmptyJourneyState,
  createJourneyActiveLesson,
  createJourneyMatchState,
  createJourneyProgressRecord,
  getJourneyChapter,
  getJourneyNextPart,
  getJourneyPart,
  getJourneyPartKey,
  normalizeJourneyLessonContent,
  normalizeJourneySnapshot,
  type JourneyActiveLesson,
  type JourneyLessonContent,
  type JourneyMatchState,
  type JourneyPartProgress,
  type JourneyStateSnapshot,
  type JourneyStepId,
} from "../lib/journey";

const TASKS_PER_SCENARIO = 10;
const BUDDY_STATE_KEY_PREFIX = "lingoarc_buddy_state_";
const QUICK_CHAT_STATE_KEY_PREFIX = "lingoarc_quick_chat_";
const QUICK_CHAT_LAYOUT_KEY = "lingoarc_quick_chat_layout";

function extractJourneyOptionTokens(text: string) {
  return text
    .split(/[^\p{L}\p{N}'-]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && token.length < 28);
}

type QuickChatLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
};

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
  folder?: string | null;
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

type VocabScope = "chat" | "common" | "sentence" | "scenario" | "topic" | "surge" | "example" | "quick" | "journey";
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
  practicedWordCount: number;
};

type BuddySavedState = {
  messages: Message[];
  savedAt: number;
};

type QuickChatMode = "translation" | "correction" | "answer" | "tts";
type QuickAssistantPayload = {
  mode: QuickChatMode;
  title: string;
  text: string;
  targetText?: string;
  translation?: string;
  verdict?: "ok" | "fix" | "note" | null;
  improved?: string;
  note?: string;
  ttsText?: string;
};

type QuickChatMessage = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  payload?: QuickAssistantPayload;
};

type ScenarioGroupId = "foundation" | "travel" | "life";
type JourneyPersistedRow = {
  progress_state: JourneyStateSnapshot | null;
  updated_at?: string | null;
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
  const [isCompactViewport, setIsCompactViewport] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [mobileHeaderHidden, setMobileHeaderHidden] = useState<boolean>(false);
  const [mobileVocabTools, setMobileVocabTools] = useState<{
    common: boolean;
    sentence: boolean;
    scenario: boolean;
    topic: boolean;
    surge: boolean;
  }>({
    common: false,
    sentence: false,
    scenario: false,
    topic: false,
    surge: false,
  });

  const [language, setLanguage] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [loadingProgress, setLoadingProgress] = useState<boolean>(false);

  const [view, setView] = useState<
    "dashboard" | "journey" | "chat" | "common" | "sentences" | "scenario-vocab" | "scenario-detail" | "topic-detail" | "surge"
  >("dashboard");
  const [activeScenario, setActiveScenario] = useState<ScenarioDefinition | null>(null);
  const [taskText, setTaskText] = useState<string>("");
  const [taskLoading, setTaskLoading] = useState<boolean>(false);
  const [taskChecking, setTaskChecking] = useState<boolean>(false);
  const [taskCompleted, setTaskCompleted] = useState<boolean>(false);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [rewardPoints, setRewardPoints] = useState<number>(0);
  const [chatMode, setChatMode] = useState<ChatMode>("scenario");
  const [activeScenarioGroup, setActiveScenarioGroup] = useState<ScenarioGroupId>("foundation");
  const [buddySavedState, setBuddySavedState] = useState<BuddySavedState | null>(null);

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
  const [sentencePack, setSentencePack] = useState<StudyPack | null>(null);
  const [sentenceMode, setSentenceMode] = useState<"list" | "cards">("list");
  const [sentenceFront, setSentenceFront] = useState<"word" | "translation">("word");
  const [sentenceFlipped, setSentenceFlipped] = useState<Record<number, boolean>>({});
  const [sentenceLoading, setSentenceLoading] = useState<boolean>(false);
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
  const [studyFolderFilter, setStudyFolderFilter] = useState<string>("all");
  const [showSentenceStarredOnly, setShowSentenceStarredOnly] = useState<boolean>(false);
  const [sentenceFolderFilter, setSentenceFolderFilter] = useState<string>("all");
  const [showScenarioStarredOnly, setShowScenarioStarredOnly] = useState<boolean>(false);
  const [scenarioFolderFilter, setScenarioFolderFilter] = useState<string>("all");
  const [topicFolderFilter, setTopicFolderFilter] = useState<string>("all");
  const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);
  const [holdDeleteId, setHoldDeleteId] = useState<string | null>(null);
  const [surgeProgressMap, setSurgeProgressMap] = useState<Record<string, SurgeProgressRecord>>({});
  const [surgeSession, setSurgeSession] = useState<SurgeSession | null>(null);
  const [surgeLoading, setSurgeLoading] = useState<boolean>(false);
  const [surgeError, setSurgeError] = useState<string | null>(null);
  const [surgeSavedAt, setSurgeSavedAt] = useState<number>(0);
  const [surgeHydrated, setSurgeHydrated] = useState<boolean>(false);
  const [showSurgeMastered, setShowSurgeMastered] = useState<boolean>(false);
  const [surgeModes, setSurgeModes] = useState<SurgeModePreferences>(DEFAULT_SURGE_MODE_PREFERENCES);
  const [journeyState, setJourneyState] = useState<JourneyStateSnapshot | null>(null);
  const [journeyHydrated, setJourneyHydrated] = useState<boolean>(false);
  const [journeyLoading, setJourneyLoading] = useState<boolean>(false);
  const [journeyError, setJourneyError] = useState<string | null>(null);
  const [journeySavedAt, setJourneySavedAt] = useState<number>(0);
  const [quickChatOpen, setQuickChatOpen] = useState<boolean>(true);
  const [quickChatLarge, setQuickChatLarge] = useState<boolean>(true);
  const [quickChatLayout, setQuickChatLayout] = useState<QuickChatLayout | null>(null);
  const [quickChatInput, setQuickChatInput] = useState<string>("");
  const [quickChatMessages, setQuickChatMessages] = useState<QuickChatMessage[]>([]);
  const [quickChatLoading, setQuickChatLoading] = useState<boolean>(false);
  const [quickChatRecording, setQuickChatRecording] = useState<boolean>(false);
  const [quickChatVoiceReady, setQuickChatVoiceReady] = useState<boolean>(false);

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const surgeInputRef = useRef<HTMLInputElement | null>(null);
  const journeyInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const surgeTypingPanelRef = useRef<HTMLDivElement | null>(null);
  const activeTargetRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const ignoreWindowClickRef = useRef<boolean>(false);
  const messagesStateRef = useRef<Message[]>([]);
  const activeScenarioRef = useRef<ScenarioDefinition | null>(null);
  const chatModeRef = useRef<ChatMode>("scenario");
  const buddyProfileRef = useRef<BuddyProfileSnapshot | null>(null);
  const surgeModesRef = useRef<SurgeModePreferences>(DEFAULT_SURGE_MODE_PREFERENCES);
  const surgeProgressRef = useRef<Record<string, SurgeProgressRecord>>({});
  const pendingSurgeSyncRef = useRef<Record<string, SurgeProgressRecord>>({});
  const surgeSyncInFlightRef = useRef<boolean>(false);
  const surgeSyncRetryTimerRef = useRef<number | null>(null);
  const pendingSurgeSessionSyncRef = useRef<SurgeSessionSnapshot | null>(null);
  const surgeSessionSyncInFlightRef = useRef<boolean>(false);
  const surgeSessionSyncRetryTimerRef = useRef<number | null>(null);
  const journeyStateRef = useRef<JourneyStateSnapshot | null>(null);
  const pendingJourneySyncRef = useRef<JourneyStateSnapshot | null>(null);
  const journeySyncInFlightRef = useRef<boolean>(false);
  const journeySyncRetryTimerRef = useRef<number | null>(null);
  const journeyAutoAdvanceTimerRef = useRef<number | null>(null);
  const taskRef = useRef<string>("");
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);
  const archiveTimerRef = useRef<number | null>(null);
  const archiveTriggeredRef = useRef<boolean>(false);
  const speechCacheRef = useRef<Map<string, string>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechPlaybackTokenRef = useRef<number>(0);
  const uiAudioContextRef = useRef<AudioContext | null>(null);
  const quickChatMessagesRef = useRef<HTMLDivElement | null>(null);
  const quickChatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const quickChatShellRef = useRef<HTMLDivElement | null>(null);
  const quickChatPanelRef = useRef<HTMLElement | null>(null);
  const quickChatRecorderRef = useRef<MediaRecorder | null>(null);
  const quickChatChunksRef = useRef<Blob[]>([]);
  const quickChatDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);
  const quickChatResizeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const clientCache = useMemo(() => new Map<string, string>(), []);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("linguachat_language");
    const savedVocab = localStorage.getItem("lingoarc_vocab");
    const savedFront = localStorage.getItem("lingoarc_vocab_front");
    const savedStudy = localStorage.getItem("lingoarc_study_pack");
    const savedSentencePack = localStorage.getItem("lingoarc_sentence_pack");
    const savedScenarioVocab = localStorage.getItem("lingoarc_scenario_vocab");
    const savedTopicVocab = localStorage.getItem("lingoarc_topic_vocab");
    const savedSurgeModes = localStorage.getItem(SURGE_MODE_KEY);
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
    if (savedSentencePack) {
      try {
        const parsed = JSON.parse(savedSentencePack) as StudyPack;
        if (parsed && typeof parsed.language === "string" && Array.isArray(parsed.entries)) {
          setSentencePack(parsed);
        }
      } catch {
        // Ignore malformed sentence cache
      }
    }
    if (savedSurgeModes) {
      try {
        setSurgeModes(normalizeSurgeModePreferences(JSON.parse(savedSurgeModes)));
      } catch {
        setSurgeModes(DEFAULT_SURGE_MODE_PREFERENCES);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (surgeSyncRetryTimerRef.current !== null) {
        window.clearTimeout(surgeSyncRetryTimerRef.current);
      }
      if (surgeSessionSyncRetryTimerRef.current !== null) {
        window.clearTimeout(surgeSessionSyncRetryTimerRef.current);
      }
      if (journeySyncRetryTimerRef.current !== null) {
        window.clearTimeout(journeySyncRetryTimerRef.current);
      }
      if (journeyAutoAdvanceTimerRef.current !== null) {
        window.clearTimeout(journeyAutoAdvanceTimerRef.current);
      }
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
    const mediaQuery = window.matchMedia("(max-width: 720px)");
    const syncViewport = () => {
      const compact = mediaQuery.matches;
      setIsCompactViewport(compact);
      if (!compact) {
        setMobileMenuOpen(false);
        setMobileHeaderHidden(false);
      }
    };

    syncViewport();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }
    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  useEffect(() => {
    if (!isCompactViewport) return;
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      if (mobileMenuOpen) {
        setMobileHeaderHidden(false);
        lastScrollY = currentScrollY;
        return;
      }
      if (currentScrollY <= 24 || currentScrollY < lastScrollY - 8) {
        setMobileHeaderHidden(false);
      } else if (currentScrollY > lastScrollY + 8 && currentScrollY > 88) {
        setMobileHeaderHidden(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isCompactViewport, mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileHeaderHidden(false);
    setMobileVocabTools({
      common: false,
      sentence: false,
      scenario: false,
      topic: false,
      surge: false,
    });
  }, [authUser, isCompactViewport, language, view]);

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
      ...(sentencePack?.entries.filter((entry) => !entry.archived) ?? []),
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
      practicedWordCount: uniqueStrings([
        ...knownItems,
        ...learningItems,
        ...recentItems,
      ]).length,
    };
  }, [
    difficulty,
    language,
    profileName,
    progressMap,
    scenarioVocabMap,
    sentencePack,
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
    surgeModesRef.current = surgeModes;
    localStorage.setItem(SURGE_MODE_KEY, JSON.stringify(surgeModes));
  }, [surgeModes]);

  useEffect(() => {
    surgeProgressRef.current = surgeProgressMap;
  }, [surgeProgressMap]);

  useEffect(() => {
    journeyStateRef.current = journeyState;
  }, [journeyState]);

  useEffect(() => {
    if (!surgeSession || isSurgeModeEnabled(surgeSession.phase, surgeModes)) {
      return;
    }

    let cancelled = false;

    const syncPhase = async () => {
      if (!surgeSession) return;

      if (surgeSession.phase === "preview") {
        if (surgeModes.match) {
          if (!cancelled) {
            setSurgeSession(createMatchSession(surgeSession));
          }
          return;
        }
        if (surgeModes.typing) {
          if (!cancelled) {
            setSurgeSession(createTypingSession(surgeSession, surgeSession.activeRound));
          }
          return;
        }
      }

      if (surgeSession.phase === "match") {
        if (!cancelled) {
          await completeSurgeMatchRound(surgeSession);
        }
        return;
      }

      const carryQueue = dedupeSurgeItems([
        ...surgeSession.reviewQueue,
        ...surgeSession.typingQueue,
        ...surgeSession.delayedReviewQueue.map((entry) => entry.item),
      ]).filter((item) => surgeProgressRef.current[item.itemKey]?.status !== "known");

      const rebuilt = await buildNextSurgeRound({
        ...surgeSession,
        reviewQueue: carryQueue,
        typingQueue: [],
        delayedReviewQueue: [],
        typingInput: "",
        typingDirection: null,
        typingHintCount: 0,
        typingFeedback: null,
      });

      if (!cancelled) {
        setSurgeSession(rebuilt);
      }
    };

    void syncPhase();
    return () => {
      cancelled = true;
    };
  }, [surgeModes, surgeSession]);

  useEffect(() => {
    if (!language) {
      setBuddySavedState(null);
      return;
    }
    const raw = localStorage.getItem(`${BUDDY_STATE_KEY_PREFIX}${language}`);
    if (!raw) {
      setBuddySavedState(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<BuddySavedState>;
      const restoredMessages = Array.isArray(parsed.messages)
        ? parsed.messages.filter(
            (message): message is Message =>
              Boolean(message) &&
              typeof message.id === "string" &&
              (message.role === "user" || message.role === "assistant") &&
              typeof message.content === "string"
          )
        : [];
      if (!restoredMessages.length) {
        setBuddySavedState(null);
        return;
      }
      setBuddySavedState({
        messages: restoredMessages,
        savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
      });
    } catch {
      setBuddySavedState(null);
    }
  }, [language]);

  useEffect(() => {
    setQuickChatVoiceReady(
      typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        Boolean(navigator.mediaDevices?.getUserMedia) &&
        typeof MediaRecorder !== "undefined"
    );
  }, []);

  useEffect(() => {
    if (!language) {
      setQuickChatMessages([]);
      return;
    }
    const raw = localStorage.getItem(`${QUICK_CHAT_STATE_KEY_PREFIX}${language}`);
    if (!raw) {
      setQuickChatMessages([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as QuickChatMessage[];
      const restored = Array.isArray(parsed)
        ? parsed.filter(
            (item): item is QuickChatMessage =>
              item &&
              typeof item.id === "string" &&
              (item.role === "user" || item.role === "assistant")
          )
        : [];
      setQuickChatMessages(restored);
    } catch {
      setQuickChatMessages([]);
    }
  }, [language]);

  useEffect(() => {
    if (!language) return;
    localStorage.setItem(`${QUICK_CHAT_STATE_KEY_PREFIX}${language}`, JSON.stringify(quickChatMessages));
  }, [language, quickChatMessages]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(QUICK_CHAT_LAYOUT_KEY);
    if (!raw) {
      setQuickChatLayout(getQuickChatPresetLayout(true));
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<QuickChatLayout>;
      if (
        typeof parsed.left === "number" &&
        typeof parsed.top === "number" &&
        typeof parsed.width === "number" &&
        typeof parsed.height === "number"
      ) {
        setQuickChatLayout(clampQuickChatLayout(parsed as QuickChatLayout));
        return;
      }
    } catch {
      // Ignore malformed quick chat layout
    }
    setQuickChatLayout(getQuickChatPresetLayout(true));
  }, []);

  useEffect(() => {
    if (!quickChatLayout || typeof window === "undefined") return;
    localStorage.setItem(QUICK_CHAT_LAYOUT_KEY, JSON.stringify(quickChatLayout));
  }, [quickChatLayout]);

  useEffect(() => {
    if (!language) return;
    if (chatMode !== "buddy" || messages.length === 0) {
      return;
    }
    const payload: BuddySavedState = {
      messages,
      savedAt: Date.now(),
    };
    setBuddySavedState(payload);
    localStorage.setItem(`${BUDDY_STATE_KEY_PREFIX}${language}`, JSON.stringify(payload));
  }, [chatMode, language, messages]);

  useEffect(() => {
    localStorage.setItem("lingoarc_vocab", JSON.stringify(vocabEntries));
  }, [vocabEntries]);

  useEffect(() => {
    if (studyPack) {
      localStorage.setItem("lingoarc_study_pack", JSON.stringify(studyPack));
      return;
    }
    localStorage.removeItem("lingoarc_study_pack");
  }, [studyPack]);

  useEffect(() => {
    if (sentencePack) {
      localStorage.setItem("lingoarc_sentence_pack", JSON.stringify(sentencePack));
      return;
    }
    localStorage.removeItem("lingoarc_sentence_pack");
  }, [sentencePack]);

  useEffect(() => {
    localStorage.setItem("lingoarc_scenario_vocab", JSON.stringify(scenarioVocabMap));
  }, [scenarioVocabMap]);

  useEffect(() => {
    localStorage.setItem("lingoarc_topic_vocab", JSON.stringify(topicVocabMap));
  }, [topicVocabMap]);

  useEffect(() => {
    if (authLoading || !surgeHydrated) {
      return;
    }
    if (!language) {
      return;
    }
    if (!surgeSession || surgeSession.language !== language) {
      return;
    }
    const snapshot: SurgeSessionSnapshot = {
      session: surgeSession,
      updatedAt: Date.now(),
    };
    localStorage.setItem(SURGE_SESSION_KEY, JSON.stringify(snapshot));
    queueSurgeSessionSync(snapshot);
  }, [authLoading, language, surgeHydrated, surgeSession]);

  useEffect(() => {
    if (authLoading || !surgeHydrated) return;
    if (!language) return;
    localStorage.setItem(
      `${SURGE_PROGRESS_KEY_PREFIX}${language}`,
      JSON.stringify(surgeProgressMap)
    );
  }, [authLoading, language, surgeHydrated, surgeProgressMap]);

  useEffect(() => {
    if (authLoading || !journeyHydrated || !language || !journeyState) {
      return;
    }
    if (journeyState.language !== language) {
      return;
    }
    localStorage.setItem(`${JOURNEY_STORAGE_KEY_PREFIX}${language}`, JSON.stringify(journeyState));
    setJourneySavedAt(journeyState.updatedAt || Date.now());
    queueJourneyStateSync(journeyState);
  }, [authLoading, journeyHydrated, journeyState, language]);


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
    if (!authUser || !language) return;
    if (!Object.keys(pendingSurgeSyncRef.current).length) return;
    void flushPendingSurgeProgress();
  }, [authUser, language]);

  useEffect(() => {
    if (!authUser || !language) return;
    if (!pendingSurgeSessionSyncRef.current) return;
    void flushPendingSurgeSession();
  }, [authUser, language]);

  useEffect(() => {
    if (!authUser || !language) return;
    if (!pendingJourneySyncRef.current) return;
    void flushPendingJourneyState();
  }, [authUser, language]);

  useEffect(() => {
    let cancelled = false;

    const hydrateForLanguage = async () => {
      setSurgeHydrated(false);
      if (authLoading || !language) return;

      if (authUser) {
        await loadUserVocab(language);
        if (cancelled) return;
        const dbSurgeProgress = await loadSurgeProgress(language);
        if (cancelled) return;
        const localSession = readLocalSurgeSessionSnapshot(language, dbSurgeProgress);
        const serverSession = await loadSurgeSessionSnapshot(language, dbSurgeProgress);
        if (cancelled) return;
        const nextSession =
          !serverSession
            ? localSession
            : !localSession
              ? serverSession
              : localSession.updatedAt >= serverSession.updatedAt
                ? localSession
                : serverSession;
        if (
          nextSession &&
          localSession &&
          (!serverSession || localSession.updatedAt > serverSession.updatedAt)
        ) {
          queueSurgeSessionSync(nextSession);
        }
        setSurgeSession(nextSession?.session ?? null);
        setSurgeHydrated(true);
        return;
      }

      applySurgeProgressMap(readLocalSurgeProgress(language));
      setSurgeSession(restoreLocalSurgeSession(language, readLocalSurgeProgress(language)));

      const savedStudy = localStorage.getItem("lingoarc_study_pack");
      const savedSentencePack = localStorage.getItem("lingoarc_sentence_pack");
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

      if (!savedSentencePack) {
        setSentencePack(null);
      } else {
        try {
          const parsed = JSON.parse(savedSentencePack) as StudyPack;
          if (parsed && typeof parsed.language === "string" && Array.isArray(parsed.entries)) {
            setSentencePack(parsed);
          }
        } catch {
          setSentencePack(null);
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
        setSurgeHydrated(true);
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
      setSurgeHydrated(true);
    };

    void hydrateForLanguage();
    return () => {
      cancelled = true;
    };
  }, [authLoading, authUser, language]);

  useEffect(() => {
    let cancelled = false;

    const hydrateJourney = async () => {
      setJourneyHydrated(false);
      if (authLoading || !language) {
        return;
      }

      const localSnapshot = readLocalJourneySnapshot(language);

      if (authUser) {
        const serverSnapshot = await loadJourneySnapshot(language);
        if (cancelled) return;
        const nextSnapshot =
          !serverSnapshot
            ? localSnapshot
            : !localSnapshot
              ? serverSnapshot
              : localSnapshot.updatedAt >= serverSnapshot.updatedAt
                ? localSnapshot
                : serverSnapshot;
        if (
          nextSnapshot &&
          localSnapshot &&
          (!serverSnapshot || localSnapshot.updatedAt > serverSnapshot.updatedAt)
        ) {
          queueJourneyStateSync(nextSnapshot);
        }
        setJourneyState(nextSnapshot ?? createEmptyJourneyState(language));
        setJourneyHydrated(true);
        return;
      }

      setJourneyState(localSnapshot ?? createEmptyJourneyState(language));
      setJourneyHydrated(true);
    };

    void hydrateJourney();
    return () => {
      cancelled = true;
    };
  }, [authLoading, authUser, language]);

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
    if (authLoading) return;
    if (!authUser) {
      setSurgeHydrated(false);
      setJourneyHydrated(false);
      pendingSurgeSyncRef.current = {};
      pendingSurgeSessionSyncRef.current = null;
      pendingJourneySyncRef.current = null;
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
      setSentencePack(null);
      setScenarioVocabMap({});
      setTopicVocabMap({});
      setSurgeProgressMap({});
      setSurgeSession(null);
      setJourneyState(null);
      setProfileName("");
      return;
    }
    setAuthError(null);
    void fetchProgress();
    void loadProfile();
  }, [authLoading, authUser]);

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
      setActiveFolderMenu(null);
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

  function scrollMessagesToBottom(behavior: ScrollBehavior = "auto") {
    const container = messagesRef.current;
    if (!container) return;
    window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    });
  }

  useEffect(() => {
    scrollMessagesToBottom("auto");
  }, [messages, chatMode, view]);

  useEffect(() => {
    const container = quickChatMessagesRef.current;
    if (!container) return;
    window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "auto",
      });
    });
  }, [quickChatMessages, quickChatLoading, quickChatOpen]);

  useEffect(() => {
    if (!quickChatOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) {
        return;
      }
      const input = quickChatInputRef.current;
      if (!input) return;
      if (event.key.length !== 1 && event.key !== "Backspace") {
        return;
      }

      event.preventDefault();
      input.focus();

      if (event.key === "Backspace") {
        setQuickChatInput((current) => current.slice(0, -1));
        return;
      }

      setQuickChatInput((current) => `${current}${event.key}`);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quickChatOpen]);

  useEffect(() => {
    if (!quickChatOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const shell = quickChatShellRef.current;
      if (!shell) return;
      if (shell.contains(event.target as Node)) {
        return;
      }
      setQuickChatOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [quickChatOpen]);

  useEffect(() => {
    const handleResize = () => {
      setQuickChatLayout((current) => clampQuickChatLayout(current || getQuickChatPresetLayout(quickChatLarge)));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [quickChatLarge]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const drag = quickChatDragRef.current;
      const resize = quickChatResizeRef.current;
      if (drag) {
        setQuickChatLayout((current) =>
          clampQuickChatLayout({
            ...(current || getQuickChatPresetLayout(quickChatLarge)),
            left: drag.startLeft + (event.clientX - drag.startX),
            top: drag.startTop + (event.clientY - drag.startY),
          })
        );
      } else if (resize) {
        setQuickChatLayout((current) =>
          clampQuickChatLayout({
            ...(current || getQuickChatPresetLayout(quickChatLarge)),
            width: resize.startWidth + (event.clientX - resize.startX),
            height: resize.startHeight + (event.clientY - resize.startY),
          })
        );
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      const drag = quickChatDragRef.current;
      if (drag && drag.pointerId === event.pointerId) {
        quickChatDragRef.current = null;
      }
      const resize = quickChatResizeRef.current;
      if (resize && resize.pointerId === event.pointerId) {
        quickChatResizeRef.current = null;
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [quickChatLarge]);

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
      .select("scope, scenario_id, word_key, word, translation, starred, folder, count, last_clicked, archived")
      .eq("user_id", authUser.id)
      .eq("language", activeLanguage);

    if (error) {
      return;
    }

    const chatEntries: VocabEntry[] = [];
    const commonEntries: StudyEntry[] = [];
    const sentenceEntries: StudyEntry[] = [];
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
        folder: typeof row.folder === "string" ? row.folder : null,
      };
      if (row.scope === "common") {
        commonEntries.push(entry);
      } else if (row.scope === "sentence") {
        sentenceEntries.push(entry);
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
    const dedupedSentence = mergeUniqueEntries([], sentenceEntries).merged;
    if (dedupedSentence.length) {
      setSentencePack({ language: activeLanguage, entries: dedupedSentence });
    } else {
      setSentencePack(null);
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

  function applySurgeProgressMap(nextMap: Record<string, SurgeProgressRecord>) {
    surgeProgressRef.current = nextMap;
    setSurgeProgressMap(nextMap);
  }

  function readLocalSurgeProgress(activeLanguage: string) {
    const savedSurgeProgress = localStorage.getItem(`${SURGE_PROGRESS_KEY_PREFIX}${activeLanguage}`);
    if (!savedSurgeProgress) {
      return {};
    }
    try {
      const parsed = JSON.parse(savedSurgeProgress) as Record<string, SurgeProgressRecord>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function mergeSurgeProgressMaps(
    serverMap: Record<string, SurgeProgressRecord>,
    localMap: Record<string, SurgeProgressRecord>
  ) {
    const merged: Record<string, SurgeProgressRecord> = { ...serverMap };
    const localWins: SurgeProgressRecord[] = [];

    Object.entries(localMap).forEach(([itemKey, localRecord]) => {
      const serverRecord = merged[itemKey];
      if (!serverRecord) {
        merged[itemKey] = localRecord;
        localWins.push(localRecord);
        return;
      }

      const serverStamp = serverRecord.updatedAt || serverRecord.lastReviewedAt || serverRecord.createdAt || 0;
      const localStamp = localRecord.updatedAt || localRecord.lastReviewedAt || localRecord.createdAt || 0;
      if (localStamp > serverStamp) {
        merged[itemKey] = {
          ...serverRecord,
          ...localRecord,
        };
        localWins.push(merged[itemKey]);
      }
    });

    return { merged, localWins };
  }

  function sanitizeStoredSurgeItems(
    items: unknown,
    progressByKey: Record<string, SurgeProgressRecord>
  ): SurgeItem[] {
    if (!Array.isArray(items)) return [];
    return dedupeSurgeItems(
      items
        .filter((item): item is Partial<SurgeItem> => Boolean(item) && typeof item === "object")
        .map((item) => {
          const itemKey = typeof item.itemKey === "string" ? item.itemKey : "";
          const progressRecord = itemKey ? progressByKey[itemKey] : null;
          const nextText =
            typeof item.text === "string" && item.text.trim()
              ? item.text.trim()
              : progressRecord?.itemText || "";
          const nextTranslation =
            typeof item.translation === "string" && item.translation.trim()
              ? item.translation.trim()
              : progressRecord?.translation || "";
          const nextType = item.itemType === "phrase" ? "phrase" : progressRecord?.itemType === "phrase" ? "phrase" : "word";
          return {
            itemKey,
            text: nextText,
            translation: nextTranslation,
            itemType: nextType as SurgeItem["itemType"],
          };
        })
        .filter(
          (item) =>
            Boolean(item.itemKey) &&
            Boolean(item.text) &&
            Boolean(item.translation) &&
            progressByKey[item.itemKey]?.status !== "known"
        )
    );
  }

  function sanitizeStoredSurgeSession(
    activeLanguage: string,
    progressByKey: Record<string, SurgeProgressRecord>,
    source: unknown
  ) {
    const parsed = source as Partial<SurgeSession>;
    if (!parsed || typeof parsed !== "object" || parsed.language !== activeLanguage) {
      return null;
    }

    const activeRound = sanitizeStoredSurgeItems(parsed.activeRound, progressByKey);
    const reserve = sanitizeStoredSurgeItems(parsed.reserve, progressByKey);
    const reviewQueue = sanitizeStoredSurgeItems(parsed.reviewQueue, progressByKey);
    const typingQueue = sanitizeStoredSurgeItems(parsed.typingQueue, progressByKey);
    const delayedReviewQueue = Array.isArray(parsed.delayedReviewQueue)
      ? parsed.delayedReviewQueue
          .filter((entry): entry is { item: SurgeItem; remainingSkips: number } => Boolean(entry) && typeof entry === "object")
          .map((entry) => ({
            item: sanitizeStoredSurgeItems([entry.item], progressByKey)[0],
            remainingSkips: Number.isFinite(entry.remainingSkips) ? Math.max(0, Number(entry.remainingSkips)) : 0,
          }))
          .filter((entry) => entry.item)
      : [];
    const activeRoundKeys = new Set(activeRound.map((item) => item.itemKey));
    const typingQueueKeys = new Set(typingQueue.map((item) => item.itemKey));
    const phase: SurgePhase =
      parsed.phase === "match" || parsed.phase === "typing" || parsed.phase === "preview" ? parsed.phase : "preview";

    const restored: SurgeSession = {
      ...createEmptySurgeSession(activeLanguage),
      ...parsed,
      language: activeLanguage,
      phase,
      activeRound,
      reserve,
      reviewQueue,
      typingQueue,
      delayedReviewQueue,
      recentlySeen: Array.isArray(parsed.recentlySeen)
        ? uniqueStrings(
            parsed.recentlySeen.filter(
              (itemKey): itemKey is string =>
                typeof itemKey === "string" && progressByKey[itemKey]?.status !== "known"
            )
          ).slice(-120)
        : [],
      previewIndex: Math.min(
        Number.isFinite(parsed.previewIndex) ? Math.max(0, Number(parsed.previewIndex)) : 0,
        Math.max(activeRound.length - 1, 0)
      ),
      previewRevealed: Boolean(parsed.previewRevealed),
      previewSeenKeys: Array.isArray(parsed.previewSeenKeys)
        ? parsed.previewSeenKeys.filter((itemKey): itemKey is string => typeof itemKey === "string" && activeRoundKeys.has(itemKey))
        : [],
      matchTargets: Array.isArray(parsed.matchTargets)
        ? parsed.matchTargets.filter((itemKey): itemKey is string => typeof itemKey === "string" && activeRoundKeys.has(itemKey))
        : [],
      matchTranslations: Array.isArray(parsed.matchTranslations)
        ? parsed.matchTranslations.filter((itemKey): itemKey is string => typeof itemKey === "string" && activeRoundKeys.has(itemKey))
        : [],
      matchedKeys: Array.isArray(parsed.matchedKeys)
        ? parsed.matchedKeys.filter((itemKey): itemKey is string => typeof itemKey === "string" && activeRoundKeys.has(itemKey))
        : [],
      selectedTargetKey:
        typeof parsed.selectedTargetKey === "string" && activeRoundKeys.has(parsed.selectedTargetKey)
          ? parsed.selectedTargetKey
          : null,
      selectedTranslationKey:
        typeof parsed.selectedTranslationKey === "string" && activeRoundKeys.has(parsed.selectedTranslationKey)
          ? parsed.selectedTranslationKey
          : null,
      typingInput: typeof parsed.typingInput === "string" ? parsed.typingInput : "",
      typingDirection:
        parsed.typingDirection === "english_to_target" || parsed.typingDirection === "target_to_english"
          ? parsed.typingDirection
          : typingQueue[0]
            ? getDirectionForStage(progressByKey[typingQueue[0].itemKey]?.stage ?? 0)
            : null,
      typingHintCount: Number.isFinite(parsed.typingHintCount) ? Math.max(0, Number(parsed.typingHintCount)) : 0,
      typingFeedback:
        parsed.typingFeedback &&
        (parsed.typingFeedback.status === "correct" || parsed.typingFeedback.status === "wrong") &&
        (parsed.typingFeedback.direction === "target_to_english" || parsed.typingFeedback.direction === "english_to_target") &&
        typeof parsed.typingFeedback.expected === "string" &&
        typingQueueKeys.has(typingQueue[0]?.itemKey || "")
          ? parsed.typingFeedback
          : null,
    };

    const hasRecoverableState =
      restored.activeRound.length ||
      restored.reserve.length ||
      restored.reviewQueue.length ||
      restored.typingQueue.length ||
      restored.delayedReviewQueue.length;

    return hasRecoverableState ? restored : null;
  }

  function readLocalSurgeSessionSnapshot(
    activeLanguage: string,
    progressByKey: Record<string, SurgeProgressRecord>
  ): SurgeSessionSnapshot | null {
    const savedSession = localStorage.getItem(SURGE_SESSION_KEY);
    if (!savedSession) {
      return null;
    }

    try {
      const parsed = JSON.parse(savedSession) as Partial<SurgeSessionSnapshot> | Partial<SurgeSession>;
      const snapshotSource =
        parsed && typeof parsed === "object" && "session" in parsed ? parsed.session : parsed;
      const restored = sanitizeStoredSurgeSession(activeLanguage, progressByKey, snapshotSource);
      if (!restored) {
        localStorage.removeItem(SURGE_SESSION_KEY);
        return null;
      }

      const updatedAt =
        parsed && typeof parsed === "object" && "updatedAt" in parsed && typeof parsed.updatedAt === "number"
          ? parsed.updatedAt
          : 0;

      return {
        session: restored,
        updatedAt,
      };
    } catch {
      localStorage.removeItem(SURGE_SESSION_KEY);
      return null;
    }
  }

  function restoreLocalSurgeSession(
    activeLanguage: string,
    progressByKey: Record<string, SurgeProgressRecord>
  ) {
    return readLocalSurgeSessionSnapshot(activeLanguage, progressByKey)?.session ?? null;
  }

  async function loadSurgeSessionSnapshot(
    activeLanguage: string,
    progressByKey: Record<string, SurgeProgressRecord>
  ) {
    if (!authUser) return null;
    const { data, error } = await supabase
      .from("surge_sessions")
      .select("session_state, updated_at")
      .eq("user_id", authUser.id)
      .eq("language", activeLanguage)
      .maybeSingle();

    if (error || !data?.session_state) {
      return null;
    }

    const session = sanitizeStoredSurgeSession(activeLanguage, progressByKey, data.session_state);
    if (!session) {
      return null;
    }

    return {
      session,
      updatedAt: data.updated_at ? Date.parse(data.updated_at) : 0,
    } satisfies SurgeSessionSnapshot;
  }

  async function loadSurgeProgress(activeLanguage: string) {
    if (!authUser) return {};
    const localMirror = readLocalSurgeProgress(activeLanguage);
    const { data, error } = await supabase
      .from("surge_progress")
      .select(
        "item_key, item_text, translation, item_type, status, stage, times_seen, times_correct, last_result, last_direction, last_reviewed_at, next_review_at, created_at, updated_at"
      )
      .eq("user_id", authUser.id)
      .eq("language", activeLanguage);

    if (error) {
      const fallback = localMirror;
      applySurgeProgressMap(fallback);
      return fallback;
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
    const { merged, localWins } = mergeSurgeProgressMaps(nextMap, localMirror);
    applySurgeProgressMap(merged);
    if (localWins.length) {
      queueSurgeProgressSync(localWins);
    }
    return merged;
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

  function queueSurgeProgressSync(records: SurgeProgressRecord[]) {
    if (!authUser || !language || !records.length) return;
    records.forEach((record) => {
      pendingSurgeSyncRef.current[record.itemKey] = record;
    });
    void flushPendingSurgeProgress();
  }

  async function flushPendingSurgeProgress() {
    if (!authUser || !language || surgeSyncInFlightRef.current) {
      return;
    }

    const batch = Object.values(pendingSurgeSyncRef.current);
    if (!batch.length) {
      return;
    }

    surgeSyncInFlightRef.current = true;
    if (surgeSyncRetryTimerRef.current !== null) {
      window.clearTimeout(surgeSyncRetryTimerRef.current);
      surgeSyncRetryTimerRef.current = null;
    }

    try {
      await upsertSurgeProgress(batch);
      batch.forEach((record) => {
        const pending = pendingSurgeSyncRef.current[record.itemKey];
        if (pending && pending.updatedAt === record.updatedAt) {
          delete pendingSurgeSyncRef.current[record.itemKey];
        }
      });
    } catch {
      surgeSyncRetryTimerRef.current = window.setTimeout(() => {
        surgeSyncRetryTimerRef.current = null;
        void flushPendingSurgeProgress();
      }, 1200);
    } finally {
      surgeSyncInFlightRef.current = false;
      if (!surgeSyncRetryTimerRef.current && Object.keys(pendingSurgeSyncRef.current).length) {
        void flushPendingSurgeProgress();
      }
    }
  }

  async function upsertSurgeSessionSnapshot(snapshot: SurgeSessionSnapshot) {
    if (!authUser || !language) return;
    await supabase.from("surge_sessions").upsert(
      {
        user_id: authUser.id,
        language,
        session_state: snapshot.session,
        updated_at: new Date(snapshot.updatedAt).toISOString(),
      },
      {
        onConflict: "user_id,language",
      }
    );
  }

  function queueSurgeSessionSync(snapshot: SurgeSessionSnapshot) {
    if (!authUser || !language) return;
    pendingSurgeSessionSyncRef.current = snapshot;
    void flushPendingSurgeSession();
  }

  async function flushPendingSurgeSession() {
    if (!authUser || !language || surgeSessionSyncInFlightRef.current || !pendingSurgeSessionSyncRef.current) {
      return;
    }

    const snapshot = pendingSurgeSessionSyncRef.current;
    surgeSessionSyncInFlightRef.current = true;
    if (surgeSessionSyncRetryTimerRef.current !== null) {
      window.clearTimeout(surgeSessionSyncRetryTimerRef.current);
      surgeSessionSyncRetryTimerRef.current = null;
    }

    try {
      await upsertSurgeSessionSnapshot(snapshot);
      if (
        pendingSurgeSessionSyncRef.current &&
        pendingSurgeSessionSyncRef.current.updatedAt === snapshot.updatedAt
      ) {
        pendingSurgeSessionSyncRef.current = null;
      }
    } catch {
      surgeSessionSyncRetryTimerRef.current = window.setTimeout(() => {
        surgeSessionSyncRetryTimerRef.current = null;
        void flushPendingSurgeSession();
      }, 1200);
    } finally {
      surgeSessionSyncInFlightRef.current = false;
      if (!surgeSessionSyncRetryTimerRef.current && pendingSurgeSessionSyncRef.current) {
        void flushPendingSurgeSession();
      }
    }
  }

  function getJourneyStorageKey(activeLanguage: string) {
    return `${JOURNEY_STORAGE_KEY_PREFIX}${activeLanguage}`;
  }

  function isJourneyTableMissingError(error: unknown) {
    if (!error || typeof error !== "object") {
      return false;
    }
    const message = "message" in error && typeof error.message === "string" ? error.message : "";
    const code = "code" in error && typeof error.code === "string" ? error.code : "";
    return code === "42P01" || message.toLowerCase().includes("journey_progress");
  }

  function readLocalJourneySnapshot(activeLanguage: string) {
    const stored = localStorage.getItem(getJourneyStorageKey(activeLanguage));
    if (!stored) {
      return null;
    }
    try {
      return normalizeJourneySnapshot(activeLanguage, JSON.parse(stored));
    } catch {
      localStorage.removeItem(getJourneyStorageKey(activeLanguage));
      return null;
    }
  }

  async function loadJourneySnapshot(activeLanguage: string) {
    if (!authUser) return null;
    const { data, error } = await supabase
      .from("journey_progress")
      .select("progress_state, updated_at")
      .eq("user_id", authUser.id)
      .eq("language", activeLanguage)
      .maybeSingle();

    const row = data as JourneyPersistedRow | null;
    if (error || !row?.progress_state) {
      if (error && !isJourneyTableMissingError(error)) {
        console.error("Failed to load journey progress:", error);
      }
      return null;
    }

    const normalized = normalizeJourneySnapshot(activeLanguage, row.progress_state);
    if (!normalized) {
      return null;
    }

    return {
      ...normalized,
      updatedAt: row.updated_at ? Date.parse(row.updated_at) : normalized.updatedAt,
    } satisfies JourneyStateSnapshot;
  }

  async function upsertJourneySnapshot(snapshot: JourneyStateSnapshot) {
    if (!authUser || !language) return;
    await supabase.from("journey_progress").upsert(
      {
        user_id: authUser.id,
        language,
        progress_state: snapshot,
        updated_at: new Date(snapshot.updatedAt).toISOString(),
      },
      {
        onConflict: "user_id,language",
      }
    );
  }

  function queueJourneyStateSync(snapshot: JourneyStateSnapshot) {
    if (!authUser || !language) return;
    pendingJourneySyncRef.current = snapshot;
    void flushPendingJourneyState();
  }

  async function flushPendingJourneyState() {
    if (!authUser || !language || journeySyncInFlightRef.current || !pendingJourneySyncRef.current) {
      return;
    }

    const snapshot = pendingJourneySyncRef.current;
    journeySyncInFlightRef.current = true;
    if (journeySyncRetryTimerRef.current !== null) {
      window.clearTimeout(journeySyncRetryTimerRef.current);
      journeySyncRetryTimerRef.current = null;
    }

    try {
      await upsertJourneySnapshot(snapshot);
      if (pendingJourneySyncRef.current?.updatedAt === snapshot.updatedAt) {
        pendingJourneySyncRef.current = null;
      }
    } catch (error) {
      if (isJourneyTableMissingError(error)) {
        pendingJourneySyncRef.current = null;
      } else {
        journeySyncRetryTimerRef.current = window.setTimeout(() => {
          journeySyncRetryTimerRef.current = null;
          void flushPendingJourneyState();
        }, 1400);
      }
    } finally {
      journeySyncInFlightRef.current = false;
      if (!journeySyncRetryTimerRef.current && pendingJourneySyncRef.current) {
        void flushPendingJourneyState();
      }
    }
  }

  function mutateJourneyState(
    updater: (current: JourneyStateSnapshot) => JourneyStateSnapshot
  ) {
    if (!language) return;
    setJourneyState((prev) => {
      const base =
        prev && prev.language === language ? prev : createEmptyJourneyState(language);
      return {
        ...updater(base),
        language,
        updatedAt: Date.now(),
      };
    });
  }

  function getJourneyReviewSentences(excludePartKey?: string) {
    const state = journeyStateRef.current;
    if (!state) return [];
    return Object.entries(state.progress)
      .filter(([key, record]) => key !== excludePartKey && record.status === "completed")
      .sort((a, b) => (a[1].updatedAt || 0) - (b[1].updatedAt || 0))
      .flatMap(([, record]) => record.learnedSentences || [])
      .slice(-12);
  }

  async function fetchJourneyLesson(chapterId: string, partId: string) {
    if (!language) return null;
    const partKey = getJourneyPartKey(chapterId, partId);
    const response = await fetch("/api/journey-part", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language,
        difficulty,
        chapterId,
        partId,
        reviewSentences: getJourneyReviewSentences(partKey),
      }),
    });

    const payload = (await response.json().catch(() => null)) as { lesson?: JourneyLessonContent; error?: string } | null;
    if (!response.ok) {
      throw new Error(payload?.error || "Journey could not load this part right now.");
    }

    const lesson = normalizeJourneyLessonContent(payload?.lesson);
    if (!lesson) {
      throw new Error("Journey returned an invalid lesson.");
    }
    return lesson;
  }

  async function upsertUserVocab(rows: Array<{
    scope: "chat" | "common" | "sentence" | "scenario" | "topic";
    scenarioId?: string | null;
    wordKey: string;
    word: string;
    translation: string;
    starred: boolean;
    folder?: string | null;
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
      ...(row.folder !== undefined ? { folder: row.folder || null } : {}),
      count: row.count ?? 1,
      last_clicked: new Date(row.lastClicked ?? Date.now()).toISOString(),
      archived: row.archived ?? false,
    }));
    await supabase.from("user_vocab").upsert(payload, {
      onConflict: "user_id,language,scope,scenario_id,word_key",
    });
  }

  async function deleteUserVocab(
    scope: "chat" | "common" | "sentence" | "scenario" | "topic",
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

  async function clearUserVocabScope(scope: "common" | "sentence" | "scenario" | "topic", scenarioId?: string | null) {
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

  async function archiveSentenceUnstarred() {
    if (!authUser || !language || !sentencePack) return;
    const keys = sentencePack.entries
      .filter((entry) => !entry.starred)
      .map((entry) => normalizeWord(entry.word))
      .filter(Boolean);
    if (keys.length) {
      await supabase
        .from("user_vocab")
        .update({ archived: true })
        .eq("user_id", authUser.id)
        .eq("language", language)
        .eq("scope", "sentence")
        .in("word_key", keys);
    }
    setSentencePack({
      language: sentencePack.language,
      entries: sentencePack.entries.map((entry) => ({
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

    if (forceNew) {
      localStorage.removeItem(`${BUDDY_STATE_KEY_PREFIX}${language}`);
      setBuddySavedState(null);
    }

    if (!forceNew && hasExistingBuddy && sessionId) {
      await syncSessionContext(sessionId, "buddy");
      return;
    }

    if (!forceNew && buddySavedState?.messages.length) {
      setMessages(buddySavedState.messages);
      messagesStateRef.current = buddySavedState.messages;
      setInputValue("");
      setSessionId(null);
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
          scenarioStart: buddyStartupGuide,
          task: null,
          buddyContext: `${buddyProfileRef.current?.summary || buddyProfileSnapshot.summary} Startup guidance: ${buddyStartupGuide}`,
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
        if (chatModeRef.current === "buddy") {
          scrollMessagesToBottom("auto");
        }
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
    context?: { scope?: "chat" | "common" | "sentence" | "scenario" | "topic"; scenarioId?: string | null; sentence?: string }
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
    context?: { scope?: "chat" | "common" | "sentence" | "scenario" | "topic"; scenarioId?: string | null; sentence?: string }
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
    scope: "chat" | "common" | "sentence" | "scenario" | "topic",
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
    if (scope === "sentence") {
      const key = normalizeWord(word);
      setSentencePack((prev) => {
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
            scope: "sentence",
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

  function clearSentenceStudy() {
    setSentencePack(null);
    setSentenceFlipped({});
    void clearUserVocabScope("sentence");
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

  function toggleSentenceStar(index: number) {
    const target = sentencePack?.entries[index];
    setSentencePack((prev) => {
      if (!prev) return prev;
      const next = prev.entries.map((entry, i) =>
        i === index ? { ...entry, starred: !entry.starred } : entry
      );
      return { ...prev, entries: next };
    });
    if (target) {
      void upsertUserVocab([
        {
          scope: "sentence",
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

  function assignStudyFolder(index: number, folder: string | null, archived = false) {
    const target = studyPack?.entries[index];
    setStudyPack((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.map((entry, i) => (i === index ? { ...entry, folder, archived } : entry)),
      };
    });
    if (target) {
      void upsertUserVocab([
        {
          scope: "common",
          scenarioId: null,
          wordKey: normalizeWord(target.word),
          word: target.word,
          translation: target.translation,
          starred: Boolean(target.starred),
          folder,
          count: 1,
          lastClicked: Date.now(),
          archived,
        },
      ]);
    }
  }

  function assignSentenceFolder(index: number, folder: string | null, archived = false) {
    const target = sentencePack?.entries[index];
    setSentencePack((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.map((entry, i) => (i === index ? { ...entry, folder, archived } : entry)),
      };
    });
    if (target) {
      void upsertUserVocab([
        {
          scope: "sentence",
          scenarioId: null,
          wordKey: normalizeWord(target.word),
          word: target.word,
          translation: target.translation,
          starred: Boolean(target.starred),
          folder,
          count: 1,
          lastClicked: Date.now(),
          archived,
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

  function toggleSentenceCard(index: number) {
    setSentenceFlipped((prev) => ({
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

  function normalizeQuickChatText(value: string) {
    return value
      .toLocaleLowerCase()
      .normalize("NFKC")
      .replace(/[\s\p{P}\p{S}]+/gu, " ")
      .trim();
  }

  function shouldHideQuickChatBody(payload?: QuickAssistantPayload) {
    const body = (payload?.text || "").trim();
    if (!body) return true;
    if (!payload?.mode || payload.mode === "answer") {
      return false;
    }
    return /^(check if|correct\b|fix\b|translate\b|say\b|how do you say\b|is ['"].+['"] correct)/i.test(body);
  }

  function getQuickChatDisplay(payload?: QuickAssistantPayload) {
    const targetText = (payload?.targetText || "").trim();
    const improved = (payload?.improved || "").trim();
    const showImproved =
      improved.length > 0 && normalizeQuickChatText(improved) !== normalizeQuickChatText(targetText);

    return {
      body: shouldHideQuickChatBody(payload) ? "" : (payload?.text || "").trim(),
      translation: (payload?.translation || "").trim(),
      note: (payload?.note || "").trim(),
      primaryText: showImproved ? improved : targetText,
      secondaryText: showImproved ? targetText : "",
      verdict: payload?.verdict || null,
      ttsText: (payload?.ttsText || "").trim(),
      mode: payload?.mode || "answer",
    };
  }

  function getQuickChatRecorderMimeType() {
    if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
      return "";
    }
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || "";
  }

  function getQuickChatPresetLayout(large: boolean): QuickChatLayout {
    if (typeof window === "undefined") {
      return {
        left: 16,
        top: 16,
        width: large ? 460 : 360,
        height: large ? 640 : 540,
      };
    }
    const width = Math.min(large ? 460 : 360, Math.max(window.innerWidth - 24, 320));
    const height = Math.min(large ? 640 : 540, Math.max(window.innerHeight - 32, 420));
    return {
      left: Math.max(12, window.innerWidth - width - 16),
      top: Math.max(12, window.innerHeight - height - 16),
      width,
      height,
    };
  }

  function clampQuickChatLayout(layout: QuickChatLayout) {
    if (typeof window === "undefined") {
      return layout;
    }
    const maxWidth = Math.max(320, window.innerWidth - 12);
    const maxHeight = Math.max(360, window.innerHeight - 12);
    const width = Math.min(Math.max(320, Math.round(layout.width)), maxWidth);
    const height = Math.min(Math.max(360, Math.round(layout.height)), maxHeight);
    const left = Math.min(Math.max(6, Math.round(layout.left)), Math.max(6, window.innerWidth - width - 6));
    const top = Math.min(Math.max(6, Math.round(layout.top)), Math.max(6, window.innerHeight - height - 6));
    return { left, top, width, height };
  }

  function toggleQuickChatSize() {
    const nextLarge = !quickChatLarge;
    setQuickChatLarge(nextLarge);
    setQuickChatLayout((current) => {
      const preset = getQuickChatPresetLayout(nextLarge);
      if (!current) {
        return preset;
      }
      return clampQuickChatLayout({
        ...current,
        width: preset.width,
        height: preset.height,
      });
    });
  }

  function startQuickChatDrag(event: React.PointerEvent<HTMLElement>) {
    const target = event.target as HTMLElement | null;
    if (!target || target.closest("button, textarea, input, a, code, .quick-chat-resize-handle")) {
      return;
    }
    const base = quickChatLayout || getQuickChatPresetLayout(quickChatLarge);
    quickChatDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: base.left,
      startTop: base.top,
    };
  }

  function startQuickChatResize(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const base = quickChatLayout || getQuickChatPresetLayout(quickChatLarge);
    quickChatResizeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: base.width,
      startHeight: base.height,
    };
  }

  function resetQuickChatConversation() {
    setQuickChatMessages([]);
    setQuickChatInput("");
    if (language) {
      localStorage.removeItem(`${QUICK_CHAT_STATE_KEY_PREFIX}${language}`);
    }
    window.requestAnimationFrame(() => {
      quickChatInputRef.current?.focus();
    });
  }

  function createFolderWithPrompt(onSelect: (folder: string | null) => void) {
    const raw = window.prompt("Folder name");
    if (raw === null) return;
    const folder = normalizeFolderName(raw);
    if (!folder) return;
    onSelect(folder);
    setActiveFolderMenu(null);
  }

  function renderFolderMenu(
    menuKey: string,
    folders: string[],
    currentFolder: string | null | undefined,
    isArchived: boolean,
    onSelect: (folder: string | null, archived?: boolean) => void
  ) {
    if (activeFolderMenu !== menuKey) {
      return null;
    }
    return (
      <div className="vocab-folder-menu" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className={`ghost vocab-folder-item${!currentFolder ? " active" : ""}`}
          onClick={() => {
            onSelect(null, false);
            setActiveFolderMenu(null);
          }}
        >
          No folder
        </button>
        <button
          type="button"
          className={`ghost vocab-folder-item${isArchived ? " active" : ""}`}
          onClick={() => {
            onSelect(null, true);
            setActiveFolderMenu(null);
          }}
        >
          Archived
        </button>
        {folders.map((folder) => (
          <button
            key={folder}
            type="button"
            className={`ghost vocab-folder-item${currentFolder === folder ? " active" : ""}`}
            onClick={() => {
              onSelect(folder, false);
              setActiveFolderMenu(null);
            }}
          >
            {folder}
          </button>
        ))}
        <button
          type="button"
          className="ghost vocab-folder-item create"
          onClick={() => createFolderWithPrompt((folder) => onSelect(folder, false))}
        >
          + New folder
        </button>
      </div>
    );
  }

  function getSurgeHintDisplay(answer: string) {
    return answer
      .replace(/\([^)]*\)/g, " ")
      .replace(/\s*\/\s*/g, "/")
      .split(" ")
      .map((token) => (token.includes("/") ? token.split("/").filter(Boolean)[0] || token : token))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildSurgeHintGlyphs(answer: string, revealCount: number) {
    const display = getSurgeHintDisplay(answer);
    let revealed = 0;
    return Array.from(display).map((char) => {
      const isLetter = /[\p{L}\p{N}]/u.test(char);
      if (!isLetter) {
        return { char, revealed: true, isLetter: false };
      }
      revealed += 1;
      return {
        char: revealed <= revealCount ? char : "•",
        revealed: revealed <= revealCount,
        isLetter: true,
      };
    });
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
      folder: entry.folder || null,
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
          folder: entry.folder || null,
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
        folder: entry.folder || currentEntry.folder || null,
      };
    });
    return { merged, added };
  }

  function normalizeFolderName(value: string) {
    const trimmed = value.trim().replace(/\s+/g, " ");
    return trimmed ? trimmed.slice(0, 40) : "";
  }

  function getEntryFolder(entry: StudyEntry) {
    return entry.folder || null;
  }

  function getFolderKey(scope: "common" | "sentence" | "scenario" | "topic", index: number, scenarioId?: string | null) {
    return `${scope}:${scenarioId || "none"}:${index}`;
  }

  function exampleKey(scope: ExampleScope, word: string, scenarioId?: string | null) {
    const base = normalizeWord(word) || word.toLowerCase();
    return `${scope}:${scenarioId || "none"}:${base}`;
  }

  function speechKey(scope: VocabScope, word: string, scenarioId?: string | null) {
    const base = normalizeWord(word) || word.toLowerCase();
    return `${language || "none"}:${scope}:${scenarioId || "none"}:${base}`;
  }

  async function getSpeechAudioUrl(key: string, text: string, variant: "slow" | "natural") {
    const cacheKey = `${key}:${variant}`;
    let audioUrl = speechCacheRef.current.get(cacheKey);
    if (audioUrl) {
      return audioUrl;
    }

    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, text, variant }),
    });

    if (!res.ok) {
      return null;
    }

    const blob = await res.blob();
    if (!blob.size) {
      return null;
    }

    audioUrl = URL.createObjectURL(blob);
    speechCacheRef.current.set(cacheKey, audioUrl);
    return audioUrl;
  }

  async function playSpeechSequence(audio: HTMLAudioElement, key: string, urls: string[], token: number) {
    for (let index = 0; index < urls.length; index += 1) {
      if (speechPlaybackTokenRef.current !== token) {
        return;
      }

      const url = urls[index];
      await new Promise<void>((resolve, reject) => {
        const handleEnded = () => {
          cleanup();
          resolve();
        };
        const handleError = () => {
          cleanup();
          reject(new Error("Audio playback failed"));
        };
        const cleanup = () => {
          audio.onended = null;
          audio.onerror = null;
        };

        audio.onended = handleEnded;
        audio.onerror = handleError;
        audio.src = url;
        audio.currentTime = 0;
        void audio.play().then(() => {
          if (speechPlaybackTokenRef.current !== token) {
            audio.pause();
            cleanup();
            resolve();
          }
        }).catch((error) => {
          cleanup();
          reject(error);
        });
      });

    }

    if (speechPlaybackTokenRef.current === token) {
      setSpeechPlayingKey((current) => (current === key ? null : current));
    }
  }

  async function playFlashcardAudio(scope: VocabScope, word: string, scenarioId?: string | null) {
    const trimmedWord = word.trim();
    if (!language || !trimmedWord) return;

    const key = speechKey(scope, trimmedWord, scenarioId);
    if (speechLoadingKey === key) return;

    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;

    if (speechPlayingKey === key) {
      speechPlaybackTokenRef.current += 1;
      audio.pause();
      audio.currentTime = 0;
      audio.onended = null;
      audio.onerror = null;
      setSpeechPlayingKey(null);
      return;
    }

    if (!audio.paused) {
      speechPlaybackTokenRef.current += 1;
      audio.pause();
      audio.currentTime = 0;
      audio.onended = null;
      audio.onerror = null;
    }

    try {
      setSpeechLoadingKey(key);
      const [slowUrl, naturalUrl] = await Promise.all([
        getSpeechAudioUrl(key, trimmedWord, "slow"),
        getSpeechAudioUrl(key, trimmedWord, "natural"),
      ]);
      if (!slowUrl || !naturalUrl) {
        return;
      }
      setSpeechPlayingKey(key);
      const token = speechPlaybackTokenRef.current + 1;
      speechPlaybackTokenRef.current = token;
      await playSpeechSequence(audio, key, [slowUrl, naturalUrl], token);
    } catch {
      setSpeechPlayingKey((current) => (current === key ? null : current));
    } finally {
      setSpeechLoadingKey((current) => (current === key ? null : current));
    }
  }

  function quickMessageToHistoryText(message: QuickChatMessage) {
    if (message.role === "user") {
      return message.text || "";
    }
    const payload = message.payload;
    if (!payload) {
      return "";
    }
    return [
      payload.title,
      payload.text,
      payload.targetText,
      payload.translation,
      payload.improved,
      payload.note,
      payload.ttsText,
    ]
      .filter(Boolean)
      .join(" | ");
  }

  async function sendQuickChatMessage(rawText: string, options?: { force?: boolean }) {
    const trimmed = rawText.trim();
    if (!trimmed || !language || (quickChatLoading && !options?.force)) return;

    const userMessage: QuickChatMessage = {
      id: makeId(),
      role: "user",
      text: trimmed,
    };
    const nextMessages = [...quickChatMessages, userMessage];
    setQuickChatMessages(nextMessages);
    setQuickChatInput("");
    setQuickChatOpen(true);
    setQuickChatLoading(true);

    try {
      const res = await fetch("/api/quick-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          message: trimmed,
          profileSummary: buddyProfileSnapshot.summary,
          history: nextMessages.slice(-12).map((item) => ({
            role: item.role,
            text: quickMessageToHistoryText(item),
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Quick chat failed");
      }

      const data = (await res.json()) as QuickAssistantPayload;
      setQuickChatMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          payload: {
            mode: data.mode || "answer",
            title: data.title || "Quick help",
            text: data.text || "",
            targetText: data.targetText || "",
            translation: data.translation || "",
            verdict: data.verdict || null,
            improved: data.improved || "",
            note: data.note || "",
            ttsText: data.ttsText || "",
          },
        },
      ]);
    } catch {
      setQuickChatMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          payload: {
            mode: "answer",
            title: "Quick help",
            text: "That did not go through. Try again.",
          },
        },
      ]);
    } finally {
      setQuickChatLoading(false);
    }
  }

  async function transcribeQuickChatAudio(blob: Blob) {
    if (!language) {
      throw new Error("Choose a language first.");
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(new Error("Failed to read audio"));
      reader.readAsDataURL(blob);
    });

    const res = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audioBase64: dataUrl,
        mimeType: blob.type || "audio/webm",
        language,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "Transcription failed");
    }

    const data = (await res.json()) as { text?: string };
    const text = (data.text || "").trim();
    if (!text) {
      throw new Error("I did not catch any speech.");
    }
    await sendQuickChatMessage(text, { force: true });
  }

  async function toggleQuickChatRecording() {
    if (!quickChatVoiceReady) return;
    if (quickChatRecorderRef.current && quickChatRecording) {
      quickChatRecorderRef.current.stop();
      setQuickChatRecording(false);
      return;
    }

    setQuickChatOpen(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getQuickChatRecorderMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 })
      : new MediaRecorder(stream);
    quickChatRecorderRef.current = recorder;
    quickChatChunksRef.current = [];
    let completed = false;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        quickChatChunksRef.current.push(event.data);
      }
    };

    recorder.onerror = () => {
      if (completed) return;
      completed = true;
      stream.getTracks().forEach((track) => track.stop());
      quickChatRecorderRef.current = null;
      quickChatChunksRef.current = [];
      setQuickChatRecording(false);
      setQuickChatLoading(false);
      setQuickChatMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          payload: {
            mode: "answer",
            title: "Voice",
            text: "Recording failed. Try the mic again.",
          },
        },
      ]);
    };

    recorder.onstop = async () => {
      if (completed) return;
      completed = true;
      const blob = new Blob(quickChatChunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });
      stream.getTracks().forEach((track) => track.stop());
      quickChatRecorderRef.current = null;
      quickChatChunksRef.current = [];
      setQuickChatRecording(false);
      if (!blob.size) return;
      setQuickChatLoading(true);
      try {
        await transcribeQuickChatAudio(blob);
      } catch (error) {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message.trim()
            : "I could not transcribe that. Try again.";
        setQuickChatMessages((current) => [
          ...current,
          {
            id: makeId(),
            role: "assistant",
            payload: {
              mode: "answer",
              title: "Voice",
              text: message,
            },
          },
        ]);
      } finally {
        setQuickChatLoading(false);
      }
    };

    recorder.start(250);
    setQuickChatRecording(true);
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
    const currentMap = surgeProgressRef.current;
    const current = currentMap[item.itemKey] || {
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
    const nextRecord = updater({
      ...current,
      itemText: item.text || current.itemText,
      translation: item.translation || current.translation,
      itemType: item.itemType || current.itemType,
      updatedAt: now,
    });

    if (nextRecord) {
      const nextMap = { ...currentMap, [item.itemKey]: nextRecord };
      surgeProgressRef.current = nextMap;
      setSurgeProgressMap(nextMap);
      queueSurgeProgressSync([nextRecord]);
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
    return Object.values(surgeProgressRef.current)
      .filter((record) => record.status !== "known")
      .filter((record) => Boolean(record.nextReviewAt) && (record.nextReviewAt || 0) <= now)
      .filter((record) => !exclude.has(record.itemKey))
      .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0))
      .map((record) => toSurgeItem(record));
  }

  function isSurgeModeEnabled(phase: SurgePhase, preferences = surgeModesRef.current) {
    return Boolean(preferences[phase]);
  }

  function toggleMobileVocabTools(panel: "common" | "sentence" | "scenario" | "topic" | "surge") {
    setMobileVocabTools((current) => ({
      common: false,
      sentence: false,
      scenario: false,
      topic: false,
      surge: false,
      [panel]: !current[panel],
    }));
  }

  function toggleSurgeMode(phase: SurgePhase) {
    setSurgeModes((current) => {
      const enabledCount = Object.values(current).filter(Boolean).length;
      if (current[phase] && enabledCount === 1) {
        return current;
      }
      return {
        ...current,
        [phase]: !current[phase],
      };
    });
  }

  function applyImmediateSurgeReplacement(session: SurgeSession) {
    if (session.phase !== "preview" || session.activeRound.length >= 5) {
      return session;
    }

    const usedKeys = getSurgeUsedKeys(session, { includeReserve: false });
    session.activeRound.forEach((entry) => usedKeys.add(entry.itemKey));
    const dueItem = getDueSurgeItems(usedKeys)[0];
    if (dueItem) {
      return {
        ...session,
        activeRound: [...session.activeRound, dueItem],
      };
    }

    const reserveItem = session.reserve.find((entry) => !usedKeys.has(entry.itemKey));
    if (!reserveItem) {
      return session;
    }

    return {
      ...session,
      reserve: session.reserve.filter((entry) => entry.itemKey !== reserveItem.itemKey),
      activeRound: [...session.activeRound, reserveItem],
    };
  }

  async function fetchSurgeBatch(session: SurgeSession, count = 10) {
    if (!language) return [];
    const knownTexts = Object.values(surgeProgressRef.current)
      .filter((record) => record.status === "known")
      .map((record) => record.itemText);
    const trackedTexts = Object.values(surgeProgressRef.current)
      .map((record) => record.itemText)
      .filter(Boolean);
    const supportTexts = uniqueStrings([
      ...Object.values(surgeProgressRef.current)
        .filter((record) => record.status === "known" || record.stage >= 1)
        .map((record) => record.itemText),
      ...(studyPack?.entries.filter((entry) => !entry.archived).map((entry) => entry.word) ?? []),
      ...(sentencePack?.entries.filter((entry) => !entry.archived).map((entry) => entry.word) ?? []),
      ...Object.values(scenarioVocabMap).flatMap((pack) =>
        pack.entries.filter((entry) => !entry.archived).map((entry) => entry.word)
      ),
      ...Object.values(topicVocabMap).flatMap((pack) =>
        pack.entries.filter((entry) => !entry.archived).map((entry) => entry.word)
      ),
    ]).slice(-120);
    const existingTexts = [
      ...trackedTexts,
      ...session.activeRound.map((item) => item.text),
      ...session.reserve.map((item) => item.text),
      ...session.reviewQueue.map((item) => item.text),
      ...session.typingQueue.map((item) => item.text),
      ...session.delayedReviewQueue.map((item) => item.item.text),
    ];
    const recentTexts = session.recentlySeen
      .map((key) => surgeProgressRef.current[key]?.itemText || session.activeRound.find((item) => item.itemKey === key)?.text)
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
        support: supportTexts,
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

  function initializeSurgePhaseForRound(session: SurgeSession, preferences = surgeModesRef.current) {
    if (!session.activeRound.length) {
      return session;
    }
    if (preferences.preview) {
      return {
        ...session,
        phase: "preview" as const,
      };
    }
    if (preferences.match) {
      return createMatchSession(session);
    }
    return createTypingSession(session, session.activeRound);
  }

  function createTypingSession(session: SurgeSession, queue: SurgeItem[]) {
    const dedupedQueue = dedupeSurgeItems(queue);
    return {
      ...session,
      phase: "typing" as const,
      typingQueue: dedupedQueue,
      delayedReviewQueue: [],
      typingInput: "",
      typingDirection: dedupedQueue[0] ? getSurgeDirection(dedupedQueue[0]) : null,
      typingHintCount: 0,
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
        typingDirection: null,
        typingHintCount: 0,
        typingFeedback: null,
      },
      roundItems
    );
    const readySession = {
      ...filled,
      recentlySeen: uniqueStrings([
        ...filled.recentlySeen,
        ...filled.activeRound.map((item) => item.itemKey),
      ]).slice(-120),
    };
    return initializeSurgePhaseForRound(readySession);
  }

  function buildJourneyLessonStep(
    content: JourneyLessonContent,
    step: JourneyStepId
  ): JourneyActiveLesson {
    const base = createJourneyActiveLesson(content);
    if (step === "read") {
      return base;
    }
    if (step === "repeat") {
      return {
        ...base,
        step,
        repeatMode: "match",
        match: createJourneyMatchState(content.repeatItems),
      };
    }
    return {
      ...base,
      step,
      repeatMode: "type",
      match: null,
    };
  }

  function buildNextJourneyProgressRecord(
    current: JourneyPartProgress | undefined,
    chapterId: string,
    partId: string,
    options: {
      opened?: boolean;
      completedStep?: JourneyStepId;
      completed?: boolean;
      content?: JourneyLessonContent;
    } = {}
  ) {
    const now = Date.now();
    const base = current ?? createJourneyProgressRecord(chapterId, partId);
    const completedSteps = options.completedStep && !base.completedSteps.includes(options.completedStep)
      ? [...base.completedSteps, options.completedStep]
      : base.completedSteps;
    return {
      ...base,
      chapterId,
      partId,
      status: options.completed ? "completed" : completedSteps.length || options.opened || base.status === "started" ? "started" : "new",
      completedSteps,
      startedAt: base.startedAt ?? now,
      lastOpenedAt: options.opened ? now : base.lastOpenedAt ?? now,
      completedAt: options.completed ? now : base.completedAt,
      runCount: options.opened ? base.runCount + 1 : base.runCount,
      learnedSentences:
        options.completed && options.content ? collectJourneyLearnedSentences(options.content) : base.learnedSentences,
      updatedAt: now,
    } satisfies JourneyPartProgress;
  }

  function selectJourneyChapter(chapterId: string) {
    const chapter = getJourneyChapter(chapterId);
    if (!chapter) return;
    setView("journey");
    mutateJourneyState((state) => ({
      ...state,
      selectedChapterId: chapter.id,
      selectedPartId: chapter.parts[0]?.id || null,
      activeLesson:
        state.activeLesson && state.activeLesson.chapterId === chapter.id ? state.activeLesson : null,
    }));
  }

  async function openJourneyPart(chapterId: string, partId: string, forceRestart = false) {
    const chapter = getJourneyChapter(chapterId);
    const part = getJourneyPart(chapterId, partId);
    if (!language || !chapter || !part) return;
    setView("journey");
    setJourneyLoading(true);
    setJourneyError(null);

    const partKey = getJourneyPartKey(chapterId, partId);
    let lesson = journeyStateRef.current?.contentCache[partKey] || null;

    try {
      if (!lesson) {
        lesson = await fetchJourneyLesson(chapterId, partId);
      }

      mutateJourneyState((state) => {
        const currentActive = state.activeLesson;
        const shouldResume =
          !forceRestart &&
          currentActive &&
          currentActive.chapterId === chapterId &&
          currentActive.partId === partId &&
          !currentActive.completed;

        return {
          ...state,
          selectedChapterId: chapterId,
          selectedPartId: partId,
          contentCache: {
            ...state.contentCache,
            [partKey]: lesson!,
          },
          progress: {
            ...state.progress,
            [partKey]: buildNextJourneyProgressRecord(state.progress[partKey], chapterId, partId, {
              opened: true,
            }),
          },
          activeLesson: shouldResume ? currentActive : createJourneyActiveLesson(lesson!),
        };
      });
    } catch (error) {
      setJourneyError(
        error instanceof Error && error.message.trim()
          ? error.message
          : "Journey could not open this part right now."
      );
    } finally {
      setJourneyLoading(false);
    }
  }

  async function restartJourneyPart() {
    if (!activeJourneyContent) return;
    await openJourneyPart(activeJourneyContent.chapterId, activeJourneyContent.partId, true);
  }

  function closeJourneyLesson() {
    mutateJourneyState((state) => ({
      ...state,
      activeLesson: null,
    }));
  }

  function revealJourneyReadItem() {
    if (!activeJourneyLesson || activeJourneyLesson.step !== "read") return;
    mutateJourneyState((state) => ({
      ...state,
      activeLesson: state.activeLesson
        ? {
            ...state.activeLesson,
            revealed: true,
          }
        : null,
    }));
  }

  function toggleJourneyReadCard() {
    if (!activeJourneyLesson || activeJourneyLesson.step !== "read") return;
    mutateJourneyState((state) => ({
      ...state,
      activeLesson: state.activeLesson
        ? {
            ...state.activeLesson,
            revealed: !state.activeLesson.revealed,
          }
        : null,
    }));
  }

  function moveJourneyToNextStep(completedStep: JourneyStepId) {
    if (!activeJourneyLesson || !activeJourneyContent) return;
    const stepIndex = JOURNEY_STEP_ORDER.indexOf(completedStep);
    const nextStep = JOURNEY_STEP_ORDER[stepIndex + 1];
    const partKey = getJourneyPartKey(activeJourneyLesson.chapterId, activeJourneyLesson.partId);

    mutateJourneyState((state) => ({
      ...state,
      progress: {
        ...state.progress,
        [partKey]: buildNextJourneyProgressRecord(
          state.progress[partKey],
          activeJourneyLesson.chapterId,
          activeJourneyLesson.partId,
          {
            completedStep,
            completed: !nextStep,
            content: !nextStep ? activeJourneyContent : undefined,
          }
        ),
      },
      activeLesson: nextStep
        ? buildJourneyLessonStep(activeJourneyContent, nextStep)
        : state.activeLesson
          ? {
              ...state.activeLesson,
              completed: true,
              feedback: null,
              input: "",
              revealed: true,
            }
          : null,
    }));
  }

  function advanceJourneyReadItem() {
    if (!activeJourneyLesson || !activeJourneyContent || activeJourneyLesson.step !== "read") return;
    const isLast = activeJourneyLesson.itemIndex >= activeJourneyContent.readItems.length - 1;
    if (isLast) {
      moveJourneyToNextStep("read");
      return;
    }
    mutateJourneyState((state) => ({
      ...state,
      activeLesson: state.activeLesson
        ? {
            ...state.activeLesson,
            itemIndex: state.activeLesson.itemIndex + 1,
            revealed: false,
          }
        : null,
    }));
  }

  function chooseJourneyMatch(side: "target" | "translation", itemId: string) {
    if (
      !activeJourneyLesson ||
      activeJourneyLesson.step !== "repeat" ||
      activeJourneyLesson.repeatMode !== "match" ||
      !activeJourneyLesson.match
    ) {
      return;
    }

    mutateJourneyState((state) => {
      if (!state.activeLesson || state.activeLesson.step !== "repeat" || state.activeLesson.repeatMode !== "match" || !state.activeLesson.match) {
        return state;
      }

      const match = {
        ...state.activeLesson.match,
        selectedTargetId: side === "target" ? itemId : state.activeLesson.match.selectedTargetId,
        selectedTranslationId: side === "translation" ? itemId : state.activeLesson.match.selectedTranslationId,
      };

      if (!match.selectedTargetId || !match.selectedTranslationId) {
        return {
          ...state,
          activeLesson: {
            ...state.activeLesson,
            match,
          },
        };
      }

      if (match.selectedTargetId === match.selectedTranslationId) {
        const matchedIds = uniqueStrings([...match.matchedIds, match.selectedTargetId]);
        const nextMatch: JourneyMatchState = {
          ...match,
          matchedIds,
          selectedTargetId: null,
          selectedTranslationId: null,
        };
        const lessonComplete = matchedIds.length >= (activeJourneyContent?.repeatItems.length || 0);
        return {
          ...state,
          activeLesson: lessonComplete
            ? {
                ...state.activeLesson,
                repeatMode: "type",
                itemIndex: 0,
                input: "",
                feedback: null,
                match: nextMatch,
              }
            : {
                ...state.activeLesson,
                match: nextMatch,
              },
        };
      }

      return {
        ...state,
        activeLesson: {
          ...state.activeLesson,
          match: {
            ...match,
            selectedTargetId: null,
            selectedTranslationId: null,
          },
        },
      };
    });
  }

  function getCurrentJourneyExpectedAnswer() {
    if (!activeJourneyLesson || !activeJourneyContent) return null;
    if (activeJourneyLesson.step === "repeat" && activeJourneyLesson.repeatMode === "type") {
      return currentJourneyRepeatItem?.target || null;
    }
    if (activeJourneyLesson.step === "change") {
      return currentJourneyChangeItem?.answer || null;
    }
    if (activeJourneyLesson.step === "build") {
      return currentJourneyBuildItem?.answer || null;
    }
    if (activeJourneyLesson.step === "use") {
      return currentJourneyUseItem?.answer || null;
    }
    return null;
  }

  function submitJourneyValue(value: string) {
    if (!activeJourneyLesson || !activeJourneyContent) return;
    const expected = getCurrentJourneyExpectedAnswer();
    if (!expected) return;
    const submitted = value.trim();
    if (!submitted) return;

    const correct = matchesSurgeAnswer(submitted, expected, "target");
    const note =
      activeJourneyLesson.step === "use"
          ? "One strong real-life answer is enough here."
          : undefined;

    mutateJourneyState((state) => ({
      ...state,
      activeLesson: state.activeLesson
        ? {
            ...state.activeLesson,
            input: value,
            feedback: {
              status: correct ? "correct" : "wrong",
              expected,
              note,
            },
          }
        : null,
    }));
  }

  function submitJourneyAnswer() {
    if (!activeJourneyLesson) return;
    submitJourneyValue(activeJourneyLesson.input);
  }

  function continueJourneyAnswer() {
    if (!activeJourneyLesson || !activeJourneyContent || !activeJourneyLesson.feedback) return;
    const step = activeJourneyLesson.step;

    if (step === "repeat" && activeJourneyLesson.repeatMode === "type") {
      const isLast = activeJourneyLesson.itemIndex >= activeJourneyContent.repeatItems.length - 1;
      if (isLast) {
        moveJourneyToNextStep("repeat");
        return;
      }
    }

    if (step === "change") {
      const isLast = activeJourneyLesson.itemIndex >= activeJourneyContent.changeItems.length - 1;
      if (isLast) {
        moveJourneyToNextStep("change");
        return;
      }
    }

    if (step === "build") {
      const isLast = activeJourneyLesson.itemIndex >= activeJourneyContent.buildItems.length - 1;
      if (isLast) {
        moveJourneyToNextStep("build");
        return;
      }
    }

    if (step === "use") {
      moveJourneyToNextStep("use");
      return;
    }

    mutateJourneyState((state) => ({
      ...state,
      activeLesson: state.activeLesson
        ? {
            ...state.activeLesson,
            itemIndex: state.activeLesson.itemIndex + 1,
            input: "",
            feedback: null,
          }
        : null,
    }));
  }

  function openNextJourneyPart() {
    if (!activeJourneyContent) return;
    const nextPart = getJourneyNextPart(activeJourneyContent.chapterId, activeJourneyContent.partId);
    if (!nextPart) {
      closeJourneyLesson();
      return;
    }
    void openJourneyPart(nextPart.chapterId, nextPart.partId);
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
    const now = Date.now();
    syncSurgeRecord(item, (current) => ({
      ...current,
      status: current.status,
      timesSeen: current.timesSeen + 1,
      lastReviewedAt: current.lastReviewedAt ?? now,
      nextReviewAt: current.nextReviewAt ?? now + 10 * 60 * 1000,
      updatedAt: now,
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
    if (isSurgeModeEnabled("match")) {
      setSurgeSession(createMatchSession(surgeSession));
      return;
    }
    await completeSurgeMatchRound(surgeSession);
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
      recentlySeen: uniqueStrings([...surgeSession.recentlySeen, item.itemKey]).slice(-120),
      previewSeenKeys: surgeSession.previewSeenKeys.filter((key) => key !== item.itemKey),
    };

    const setIfStillRelevant = (candidate: SurgeSession) => {
      setSurgeSession((current) => {
        if (!current || current.language !== candidate.language) {
          return current;
        }
        return candidate;
      });
    };

    if (nextSession.phase === "preview") {
      const removedIndex = surgeSession.activeRound.findIndex((entry) => entry.itemKey === item.itemKey);
      const preservedIndex =
        removedIndex !== -1 && removedIndex < surgeSession.previewIndex
          ? Math.max(0, surgeSession.previewIndex - 1)
          : surgeSession.previewIndex;
      nextSession = applyImmediateSurgeReplacement({
        ...nextSession,
        previewRevealed: false,
      });
      nextSession.previewIndex = Math.min(preservedIndex, Math.max(nextSession.activeRound.length - 1, 0));
      nextSession.previewRevealed = false;
      setSurgeSession(nextSession);

      let filledSession = nextSession;
      if (filledSession.activeRound.length < 5) {
        filledSession = await fillSurgeRound(
          {
            ...filledSession,
            previewRevealed: false,
          },
          filledSession.activeRound
        );
        filledSession.previewIndex = Math.min(preservedIndex, Math.max(filledSession.activeRound.length - 1, 0));
        filledSession.previewRevealed = false;
      }
      if (!filledSession.activeRound.length) {
        filledSession = await buildNextSurgeRound(filledSession);
      }
      setIfStillRelevant(filledSession);
      return;
    }

    if (nextSession.phase === "typing") {
      if (!nextSession.typingQueue.length && nextSession.delayedReviewQueue.length) {
        const nextTypingQueue = nextSession.delayedReviewQueue.map((entry) => entry.item);
        nextSession = {
          ...nextSession,
          typingQueue: nextTypingQueue,
          delayedReviewQueue: [],
          typingDirection: nextTypingQueue[0] ? getSurgeDirection(nextTypingQueue[0]) : null,
        };
        setSurgeSession(nextSession);
        return;
      }
      nextSession.typingDirection = nextSession.typingQueue[0] ? getSurgeDirection(nextSession.typingQueue[0]) : null;
      setSurgeSession(nextSession);
      if (!nextSession.typingQueue.length) {
        const rebuilt = await buildNextSurgeRound(nextSession);
        setIfStillRelevant(rebuilt);
      }
      return;
    }

    setSurgeSession(nextSession);
  }

  function getSurgeDirection(item: SurgeItem) {
    const stage = surgeProgressRef.current[item.itemKey]?.stage ?? 0;
    return getDirectionForStage(stage);
  }

  function getSurgeExpectedAnswer(item: SurgeItem, directionOverride?: SurgeDirection | null) {
    const direction = directionOverride || getSurgeDirection(item);
    return direction === "target_to_english" ? item.translation : item.text;
  }

  function revealSurgeTypingHint() {
    if (!surgeSession || surgeSession.phase !== "typing" || surgeSession.typingFeedback) return;
    const current = surgeSession.typingQueue[0];
    if (!current) return;
    const answer = getSurgeHintDisplay(getSurgeExpectedAnswer(current, surgeSession.typingDirection));
    const revealableCount = Array.from(answer).filter((char) => /[\p{L}\p{N}]/u.test(char)).length;
    setSurgeSession({
      ...surgeSession,
      typingHintCount: Math.min(surgeSession.typingHintCount + 1, revealableCount),
    });
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
      typingDirection: surgeSession.typingQueue[1] ? getSurgeDirection(surgeSession.typingQueue[1]) : null,
      typingHintCount: 0,
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
        typingDirection: delayedItems[0] ? getSurgeDirection(delayedItems[0]) : null,
        typingHintCount: 0,
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
    const currentRecord = surgeProgressRef.current[current.itemKey];
    const direction = surgeSession.typingDirection || getDirectionForStage(currentRecord?.stage ?? 0);
    const mode = direction === "target_to_english" ? "english" : "target";
    const submitted = normalizeSurgeAnswer(surgeSession.typingInput, mode);
    const expectedText = direction === "target_to_english" ? current.translation : current.text;
    const now = Date.now();

    noteSurgeExposure(current);

    if (submitted && matchesSurgeAnswer(surgeSession.typingInput, expectedText, mode)) {
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
      master.gain.exponentialRampToValueAtTime(0.38, start + 0.002);
      master.gain.exponentialRampToValueAtTime(0.0001, start + 0.08);
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
      noiseGain.gain.exponentialRampToValueAtTime(0.9, start + 0.0015);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.038);
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
      bodyGain.gain.exponentialRampToValueAtTime(0.24, start + 0.002);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.055);
      body.connect(bodyGain);
      bodyGain.connect(master);
      body.start(start);
      body.stop(start + 0.055);

      const click = context.createOscillator();
      click.type = "triangle";
      click.frequency.setValueAtTime(920, start);
      click.frequency.exponentialRampToValueAtTime(520, start + 0.02);
      const clickGain = context.createGain();
      clickGain.gain.setValueAtTime(0.0001, start);
      clickGain.gain.exponentialRampToValueAtTime(0.08, start + 0.001);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.018);
      click.connect(clickGain);
      clickGain.connect(master);
      click.start(start);
      click.stop(start + 0.02);
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

  async function completeSurgeMatchRound(sessionOverride?: SurgeSession) {
    const sourceSession = sessionOverride ?? surgeSession;
    if (!sourceSession) return;
    const nextReviewQueue = dedupeSurgeItems([...sourceSession.reviewQueue, ...sourceSession.activeRound]).filter(
      (item) => surgeProgressMap[item.itemKey]?.status !== "known"
    );
    const nextCycleCount = sourceSession.cycleCount + 1;
    let nextSession: SurgeSession = {
      ...sourceSession,
      cycleCount: nextCycleCount,
      reviewQueue: isSurgeModeEnabled("typing") ? nextReviewQueue : [],
      selectedTargetKey: null,
      selectedTranslationKey: null,
      matchedKeys: sourceSession.activeRound.map((item) => item.itemKey),
    };

    if (isSurgeModeEnabled("typing") && nextCycleCount % 2 === 0 && nextReviewQueue.length) {
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
          void completeSurgeMatchRound(resolvedSession);
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

  function deleteSentenceEntry(index: number) {
    const target = sentencePack?.entries[index];
    setSentencePack((prev) => {
      if (!prev) return prev;
      const next = prev.entries.filter((_, i) => i !== index);
      return { ...prev, entries: next };
    });
    setSentenceFlipped((prev) => {
      const next: Record<number, boolean> = {};
      Object.keys(prev).forEach((key) => {
        const idx = Number(key);
        if (Number.isNaN(idx) || idx === index) return;
        next[idx > index ? idx - 1 : idx] = prev[idx];
      });
      return next;
    });
    if (target) {
      void deleteUserVocab("sentence", normalizeWord(target.word));
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

  async function archiveSentenceEntry(index: number) {
    if (!authUser || !language || !sentencePack) return;
    const target = sentencePack.entries[index];
    if (!target) return;
    setSentencePack((prev) => {
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
      .eq("scope", "sentence")
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

  function assignScenarioFolder(index: number, scenarioId: string, folder: string | null) {
    const target = scenarioVocabMap[scenarioId]?.entries[index];
    setScenarioVocabMap((prev) => {
      const current = prev[scenarioId];
      if (!current) return prev;
      return {
        ...prev,
        [scenarioId]: {
          ...current,
          entries: current.entries.map((entry, i) => (i === index ? { ...entry, folder } : entry)),
        },
      };
    });
    if (target) {
      void upsertUserVocab([
        {
          scope: "scenario",
          scenarioId,
          wordKey: normalizeWord(target.word),
          word: target.word,
          translation: target.translation,
          starred: Boolean(target.starred),
          folder,
          count: 1,
          lastClicked: Date.now(),
          archived: Boolean(target.archived),
        },
      ]);
    }
  }

  function assignTopicFolder(index: number, folder: string | null) {
    if (!activeTopic) return;
    const target = topicVocabMap[activeTopic]?.entries[index];
    setTopicVocabMap((prev) => {
      const current = prev[activeTopic];
      if (!current) return prev;
      return {
        ...prev,
        [activeTopic]: {
          ...current,
          entries: current.entries.map((entry, i) => (i === index ? { ...entry, folder } : entry)),
        },
      };
    });
    if (target) {
      void upsertUserVocab([
        {
          scope: "topic",
          scenarioId: activeTopic,
          wordKey: normalizeWord(target.word),
          word: target.word,
          translation: target.translation,
          starred: Boolean(target.starred),
          folder,
          count: 1,
          lastClicked: Date.now(),
          archived: Boolean(target.archived),
        },
      ]);
    }
  }

  async function generateSentenceWords(count: number, level?: "core" | "advanced") {
    if (!language || sentenceLoading) return;
    setSentenceLoading(true);
    try {
      const existingEntries = sentencePack?.entries ?? [];
      const existing = existingEntries.map((entry) => entry.word);
      const res = await fetch("/api/vocab-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, count, existing, level, unitType: "sentence" }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items: StudyEntry[] };
      if (!Array.isArray(data.items) || data.items.length === 0) return;
      const incoming = data.items.map((item) => ({ ...item, starred: item.starred ?? false }));
      const { merged, added } = mergeUniqueEntries(existingEntries, incoming);

      setSentencePack({ language, entries: merged });

      const rows = added
        .map((item) => ({
          scope: "sentence" as const,
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
      setSentenceLoading(false);
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

  useEffect(() => {
    if (surgeSession?.phase === "typing" && !surgeSession.typingFeedback) {
      surgeInputRef.current?.focus();
      surgeTypingPanelRef.current?.blur();
    }
    if (surgeSession?.phase === "typing" && surgeSession.typingFeedback) {
      surgeTypingPanelRef.current?.focus();
    }
  }, [surgeSession]);

  useEffect(() => {
    const lesson = journeyState?.activeLesson;
    if (!lesson || lesson.completed) {
      return;
    }
    if (lesson.step === "read") {
      return;
    }
    if (lesson.step === "repeat" && lesson.repeatMode === "match") {
      return;
    }
    journeyInputRef.current?.focus();
  }, [journeyState]);

  useEffect(() => {
    const lesson = journeyState?.activeLesson;
    if (journeyAutoAdvanceTimerRef.current !== null) {
      window.clearTimeout(journeyAutoAdvanceTimerRef.current);
      journeyAutoAdvanceTimerRef.current = null;
    }
    if (!lesson?.feedback || lesson.feedback.status !== "correct" || lesson.completed) {
      return;
    }
    journeyAutoAdvanceTimerRef.current = window.setTimeout(() => {
      journeyAutoAdvanceTimerRef.current = null;
      continueJourneyAnswer();
    }, 650);
    return () => {
      if (journeyAutoAdvanceTimerRef.current !== null) {
        window.clearTimeout(journeyAutoAdvanceTimerRef.current);
        journeyAutoAdvanceTimerRef.current = null;
      }
    };
  }, [journeyState]);

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
  const surgeMasteredItems = useMemo(() => {
    return Object.values(surgeProgressMap)
      .filter((record) => record.status === "known" || record.stage >= 6)
      .sort((a, b) => (b.updatedAt || b.lastReviewedAt || 0) - (a.updatedAt || a.lastReviewedAt || 0));
  }, [surgeProgressMap]);
  const commonWordCount = useMemo(
    () => studyPack?.entries.filter((entry) => !entry.archived).length || 0,
    [studyPack]
  );
  const sentenceCount = useMemo(
    () => sentencePack?.entries.filter((entry) => !entry.archived).length || 0,
    [sentencePack]
  );
  const scenarioWordCount = useMemo(
    () =>
      Object.values(scenarioVocabMap).reduce(
        (sum, pack) => sum + pack.entries.filter((entry) => !entry.archived).length,
        0
      ),
    [scenarioVocabMap]
  );
  const scenarioDeckCount = useMemo(
    () => Object.values(scenarioVocabMap).filter((pack) => pack.entries.some((entry) => !entry.archived)).length,
    [scenarioVocabMap]
  );
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
  const journeyProgress = journeyState?.progress ?? {};
  const selectedJourneyChapterId = journeyState?.selectedChapterId || JOURNEY_CHAPTERS[0]?.id || null;
  const selectedJourneyPartId = journeyState?.selectedPartId || null;
  const selectedJourneyChapter = useMemo(
    () => (selectedJourneyChapterId ? getJourneyChapter(selectedJourneyChapterId) : JOURNEY_CHAPTERS[0] || null),
    [selectedJourneyChapterId]
  );
  const selectedJourneyPart = useMemo(
    () =>
      selectedJourneyChapter && selectedJourneyPartId
        ? getJourneyPart(selectedJourneyChapter.id, selectedJourneyPartId)
        : null,
    [selectedJourneyChapter, selectedJourneyPartId]
  );
  const activeJourneyLesson = journeyState?.activeLesson || null;
  const activeJourneyPartKey = activeJourneyLesson
    ? getJourneyPartKey(activeJourneyLesson.chapterId, activeJourneyLesson.partId)
    : selectedJourneyChapter && selectedJourneyPartId
      ? getJourneyPartKey(selectedJourneyChapter.id, selectedJourneyPartId)
      : null;
  const activeJourneyContent = activeJourneyPartKey ? journeyState?.contentCache[activeJourneyPartKey] || null : null;
  const activeJourneyProgress = activeJourneyPartKey ? journeyProgress[activeJourneyPartKey] || null : null;
  const journeyCompletedCount = useMemo(
    () => Object.values(journeyProgress).filter((record) => record.status === "completed").length,
    [journeyProgress]
  );
  const journeyStartedCount = useMemo(
    () => Object.values(journeyProgress).filter((record) => record.status !== "new").length,
    [journeyProgress]
  );
  const journeyChapterCounts = useMemo(() => {
    return JOURNEY_CHAPTERS.reduce<Record<string, { completed: number; started: number; total: number }>>(
      (accumulator, chapter) => {
        const counts = chapter.parts.reduce(
          (summary, part) => {
            const record = journeyProgress[getJourneyPartKey(chapter.id, part.id)];
            if (!record || record.status === "new") {
              return summary;
            }
            return {
              ...summary,
              started: summary.started + 1,
              completed: summary.completed + (record.status === "completed" ? 1 : 0),
            };
          },
          { completed: 0, started: 0, total: chapter.parts.length }
        );
        accumulator[chapter.id] = counts;
        return accumulator;
      },
      {}
    );
  }, [journeyProgress]);
  const journeyRecommendation = useMemo(() => {
    if (activeJourneyLesson && !activeJourneyLesson.completed) {
      return { chapterId: activeJourneyLesson.chapterId, partId: activeJourneyLesson.partId, label: "Resume part" };
    }
    const startedRecord = Object.values(journeyProgress)
      .filter((record) => record.status === "started")
      .sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0))[0];
    if (startedRecord) {
      return {
        chapterId: startedRecord.chapterId,
        partId: startedRecord.partId,
        label: "Continue journey",
      };
    }
    const firstIncomplete = JOURNEY_CHAPTERS.flatMap((chapter) =>
      chapter.parts.map((part) => ({
        chapterId: chapter.id,
        partId: part.id,
        record: journeyProgress[getJourneyPartKey(chapter.id, part.id)],
      }))
    ).find((item) => item.record?.status !== "completed");
    return firstIncomplete
      ? { chapterId: firstIncomplete.chapterId, partId: firstIncomplete.partId, label: "Start here" }
      : { chapterId: JOURNEY_CHAPTERS[0]?.id || "", partId: JOURNEY_CHAPTERS[0]?.parts[0]?.id || "", label: "Replay journey" };
  }, [activeJourneyLesson, journeyProgress]);
  const currentJourneyReadItem =
    activeJourneyLesson && activeJourneyContent && activeJourneyLesson.step === "read"
      ? activeJourneyContent.readItems[activeJourneyLesson.itemIndex] || null
      : null;
  const currentJourneyRepeatItem =
    activeJourneyLesson &&
    activeJourneyContent &&
    activeJourneyLesson.step === "repeat" &&
    activeJourneyLesson.repeatMode === "type"
      ? activeJourneyContent.repeatItems[activeJourneyLesson.itemIndex] || null
      : null;
  const currentJourneyChangeItem =
    activeJourneyLesson && activeJourneyContent && activeJourneyLesson.step === "change"
      ? activeJourneyContent.changeItems[activeJourneyLesson.itemIndex] || null
      : null;
  const currentJourneyChangeOptions = useMemo(() => {
    if (!currentJourneyChangeItem || !activeJourneyContent) {
      return [];
    }

    const answer = currentJourneyChangeItem.answer.trim();
    const phraseCandidates = [
      ...(currentJourneyChangeItem.options || []),
      ...activeJourneyContent.changeItems.flatMap((item) => [item.answer, ...(item.options || [])]),
    ]
      .map((value) => value.trim())
      .filter(Boolean);

    const tokenCandidates = [
      ...activeJourneyContent.readItems.map((item) => item.target),
      ...activeJourneyContent.repeatItems.map((item) => item.target),
      ...activeJourneyContent.changeItems.map((item) => item.template.replace("___", item.answer)),
      ...activeJourneyContent.buildItems.map((item) => item.answer),
      activeJourneyContent.useItem.answer,
    ].flatMap(extractJourneyOptionTokens);

    const seen = new Set<string>();
    const normalizedAnswer = normalizeSurgeAnswer(answer, "target");
    const distractors = [...phraseCandidates, ...tokenCandidates].filter((value) => {
      const normalized = normalizeSurgeAnswer(value, "target");
      if (!normalized || normalized === normalizedAnswer || seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });

    return shuffleList([answer, ...shuffleList(distractors).slice(0, 5)]);
  }, [activeJourneyContent, currentJourneyChangeItem]);
  const currentJourneyBuildItem =
    activeJourneyLesson && activeJourneyContent && activeJourneyLesson.step === "build"
      ? activeJourneyContent.buildItems[activeJourneyLesson.itemIndex] || null
      : null;
  const currentJourneyUseItem =
    activeJourneyLesson && activeJourneyContent && activeJourneyLesson.step === "use"
      ? activeJourneyContent.useItem
      : null;
  const buddyQuickActions = useMemo(
    () => [
      {
        label: "Quiz me",
        prompt: `Coach me in English, but quiz me on ${language || "the target language"} using the words I am still learning. One prompt at a time.`,
      },
      {
        label: "Mini chat",
        prompt: `Set up a tiny everyday conversation. Explain in English first, then have me answer in ${language || "the target language"}. Keep it simple and correct me briefly if needed.`,
      },
      {
        label: "Translate",
        prompt: `Give me three very common English words or short phrases to translate into ${language || "the target language"}, one at a time.`,
      },
      {
        label: "Review weak words",
        prompt: `Use my recent and weak words. Speak in English, but make me actively recall the ${language || "target language"} forms.`,
      },
    ],
    [language]
  );
  const scenarioGroups = useMemo(
    () =>
      [
        {
          id: "foundation" as const,
          title: "Daily basics",
          description: "Short, practical scenes for the phrases you use constantly.",
          scenarioIds: ["cafe", "restaurant", "bakery", "grocery", "market", "pharmacy", "post"],
        },
        {
          id: "travel" as const,
          title: "Travel and getting around",
          description: "Move through stations, hotels, check-ins, and quick travel questions.",
          scenarioIds: ["hotel", "airport", "customs", "taxi", "train", "museum", "movie"],
        },
        {
          id: "life" as const,
          title: "Work and real life",
          description: "Conversations for work, appointments, relationships, and everyday logistics.",
          scenarioIds: ["doctor", "job", "first-day", "apartment", "bank", "gym", "salon", "tech", "dating", "family", "school"],
        },
      ].map((group) => ({
        ...group,
        scenarios: group.scenarioIds
          .map((scenarioId) => SCENARIOS.find((scenario) => scenario.id === scenarioId))
          .filter((scenario): scenario is ScenarioDefinition => Boolean(scenario)),
      })),
    []
  );
  const activeScenarioGroupData =
    scenarioGroups.find((group) => group.id === activeScenarioGroup) || scenarioGroups[0];
  const topScenario = useMemo(() => {
    return SCENARIOS
      .map((scenario) => ({
        scenario,
        count: progressMap[scenario.id] || 0,
      }))
      .sort((a, b) => b.count - a.count)[0];
  }, [progressMap]);
  const nextScenario = useMemo(() => {
    return SCENARIOS
      .map((scenario) => ({
        scenario,
        count: progressMap[scenario.id] || 0,
      }))
      .sort((a, b) => a.count - b.count)[0];
  }, [progressMap]);
  const topicList = useMemo(() => Object.keys(topicVocabMap).sort((a, b) => a.localeCompare(b)), [topicVocabMap]);
  const buddyResumeAvailable = isBuddyChat
    ? hasBuddyConversation
    : Boolean(buddySavedState?.messages.length);
  const buddyRecommendation = useMemo(() => {
    if (!language) {
      return {
        title: "Choose your language first",
        body: "Set the target language in the header, then Buddy can build a real plan from your saved words and practice history.",
        action: "Set language",
      };
    }
    if (buddyProfileSnapshot.practicedWordCount < 12) {
      return {
        title: "Build a foundation first",
        body: `You have only practiced about ${buddyProfileSnapshot.practicedWordCount} saved words so far. Start with Surge, then let Buddy turn those basics into mini chats and recall drills.`,
        action: "Start with Surge",
      };
    }
    if (buddyProfileSnapshot.dueCount > 0) {
      return {
        title: "You have words ready for review",
        body: `${buddyProfileSnapshot.dueCount} Surge items are due now. Clear those first so Buddy can reinforce the exact words that are still unstable.`,
        action: "Continue Surge",
      };
    }
    if ((topScenario?.count || 0) < 2) {
      return {
        title: "Start using your words in scenes",
        body: "You have some vocabulary, but not much scenario practice yet. A short daily-life scenario will make those words stick faster.",
        action: "Open a scenario",
      };
    }
    return {
      title: "Turn your progress into active recall",
      body: `You have ${buddyProfileSnapshot.practicedWordCount} practiced words and ${buddyProfileSnapshot.masteredCount} stronger items. Buddy should now push you with mini chats, short translations, and recycled weak words.`,
      action: buddyResumeAvailable ? "Continue Buddy" : "Open Buddy",
    };
  }, [buddyProfileSnapshot, buddyResumeAvailable, language, topScenario]);
  const buddyStartupGuide = useMemo(() => {
    if (!language) {
      return "Open with a short, encouraging note and ask the learner to pick a language first.";
    }
    if (buddyProfileSnapshot.practicedWordCount < 12) {
      return `Tell the learner they have practiced ${buddyProfileSnapshot.practicedWordCount} saved words so far and need a stronger base. Recommend Surge first, then offer a tiny warm-up chat using only the most common words.`;
    }
    if (buddyProfileSnapshot.dueCount > 0) {
      return `Tell the learner they have ${buddyProfileSnapshot.dueCount} due Surge reviews waiting. Recommend clearing those first, then offer one small follow-up chat using recent words.`;
    }
    if ((topScenario?.count || 0) < 2) {
      return "Tell the learner they have enough core words to start using them in full situations. Suggest one short daily-life scenario and then offer a mini conversation.";
    }
    return `Tell the learner they have practiced ${buddyProfileSnapshot.practicedWordCount} saved words, with ${buddyProfileSnapshot.masteredCount} stronger items and ${buddyProfileSnapshot.learningCount} still in progress. Recommend a focused buddy drill that targets weak items first.`;
  }, [buddyProfileSnapshot, language, topScenario]);
  const dashboardPlanItems = useMemo(() => {
    if (!language) {
      return [
        "Pick the language you want to train.",
        "Start Surge to build a useful base of high-frequency words and short phrases.",
        "Use Buddy or a scenario once you have a few basics to work with.",
      ];
    }
    if (buddyProfileSnapshot.practicedWordCount < 12) {
      return [
        "Run a short Surge block and learn the next core items.",
        "Repeat the due items until recall feels automatic.",
        "Open Buddy after that for one tiny guided drill in English-first coaching.",
      ];
    }
    if (buddyProfileSnapshot.dueCount > 0) {
      return [
        `Clear the ${buddyProfileSnapshot.dueCount} Surge reviews due now.`,
        "Let Buddy recycle the same weak words in one short quiz.",
        "Finish with one daily-life scenario to use them in context.",
      ];
    }
    return [
      "Open Buddy for active recall with your current weak words.",
      "Do one daily-life scenario to use them in context.",
      "Come back to Surge later for the next review wave.",
    ];
  }, [buddyProfileSnapshot, language]);
  const dashboardTopicPreview = useMemo(() => topicList.slice(0, 3), [topicList]);
  const currentSurgePrompt = useMemo(() => getCurrentSurgePrompt(surgeSession), [surgeSession]);
  const currentSurgeTypingDirection = useMemo(() => {
    if (!surgeSession || surgeSession.phase !== "typing" || !currentSurgePrompt) {
      return null;
    }
    return surgeSession.typingFeedback?.direction || surgeSession.typingDirection || getSurgeDirection(currentSurgePrompt);
  }, [currentSurgePrompt, surgeSession]);
  const currentSurgeHintAnswer = useMemo(() => {
    if (!currentSurgePrompt || !currentSurgeTypingDirection) {
      return "";
    }
    return getSurgeHintDisplay(getSurgeExpectedAnswer(currentSurgePrompt, currentSurgeTypingDirection));
  }, [currentSurgePrompt, currentSurgeTypingDirection]);
  const currentSurgeHintGlyphs = useMemo(
    () => buildSurgeHintGlyphs(currentSurgeHintAnswer, surgeSession?.typingHintCount || 0),
    [currentSurgeHintAnswer, surgeSession?.typingHintCount]
  );
  const currentSurgeHintTotal = useMemo(
    () => currentSurgeHintGlyphs.filter((glyph) => glyph.isLetter).length,
    [currentSurgeHintGlyphs]
  );
  const studyFolders = useMemo(
    () => uniqueStrings((studyPack?.entries ?? []).map((entry) => normalizeFolderName(entry.folder || ""))),
    [studyPack]
  );
  const sentenceFolders = useMemo(
    () => uniqueStrings((sentencePack?.entries ?? []).map((entry) => normalizeFolderName(entry.folder || ""))),
    [sentencePack]
  );
  const scenarioFolders = useMemo(() => {
    const entries = activeScenarioVocab ? scenarioVocabMap[activeScenarioVocab.id]?.entries ?? [] : [];
    return uniqueStrings(entries.map((entry) => normalizeFolderName(entry.folder || "")));
  }, [activeScenarioVocab, scenarioVocabMap]);
  const topicFolders = useMemo(() => {
    const entries = activeTopic ? topicVocabMap[activeTopic]?.entries ?? [] : [];
    return uniqueStrings(entries.map((entry) => normalizeFolderName(entry.folder || "")));
  }, [activeTopic, topicVocabMap]);
  const studyVisibleItems = useMemo(() => {
    const entries = studyPack?.entries ?? [];
    return entries
      .map((entry, index) => ({ entry, index }))
      .filter((item) =>
        studyFolderFilter === "archived"
          ? item.entry.archived
          : !item.entry.archived &&
            (studyFolderFilter === "all"
              ? true
              : normalizeFolderName(item.entry.folder || "") === studyFolderFilter)
      )
      .filter((item) => (showStudyStarredOnly ? item.entry.starred : true));
  }, [showStudyStarredOnly, studyFolderFilter, studyPack]);
  const sentenceVisibleItems = useMemo(() => {
    const entries = sentencePack?.entries ?? [];
    return entries
      .map((entry, index) => ({ entry, index }))
      .filter((item) =>
        sentenceFolderFilter === "archived"
          ? item.entry.archived
          : !item.entry.archived &&
            (sentenceFolderFilter === "all"
              ? true
              : normalizeFolderName(item.entry.folder || "") === sentenceFolderFilter)
      )
      .filter((item) => (showSentenceStarredOnly ? item.entry.starred : true));
  }, [sentenceFolderFilter, sentencePack, showSentenceStarredOnly]);

  const filteredVocab = useMemo(() => {
    if (!showStarredOnly) return sortedVocab;
    return sortedVocab.filter((entry) => entry.starred);
  }, [sortedVocab, showStarredOnly]);

  const journeyView = (
    <section className="journey-shell">
      <div className="journey-header">
        <div>
          <div className="journey-kicker">Journey</div>
          <h2>Learn in chapters, not random fragments.</h2>
          <p>Each part stays focused on one useful idea, then pushes you to use it.</p>
        </div>
        <div className="journey-header-actions">
          {journeyRecommendation.chapterId && journeyRecommendation.partId ? (
            <button
              type="button"
              className="solid"
              onClick={() => void openJourneyPart(journeyRecommendation.chapterId, journeyRecommendation.partId)}
              disabled={!language || journeyLoading}
            >
              {journeyRecommendation.label}
            </button>
          ) : null}
          <div className="journey-stat-chip">Completed {journeyCompletedCount}/50</div>
          <div className="journey-stat-chip">Started {journeyStartedCount}</div>
        </div>
      </div>

      {!language ? (
        <div className="journey-panel">
          <div className="home-vocab-empty">Choose a language first, then Journey can build the right lesson path.</div>
        </div>
      ) : activeJourneyLesson && activeJourneyContent ? (
        <section className="journey-focus-shell">
          <div className="journey-focus-bar">
            <button type="button" className="ghost" onClick={closeJourneyLesson}>
              Back to chapter
            </button>
            <div className="journey-focus-meta">
              <span>Chapter {selectedJourneyChapter?.index} - Part {selectedJourneyPart?.index}</span>
              <span>{selectedJourneyPart?.title}</span>
            </div>
            <button type="button" className="ghost" onClick={() => void restartJourneyPart()}>
              Restart
            </button>
          </div>

          <section className="journey-panel journey-lesson-panel journey-lesson-panel-focus">
            {activeJourneyLesson.completed ? (
              <div className="journey-finish-card">
                <div className="journey-panel-head">
                  <div>
                    <span className="journey-panel-kicker">Part complete</span>
                    <h3>{selectedJourneyPart?.title}</h3>
                  </div>
                  <div className="journey-panel-meta">Saved</div>
                </div>
                <div className="journey-finish-copy">
                  {activeJourneyContent.carryForwardNote || "This pattern is now ready to reappear inside later chapters."}
                </div>
                <div className="journey-finish-list">
                  {collectJourneyLearnedSentences(activeJourneyContent).slice(0, 4).map((item) => (
                    <div key={item.id} className="journey-finish-row">
                      <div className="journey-finish-target">{item.target}</div>
                      <div className="journey-finish-translation">{item.translation}</div>
                    </div>
                  ))}
                </div>
                <div className="journey-lesson-actions">
                  <button type="button" className="ghost" onClick={() => void restartJourneyPart()}>
                    Replay part
                  </button>
                  <button type="button" className="ghost" onClick={closeJourneyLesson}>
                    Close
                  </button>
                  <button type="button" className="solid" onClick={openNextJourneyPart}>
                    Next part
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="journey-panel-head">
                  <div>
                    <span className="journey-panel-kicker">
                      Chapter {selectedJourneyChapter?.index} - Part {selectedJourneyPart?.index}
                    </span>
                    <h3>{selectedJourneyPart?.title}</h3>
                  </div>
                  <div className="journey-panel-meta">{JOURNEY_STEP_LABELS[activeJourneyLesson.step]}</div>
                </div>

                <div className="journey-step-track">
                  {JOURNEY_STEP_ORDER.map((step) => {
                    const done = activeJourneyProgress?.completedSteps.includes(step);
                    const active = activeJourneyLesson.step === step;
                    return (
                      <div
                        key={step}
                        className={`journey-step-pill${done ? " done" : ""}${active ? " active" : ""}`}
                      >
                        <span>{JOURNEY_STEP_LABELS[step]}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="journey-lesson-copy">
                  <div>{activeJourneyContent.summary || selectedJourneyPart?.summary}</div>
                  <div>{activeJourneyContent.grammarFocus}</div>
                </div>

                {activeJourneyContent.carryForwardNote ? (
                  <div className="journey-carry-note">{activeJourneyContent.carryForwardNote}</div>
                ) : null}

                {activeJourneyLesson.step === "read" && currentJourneyReadItem ? (
                  <>
                    <button
                      type="button"
                      className={`journey-card${activeJourneyLesson.revealed ? " revealed" : ""}`}
                      onClick={toggleJourneyReadCard}
                    >
                      <div className="journey-card-label">Meaning</div>
                      <div className="journey-card-translation">{currentJourneyReadItem.translation}</div>
                      <div className="journey-card-label">Target</div>
                      <div className="journey-card-target">
                        {activeJourneyLesson.revealed ? currentJourneyReadItem.target : "Tap to flip"}
                      </div>
                    </button>
                    <div className="journey-lesson-actions">
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => void playFlashcardAudio("journey", currentJourneyReadItem.target)}
                      >
                        Pronounce
                      </button>
                      <button
                        type="button"
                        className="solid"
                        onClick={() =>
                          activeJourneyLesson.revealed ? advanceJourneyReadItem() : revealJourneyReadItem()
                        }
                      >
                        {activeJourneyLesson.revealed ? "Next" : "Reveal"}
                      </button>
                    </div>
                  </>
                ) : null}

                {activeJourneyLesson.step === "repeat" && activeJourneyLesson.repeatMode === "match" && activeJourneyLesson.match ? (
                  <>
                    <div className="journey-repeat-head">
                      <span>Match the sentence pairs first.</span>
                      <span>{activeJourneyLesson.match.matchedIds.length}/{activeJourneyContent.repeatItems.length}</span>
                    </div>
                    <div className="journey-match-grid">
                      <div className="journey-match-column">
                        {activeJourneyLesson.match.targets.map((itemId) => {
                          const item = activeJourneyContent.repeatItems.find((entry) => entry.id === itemId);
                          if (!item) return null;
                          const matched = activeJourneyLesson.match?.matchedIds.includes(itemId);
                          const selected = activeJourneyLesson.match?.selectedTargetId === itemId;
                          return (
                            <button
                              key={`journey-target-${itemId}`}
                              type="button"
                              className={`journey-match-card${matched ? " matched" : ""}${selected ? " selected" : ""}`}
                              onClick={() => chooseJourneyMatch("target", itemId)}
                              disabled={matched}
                            >
                              {item.target}
                            </button>
                          );
                        })}
                      </div>
                      <div className="journey-match-column">
                        {activeJourneyLesson.match.translations.map((itemId) => {
                          const item = activeJourneyContent.repeatItems.find((entry) => entry.id === itemId);
                          if (!item) return null;
                          const matched = activeJourneyLesson.match?.matchedIds.includes(itemId);
                          const selected = activeJourneyLesson.match?.selectedTranslationId === itemId;
                          return (
                            <button
                              key={`journey-translation-${itemId}`}
                              type="button"
                              className={`journey-match-card${matched ? " matched" : ""}${selected ? " selected" : ""}`}
                              onClick={() => chooseJourneyMatch("translation", itemId)}
                              disabled={matched}
                            >
                              {item.translation}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : null}

                {activeJourneyLesson.step === "repeat" && activeJourneyLesson.repeatMode === "type" && currentJourneyRepeatItem ? (
                  <>
                    <div className="journey-practice-card">
                      <div className="journey-card-label">Repeat the sentence</div>
                      <div className="journey-practice-source">{currentJourneyRepeatItem.target}</div>
                      <div className="journey-practice-translation">{currentJourneyRepeatItem.translation}</div>
                    </div>
                    <div className="journey-answer-area">
                      <div className="surge-input-wrap">
                        <input
                          ref={(node) => {
                            journeyInputRef.current = node;
                          }}
                          type="text"
                          value={activeJourneyLesson.input}
                          onChange={(event) =>
                            mutateJourneyState((state) => ({
                              ...state,
                              activeLesson: state.activeLesson
                                ? {
                                    ...state.activeLesson,
                                    input: event.target.value,
                                  }
                                : null,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              activeJourneyLesson.feedback ? continueJourneyAnswer() : submitJourneyAnswer();
                            }
                          }}
                          placeholder="Type the same sentence"
                        />
                      </div>
                      {activeJourneyLesson.feedback ? (
                        <div className={`journey-feedback ${activeJourneyLesson.feedback.status}`}>
                          <span>{activeJourneyLesson.feedback.status === "correct" ? "Good." : "Use this exact sentence."}</span>
                          <strong>{activeJourneyLesson.feedback.expected}</strong>
                        </div>
                      ) : null}
                    </div>
                    <div className="journey-lesson-actions">
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => void playFlashcardAudio("journey", currentJourneyRepeatItem.target)}
                      >
                        Pronounce
                      </button>
                      {!activeJourneyLesson.feedback || activeJourneyLesson.feedback.status === "wrong" ? (
                        <button
                          type="button"
                          className="solid"
                          onClick={() =>
                            activeJourneyLesson.feedback ? continueJourneyAnswer() : submitJourneyAnswer()
                          }
                        >
                          {activeJourneyLesson.feedback ? "Continue" : "Check"}
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}

                {activeJourneyLesson.step === "change" && currentJourneyChangeItem ? (
                  <>
                    <div className="journey-practice-card">
                      <div className="journey-card-label">Change one part</div>
                      <div className="journey-practice-source blank">{currentJourneyChangeItem.template}</div>
                      <div className="journey-practice-translation">{currentJourneyChangeItem.cue}</div>
                      <div className="journey-practice-support">{currentJourneyChangeItem.translation}</div>
                      {currentJourneyChangeOptions.length ? (
                        <div className="journey-option-row">
                          {currentJourneyChangeOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={`ghost journey-option-chip${activeJourneyLesson.input === option ? " selected" : ""}`}
                              onClick={() => submitJourneyValue(option)}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="journey-answer-area">
                      {!activeJourneyLesson.feedback ? (
                        <div className="journey-choice-helper">Choose the missing word or phrase.</div>
                      ) : null}
                      {activeJourneyLesson.feedback ? (
                        <div className={`journey-feedback ${activeJourneyLesson.feedback.status}`}>
                          <span>{activeJourneyLesson.feedback.status === "correct" ? "Correct." : "Not quite."}</span>
                          <strong>{activeJourneyLesson.feedback.expected}</strong>
                        </div>
                      ) : null}
                    </div>
                    <div className="journey-lesson-actions">
                      {activeJourneyLesson.feedback?.status === "wrong" ? (
                        <button
                          type="button"
                          className="solid"
                          onClick={() => continueJourneyAnswer()}
                        >
                          Continue
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}

                {activeJourneyLesson.step === "build" && currentJourneyBuildItem ? (
                  <>
                    <div className="journey-practice-card">
                      <div className="journey-card-label">Build the sentence</div>
                      <div className="journey-build-cue">{currentJourneyBuildItem.cue}</div>
                      <div className="journey-practice-support">
                        {currentJourneyBuildItem.support || currentJourneyBuildItem.translation}
                      </div>
                    </div>
                    <div className="journey-answer-area">
                      <div className="surge-input-wrap">
                        <input
                          ref={(node) => {
                            journeyInputRef.current = node;
                          }}
                          type="text"
                          value={activeJourneyLesson.input}
                          onChange={(event) =>
                            mutateJourneyState((state) => ({
                              ...state,
                              activeLesson: state.activeLesson
                                ? {
                                    ...state.activeLesson,
                                    input: event.target.value,
                                  }
                                : null,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              activeJourneyLesson.feedback ? continueJourneyAnswer() : submitJourneyAnswer();
                            }
                          }}
                          placeholder={`Write the full ${targetLabel} sentence`}
                        />
                      </div>
                      {activeJourneyLesson.feedback ? (
                        <div className={`journey-feedback ${activeJourneyLesson.feedback.status}`}>
                          <span>{activeJourneyLesson.feedback.status === "correct" ? "That works." : "Use this full sentence."}</span>
                          <strong>{activeJourneyLesson.feedback.expected}</strong>
                        </div>
                      ) : null}
                    </div>
                    <div className="journey-lesson-actions">
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => void playFlashcardAudio("journey", currentJourneyBuildItem.answer)}
                      >
                        Pronounce
                      </button>
                      {!activeJourneyLesson.feedback || activeJourneyLesson.feedback.status === "wrong" ? (
                        <button
                          type="button"
                          className="solid"
                          onClick={() =>
                            activeJourneyLesson.feedback ? continueJourneyAnswer() : submitJourneyAnswer()
                          }
                        >
                          {activeJourneyLesson.feedback ? "Continue" : "Check"}
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}

                {activeJourneyLesson.step === "use" && currentJourneyUseItem ? (
                  <>
                    <div className="journey-use-card">
                      <div className="journey-card-label">Use it</div>
                      <div className="journey-use-situation">{currentJourneyUseItem.situation}</div>
                      <div className="journey-use-prompt">{currentJourneyUseItem.prompt}</div>
                      {currentJourneyUseItem.support ? (
                        <div className="journey-practice-support">{currentJourneyUseItem.support}</div>
                      ) : null}
                    </div>
                    <div className="journey-answer-area">
                      <div className="surge-input-wrap">
                        <textarea
                          ref={(node) => {
                            journeyInputRef.current = node;
                          }}
                          value={activeJourneyLesson.input}
                          onChange={(event) =>
                            mutateJourneyState((state) => ({
                              ...state,
                              activeLesson: state.activeLesson
                                ? {
                                    ...state.activeLesson,
                                    input: event.target.value,
                                  }
                                : null,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              activeJourneyLesson.feedback ? continueJourneyAnswer() : submitJourneyAnswer();
                            }
                          }}
                          rows={3}
                          placeholder="Reply naturally in the target language"
                        />
                      </div>
                      {activeJourneyLesson.feedback ? (
                        <div className={`journey-feedback ${activeJourneyLesson.feedback.status}`}>
                          <span>{activeJourneyLesson.feedback.status === "correct" ? "Usable." : "A strong model answer is below."}</span>
                          <strong>{activeJourneyLesson.feedback.expected}</strong>
                        </div>
                      ) : null}
                    </div>
                    <div className="journey-lesson-actions">
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => void playFlashcardAudio("journey", currentJourneyUseItem.answer)}
                      >
                        Pronounce
                      </button>
                      {!activeJourneyLesson.feedback || activeJourneyLesson.feedback.status === "wrong" ? (
                        <button
                          type="button"
                          className="solid"
                          onClick={() =>
                            activeJourneyLesson.feedback ? continueJourneyAnswer() : submitJourneyAnswer()
                          }
                        >
                          {activeJourneyLesson.feedback ? "Finish part" : "Check"}
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </>
            )}
          </section>
        </section>
      ) : (
        <div className="journey-layout">
          <section className="journey-panel journey-map-panel">
            <div className="journey-panel-head">
              <div>
                <span className="journey-panel-kicker">Chapters</span>
                <h3>The path</h3>
              </div>
              <div className="journey-panel-meta">{journeyCompletedCount} parts done</div>
            </div>
            <div className="journey-path">
              {JOURNEY_CHAPTERS.map((chapter, chapterIndex) => {
                const counts = journeyChapterCounts[chapter.id] || {
                  completed: 0,
                  started: 0,
                  total: chapter.parts.length,
                };
                const active = selectedJourneyChapter?.id === chapter.id;
                return (
                  <button
                    key={chapter.id}
                    type="button"
                    className={`journey-node${chapterIndex % 2 === 0 ? " left" : " right"}${active ? " active" : ""}${counts.completed === counts.total ? " complete" : ""}`}
                    onClick={() => selectJourneyChapter(chapter.id)}
                  >
                    <span className="journey-node-orb">{chapter.index}</span>
                    <div className="journey-node-card">
                      <div className="journey-node-top">
                        <span className="journey-node-count">Chapter {chapter.index}</span>
                        <span className="journey-node-progress">{counts.completed}/{counts.total}</span>
                      </div>
                      <div className="journey-node-title">{chapter.title}</div>
                      <div className="journey-node-body">{chapter.summary}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="journey-side">
            <section className="journey-panel journey-parts-panel">
              <div className="journey-panel-head">
                <div>
                  <span className="journey-panel-kicker">Current chapter</span>
                  <h3>{selectedJourneyChapter?.title || "Choose a chapter"}</h3>
                </div>
                <div className="journey-panel-meta">
                  {selectedJourneyChapter ? `${selectedJourneyChapter.parts.length} parts` : ""}
                </div>
              </div>
              {selectedJourneyChapter?.parts[0] ? (
                <div className="journey-start-card">
                  <div className="journey-start-copy">
                    <span className="journey-panel-kicker">Start here</span>
                    <h4>Part 1: {selectedJourneyChapter.parts[0].title}</h4>
                    <p>{selectedJourneyChapter.parts[0].summary}</p>
                  </div>
                  <button
                    type="button"
                    className="solid"
                    onClick={() => void openJourneyPart(selectedJourneyChapter.id, selectedJourneyChapter.parts[0].id)}
                  >
                    Start Part 1
                  </button>
                </div>
              ) : null}
              {selectedJourneyChapter ? (
                <div className="journey-parts-grid">
                  {selectedJourneyChapter.parts.map((part) => {
                    const partKey = getJourneyPartKey(selectedJourneyChapter.id, part.id);
                    const record = journeyProgress[partKey];
                    const completedSteps = record?.completedSteps.length || 0;
                    const active = activeJourneyLesson?.chapterId === selectedJourneyChapter.id && activeJourneyLesson.partId === part.id;
                    return (
                      <button
                        key={part.id}
                        type="button"
                        className={`journey-part-card${active ? " active" : ""}${record?.status === "completed" ? " complete" : ""}`}
                        onClick={() => void openJourneyPart(selectedJourneyChapter.id, part.id)}
                      >
                        <div className="journey-part-top">
                          <span className="journey-part-number">Part {part.index}</span>
                          <span className={`journey-part-status ${record?.status || "new"}`}>
                            {record?.status === "completed" ? "Done" : record?.status === "started" ? "Continue" : "Start"}
                          </span>
                        </div>
                        <div className="journey-part-title">{part.title}</div>
                        <div className="journey-part-body">{part.summary}</div>
                        <div className="journey-part-progress">
                          <span>{completedSteps}/5 steps</span>
                          <span>{part.focus}</span>
                        </div>
                        <div className="journey-mode-row">
                          {part.modes.slice(0, 4).map((mode) => (
                            <span key={mode} className="journey-mode-chip">
                              {JOURNEY_MODE_LABELS[mode]}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="home-vocab-empty">Pick a chapter to see its parts.</div>
              )}
            </section>

            <section className="journey-panel journey-lesson-panel">
              {journeyLoading && !activeJourneyLesson ? (
                <div className="home-vocab-empty">Building your lesson...</div>
              ) : journeyError ? (
                <div className="journey-error-block">
                  <div className="journey-error-title">Journey hit a snag.</div>
                  <div className="journey-error-body">{journeyError}</div>
                  {selectedJourneyChapter && selectedJourneyPart ? (
                    <button
                      type="button"
                      className="solid"
                      onClick={() => void openJourneyPart(selectedJourneyChapter.id, selectedJourneyPart.id, true)}
                    >
                      Try again
                    </button>
                  ) : null}
                </div>
              ) : !selectedJourneyChapter || !selectedJourneyPart ? (
                <div className="journey-empty-state">
                  <div className="journey-empty-title">Pick a part to begin.</div>
                  <div className="journey-empty-body">Journey keeps one idea tight, useful, and repeatable before moving on.</div>
                </div>
              ) : !activeJourneyLesson || !activeJourneyContent ? (
                <div className="journey-empty-state">
                  <div className="journey-empty-title">{selectedJourneyPart.title}</div>
                  <div className="journey-empty-body">{selectedJourneyPart.summary}</div>
                  <div className="journey-preview-meta">
                    <span>{selectedJourneyPart.focus}</span>
                    <span>
                      {(journeyProgress[getJourneyPartKey(selectedJourneyChapter.id, selectedJourneyPart.id)]?.completedSteps.length || 0)}/5 steps
                    </span>
                  </div>
                  <button
                    type="button"
                    className="solid"
                    onClick={() => void openJourneyPart(selectedJourneyChapter.id, selectedJourneyPart.id)}
                  >
                    {selectedJourneyPart.index === 1 ? "Start Part 1" : `Start Part ${selectedJourneyPart.index}`}
                  </button>
                </div>
              ) : activeJourneyLesson.completed ? (
                <div className="journey-finish-card">
                  <div className="journey-panel-head">
                    <div>
                      <span className="journey-panel-kicker">Part complete</span>
                      <h3>{selectedJourneyPart.title}</h3>
                    </div>
                    <div className="journey-panel-meta">Saved</div>
                  </div>
                  <div className="journey-finish-copy">
                    {activeJourneyContent.carryForwardNote || "This pattern is now ready to reappear inside later chapters."}
                  </div>
                  <div className="journey-finish-list">
                    {collectJourneyLearnedSentences(activeJourneyContent).slice(0, 4).map((item) => (
                      <div key={item.id} className="journey-finish-row">
                        <div className="journey-finish-target">{item.target}</div>
                        <div className="journey-finish-translation">{item.translation}</div>
                      </div>
                    ))}
                  </div>
                  <div className="journey-lesson-actions">
                    <button type="button" className="ghost" onClick={() => void restartJourneyPart()}>
                      Replay part
                    </button>
                    <button type="button" className="ghost" onClick={closeJourneyLesson}>
                      Close
                    </button>
                    <button type="button" className="solid" onClick={openNextJourneyPart}>
                      Next part
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="journey-panel-head">
                    <div>
                      <span className="journey-panel-kicker">
                        Chapter {selectedJourneyChapter.index} • Part {selectedJourneyPart.index}
                      </span>
                      <h3>{selectedJourneyPart.title}</h3>
                    </div>
                    <div className="journey-panel-actions">
                      <button type="button" className="ghost" onClick={() => void restartJourneyPart()}>
                        Restart
                      </button>
                      <button type="button" className="ghost" onClick={closeJourneyLesson}>
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="journey-step-track">
                    {JOURNEY_STEP_ORDER.map((step) => {
                      const done = activeJourneyProgress?.completedSteps.includes(step);
                      const active = activeJourneyLesson.step === step;
                      return (
                        <div
                          key={step}
                          className={`journey-step-pill${done ? " done" : ""}${active ? " active" : ""}`}
                        >
                          <span>{JOURNEY_STEP_LABELS[step]}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="journey-lesson-copy">
                    <div>{activeJourneyContent.summary || selectedJourneyPart.summary}</div>
                    <div>{activeJourneyContent.grammarFocus}</div>
                  </div>

                  {activeJourneyContent.carryForwardNote ? (
                    <div className="journey-carry-note">{activeJourneyContent.carryForwardNote}</div>
                  ) : null}

                  {activeJourneyLesson.step === "read" && currentJourneyReadItem ? (
                    <>
                      <div className={`journey-card${activeJourneyLesson.revealed ? " revealed" : ""}`}>
                        <div className="journey-card-label">Meaning</div>
                        <div className="journey-card-translation">{currentJourneyReadItem.translation}</div>
                        <div className="journey-card-label">Target</div>
                        <div className="journey-card-target">
                          {activeJourneyLesson.revealed ? currentJourneyReadItem.target : "Reveal the sentence"}
                        </div>
                      </div>
                      <div className="journey-lesson-actions">
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => void playFlashcardAudio("journey", currentJourneyReadItem.target)}
                        >
                          Pronounce
                        </button>
                        <button
                          type="button"
                          className="solid"
                          onClick={() =>
                            activeJourneyLesson.revealed ? advanceJourneyReadItem() : revealJourneyReadItem()
                          }
                        >
                          {activeJourneyLesson.revealed ? "Next" : "Reveal"}
                        </button>
                      </div>
                    </>
                  ) : null}

                  {activeJourneyLesson.step === "repeat" && activeJourneyLesson.repeatMode === "match" && activeJourneyLesson.match ? (
                    <>
                      <div className="journey-repeat-head">
                        <span>Match the sentence pairs first.</span>
                        <span>{activeJourneyLesson.match.matchedIds.length}/{activeJourneyContent.repeatItems.length}</span>
                      </div>
                      <div className="journey-match-grid">
                        <div className="journey-match-column">
                          {activeJourneyLesson.match.targets.map((itemId) => {
                            const item = activeJourneyContent.repeatItems.find((entry) => entry.id === itemId);
                            if (!item) return null;
                            const matched = activeJourneyLesson.match?.matchedIds.includes(itemId);
                            const selected = activeJourneyLesson.match?.selectedTargetId === itemId;
                            return (
                              <button
                                key={`journey-target-${itemId}`}
                                type="button"
                                className={`journey-match-card${matched ? " matched" : ""}${selected ? " selected" : ""}`}
                                onClick={() => chooseJourneyMatch("target", itemId)}
                                disabled={matched}
                              >
                                {item.target}
                              </button>
                            );
                          })}
                        </div>
                        <div className="journey-match-column">
                          {activeJourneyLesson.match.translations.map((itemId) => {
                            const item = activeJourneyContent.repeatItems.find((entry) => entry.id === itemId);
                            if (!item) return null;
                            const matched = activeJourneyLesson.match?.matchedIds.includes(itemId);
                            const selected = activeJourneyLesson.match?.selectedTranslationId === itemId;
                            return (
                              <button
                                key={`journey-translation-${itemId}`}
                                type="button"
                                className={`journey-match-card${matched ? " matched" : ""}${selected ? " selected" : ""}`}
                                onClick={() => chooseJourneyMatch("translation", itemId)}
                                disabled={matched}
                              >
                                {item.translation}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : null}

                  {activeJourneyLesson.step === "repeat" && activeJourneyLesson.repeatMode === "type" && currentJourneyRepeatItem ? (
                    <>
                      <div className="journey-practice-card">
                        <div className="journey-card-label">Repeat the sentence</div>
                        <div className="journey-practice-source">{currentJourneyRepeatItem.target}</div>
                        <div className="journey-practice-translation">{currentJourneyRepeatItem.translation}</div>
                      </div>
                      <div className="surge-input-wrap">
                        <input
                          ref={(node) => {
                            journeyInputRef.current = node;
                          }}
                          type="text"
                          value={activeJourneyLesson.input}
                          onChange={(event) =>
                            mutateJourneyState((state) => ({
                              ...state,
                              activeLesson: state.activeLesson
                                ? {
                                    ...state.activeLesson,
                                    input: event.target.value,
                                  }
                                : null,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              activeJourneyLesson.feedback ? continueJourneyAnswer() : submitJourneyAnswer();
                            }
                          }}
                          placeholder="Type the same sentence"
                        />
                      </div>
                      {activeJourneyLesson.feedback ? (
                        <div className={`journey-feedback ${activeJourneyLesson.feedback.status}`}>
                          <span>{activeJourneyLesson.feedback.status === "correct" ? "Good." : "Use this exact sentence."}</span>
                          <strong>{activeJourneyLesson.feedback.expected}</strong>
                        </div>
                      ) : null}
                      <div className="journey-lesson-actions">
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => void playFlashcardAudio("journey", currentJourneyRepeatItem.target)}
                        >
                          Pronounce
                        </button>
                        <button
                          type="button"
                          className="solid"
                          onClick={() =>
                            activeJourneyLesson.feedback ? continueJourneyAnswer() : submitJourneyAnswer()
                          }
                        >
                          {activeJourneyLesson.feedback ? "Continue" : "Check"}
                        </button>
                      </div>
                    </>
                  ) : null}

                  {activeJourneyLesson.step === "change" && currentJourneyChangeItem ? (
                    <>
                      <div className="journey-practice-card">
                        <div className="journey-card-label">Change one part</div>
                        <div className="journey-practice-source blank">{currentJourneyChangeItem.template}</div>
                        <div className="journey-practice-translation">{currentJourneyChangeItem.cue}</div>
                        <div className="journey-practice-support">{currentJourneyChangeItem.translation}</div>
                        {currentJourneyChangeOptions.length ? (
                          <div className="journey-option-row">
                            {currentJourneyChangeOptions.map((option) => (
                              <button
                                key={option}
                                type="button"
                                className={`ghost journey-option-chip${activeJourneyLesson.input === option ? " selected" : ""}`}
                                onClick={() => submitJourneyValue(option)}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="journey-answer-area">
                        {!activeJourneyLesson.feedback ? (
                          <div className="journey-choice-helper">Choose the missing word or phrase.</div>
                        ) : null}
                        {activeJourneyLesson.feedback ? (
                          <div className={`journey-feedback ${activeJourneyLesson.feedback.status}`}>
                            <span>{activeJourneyLesson.feedback.status === "correct" ? "Correct." : "Not quite."}</span>
                            <strong>{activeJourneyLesson.feedback.expected}</strong>
                          </div>
                        ) : null}
                      </div>
                      <div className="journey-lesson-actions">
                        {activeJourneyLesson.feedback?.status === "wrong" ? (
                          <button
                            type="button"
                            className="solid"
                            onClick={() => continueJourneyAnswer()}
                          >
                            Continue
                          </button>
                        ) : null}
                      </div>
                    </>
                  ) : null}

                  {activeJourneyLesson.step === "build" && currentJourneyBuildItem ? (
                    <>
                      <div className="journey-practice-card">
                        <div className="journey-card-label">Build the sentence</div>
                        <div className="journey-build-cue">{currentJourneyBuildItem.cue}</div>
                        <div className="journey-practice-support">
                          {currentJourneyBuildItem.support || currentJourneyBuildItem.translation}
                        </div>
                      </div>
                      <div className="surge-input-wrap">
                        <input
                          ref={(node) => {
                            journeyInputRef.current = node;
                          }}
                          type="text"
                          value={activeJourneyLesson.input}
                          onChange={(event) =>
                            mutateJourneyState((state) => ({
                              ...state,
                              activeLesson: state.activeLesson
                                ? {
                                    ...state.activeLesson,
                                    input: event.target.value,
                                  }
                                : null,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              activeJourneyLesson.feedback ? continueJourneyAnswer() : submitJourneyAnswer();
                            }
                          }}
                          placeholder={`Write the full ${targetLabel} sentence`}
                        />
                      </div>
                      {activeJourneyLesson.feedback ? (
                        <div className={`journey-feedback ${activeJourneyLesson.feedback.status}`}>
                          <span>{activeJourneyLesson.feedback.status === "correct" ? "That works." : "Use this full sentence."}</span>
                          <strong>{activeJourneyLesson.feedback.expected}</strong>
                        </div>
                      ) : null}
                      <div className="journey-lesson-actions">
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => void playFlashcardAudio("journey", currentJourneyBuildItem.answer)}
                        >
                          Pronounce
                        </button>
                        <button
                          type="button"
                          className="solid"
                          onClick={() =>
                            activeJourneyLesson.feedback ? continueJourneyAnswer() : submitJourneyAnswer()
                          }
                        >
                          {activeJourneyLesson.feedback ? "Continue" : "Check"}
                        </button>
                      </div>
                    </>
                  ) : null}

                  {activeJourneyLesson.step === "use" && currentJourneyUseItem ? (
                    <>
                      <div className="journey-use-card">
                        <div className="journey-card-label">Use it</div>
                        <div className="journey-use-situation">{currentJourneyUseItem.situation}</div>
                        <div className="journey-use-prompt">{currentJourneyUseItem.prompt}</div>
                        {currentJourneyUseItem.support ? (
                          <div className="journey-practice-support">{currentJourneyUseItem.support}</div>
                        ) : null}
                      </div>
                      <div className="surge-input-wrap">
                        <textarea
                          ref={(node) => {
                            journeyInputRef.current = node;
                          }}
                          value={activeJourneyLesson.input}
                          onChange={(event) =>
                            mutateJourneyState((state) => ({
                              ...state,
                              activeLesson: state.activeLesson
                                ? {
                                    ...state.activeLesson,
                                    input: event.target.value,
                                  }
                                : null,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              activeJourneyLesson.feedback ? continueJourneyAnswer() : submitJourneyAnswer();
                            }
                          }}
                          rows={3}
                          placeholder="Reply naturally in the target language"
                        />
                      </div>
                      {activeJourneyLesson.feedback ? (
                        <div className={`journey-feedback ${activeJourneyLesson.feedback.status}`}>
                          <span>{activeJourneyLesson.feedback.status === "correct" ? "Usable." : "A strong model answer is below."}</span>
                          <strong>{activeJourneyLesson.feedback.expected}</strong>
                        </div>
                      ) : null}
                      <div className="journey-lesson-actions">
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => void playFlashcardAudio("journey", currentJourneyUseItem.answer)}
                        >
                          Pronounce
                        </button>
                        <button
                          type="button"
                          className="solid"
                          onClick={() =>
                            activeJourneyLesson.feedback ? continueJourneyAnswer() : submitJourneyAnswer()
                          }
                        >
                          {activeJourneyLesson.feedback ? "Finish part" : "Check"}
                        </button>
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </section>
          </div>
        </div>
      )}

      {journeySavedAt ? (
        <div className="journey-footnote">Journey saved {new Date(journeySavedAt).toLocaleTimeString()}</div>
      ) : null}
    </section>
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
          <h2>Fast active recall.</h2>
          <p>Pick your loop and keep moving.</p>
        </div>
        <div className="surge-status">
          <div className="surge-status-pill">Due now {surgeDueCount}</div>
          <div className="surge-status-pill">In session {surgeInSessionCount}</div>
          <button
            type="button"
            className="surge-status-pill surge-status-action"
            onClick={() => setShowSurgeMastered(true)}
          >
            Mastered {surgeMasteredCount}
          </button>
          {isCompactViewport ? (
            <button
              type="button"
              className="surge-status-pill surge-status-action"
              onClick={() => toggleMobileVocabTools("surge")}
            >
              {mobileVocabTools.surge ? "Hide options" : "Options"}
            </button>
          ) : null}
        </div>
      </div>

      {!isCompactViewport || mobileVocabTools.surge ? (
        <div className="surge-panel surge-options-panel">
          <div className="surge-progress">
            <span>Modes</span>
            <span>{Object.values(surgeModes).filter(Boolean).length} active</span>
          </div>
          <div className="surge-mode-grid">
            {(["preview", "match", "typing"] as SurgePhase[]).map((phase) => {
              const label = phase === "preview" ? "Flashcards" : phase === "match" ? "Matching" : "Typing";
              const enabledCount = Object.values(surgeModes).filter(Boolean).length;
              const checked = surgeModes[phase];
              const locked = checked && enabledCount === 1;
              return (
                <label key={phase} className={`surge-mode-toggle${checked ? " active" : ""}${locked ? " locked" : ""}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSurgeMode(phase)}
                    disabled={locked}
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

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
            <p>{surgeError ? surgeError : "Start with the modes you want."}</p>
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
            <span>{currentSurgeTypingDirection === "target_to_english" ? "Type English" : `Type ${targetLabel}`}</span>
            <span>{surgeSession.typingQueue.length} left</span>
          </div>
          <div className="surge-prompt-card">
            <div className="surge-card-label">
              {currentSurgeTypingDirection === "target_to_english" ? targetLabel : "English"}
            </div>
            <div className="surge-prompt-text">
              {currentSurgeTypingDirection === "target_to_english"
                ? currentSurgePrompt.text
                : currentSurgePrompt.translation}
            </div>
            <div className="surge-prompt-sub">
              {currentSurgeTypingDirection === "target_to_english"
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
                currentSurgeTypingDirection === "target_to_english"
                  ? "Type the English meaning"
                  : `Type in ${targetLabel}`
              }
              disabled={Boolean(surgeSession.typingFeedback)}
            />
          </div>
          {surgeSession.typingHintCount > 0 && !surgeSession.typingFeedback ? (
            <div className="surge-hint">
              <div className="surge-hint-top">
                <span>Hint</span>
                <span>
                  {Math.min(surgeSession.typingHintCount, currentSurgeHintTotal)}/{currentSurgeHintTotal}
                </span>
              </div>
              <div className="surge-hint-track">
                <span
                  style={{
                    width: currentSurgeHintTotal
                      ? `${(Math.min(surgeSession.typingHintCount, currentSurgeHintTotal) / currentSurgeHintTotal) * 100}%`
                      : "0%",
                  }}
                />
              </div>
              <div className="surge-hint-mask" aria-live="polite">
                {currentSurgeHintGlyphs.map((glyph, index) => (
                  <span
                    key={`${glyph.char}-${index}`}
                    className={`surge-hint-chip${glyph.isLetter ? " letter" : " spacer"}${glyph.revealed ? " revealed" : ""}`}
                  >
                    {glyph.char === " " ? "\u00A0" : glyph.char}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
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
            {!surgeSession.typingFeedback ? (
              <button
                type="button"
                className="ghost"
                onClick={revealSurgeTypingHint}
              >
                Hint
              </button>
            ) : null}
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

      {showSurgeMastered ? (
        <div className="suggestion-modal-overlay" onClick={() => setShowSurgeMastered(false)}>
          <div className="vocab-modal surge-library-modal" onClick={(event) => event.stopPropagation()}>
            <div className="vocab-modal-header">
              <div className="vocab-title">Mastered in Surge</div>
              <div className="vocab-controls">
                <button type="button" className="ghost" onClick={() => setShowSurgeMastered(false)}>
                  Close
                </button>
              </div>
            </div>
            <div className="vocab-modal-body">
              {surgeMasteredItems.length ? (
                <div className="surge-mastered-list">
                  {surgeMasteredItems.map((record) => (
                    <div key={record.itemKey} className="surge-mastered-row">
                      <div className="surge-mastered-main">
                        <div className="surge-mastered-text">{record.itemText}</div>
                        <div className="surge-mastered-translation">{record.translation}</div>
                      </div>
                      <div className="surge-mastered-meta">
                        <span>{record.itemType === "phrase" ? "Phrase" : "Word"}</span>
                        <span>{record.status === "known" ? "Known" : `Stage ${record.stage}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="home-vocab-empty">Mastered items will show up here as you lock them in.</div>
              )}
            </div>
          </div>
        </div>
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
      <div className="vocab-mobile-bar">
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
        {isCompactViewport ? (
          <button
            type="button"
            className="ghost mobile-tools-toggle"
            onClick={() => toggleMobileVocabTools("common")}
          >
            {mobileVocabTools.common ? "Hide tools" : "Tools"}
          </button>
        ) : null}
      </div>
      <div className="task-banner vocab-banner vocab-banner-compact">
        <div className="task-label">Common words</div>
        <div className="task-text">{studyVisibleItems.length} ready</div>
        {!isCompactViewport || mobileVocabTools.common ? (
          <div className="vocab-toolbar-wrap">
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
              <button type="button" className="ghost" onClick={clearStudy}>
                Clear
              </button>
              <div className="toolbar-right">
                <div className="action-fab" aria-label="Filter folders">
                  <button type="button" className="ghost action-fab-main">
                    Folder: {studyFolderFilter === "all" ? "All" : studyFolderFilter}
                  </button>
                  <div className="action-fab-menu">
                    <button type="button" className="ghost action-fab-item" onClick={() => setStudyFolderFilter("all")}>
                      All folders
                    </button>
                    <button
                      type="button"
                      className="ghost action-fab-item"
                      onClick={() => setStudyFolderFilter("archived")}
                    >
                      Archived
                    </button>
                    {studyFolders.map((folder) => (
                      <button
                        key={folder}
                        type="button"
                        className="ghost action-fab-item"
                        onClick={() => setStudyFolderFilter(folder)}
                      >
                        {folder}
                      </button>
                    ))}
                  </div>
                </div>
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
        ) : null}
      </div>
      {!language ? (
        <p className="dashboard-alert">Set a language above to generate vocabulary.</p>
      ) : !studyPack || studyVisibleItems.length === 0 ? (
        <div className="home-vocab-empty">
          {studyFolderFilter === "all"
            ? "Generate a list to start studying."
            : studyFolderFilter === "archived"
              ? "No archived words yet."
              : "No words in this folder yet."}
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
                    const folderMenuKey = `common:${index}`;
                    // examples are shown in a modal
                    return (
                      <div
                        key={`${entry.word}-${index}`}
                        className={`vocab-card-wrap${activeFolderMenu === folderMenuKey ? " folder-open" : ""}`}
                      >
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
                              className={`vocab-card-icon ${entry.folder || entry.archived ? "active" : ""}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setActiveFolderMenu((current) => (current === folderMenuKey ? null : folderMenuKey));
                              }}
                              aria-label="Folder"
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                  d="M3.5 7.5A2.5 2.5 0 0 1 6 5h3l1.5 2H18A2.5 2.5 0 0 1 20.5 9.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5z"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            {renderFolderMenu(folderMenuKey, studyFolders, getEntryFolder(entry), Boolean(entry.archived), (folder, archived) =>
                              assignStudyFolder(index, folder, archived)
                            )}
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

  const sentenceWordsView = (
    <section className="chat-shell vocab-shell">
      <div className="subtle-back">
        <button type="button" className="ghost subtle-back-btn" onClick={() => setView("dashboard")}>
          Back
        </button>
      </div>
      <div className="vocab-mobile-bar">
        <div className="vocab-tabs">
          <button
            type="button"
            className={`vocab-tab-btn ${sentenceMode === "list" ? "active" : ""}`}
            onClick={() => setSentenceMode("list")}
          >
            List
          </button>
          <button
            type="button"
            className={`vocab-tab-btn ${sentenceMode === "cards" ? "active" : ""}`}
            onClick={() => setSentenceMode("cards")}
          >
            Flashcards
          </button>
        </div>
        {isCompactViewport ? (
          <button
            type="button"
            className="ghost mobile-tools-toggle"
            onClick={() => toggleMobileVocabTools("sentence")}
          >
            {mobileVocabTools.sentence ? "Hide tools" : "Tools"}
          </button>
        ) : null}
      </div>
      <div className="task-banner vocab-banner vocab-banner-compact">
        <div className="task-label">Sentence vocabulary</div>
        <div className="task-text">{sentenceVisibleItems.length} ready</div>
        {!isCompactViewport || mobileVocabTools.sentence ? (
          <div className="vocab-toolbar-wrap">
            <div className="vocab-toolbar">
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setSentenceFront((prev) => (prev === "word" ? "translation" : "word"));
                  setSentenceFlipped({});
                }}
              >
                Start: {sentenceFront === "word" ? targetLabel : "English"}
              </button>
              <div className="vocab-toolbar-divider" />
              <div className="action-fab" aria-label="Generate sentences">
                <button type="button" className="ghost action-fab-main">
                  Generate
                </button>
                <div className="action-fab-menu">
                  <button
                    type="button"
                    className="ghost action-fab-item"
                    onClick={() => generateSentenceWords(20)}
                    disabled={!language || sentenceLoading}
                  >
                    {sentenceLoading ? "Generating" : "Generate 20"}
                  </button>
                  <button
                    type="button"
                    className="ghost action-fab-item"
                    onClick={() => generateSentenceWords(10)}
                    disabled={!language || sentenceLoading}
                  >
                    {sentenceLoading ? "Generating" : "Generate 10 more"}
                  </button>
                  <button
                    type="button"
                    className="ghost action-fab-item"
                    onClick={() => generateSentenceWords(10, "advanced")}
                    disabled={!language || sentenceLoading}
                  >
                    {sentenceLoading ? "Generating" : "More flexible patterns"}
                  </button>
                </div>
              </div>
              <button type="button" className="ghost" onClick={clearSentenceStudy}>
                Clear
              </button>
              <div className="toolbar-right">
                <div className="action-fab" aria-label="Filter sentence folders">
                  <button type="button" className="ghost action-fab-main">
                    Folder: {sentenceFolderFilter === "all" ? "All" : sentenceFolderFilter}
                  </button>
                  <div className="action-fab-menu">
                    <button type="button" className="ghost action-fab-item" onClick={() => setSentenceFolderFilter("all")}>
                      All folders
                    </button>
                    <button
                      type="button"
                      className="ghost action-fab-item"
                      onClick={() => setSentenceFolderFilter("archived")}
                    >
                      Archived
                    </button>
                    {sentenceFolders.map((folder) => (
                      <button
                        key={folder}
                        type="button"
                        className="ghost action-fab-item"
                        onClick={() => setSentenceFolderFilter(folder)}
                      >
                        {folder}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className={`toolbar-star-toggle ${showSentenceStarredOnly ? "active" : ""}`}
                  onClick={() => setShowSentenceStarredOnly((prev) => !prev)}
                  aria-pressed={showSentenceStarredOnly}
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
        ) : null}
      </div>
      {!language ? (
        <p className="dashboard-alert">Set a language above to generate sentence patterns.</p>
      ) : !sentencePack || sentenceVisibleItems.length === 0 ? (
        <div className="home-vocab-empty">
          {sentenceFolderFilter === "all"
            ? "Generate short everyday sentences to build useful patterns."
            : sentenceFolderFilter === "archived"
              ? "No archived sentences yet."
              : "No sentences in this folder yet."}
        </div>
      ) : sentenceMode === "list" ? (
        <div className="vocab-list">
          {sentenceVisibleItems.map(({ entry, index }) => (
            <div key={`${entry.word}-${index}`} className="vocab-row">
              <div className="vocab-word">{entry.word}</div>
              <div className="vocab-translation">{entry.translation}</div>
              <div className="vocab-actions">
                <button type="button" className="ghost" onClick={() => toggleSentenceStar(index)}>
                  {entry.starred ? "Unstar" : "Star"}
                </button>
                <button type="button" className="ghost" onClick={() => deleteSentenceEntry(index)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="vocab-cards">
          {sentenceVisibleItems.map(({ entry, index }) => {
            const flipped = Boolean(sentenceFlipped[index]);
            const frontText = sentenceFront === "word" ? entry.word : entry.translation;
            const backText = sentenceFront === "word" ? entry.translation : entry.word;
            const pronunciationKey = speechKey("sentence", entry.word);
            const speechActive = speechPlayingKey === pronunciationKey || speechLoadingKey === pronunciationKey;
            const folderMenuKey = `sentence:${index}`;
            return (
              <div
                key={`${entry.word}-${index}`}
                className={`vocab-card-wrap${activeFolderMenu === folderMenuKey ? " folder-open" : ""}`}
              >
                <div
                  className={`vocab-card ${flipped ? "flipped" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSentenceCard(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleSentenceCard(index);
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
                        toggleSentenceStar(index);
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
                        void playFlashcardAudio("sentence", entry.word);
                      }}
                      aria-label={speechLoadingKey === pronunciationKey ? "Loading pronunciation" : "Pronounce"}
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
                      className={`vocab-card-icon ${entry.folder || entry.archived ? "active" : ""}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveFolderMenu((current) => (current === folderMenuKey ? null : folderMenuKey));
                      }}
                      aria-label="Folder"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M3.5 7.5A2.5 2.5 0 0 1 6 5h3l1.5 2H18A2.5 2.5 0 0 1 20.5 9.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {renderFolderMenu(folderMenuKey, sentenceFolders, getEntryFolder(entry), Boolean(entry.archived), (folder, archived) =>
                      assignSentenceFolder(index, folder, archived)
                    )}
                  </div>
                  <div className="vocab-card-face">
                    <div className={flipped ? "vocab-card-translation" : "vocab-card-word"}>
                      {flipped ? backText : frontText}
                    </div>
                    <div className="vocab-card-hint">{flipped ? "Tap to hide" : "Tap to flip"}</div>
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
        {isCompactViewport ? (
          <button
            type="button"
            className="ghost mobile-tools-toggle"
            onClick={() => toggleMobileVocabTools("scenario")}
          >
            {mobileVocabTools.scenario ? "Hide tools" : "Tools"}
          </button>
        ) : null}
      </div>
      <div className="task-banner vocab-banner">
        <div className="task-label">Scenario words</div>
        <div className="task-text">
          {scenarioVocabMap[activeScenarioVocab.id]?.entries.filter((entry) => !entry.archived).length
            ? `${scenarioVocabMap[activeScenarioVocab.id].entries.filter((entry) => !entry.archived).length} words ready`
            : "Generate a list to begin."}
        </div>
        {!isCompactViewport || mobileVocabTools.scenario ? (
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
        ) : null}
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
        {!isCompactViewport || mobileVocabTools.scenario ? (
          <>
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
          </>
        ) : null}
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
        {isCompactViewport ? (
          <button
            type="button"
            className="ghost mobile-tools-toggle"
            onClick={() => toggleMobileVocabTools("topic")}
          >
            {mobileVocabTools.topic ? "Hide tools" : "Tools"}
          </button>
        ) : null}
      </div>
      <div className="task-banner vocab-banner">
        <div className="task-label">Topic list</div>
        <div className="task-text">
          {topicVocabMap[activeTopic]?.entries.filter((entry) => !entry.archived).length
            ? `${topicVocabMap[activeTopic].entries.filter((entry) => !entry.archived).length} words ready`
            : "Generate a list to begin."}
        </div>
        {!isCompactViewport || mobileVocabTools.topic ? (
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
        ) : null}
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
        {!isCompactViewport || mobileVocabTools.topic ? (
          <>
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
          </>
        ) : null}
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

  const dashboardView = (
    <>
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker">Dashboard</div>
          <div>
            <h1>{language ? language : "Choose a language"}</h1>
          </div>
          <div className="dashboard-hero-actions">
            <button
              type="button"
              className="solid"
              onClick={() => {
                if (buddyRecommendation.action.includes("Surge")) {
                  void startSurgeSession(!surgeSession);
                  return;
                }
                if (buddyRecommendation.action.includes("scenario")) {
                  if (nextScenario) {
                    void startScenarioChat(nextScenario.scenario);
                  }
                  return;
                }
                void startBuddyChat(!buddyResumeAvailable);
              }}
              disabled={!language}
            >
              {buddyRecommendation.action}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => setView("journey")}
              disabled={!language}
            >
              Journey
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => setView("common")}
              disabled={!language}
            >
              Common words
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => setView("sentences")}
              disabled={!language}
            >
              Sentences
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => setView("scenario-vocab")}
              disabled={!language}
            >
              Scenario words
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => void startSurgeSession(!surgeSession)}
              disabled={!language || surgeLoading}
            >
              {surgeSession ? "Surge" : "Start Surge"}
            </button>
          </div>
        </div>
        <div className="dashboard-plan-card">
          <div className="dashboard-section-kicker">Next</div>
          <h2>{buddyRecommendation.action}</h2>
          <div className="dashboard-mini-stats">
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-label">Practiced</div>
              <div className="dashboard-stat-value">{buddyProfileSnapshot.practicedWordCount}</div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-label">Journey</div>
              <div className="dashboard-stat-value">{journeyCompletedCount}</div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-label">Due</div>
              <div className="dashboard-stat-value">{surgeDueCount}</div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-label">Scenario reps</div>
              <div className="dashboard-stat-value">{totalPoints()}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-section dashboard-section-split">
        <div className="dashboard-panel dashboard-recommend-panel">
          <div className="dashboard-panel-header">
            <div>
              <div className="dashboard-section-kicker">Vocabulary</div>
              <h2>Word banks</h2>
            </div>
            <div className="dashboard-meta">
              {loadingProgress ? "Syncing progress" : `${commonWordCount + sentenceCount + scenarioWordCount} saved vocab items`}
            </div>
          </div>
          <div className="dashboard-vocab-gateway">
            <button
              type="button"
              className="dashboard-path-card dashboard-path-card-primary"
              onClick={() => setView("common")}
              disabled={!language}
            >
              <div className="dashboard-path-top">
                <div className="dashboard-path-title">Common words</div>
                <div className="dashboard-path-badge">{commonWordCount}</div>
              </div>
            </button>
            <button
              type="button"
              className="dashboard-path-card dashboard-path-card-primary"
              onClick={() => setView("sentences")}
              disabled={!language}
            >
              <div className="dashboard-path-top">
                <div className="dashboard-path-title">Sentence vocabulary</div>
                <div className="dashboard-path-badge">{sentenceCount}</div>
              </div>
            </button>
            <button
              type="button"
              className="dashboard-path-card dashboard-path-card-primary"
              onClick={() => setView("scenario-vocab")}
              disabled={!language}
            >
              <div className="dashboard-path-top">
                <div className="dashboard-path-title">Scenario vocabulary</div>
                <div className="dashboard-path-badge">{scenarioDeckCount}</div>
              </div>
            </button>
          </div>
        </div>

        <div className="dashboard-panel dashboard-buddy-panel">
          <div className="dashboard-panel-header">
            <div>
              <div className="dashboard-section-kicker">Progress</div>
              <h2>Saved</h2>
            </div>
          </div>
          <div className="dashboard-buddy-list">
            <div className="dashboard-buddy-item">
              <span className="dashboard-buddy-label">Learning now</span>
              <span className="dashboard-buddy-value">{buddyProfileSnapshot.learningCount}</span>
            </div>
            <div className="dashboard-buddy-item">
              <span className="dashboard-buddy-label">Stronger items</span>
              <span className="dashboard-buddy-value">{buddyProfileSnapshot.masteredCount}</span>
            </div>
            <div className="dashboard-buddy-item">
              <span className="dashboard-buddy-label">Recent practice</span>
              <span className="dashboard-buddy-value">{buddyProfileSnapshot.recentCount}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-panel-header">
          <div>
            <div className="dashboard-section-kicker">Practice</div>
            <h2>Modes</h2>
          </div>
          <button type="button" className="ghost" onClick={() => setShowTopicModal(true)}>
            + New topic
          </button>
        </div>
        <div className="dashboard-path-grid">
          <button type="button" className="dashboard-path-card" onClick={() => setView("common")}>
            <div className="dashboard-path-top">
              <div className="dashboard-path-title">Common words</div>
              <div className="dashboard-path-badge">{commonWordCount}</div>
            </div>
          </button>
          <button type="button" className="dashboard-path-card" onClick={() => setView("sentences")}>
            <div className="dashboard-path-top">
              <div className="dashboard-path-title">Sentence vocabulary</div>
              <div className="dashboard-path-badge">{sentenceCount}</div>
            </div>
          </button>
          <button type="button" className="dashboard-path-card" onClick={() => setView("scenario-vocab")}>
            <div className="dashboard-path-top">
              <div className="dashboard-path-title">Scenario vocabulary</div>
              <div className="dashboard-path-badge">{scenarioDeckCount}</div>
            </div>
          </button>
          <button
            type="button"
            className="dashboard-path-card"
            onClick={() => setView("journey")}
            disabled={!language}
          >
            <div className="dashboard-path-top">
              <div className="dashboard-path-title">Journey</div>
              <div className="dashboard-path-badge">{journeyCompletedCount}/50</div>
            </div>
          </button>
          <button
            type="button"
            className="dashboard-path-card"
            onClick={() => void startSurgeSession(!surgeSession)}
            disabled={!language || surgeLoading}
          >
            <div className="dashboard-path-top">
              <div className="dashboard-path-title">Surge</div>
              <div className="dashboard-path-badge">{surgeDueCount} due</div>
            </div>
          </button>
          <button
            type="button"
            className="dashboard-path-card"
            onClick={() => void startBuddyChat(!buddyResumeAvailable)}
            disabled={!language}
          >
            <div className="dashboard-path-top">
              <div className="dashboard-path-title">Buddy</div>
              <div className="dashboard-path-badge">{buddyResumeAvailable ? "Resume" : "Adaptive"}</div>
            </div>
          </button>
        </div>
        {dashboardTopicPreview.length ? (
          <div className="dashboard-topic-strip">
            {dashboardTopicPreview.map((topic) => {
              const count = topicVocabMap[topic]?.entries.filter((entry) => !entry.archived).length || 0;
              return (
                <button
                  key={topic}
                  type="button"
                  className="dashboard-topic-pill"
                  onClick={() => {
                    setActiveTopic(topic);
                    setTopicVocabFlipped({});
                    setView("topic-detail");
                  }}
                >
                  <span>{topic}</span>
                  <span>{count}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-panel scenario-browser">
          <div className="dashboard-panel-header">
            <div>
              <div className="dashboard-section-kicker">Scenarios</div>
              <h2>Use your words in real situations</h2>
              {!language ? (
                <p className="dashboard-alert">Set a language above to start.</p>
              ) : (
                <p className="dashboard-panel-copy">Open one grouped category at a time instead of digging through one giant wall.</p>
              )}
            </div>
          </div>
          <div className="dashboard-group-tabs">
            {scenarioGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`dashboard-group-tab ${activeScenarioGroup === group.id ? "active" : ""}`}
                onClick={() => setActiveScenarioGroup(group.id)}
              >
                <span>{group.title}</span>
                <span className="dashboard-group-count">{group.scenarios.length}</span>
              </button>
            ))}
          </div>
          <div className="dashboard-group-summary">
            <div>
              <div className="dashboard-group-title">{activeScenarioGroupData.title}</div>
              <div className="dashboard-group-copy">{activeScenarioGroupData.description}</div>
            </div>
            <div className="dashboard-group-meta">
              Next up: {activeScenarioGroupData.scenarios
                .map((scenario) => ({ scenario, count: progressMap[scenario.id] || 0 }))
                .sort((a, b) => a.count - b.count)[0]?.scenario.title || "Pick any scene"}
            </div>
          </div>
          <div className="scenario-grid dashboard-scenario-grid">
            {activeScenarioGroupData.scenarios.map((scenario) => {
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
                  <div className="scenario-card-meta">
                    {completedCount ? `${completedCount} reps completed` : "Start with a first rep"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );

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
            Buddy already knows what you have practiced and what still needs work. It will guide in English first, then make you produce the target language.
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

  const quickChatShellStyle = quickChatOpen && quickChatLayout
    ? {
        left: quickChatLayout.left,
        top: quickChatLayout.top,
        right: "auto",
        bottom: "auto",
      }
    : undefined;
  const quickChatPanelStyle = quickChatLayout
    ? {
        width: quickChatLayout.width,
        height: quickChatLayout.height,
      }
    : undefined;

  const quickChatWidget = (
    <div
      ref={quickChatShellRef}
      className={`quick-chat-shell${quickChatOpen ? " open" : ""}${quickChatLarge ? " large" : ""}`}
      style={quickChatShellStyle}
    >
      {quickChatOpen ? (
        <section
          ref={quickChatPanelRef}
          className="quick-chat-panel"
          style={quickChatPanelStyle}
        >
          <div className="quick-chat-panel-actions" onPointerDown={startQuickChatDrag}>
            <button
              type="button"
              className="ghost quick-chat-header-btn"
              onClick={resetQuickChatConversation}
            >
              New chat
            </button>
            <button
              type="button"
              className="ghost quick-chat-header-btn"
              onClick={toggleQuickChatSize}
            >
              {quickChatLarge ? "Small" : "Large"}
            </button>
            <button
              type="button"
              className="ghost quick-chat-header-btn"
              onClick={() => setQuickChatOpen(false)}
            >
              Minimize
            </button>
          </div>
          <div ref={quickChatMessagesRef} className="quick-chat-messages">
            {quickChatMessages.length ? (
              quickChatMessages.map((message) => {
                const display = getQuickChatDisplay(message.payload);
                return message.role === "user" ? (
                  <div key={message.id} className="quick-chat-row user">
                    <div className="quick-chat-bubble user">{message.text}</div>
                  </div>
                ) : (
                  <div key={message.id} className="quick-chat-row assistant">
                    <div className={`quick-chat-card ${display.mode}${display.verdict ? "" : " compact"}`}>
                      {display.verdict ? (
                        <div className="quick-chat-meta">
                          <span className={`quick-chat-badge ${display.verdict}`}>{display.verdict}</span>
                        </div>
                      ) : null}
                      {display.body ? <div className="quick-chat-body">{display.body}</div> : null}
                      {display.primaryText ? <div className="quick-chat-target">{display.primaryText}</div> : null}
                      {display.secondaryText ? (
                        <div className="quick-chat-secondary">{display.secondaryText}</div>
                      ) : null}
                      {display.translation ? (
                        <div className="quick-chat-translation">{display.translation}</div>
                      ) : null}
                      {display.note ? <div className="quick-chat-note">{display.note}</div> : null}
                      {display.ttsText ? (
                        <button
                          type="button"
                          className="ghost quick-chat-play"
                          onClick={() => void playFlashcardAudio("quick", display.ttsText)}
                        >
                          Play
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="quick-chat-empty">
                Ask in English for a translation, write in {targetLabel} for a correction, or say <code>say ...</code>.
              </div>
            )}
            {quickChatLoading ? <div className="quick-chat-loading">Thinking...</div> : null}
          </div>
          <div className="quick-chat-composer">
            <textarea
              ref={quickChatInputRef}
              value={quickChatInput}
              onChange={(event) => setQuickChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendQuickChatMessage(quickChatInput);
                }
              }}
              rows={1}
              placeholder="Translate, check, or say..."
            />
            <div className="quick-chat-actions">
              {quickChatVoiceReady ? (
                <button
                  type="button"
                  className={`ghost quick-chat-mic${quickChatRecording ? " recording" : ""}`}
                  onClick={() => void toggleQuickChatRecording()}
                >
                  {quickChatRecording ? "Stop" : "Mic"}
                </button>
              ) : null}
              <button
                type="button"
                className="solid quick-chat-send"
                onClick={() => void sendQuickChatMessage(quickChatInput)}
                disabled={quickChatLoading || !quickChatInput.trim()}
              >
                Send
              </button>
            </div>
          </div>
          <button
            type="button"
            className="quick-chat-resize-handle"
            onPointerDown={startQuickChatResize}
            aria-label="Resize chat"
          />
        </section>
      ) : (
        <button
          type="button"
          className="quick-chat-bubble-launch"
          onClick={() => setQuickChatOpen(true)}
        >
          Chat
        </button>
      )}
    </div>
  );

  return (
    <div className="app-shell" onPointerDownCapture={handleAppPointerDownCapture}>
      <header
        className={`top-bar${isCompactViewport ? " compact-header" : ""}${mobileMenuOpen ? " mobile-menu-open" : ""}${mobileHeaderHidden ? " mobile-hidden" : ""}`}
      >
        <div className="top-bar-main">
          <div className="brand">
            <button type="button" className="brand-button" onClick={() => setView("dashboard")}>
              <span className="brand-name">NeoLingo</span>
              <span className="brand-tag">Calm practice. Fast progress.</span>
            </button>
          </div>

          {authUser ? (
            <nav className="header-nav" aria-label="Primary">
              <button
                type="button"
                className={`header-nav-btn ${view === "journey" ? "" : "active"}`}
                onClick={() => setView("dashboard")}
              >
                Home
              </button>
              <button
                type="button"
                className={`header-nav-btn ${view === "journey" ? "active" : ""}`}
                onClick={() => setView("journey")}
              >
                Journey
              </button>
            </nav>
          ) : null}

          {authUser && isCompactViewport ? (
            <div className="mobile-header-actions">
              <div className="mobile-header-summary">
                <span>{language || "Choose language"}</span>
                <span>{surgeDueCount} due</span>
              </div>
              <button
                type="button"
                className="ghost mobile-menu-toggle"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileMenuOpen((current) => !current)}
              >
                {mobileMenuOpen ? "Close" : "Menu"}
              </button>
            </div>
          ) : null}
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
          <section className="dashboard dashboard-home">
            {dashboardView}
            {false ? (
              <>
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
            {null}
              </>
            ) : null}
          </section>
        ) : view === "journey" ? (
          journeyView
        ) : view === "common" ? (
          commonWordsView
        ) : view === "sentences" ? (
          sentenceWordsView
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

      {authUser ? quickChatWidget : null}

    </div>
  );
}
