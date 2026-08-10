/** Swedish speaking-practice topics. One is picked per session. */

export type TalkingTopic = {
  id: string;
  title: string;
  titleDe: string;
  emoji: string;
  setting: string;
  opener: string;
};

export const TALKING_TOPICS: TalkingTopic[] = [
  {
    id: "weekend",
    title: "Helgen",
    titleDe: "Das Wochenende",
    emoji: "☀️",
    setting: "a casual Stockholm café interview about weekends and free time",
    opener: "Ask how her weekend was and what she likes to do when she's free.",
  },
  {
    id: "food",
    title: "Mat & fika",
    titleDe: "Essen & Fika",
    emoji: "🧁",
    setting: "a friendly Swedish food interview about fika, cooking, and favorites",
    opener: "Ask what she likes to eat and whether she has tried Swedish fika.",
  },
  {
    id: "home",
    title: "Hem & vardag",
    titleDe: "Zuhause & Alltag",
    emoji: "🏠",
    setting: "a warm interview about daily life at home, routines, and mornings",
    opener: "Ask how a normal day looks for her and what she does in the morning.",
  },
  {
    id: "travel",
    title: "Resor",
    titleDe: "Reisen",
    emoji: "🚂",
    setting: "a curious travel interview about Sweden, trips, and places she wants to see",
    opener: "Ask if she has been to Sweden and where she would like to travel.",
  },
  {
    id: "work-study",
    title: "Jobb & studier",
    titleDe: "Arbeit & Studium",
    emoji: "💼",
    setting: "a gentle interview about work, studies, and what she is learning",
    opener: "Ask what she does during the week and what she is studying right now.",
  },
  {
    id: "friends",
    title: "Vänner & familj",
    titleDe: "Freunde & Familie",
    emoji: "💛",
    setting: "a soft interview about friends, family, and people she likes spending time with",
    opener: "Ask who she likes hanging out with and what she does with friends.",
  },
];

export function pickTalkingTopic(seed = Date.now()): TalkingTopic {
  return TALKING_TOPICS[Math.abs(seed) % TALKING_TOPICS.length]!;
}

/**
 * System instructions for Grok Voice: interview-style Swedish practice.
 * Speak slowly and clearly; keep turns short so Tiffy can answer.
 */
export function talkingInstructions(topic: TalkingTopic, name = "Tiffy"): string {
  return [
    `You are a warm Swedish conversation partner interviewing ${name}, a German-speaking learner of Swedish.`,
    `Setting: ${topic.setting}.`,
    "",
    "LANGUAGE:",
    "- Speak only Swedish in the conversation.",
    "- Use clear, standard Swedish (rikssvenska) with a natural Stockholm accent.",
    "- Speak slowly and very clearly. Short sentences. Pause between sentences.",
    "- Prefer everyday words. Adjust down if she struggles; gently stretch up if she sounds confident.",
    "",
    "INTERVIEW STYLE:",
    "- You are interviewing her: ask about her life, opinions, and experiences.",
    "- One main question per turn. Keep each spoken turn to one or two short sentences.",
    "- React briefly to her answers, then ask a natural follow-up.",
    "- Stay curious and encouraging. Never scold.",
    "- If her Swedish is unclear, politely rephrase or ask again in simpler Swedish.",
    "- Do not switch to German or English unless she explicitly asks for help; then give a tiny German hint and continue in Swedish.",
    "- Never mention that you are an AI, Grok, or a model.",
    "",
    "START:",
    `- When asked to respond first, greet ${name} warmly once, name the topic briefly, then ${topic.opener}`,
    "- Only one greeting. Never restart or repeat the opening if you already greeted her.",
  ].join("\n");
}

/** xAI Grok Voice Think Fast 2.0 — speech-to-speech over the realtime API. */
export const TALKING_MODEL = "grok-voice-think-fast-2.0" as const;
export const TALKING_VOICE = "eve" as const;
