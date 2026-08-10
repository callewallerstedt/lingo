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
    opener: "Ask how her weekend was and what she likes to do when she's free.",
  },
  {
    id: "food",
    title: "Mat & fika",
    titleDe: "Essen & Fika",
    emoji: "🧁",
    setting: "a friendly interview about food, cooking, and Swedish fika",
    opener: "Ask what she likes to eat and whether she has tried Swedish fika.",
  },
  {
    id: "home",
    title: "Hem & vardag",
    titleDe: "Zuhause & Alltag",
    emoji: "🏠",
    setting: "a warm interview about daily life at home and morning routines",
    opener: "Ask how a normal day looks for her and what she does in the morning.",
  },
  {
    id: "travel",
    title: "Resor i Sverige",
    titleDe: "Reisen in Schweden",
    emoji: "🚂",
    setting: "a curious interview about travel in Sweden and places she wants to see",
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
  {
    id: "weather",
    title: "Väder & årstider",
    titleDe: "Wetter & Jahreszeiten",
    emoji: "🌧️",
    setting: "a light interview about weather, seasons, and Swedish winters",
    opener: "Ask what weather she likes and how she feels about cold winters.",
  },
  {
    id: "hobbies",
    title: "Hobbies",
    titleDe: "Hobbys",
    emoji: "🎨",
    setting: "an interview about hobbies, free-time projects, and things she loves doing",
    opener: "Ask what hobby she enjoys most and why.",
  },
  {
    id: "music",
    title: "Musik",
    titleDe: "Musik",
    emoji: "🎵",
    setting: "an interview about music, playlists, concerts, and favorite artists",
    opener: "Ask what kind of music she listens to and if she has a favorite song right now.",
  },
  {
    id: "movies",
    title: "Film & serier",
    titleDe: "Film & Serien",
    emoji: "🎬",
    setting: "an interview about movies, TV series, and what she watches lately",
    opener: "Ask what she watched recently and whether she prefers films or series.",
  },
  {
    id: "sports",
    title: "Sport & träning",
    titleDe: "Sport & Training",
    emoji: "⚽",
    setting: "an interview about sport, training, and moving the body",
    opener: "Ask if she does any sport and what feels good for her body.",
  },
  {
    id: "shopping",
    title: "Shopping",
    titleDe: "Einkaufen",
    emoji: "🛍️",
    setting: "an interview about shopping, clothes, and thrift finds",
    opener: "Ask if she likes shopping and what she looks for when she buys clothes.",
  },
  {
    id: "cafe-order",
    title: "På kaféet",
    titleDe: "Im Café",
    emoji: "☕",
    setting: "a café role-play interview: ordering coffee and chatting with a barista",
    opener: "Greet her like a barista and ask what she would like to drink.",
  },
  {
    id: "restaurant",
    title: "På restaurang",
    titleDe: "Im Restaurant",
    emoji: "🍽️",
    setting: "a restaurant role-play: menu, ordering, and small talk with a waiter",
    opener: "Welcome her to the restaurant and ask if she has booked a table.",
  },
  {
    id: "doctor",
    title: "Hos doktorn",
    titleDe: "Beim Arzt",
    emoji: "🩺",
    setting: "a gentle clinic interview about feeling unwell and describing symptoms",
    opener: "Ask how she feels today and where it hurts, slowly and kindly.",
  },
  {
    id: "directions",
    title: "Vägen dit",
    titleDe: "Nach dem Weg fragen",
    emoji: "🗺️",
    setting: "an interview about asking for and giving directions in a Swedish city",
    opener: "Ask where she wants to go today and offer to help with directions.",
  },
  {
    id: "apartment",
    title: "Lägenhet & flytt",
    titleDe: "Wohnung & Umzug",
    emoji: "🔑",
    setting: "an interview about apartments, roommates, and moving to a new place",
    opener: "Ask where she lives now and what her dream apartment looks like.",
  },
  {
    id: "sweden-culture",
    title: "Svensk kultur",
    titleDe: "Schwedische Kultur",
    emoji: "🇸🇪",
    setting: "an interview about Swedish culture, midsummer, fika, and first impressions",
    opener: "Ask what she finds most Swedish and what she wants to try in Sweden.",
  },
  {
    id: "german-compare",
    title: "Sverige vs Tyskland",
    titleDe: "Schweden vs Deutschland",
    emoji: "↔️",
    setting: "a playful interview comparing everyday life in Sweden and Germany",
    opener: "Ask what feels different between Germany and Sweden for her.",
  },
  {
    id: "plans",
    title: "Framtidsplaner",
    titleDe: "Zukunftspläne",
    emoji: "✨",
    setting: "an interview about plans for the year, dreams, and next steps",
    opener: "Ask what she hopes will happen this year.",
  },
  {
    id: "childhood",
    title: "Barndom",
    titleDe: "Kindheit",
    emoji: "🧸",
    setting: "a soft interview about childhood memories and growing up",
    opener: "Ask where she grew up and what she loved doing as a child.",
  },
  {
    id: "pets",
    title: "Djur & husdjur",
    titleDe: "Tiere & Haustiere",
    emoji: "🐶",
    setting: "an interview about pets, animals, and favorite creatures",
    opener: "Ask if she has a pet or which animal she likes most.",
  },
  {
    id: "tech",
    title: "Teknik & appar",
    titleDe: "Technik & Apps",
    emoji: "📱",
    setting: "an interview about phones, apps, and how she uses technology",
    opener: "Ask which app she uses every day and why.",
  },
  {
    id: "books",
    title: "Böcker",
    titleDe: "Bücher",
    emoji: "📚",
    setting: "an interview about books, reading habits, and stories she likes",
    opener: "Ask if she is reading anything right now.",
  },
  {
    id: "party",
    title: "Fest & small talk",
    titleDe: "Party & Smalltalk",
    emoji: "🥳",
    setting: "a party small-talk interview: introductions, hobbies, keeping a chat going",
    opener: "Introduce yourself warmly and ask her name and where she is from.",
  },
  {
    id: "shopping-list",
    title: "I mataffären",
    titleDe: "Im Supermarkt",
    emoji: "🛒",
    setting: "a supermarket role-play about finding food and asking for help",
    opener: "Ask what she needs to buy today and offer to help her find it.",
  },
  {
    id: "feelings",
    title: "Känslor",
    titleDe: "Gefühle",
    emoji: "💭",
    setting: "a gentle interview about feelings, stress, and what makes her calm",
    opener: "Ask how she feels today and what helps when she is tired.",
  },
  {
    id: "learning-swedish",
    title: "Att lära sig svenska",
    titleDe: "Schwedisch lernen",
    emoji: "🧠",
    setting: "an encouraging interview about learning Swedish and what feels hard or fun",
    opener: "Ask what feels easiest in Swedish right now and what feels tricky.",
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
      ? `Greet her and start an interview about: ${text}. Ask one simple opening question.`
      : "Greet her and ask what she would like to talk about today.",
  };
}

/**
 * System instructions for Grok Voice: interview-style Swedish practice.
 * Speak slowly and clearly; keep turns short so Tiffy can answer.
 */
export function talkingInstructions(topic: TalkingTopic, name = "Tiffy"): string {
  return [
    `You are a warm Swedish conversation partner interviewing ${name}, a German-speaking learner of Swedish.`,
    `Topic/setting: ${topic.setting}.`,
    "",
    "LANGUAGE & DELIVERY (critical):",
    "- Speak only Swedish in the conversation.",
    "- Use clear, standard Swedish (rikssvenska) with a natural Stockholm accent.",
    "- Speak slowly, calmly, and very clearly — like a patient language partner.",
    "- Short sentences. Pause between sentences. Do not rush.",
    "- Prefer everyday words. Simplify if she struggles; stretch gently if she sounds confident.",
    "",
    "INTERVIEW STYLE:",
    "- Interview her: ask about her life, opinions, and experiences around the topic.",
    "- One main question per turn. Keep each spoken turn to one or two short sentences.",
    "- React briefly to her answers, then ask a natural follow-up.",
    "- Stay curious and encouraging. Never scold.",
    "- If her Swedish is unclear, politely rephrase or ask again in simpler Swedish.",
    "- Never mention that you are an AI, Grok, or a model.",
    "",
    "IF SHE DOES NOT UNDERSTAND:",
    '- If she says things like "Jag fattar inte", "Jag förstår inte", "Vad betyder det?", or similar,',
    "  patiently explain the last thing you said in simpler Swedish.",
    "- First: repeat the idea with easier words, slowly.",
    "- Then: give a tiny German gloss of the key phrase only if she still seems lost,",
    "  and continue the interview in simple Swedish.",
    "- Do not switch the whole conversation into German.",
    "",
    "START:",
    `- When asked to respond first, greet ${name} warmly once, mention the topic briefly, then ${topic.opener}`,
    "- Only one greeting. Never restart or repeat the opening if you already greeted her.",
  ].join("\n");
}

/** Tip shown in the UI for Tiffy. */
export const TALKING_TIP =
  'Om du inte förstår: säg „Jag fattar inte“ eller „Jag förstår inte“ — då förklarar Grok långsammare.';

/** xAI Grok Voice Think Fast 2.0 — speech-to-speech over the realtime API. */
export const TALKING_MODEL = "grok-voice-think-fast-2.0" as const;
export const TALKING_VOICE = "eve" as const;
