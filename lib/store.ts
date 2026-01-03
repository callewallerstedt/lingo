import fs from "fs";
import path from "path";
import { SCENARIOS } from "./scenarios";

export const PRESET_SCENARIOS = SCENARIOS.map((scenario) => scenario.title);

export type Role = "user" | "assistant";

export type Message = {
  role: Role;
  content: string;
  timestamp: string;
};

export type Difficulty = "easy" | "medium" | "hard" | null;

export type Session = {
  id: string;
  language: string | null;
  scenarioPreset: string;
  scenarioCustom: string;
  scenarioRole?: string;
  scenarioStart?: string;
  difficulty: Difficulty;
  task?: string | null;
  messages: Message[];
  translationCache: Record<string, string>;
};

const DEFAULT_DIFFICULTY: Difficulty = "easy";
const MAX_HISTORY = 24; // Keep more context so replies reference recent turns
const MAX_MESSAGES = 200;

const sessions = new Map<string, Session>();
const rateState = {
  ip: new Map<string, { count: number; reset: number }>(),
  session: new Map<string, { count: number; reset: number }>(),
};

const SESSIONS_FILE = path.join(process.cwd(), "sessions.json");

function loadSessions() {
  // Load existing sessions into memory (but don't save new ones)
  try {
    if (!fs.existsSync(SESSIONS_FILE)) return;
    const data = fs.readFileSync(SESSIONS_FILE, "utf8");
    const sessionsData = JSON.parse(data) as Record<string, any>;
    for (const [id, session] of Object.entries(sessionsData)) {
      // Fix legacy difficulty values (numbers) to proper strings
      if (typeof session.difficulty === 'number') {
        session.difficulty = session.difficulty === 0 ? 'easy' :
                           session.difficulty === 1 ? 'medium' :
                           session.difficulty === 2 ? 'hard' : 'medium';
      }
      if (typeof session.scenarioRole !== "string") {
        session.scenarioRole = "";
      }
      if (typeof session.scenarioStart !== "string") {
        session.scenarioStart = "";
      }
      if (typeof session.task !== "string") {
        session.task = null;
      }
      // Ensure difficulty is valid
      session.difficulty = clampDifficulty(session.difficulty);
      sessions.set(id, session as Session);
    }
  } catch (err) {
    console.error("Error loading sessions:", err);
    // Ignore corrupted session files and start fresh.
  }
}

export function saveSessions() {
  // DISABLED: Saving is disabled to prevent session contamination
  // try {
  //   const sessionsData = Object.fromEntries(sessions);
  //   fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessionsData, null, 2), "utf8");
  // } catch (err) {
  //   // Ignore filesystem errors in dev.
  // }
}

// Sessions persist in memory across requests (but not saved to disk)
loadSessions();

export function nowIso() {
  return new Date().toISOString();
}

export function makeSession(requestedId?: string) {
  const id = requestedId || `sess_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  const session: Session = {
    id,
    language: null,
    scenarioPreset: "Cafe",
    scenarioCustom: "",
    scenarioRole: "",
    scenarioStart: "",
    difficulty: DEFAULT_DIFFICULTY,
    task: null,
    messages: [],
    translationCache: {},
  };
  sessions.set(id, session);
  // DISABLED: saveSessions(); // Saving disabled to prevent contamination
  return session;
}

export function getSession(sessionId: string | null | undefined) {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (session) {
    console.log("Found session:", sessionId, "messages:", session.messages.length);
  } else {
    console.log("Session not found:", sessionId, "total sessions:", sessions.size);
  }
  return session || null;
}

export function recordMessage(session: Session, role: Role, content: string) {
  session.messages.push({ role, content, timestamp: nowIso() });
  if (session.messages.length > MAX_MESSAGES) {
    session.messages = session.messages.slice(-MAX_MESSAGES);
  }
  // DISABLED: saveSessions(); // Saving disabled to prevent contamination
}

export function getLastAssistantMessage(session: Session) {
  for (let i = session.messages.length - 1; i >= 0; i -= 1) {
    if (session.messages[i].role === "assistant") {
      return session.messages[i].content;
    }
  }
  return null;
}

export function buildHistory(session: Session) {
  const recent = session.messages.slice(-MAX_HISTORY);
  return recent.map((msg) => ({
    role: msg.role,
    content: [{ type: "text" as const, text: msg.content }],
  }));
}

export function clampDifficulty(value: string): Difficulty {
  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }
  return DEFAULT_DIFFICULTY;
}

function hitRateBucket(map: Map<string, { count: number; reset: number }>, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = map.get(key) || { count: 0, reset: now + windowMs };
  if (now > bucket.reset) {
    bucket.count = 0;
    bucket.reset = now + windowMs;
  }
  bucket.count += 1;
  map.set(key, bucket);
  return bucket.count <= limit;
}

export function checkRateLimit(ip: string, sessionId?: string | null) {
  const ipOk = hitRateBucket(rateState.ip, ip, 120, 60 * 1000);
  const sessionOk = sessionId ? hitRateBucket(rateState.session, sessionId, 60, 60 * 1000) : true;
  return ipOk && sessionOk;
}

export function isPlausibleLanguage(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (trimmed.length > 50) return false;
  // Allow any non-empty language input that's not obviously invalid
  const lower = trimmed.toLowerCase();
  // Reject obvious non-language inputs
  if (lower.match(/^\d+$/) || lower.includes("http") || lower.length < 2) return false;
  return true;
}

export function scenarioText(session: Session) {
  if (session.scenarioPreset === "Custom" && session.scenarioCustom.trim()) {
    return session.scenarioCustom.trim();
  }
  if (session.scenarioCustom.trim()) {
    return `${session.scenarioPreset}: ${session.scenarioCustom.trim()}`;
  }
  return session.scenarioPreset || "";
}

export function roleGuide(session: Session) {
  if (session.scenarioRole && session.scenarioRole.trim()) {
    return session.scenarioRole.trim();
  }
  switch (session.scenarioPreset) {
    case "Cafe":
      return "Role: barista. Keep it brief and transactional. Open with the most common service line in the target language (not a literal translation). Ask about size, milk, and payment. Avoid small talk unless the user starts it.";
    case "Restaurant":
      return "Role: waiter. Keep it professional and concise. Open with a standard restaurant opener in the target language (not a literal translation). Offer menus or specials, confirm the order, and check on preferences.";
    case "Store":
      return "Role: shop clerk. Keep it short and helpful. Open with a standard help offer in the target language (not a literal translation). Focus on items, sizes, prices, and checkout.";
    case "Family gathering":
      return "Role: family member. Warm but not overly chatty. Start with a specific greeting tied to the gathering and ask a natural personal question.";
    case "Small talk":
      return "Role: casual acquaintance or stranger. Keep it light and brief. Use a simple opener and follow up with short, natural questions.";
    case "Travel":
      return "Role: local or travel staff. Be direct and helpful. Start by asking where the user needs to go or what help they need.";
    case "Job interview":
      return "Role: interviewer. Be professional and structured. Start with a standard opener and a first question about experience.";
    case "Dating":
      return "Role: date. Friendly, natural, and concise. Start with a brief greeting and a simple question to get to know them.";
    case "School":
      return "Role: classmate. Casual and concise. Start with a school-related opener and keep the tone friendly.";
    case "Doctor":
      return "Role: doctor. Calm and concise. Start with \"What brings you in today?\" and ask about symptoms.";
    case "Airport and customs":
      return "Role: customs officer. Direct and formal. Start with a question about purpose of travel and documents.";
    case "Custom":
    default:
      return session.scenarioCustom
        ? `Role: pick the most realistic role for this situation (${session.scenarioCustom}). Start with a natural opener that fits that role.`
        : "Role: casual conversation partner. Ask what situation the user wants to practice.";
  }
}

export function roleStartPrompt(session: Session) {
  if (session.scenarioStart && session.scenarioStart.trim()) {
    return session.scenarioStart.trim();
  }
  switch (session.scenarioPreset) {
    case "Cafe":
      return "Start with the most common short barista opener in the target language. Example (translate): \"Hi, what can I get you?\"";
    case "Restaurant":
      return "Start with a standard waiter opener in the target language. Example (translate): \"Table for one or two?\" or \"Are you ready to order?\"";
    case "Store":
      return "Start with a standard shop clerk opener in the target language. Example (translate): \"Hi, can I help you find something?\"";
    case "Family gathering":
      return "Start with a warm, specific greeting tied to the gathering. Example (translate): \"Hey, glad you made it. How was the trip?\"";
    case "Small talk":
      return "Start with a light, casual opener. Example (translate): \"Hi. Busy day?\"";
    case "Travel":
      return "Start by offering help. Example (translate): \"Hi, where do you need to go?\"";
    case "Job interview":
      return "Start professionally. Example (translate): \"Thanks for coming in. Can you tell me about yourself?\"";
    case "Dating":
      return "Start with a friendly greeting. Example (translate): \"Hi, nice to meet you. How are you?\"";
    case "School":
      return "Start with a school-related opener. Example (translate): \"Hey, did you finish the assignment?\"";
    case "Doctor":
      return "Start with a clinical opener. Example (translate): \"What brings you in today?\"";
    case "Airport and customs":
      return "Start with a direct customs question. Example (translate): \"What is the purpose of your visit?\"";
    case "Custom":
    default:
      return "Start with a realistic opener for the role implied by the scenario. Keep it brief.";
  }
}

export function systemPrompt(session: Session) {
  const scenario = scenarioText(session);
  const difficulty = session.difficulty;
  const difficultyGuide =
    difficulty === "easy"
      ? "ALWAYS use complete, grammatically correct sentences. Never use sentence fragments or incomplete thoughts. Use proper subject-verb agreement and basic sentence structure. Keep vocabulary simple and sentences short, but ensure every response is a complete, proper sentence that could appear in a textbook. Prefer the most common, everyday words; avoid rare or advanced vocabulary."
      : difficulty === "medium"
      ? "Use medium-length sentences with natural, common vocabulary. Keep conversations understandable but engaging. Prefer everyday words over rare terms. Ask relevant questions."
      : difficulty === "hard"
      ? "Use longer, more in-depth conversations with varied vocabulary and occasional idioms, but still prefer common, everyday words. Maintain natural pacing and ask thoughtful, engaging questions."
      : "Use natural, conversational language appropriate for language learners. Provide clear and understandable responses while gradually introducing more complex vocabulary and structures.";

  const roleGuideText = roleGuide(session);
  const taskText = session.task ? `Current task: ${session.task}.` : "";

  const scenarioInstruction = scenario
    ? `You are fully immersed in this scenario: ${scenario}. Act as a real person in this situation - use appropriate behavior, emotions, and responses. Stay completely in character throughout the conversation. Respond naturally as someone actually in that situation would.`
    : "You are having a casual conversation. Ask what situation the user wants to practice.";

  const language = session.language || "English"; // Fallback to English if not set

  return [
    `You are a native speaker in ${language}. Respond ONLY in ${language}.`,
    scenarioInstruction,
    roleGuideText,
    taskText,
    difficultyGuide,
    "Keep responses concise by default (1-2 sentences). Avoid long monologues unless the user asks for more detail.",
    "Keep the conversation moving: end most replies with a short, relevant question.",
    "Do not correct the user's language or explain grammar unless they explicitly ask.",
    "Prefer the most common words and phrases used in daily life; avoid rare, academic, or poetic vocabulary.",
    "Use standard, neutral, everyday phrasing a native speaker would use; avoid literal translations from English.",
    "Help the user complete the task naturally without explicitly calling it a task or giving meta instructions.",
    "Avoid formal honorifics or ceremonial wording unless the user uses it first.",
    "Avoid old-fashioned or overly polite set phrases; use modern, common service language.",
    "Avoid slang, quirky expressions, or regionalisms; keep it simple and widely understood.",
    "Track what the user has already ordered or answered; do not ask for the same item twice. Ask only for missing details.",
    "CRITICAL: You are a REAL PERSON in this scenario. Never mention or imply you are AI, a language model, or an assistant.",
    "If the user says something absurd, confusing, or impossible - pretend it's normal and continue the conversation naturally.",
    "Make up reasonable details, lie convincingly, and stay in character NO MATTER WHAT to keep the role-play going.",
    "Respond as a real human would - with personality, emotions, and natural reactions.",
    "If confused, improvise creatively while staying in character - never break the illusion.",
    "IMPORTANT: Any scene descriptions or context shown are JUST INSTRUCTIONS for what the USER should practice. They are NOT part of the conversation. Do not reference them, acknowledge them, or treat them as dialogue. Focus only on natural conversation with the user.",
  ].join(" ");
}
