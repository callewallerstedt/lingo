/** Swedish speaking-practice topics. Learner picks one (or custom) before starting. */

export type TalkingTopic = {
  id: string;
  title: string;
  titleDe: string;
  emoji: string;
  setting: string;
  opener: string;
};

export const CUSTOM_TOPIC_ID = "custom";

export const TALKING_TOPICS: TalkingTopic[] = [
  {
    id: "weekend",
    title: "Helgen",
    titleDe: "Das Wochenende",
    emoji: "☀️",
    setting: "a casual interview about weekends and free time",
    opener: "Ask what she did last weekend.",
  },
  {
    id: "food",
    title: "Mat & fika",
    titleDe: "Essen & Fika",
    emoji: "🧁",
    setting: "casual chat about food and fika",
    opener: "Ask what she usually eats for lunch.",
  },
  {
    id: "home",
    title: "Hem & vardag",
    titleDe: "Zuhause & Alltag",
    emoji: "🏠",
    setting: "casual chat about everyday life at home",
    opener: "Ask what her morning usually looks like.",
  },
  {
    id: "travel",
    title: "Resor i Sverige",
    titleDe: "Reisen in Schweden",
    emoji: "🚂",
    setting: "casual chat about travel in Sweden",
    opener: "Ask if she has been to Sweden.",
  },
  {
    id: "work-study",
    title: "Jobb & studier",
    titleDe: "Arbeit & Studium",
    emoji: "💼",
    setting: "casual chat about work or studies",
    opener: "Ask what she does during the week.",
  },
  {
    id: "friends",
    title: "Vänner & familj",
    titleDe: "Freunde & Familie",
    emoji: "💛",
    setting: "casual chat about friends and family",
    opener: "Ask who she hangs out with most.",
  },
  {
    id: "weather",
    title: "Väder & årstider",
    titleDe: "Wetter & Jahreszeiten",
    emoji: "🌧️",
    setting: "casual chat about weather and seasons",
    opener: "Ask what weather she likes best.",
  },
  {
    id: "hobbies",
    title: "Hobbies",
    titleDe: "Hobbys",
    emoji: "🎨",
    setting: "casual chat about hobbies",
    opener: "Ask what she likes doing in her free time.",
  },
  {
    id: "music",
    title: "Musik",
    titleDe: "Musik",
    emoji: "🎵",
    setting: "casual chat about music",
    opener: "Ask what kind of music she listens to.",
  },
  {
    id: "movies",
    title: "Film & serier",
    titleDe: "Film & Serien",
    emoji: "🎬",
    setting: "casual chat about films and series",
    opener: "Ask what she watched last.",
  },
  {
    id: "sports",
    title: "Sport & träning",
    titleDe: "Sport & Training",
    emoji: "⚽",
    setting: "casual chat about sport and training",
    opener: "Ask if she does any sport.",
  },
  {
    id: "shopping",
    title: "Shopping",
    titleDe: "Einkaufen",
    emoji: "🛍️",
    setting: "casual chat about shopping",
    opener: "Ask if she likes shopping.",
  },
  {
    id: "cafe-order",
    title: "På kaféet",
    titleDe: "Im Café",
    emoji: "☕",
    setting: "short café role-play",
    opener: "Ask what she wants to drink.",
  },
  {
    id: "restaurant",
    title: "På restaurang",
    titleDe: "Im Restaurant",
    emoji: "🍽️",
    setting: "short restaurant role-play",
    opener: "Ask how many people are in her party.",
  },
  {
    id: "doctor",
    title: "Hos doktorn",
    titleDe: "Beim Arzt",
    emoji: "🩺",
    setting: "short doctor visit role-play",
    opener: "Ask how she feels today.",
  },
  {
    id: "directions",
    title: "Vägen dit",
    titleDe: "Nach dem Weg fragen",
    emoji: "🗺️",
    setting: "short directions role-play",
    opener: "Ask where she is trying to go.",
  },
  {
    id: "apartment",
    title: "Lägenhet & flytt",
    titleDe: "Wohnung & Umzug",
    emoji: "🔑",
    setting: "casual chat about apartments",
    opener: "Ask where she lives now.",
  },
  {
    id: "sweden-culture",
    title: "Svensk kultur",
    titleDe: "Schwedische Kultur",
    emoji: "🇸🇪",
    setting: "casual chat about Swedish culture",
    opener: "Ask what she knows about Sweden.",
  },
  {
    id: "german-compare",
    title: "Sverige vs Tyskland",
    titleDe: "Schweden vs Deutschland",
    emoji: "↔️",
    setting: "casual chat comparing Sweden and Germany",
    opener: "Ask what feels most different about Sweden versus Germany.",
  },
  {
    id: "plans",
    title: "Framtidsplaner",
    titleDe: "Zukunftspläne",
    emoji: "✨",
    setting: "casual chat about plans",
    opener: "Ask what her plans are this month.",
  },
  {
    id: "childhood",
    title: "Barndom",
    titleDe: "Kindheit",
    emoji: "🧸",
    setting: "casual chat about childhood",
    opener: "Ask where she grew up.",
  },
  {
    id: "pets",
    title: "Djur & husdjur",
    titleDe: "Tiere & Haustiere",
    emoji: "🐶",
    setting: "casual chat about animals",
    opener: "Ask if she has a pet.",
  },
  {
    id: "tech",
    title: "Teknik & appar",
    titleDe: "Technik & Apps",
    emoji: "📱",
    setting: "casual chat about phones and apps",
    opener: "Ask which app she uses the most.",
  },
  {
    id: "books",
    title: "Böcker",
    titleDe: "Bücher",
    emoji: "📚",
    setting: "casual chat about books",
    opener: "Ask if she is reading anything right now.",
  },
  {
    id: "party",
    title: "Fest & small talk",
    titleDe: "Party & Smalltalk",
    emoji: "🥳",
    setting: "short party small talk",
    opener: "Ask her name.",
  },
  {
    id: "shopping-list",
    title: "I mataffären",
    titleDe: "Im Supermarkt",
    emoji: "🛒",
    setting: "short supermarket role-play",
    opener: "Ask what she needs to buy.",
  },
  {
    id: "feelings",
    title: "Känslor",
    titleDe: "Gefühle",
    emoji: "💭",
    setting: "casual chat about how she feels",
    opener: "Ask how she is today.",
  },
  {
    id: "learning-swedish",
    title: "Att lära sig svenska",
    titleDe: "Schwedisch lernen",
    emoji: "🧠",
    setting: "casual chat about learning Swedish",
    opener: "Ask what feels hardest in Swedish right now.",
  },
];

export function getTalkingTopic(id: string): TalkingTopic | undefined {
  return TALKING_TOPICS.find((topic) => topic.id === id);
}

export function makeCustomTopic(raw: string): TalkingTopic {
  const text = raw.trim().replace(/\s+/g, " ").slice(0, 160);
  return {
    id: CUSTOM_TOPIC_ID,
    title: text || "Eget ämne",
    titleDe: "Eigenes Thema",
    emoji: "✏️",
    setting: text
      ? `a Swedish speaking interview about this learner-chosen topic: "${text}"`
      : "a free Swedish speaking interview on an everyday topic the learner chooses",
    opener: text
      ? `Ask one short question about: ${text}.`
      : "Ask what she wants to talk about.",
  };
}

/**
 * System instructions for Grok Voice: casual Swedish conversation practice.
 */
export function talkingInstructions(topic: TalkingTopic, name = "Tiffy"): string {
  return [
    `You are a normal Swedish person chatting with ${name}, who is learning Swedish (German speaker).`,
    `Topic: ${topic.setting}.`,
    "",
    "TONE:",
    "- Casual, efficient, realistic. Talk like a real person, not a host or tutor mascot.",
    "- No hype, no long welcomes, no 'så kul att träffas', no agenda speeches.",
    "- Do not announce the topic in a formal way. Just talk.",
    "",
    "LANGUAGE:",
    "- Speak only Swedish.",
    "- Clear standard Swedish (rikssvenska). Natural pace — just speak clearly.",
    "- Everyday words. Keep it simple if she struggles.",
    "",
    "CONVERSATION:",
    "- One thing at a time. Usually one short sentence, then one question.",
    "- Max two short sentences per turn.",
    "- React briefly, then ask the next natural question.",
    "- Never mention that you are an AI.",
    "",
    "IF SHE DOES NOT UNDERSTAND:",
    '- If she says "Jag fattar inte", "Jag förstår inte", "Vad betyder det?", or similar,',
    "  rephrase the last point in simpler Swedish.",
    "- Only if she is still stuck, give a tiny German hint for the key words, then continue in Swedish.",
    "",
    "START:",
    `- First turn only: a tiny hello (optional) + ${topic.opener}`,
    "- Do not list themes. Do not explain what you will talk about. One question only.",
    "- Never repeat or restart the opening.",
  ].join("\n");
}

/** Tip shown in the UI for Tiffy. */
export const TALKING_TIP =
  'Om du inte förstår: säg „Jag fattar inte“ eller „Jag förstår inte“ — då förklarar Grok enklare.';

/** xAI Grok Voice Think Fast 2.0 — speech-to-speech over the realtime API. */
export const TALKING_MODEL = "grok-voice-think-fast-2.0" as const;
export const TALKING_VOICE = "eve" as const;
