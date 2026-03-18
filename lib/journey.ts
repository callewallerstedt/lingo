export type JourneyStepId = "read" | "repeat" | "change" | "build" | "use";
export type JourneyMode = "flashcards" | "match" | "typeback" | "fill_blank" | "build" | "scenario";

export type JourneySentenceItem = {
  id: string;
  target: string;
  translation: string;
};

export type JourneyChangeItem = {
  id: string;
  cue: string;
  template: string;
  answer: string;
  translation: string;
  options?: string[];
};

export type JourneyBuildItem = {
  id: string;
  cue: string;
  answer: string;
  translation: string;
  support?: string;
  acceptedAnswers?: string[];
};

export type JourneyUseItem = {
  situation: string;
  prompt: string;
  answer: string;
  translation: string;
  support?: string;
  acceptedAnswers?: string[];
};

export type JourneyLessonContent = {
  chapterId: string;
  partId: string;
  summary: string;
  grammarFocus: string;
  carryForwardNote?: string;
  readItems: JourneySentenceItem[];
  repeatItems: JourneySentenceItem[];
  changeItems: JourneyChangeItem[];
  buildItems: JourneyBuildItem[];
  useItems: JourneyUseItem[];
};

export type JourneyMatchState = {
  targets: string[];
  translations: string[];
  matchedIds: string[];
  selectedTargetId: string | null;
  selectedTranslationId: string | null;
};

export type JourneyFeedback = {
  status: "correct" | "wrong";
  expected: string;
  note?: string;
};

export type JourneyRepeatMode = "match" | "type";

export type JourneyActiveLesson = {
  chapterId: string;
  partId: string;
  step: JourneyStepId;
  itemIndex: number;
  revealed: boolean;
  input: string;
  hintCount: number;
  feedback: JourneyFeedback | null;
  repeatMode: JourneyRepeatMode;
  match: JourneyMatchState | null;
  completed: boolean;
};

export type JourneyPartProgress = {
  chapterId: string;
  partId: string;
  status: "new" | "started" | "completed";
  completedSteps: JourneyStepId[];
  startedAt?: number;
  lastOpenedAt?: number;
  completedAt?: number;
  runCount: number;
  learnedSentences: JourneySentenceItem[];
  updatedAt: number;
};

export type JourneyStateSnapshot = {
  language: string;
  selectedChapterId: string | null;
  selectedPartId: string | null;
  progress: Record<string, JourneyPartProgress>;
  contentCache: Record<string, JourneyLessonContent>;
  activeLesson: JourneyActiveLesson | null;
  updatedAt: number;
};

export type JourneyPartDefinition = {
  id: string;
  index: number;
  title: string;
  focus: string;
  summary: string;
  anchorEnglish: string[];
  modes: JourneyMode[];
};

export type JourneyChapterDefinition = {
  id: string;
  index: number;
  title: string;
  summary: string;
  parts: JourneyPartDefinition[];
};

export const JOURNEY_STEP_ORDER: JourneyStepId[] = ["read", "repeat", "change", "build", "use"];
export const JOURNEY_STEP_LABELS: Record<JourneyStepId, string> = {
  read: "Read",
  repeat: "Repeat",
  change: "Change",
  build: "Build",
  use: "Use",
};

export const JOURNEY_MODE_LABELS: Record<JourneyMode, string> = {
  flashcards: "Flashcards",
  match: "Match",
  typeback: "Repeat",
  fill_blank: "Fill blank",
  build: "Build",
  scenario: "Use it",
};

export const JOURNEY_STORAGE_KEY_PREFIX = "lingoarc_journey_state_";
export const JOURNEY_STEP_ITEM_TARGET = 5;
export const JOURNEY_EXTENDED_STEP_ITEM_TARGET = 8;

export function getJourneyStepItemTarget(chapterId: string, partId: string) {
  if (
    chapterId === "basics-conversation" &&
    ["pronouns", "to-be", "simple-statements", "yes-no-questions", "short-answers"].includes(partId)
  ) {
    return JOURNEY_EXTENDED_STEP_ITEM_TARGET;
  }
  return JOURNEY_STEP_ITEM_TARGET;
}

function createPart(
  id: string,
  index: number,
  title: string,
  focus: string,
  summary: string,
  anchorEnglish: string[]
): JourneyPartDefinition {
  return {
    id,
    index,
    title,
    focus,
    summary,
    anchorEnglish,
    modes: ["flashcards", "match", "typeback", "fill_blank", "build", "scenario"],
  };
}

export const JOURNEY_CHAPTERS: JourneyChapterDefinition[] = [
  {
    id: "basics-conversation",
    index: 1,
    title: "Basics of Conversation",
    summary: "Build the first tiny sentence frames that everything else depends on.",
    parts: [
      createPart("pronouns", 1, "Pronouns", "I, you, he, she, it, we, you all, they in full sentences.", "Start using every core subject naturally instead of memorizing only a few of them.", ["I am ready.", "You are here.", "He is busy.", "She is at home.", "It is cold.", "We are late.", "You all are early.", "They are tired."]),
      createPart("to-be", 2, "To Be", "Am, are, is across the full pronoun set.", "Make calm everyday state and identity sentences with every core subject form.", ["I am tired.", "You are ready.", "He is calm.", "She is happy.", "It is open.", "We are at home.", "You all are welcome.", "They are outside."]),
      createPart("simple-statements", 3, "Simple Statements", "Short clear statements across all core subjects.", "Say basic facts cleanly with every common pronoun pattern, not just the easiest few.", ["I want coffee.", "You need water.", "He likes music.", "She lives here.", "It works now.", "We need help.", "You all know this.", "They live nearby."]),
      createPart("yes-no-questions", 4, "Yes or No Questions", "Turn statements into easy questions across every core subject.", "Ask direct everyday questions with the full beginner pronoun set.", ["Am I early?", "Are you ready?", "Is he here?", "Is she busy?", "Is it open?", "Are we late?", "Are you all hungry?", "Are they inside?"]),
      createPart("short-answers", 5, "Short Answers", "Natural short replies across the full pronoun set.", "Answer quickly and cleanly with all the basic subject forms you need early on.", ["Yes, I am.", "No, you are not.", "Yes, he is.", "No, she is not.", "Yes, it is.", "No, we are not.", "Yes, you all are.", "No, they are not."]),
    ],
  },
  {
    id: "introductions-small-talk",
    index: 2,
    title: "Introductions and Small Talk",
    summary: "Get comfortable opening conversations and keeping them friendly.",
    parts: [
      createPart("saying-your-name", 1, "Saying Your Name", "Introduce yourself simply.", "Say your name smoothly in a first meeting.", ["My name is Anna.", "I am Marco.", "I am from Sweden.", "Nice to meet you."]),
      createPart("asking-names", 2, "Asking Names", "Ask someone who they are.", "Open a first exchange without freezing.", ["What is your name?", "Who is she?", "Are you Luca?", "What do people call you?"]),
      createPart("where-from", 3, "Where You Are From", "Ask and answer where someone is from.", "Connect place words to real introductions.", ["I am from Stockholm.", "Where are you from?", "She is from Rome.", "We are from Spain."]),
      createPart("polite-phrases", 4, "Polite Phrases", "Please, thanks, sorry, excuse me.", "Soften requests and sound pleasant from the start.", ["Please help me.", "Thank you very much.", "Sorry, I am late.", "Excuse me, where is the station?"]),
      createPart("how-are-you", 5, "How Are You", "Ask and answer how someone feels.", "Handle the most common small-talk exchange naturally.", ["How are you?", "I am fine.", "I am a little tired.", "And you?"]),
    ],
  },
  {
    id: "numbers-time-dates",
    index: 3,
    title: "Numbers, Time, Dates",
    summary: "Handle the time language that shows up in almost every plan.",
    parts: [
      createPart("numbers", 1, "Numbers", "Small numbers inside everyday sentences.", "Use numbers for age, quantity, and quick facts.", ["I need two tickets.", "We have three minutes.", "She is twenty years old.", "There are five people."]),
      createPart("time", 2, "Time", "Clock time in simple plans.", "Say when things happen without stopping to think.", ["It is two o'clock.", "We meet at seven.", "The train leaves at ten.", "I work at nine."]),
      createPart("days", 3, "Days", "Days of the week in plans.", "Talk about weekly plans and routines.", ["I work on Monday.", "We meet on Friday.", "She is free on Sunday.", "Are you busy on Tuesday?"]),
      createPart("dates", 4, "Dates", "Simple date language.", "Say dates clearly for bookings and plans.", ["Today is the fifth.", "My birthday is in May.", "The booking is on the tenth.", "What date is it today?"]),
      createPart("today-tomorrow-yesterday", 5, "Today, Tomorrow, Yesterday", "Basic time markers.", "Place actions in time with the most common words first.", ["I am busy today.", "We leave tomorrow.", "I was tired yesterday.", "Are you free tonight?"]),
    ],
  },
  {
    id: "daily-life",
    index: 4,
    title: "Daily Life",
    summary: "Move from isolated ideas into the routines people actually talk about.",
    parts: [
      createPart("common-verbs", 1, "Common Verbs", "Go, eat, work, sleep, want, need.", "Use high-frequency action verbs inside complete sentences.", ["I go home.", "We eat here.", "She works today.", "They need help."]),
      createPart("routines", 2, "Routines", "Describe what you do every day.", "Talk about your normal day with basic confidence.", ["I wake up early.", "We drink coffee in the morning.", "He goes to work.", "I study at night."]),
      createPart("frequency", 3, "Frequency", "Always, often, sometimes, never.", "Add realistic rhythm to your daily-life sentences.", ["I often cook at home.", "We sometimes walk there.", "She never drinks coffee.", "Do you always eat breakfast?"]),
      createPart("simple-schedules", 4, "Simple Schedules", "Plans and timing together.", "Say what happens when, in simple order.", ["I work in the morning.", "We eat at seven.", "She studies after work.", "They leave at noon."]),
      createPart("combining-actions", 5, "Combining Actions", "Link two basic actions naturally.", "Stretch short sentences into something more useful.", ["I go home and cook dinner.", "We sit down and talk.", "She wakes up and works.", "They eat and leave."]),
    ],
  },
  {
    id: "asking-questions",
    index: 5,
    title: "Asking Questions",
    summary: "Unlock the question words that carry almost every useful conversation.",
    parts: [
      createPart("what", 1, "What", "Ask what something is or what someone wants.", "Get information with the most common question word.", ["What is this?", "What do you want?", "What time is it?", "What are we doing?"]),
      createPart("where", 2, "Where", "Ask about place and direction.", "Find people, places, and objects quickly.", ["Where is the station?", "Where do you live?", "Where are we going?", "Where is my bag?"]),
      createPart("when", 3, "When", "Ask about time.", "Get simple scheduling answers without overthinking.", ["When do we leave?", "When is the class?", "When are you free?", "When does it open?"]),
      createPart("why", 4, "Why", "Ask for reason simply.", "Understand explanations with short useful forms.", ["Why are you late?", "Why is it closed?", "Why do we wait?", "Why is she sad?"]),
      createPart("how", 5, "How", "Ask about method, state, and condition.", "Use flexible how-questions in real conversation.", ["How are you?", "How do I get there?", "How much is this?", "How long does it take?"]),
    ],
  },
  {
    id: "directions-places",
    index: 6,
    title: "Directions and Places",
    summary: "Understand movement, location, and the simplest navigation language.",
    parts: [
      createPart("left-right-straight", 1, "Left, Right, Straight", "Basic direction words in sentences.", "Recognize and give the first layer of direction language.", ["Go left here.", "Turn right at the corner.", "Go straight ahead.", "The station is on the left."]),
      createPart("asking-directions", 2, "Asking for Directions", "Ask how to get somewhere.", "Handle the most common lost-traveler question naturally.", ["Where is the station?", "How do I get to the hotel?", "Is it far from here?", "Can you help me find the bus stop?"]),
      createPart("understanding-instructions", 3, "Understanding Instructions", "Follow short direction phrases.", "Turn instruction fragments into usable comprehension.", ["Go past the bank.", "Cross the street.", "It is next to the museum.", "Take the second left."]),
      createPart("common-places", 4, "Common Places", "Station, hotel, bank, pharmacy, park.", "Talk about the places you need most often.", ["I am at the station.", "We are going to the bank.", "The pharmacy is near the park.", "She works at the hotel."]),
      createPart("distance-time", 5, "Distance and Time", "Ask how far or how long.", "Combine directions with travel time and distance.", ["It is five minutes away.", "How far is the center?", "It takes ten minutes.", "Is it close on foot?"]),
    ],
  },
  {
    id: "food-ordering",
    index: 7,
    title: "Food and Ordering",
    summary: "Build useful restaurant sentences instead of isolated food words.",
    parts: [
      createPart("food-vocabulary", 1, "Food Vocabulary", "Core food and drink in real sentences.", "Use basic meal words inside requests and preferences.", ["I want coffee.", "We need water.", "She likes bread.", "They have soup today."]),
      createPart("ordering-food", 2, "Ordering Food", "Ask for food directly and politely.", "Place a basic order with full sentences.", ["I would like coffee, please.", "Can I have the menu?", "We want two sandwiches.", "I want this one."]),
      createPart("preferences", 3, "Preferences", "Say what you like, want, or do not want.", "Keep ordering personal and practical.", ["I like pasta.", "I do not want meat.", "We prefer water.", "Do you want dessert?"]),
      createPart("asking-for-bill", 4, "Asking for the Bill", "End a meal naturally.", "Handle the last part of the restaurant exchange.", ["Can I have the bill, please?", "We want to pay now.", "Is service included?", "Can we pay by card?"]),
      createPart("special-requests", 5, "Special Requests", "Simple requests and changes.", "Adjust an order without sounding stuck.", ["No ice, please.", "Can I change this?", "I need it without milk.", "Can we sit outside?"]),
    ],
  },
  {
    id: "shopping-money",
    index: 8,
    title: "Shopping and Money",
    summary: "Learn the transaction language that comes up in shops and errands.",
    parts: [
      createPart("prices", 1, "Prices", "Price questions and answers.", "Ask about money naturally and understand the reply.", ["How much is this?", "It is ten euros.", "That is too expensive.", "This one is cheaper."]),
      createPart("asking-cost", 2, "Asking Cost", "Different ways to ask the price.", "Stay flexible when you need the cost quickly.", ["How much does this cost?", "What is the price?", "How much are these?", "Is this on sale?"]),
      createPart("buying-items", 3, "Buying Items", "Ask for what you want to buy.", "Move from browsing into actually purchasing.", ["I want to buy this.", "We need two tickets.", "I will take this one.", "Do you have a smaller one?"]),
      createPart("quantities-sizes", 4, "Quantities and Sizes", "More, less, big, small, one, two.", "Control quantity and size in real exchanges.", ["I need a large coffee.", "Do you have a small size?", "We want two of these.", "Just one, please."]),
      createPart("paying", 5, "Paying", "Card, cash, total, receipt.", "Finish a purchase without hesitation.", ["Can I pay by card?", "I only have cash.", "What is the total?", "Can I have the receipt?"]),
    ],
  },
  {
    id: "social-conversation",
    index: 9,
    title: "Social Conversation",
    summary: "Turn your base language into natural everyday social interaction.",
    parts: [
      createPart("hobbies", 1, "Hobbies", "Talk about what you do for fun.", "Make small talk feel personal and easy.", ["I like music.", "We play football.", "She reads a lot.", "Do you like films?"]),
      createPart("opinions", 2, "Opinions", "I think, I like, I do not like.", "Express small opinions without getting stuck.", ["I think it is good.", "I like this place.", "I do not like that.", "It looks nice to me."]),
      createPart("agree-disagree", 3, "Agree and Disagree", "Simple agreement and disagreement.", "Respond naturally without long explanations.", ["I agree.", "I do not agree.", "You are right.", "Maybe, but I am not sure."]),
      createPart("invitations", 4, "Invitations", "Ask someone to join you.", "Create short real-life social offers.", ["Do you want to come?", "Let us go now.", "Can we meet later?", "Would you like coffee?"]),
      createPart("responding-naturally", 5, "Responding Naturally", "Short warm social replies.", "Sound more human in casual exchanges.", ["That sounds good.", "Maybe later.", "I would love to.", "Sorry, I cannot today."]),
    ],
  },
  {
    id: "problems-help",
    index: 10,
    title: "Problems and Help",
    summary: "Get through confusion, problems, and urgent moments with useful phrases.",
    parts: [
      createPart("asking-help", 1, "Asking for Help", "Simple help requests.", "Say clearly that you need assistance.", ["Can you help me?", "I need help.", "Please help us.", "Can someone help here?"]),
      createPart("explaining-problems", 2, "Explaining Problems", "Basic problem sentences.", "Explain what is wrong in a short usable way.", ["I have a problem.", "My phone does not work.", "We are lost.", "I cannot find the address."]),
      createPart("emergencies", 3, "Emergencies", "Urgent and safety language.", "Use calm simple phrases when speed matters.", ["Call a doctor.", "I need help now.", "It is an emergency.", "Where is the hospital?"]),
      createPart("misunderstandings", 4, "Misunderstandings", "Ask for repetition and clarity.", "Recover when the conversation moves too fast.", ["I do not understand.", "Can you say that again?", "Please speak slowly.", "What does that mean?"]),
      createPart("complaints", 5, "Complaints", "Polite direct complaints.", "Fix a problem without sounding chaotic.", ["This is not right.", "My order is wrong.", "The room is dirty.", "Can you change this, please?"]),
    ],
  },
];

export function getJourneyPartKey(chapterId: string, partId: string) {
  return `${chapterId}:${partId}`;
}

export function getJourneyChapter(chapterId: string) {
  return JOURNEY_CHAPTERS.find((chapter) => chapter.id === chapterId) || null;
}

export function getJourneyPart(chapterId: string, partId: string) {
  return getJourneyChapter(chapterId)?.parts.find((part) => part.id === partId) || null;
}

function cleanJourneyText(value: string) {
  return value.replace(/\s+/g, " ").replace(/\s+([?!.,;:])/g, "$1").trim();
}

function cleanJourneyBlankText(value: string) {
  return cleanJourneyText(value).replace(/[?!.,;:]+$/g, "").trim();
}

function escapeJourneyRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractJourneyBlankAnswer(template: string, value: string) {
  const candidate = cleanJourneyBlankText(value);
  if (!template.includes("___")) {
    return candidate;
  }

  const [beforeRaw, afterRaw] = template.split("___");
  const before = cleanJourneyBlankText(beforeRaw || "");
  const after = cleanJourneyBlankText(afterRaw || "");
  let extracted = candidate;

  if (before) {
    extracted = extracted.replace(new RegExp(`^${escapeJourneyRegExp(before)}\\s*`, "i"), "").trim();
  }
  if (after) {
    extracted = extracted.replace(new RegExp(`\\s*${escapeJourneyRegExp(after)}$`, "i"), "").trim();
  }

  return cleanJourneyBlankText(extracted || candidate);
}

function cleanJourneyTargetText(target: string, translation = "") {
  const cleanedTranslation = cleanJourneyText(translation);
  let cleanedTarget = cleanJourneyText(target);
  if (/\?$/.test(cleanedTranslation) && !/[?؟]$/.test(cleanedTarget)) {
    cleanedTarget = `${cleanedTarget.replace(/[.!]+$/g, "").trim()}?`;
  }
  return cleanedTarget;
}

export function normalizeJourneyAnswer(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{N} -]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAcceptedAnswers(source: unknown, primary: string) {
  if (!Array.isArray(source)) {
    return undefined;
  }

  const primaryKey = normalizeJourneyAnswer(primary);
  const seen = new Set<string>(primaryKey ? [primaryKey] : []);
  const accepted = source
    .filter((value): value is string => typeof value === "string")
    .map((value) => cleanJourneyTargetText(value))
    .filter((value) => {
      const key = normalizeJourneyAnswer(value);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

  return accepted.length ? accepted : undefined;
}

export function matchesJourneyAnswer(submitted: string, expected: string, acceptedAnswers: string[] = []) {
  const normalizedSubmitted = normalizeJourneyAnswer(submitted);
  if (!normalizedSubmitted) {
    return false;
  }

  return [expected, ...acceptedAnswers]
    .map((value) => normalizeJourneyAnswer(value))
    .filter(Boolean)
    .includes(normalizedSubmitted);
}

function looksLikeJourneyAnswerLeak(text: string, answer: string) {
  const normalizedText = normalizeJourneyAnswer(text);
  const normalizedAnswer = normalizeJourneyAnswer(answer);
  if (!normalizedText || !normalizedAnswer) {
    return false;
  }
  return (
    normalizedText === normalizedAnswer ||
    normalizedText.includes(normalizedAnswer) ||
    normalizedAnswer.includes(normalizedText)
  );
}

function normalizeSentenceItem(source: unknown, fallbackId: string): JourneySentenceItem | null {
  const item = source as Partial<JourneySentenceItem> | null | undefined;
  const id = typeof item?.id === "string" && item.id.trim() ? item.id.trim() : fallbackId;
  const translation = typeof item?.translation === "string" ? cleanJourneyText(item.translation) : "";
  const target = typeof item?.target === "string" ? cleanJourneyTargetText(item.target, translation) : "";
  if (!target || !translation) {
    return null;
  }
  return { id, target, translation };
}

function normalizeChangeItem(source: unknown, fallbackId: string): JourneyChangeItem | null {
  const item = source as Partial<JourneyChangeItem> | null | undefined;
  const cue = typeof item?.cue === "string" ? cleanJourneyText(item.cue) : "";
  const translation = typeof item?.translation === "string" ? cleanJourneyText(item.translation) : "";
  const template = typeof item?.template === "string" ? cleanJourneyTargetText(item.template, translation) : "";
  const answer = typeof item?.answer === "string" ? extractJourneyBlankAnswer(template, item.answer) : "";
  if (!template || !answer || !translation || !template.includes("___")) {
    return null;
  }
  return {
    id: typeof item?.id === "string" && item.id.trim() ? item.id.trim() : fallbackId,
    cue: cue || "Fill the blank",
    template,
    answer,
    translation,
    options: Array.isArray(item?.options)
      ? item.options
          .filter((option): option is string => typeof option === "string")
          .map((option) => extractJourneyBlankAnswer(template, option))
          .filter(Boolean)
      : undefined,
  };
}

function normalizeBuildItem(source: unknown, fallbackId: string): JourneyBuildItem | null {
  const item = source as Partial<JourneyBuildItem> | null | undefined;
  const rawItem = item as (Partial<JourneyBuildItem> & {
    acceptedAnswers?: string[];
    accepted?: string[];
    alternatives?: string[];
    alternateAnswers?: string[];
  }) | null | undefined;
  const cue = typeof item?.cue === "string" ? cleanJourneyText(item.cue) : "";
  const translation = typeof item?.translation === "string" ? cleanJourneyText(item.translation) : "";
  const answer = typeof item?.answer === "string" ? cleanJourneyTargetText(item.answer, translation) : "";
  const support = typeof item?.support === "string" ? cleanJourneyText(item.support) : "";
  if (!cue || !answer || !translation) {
    return null;
  }
  return {
    id: typeof item?.id === "string" && item.id.trim() ? item.id.trim() : fallbackId,
    cue,
    answer,
    translation,
    support: support || undefined,
    acceptedAnswers:
      normalizeAcceptedAnswers(rawItem?.acceptedAnswers, answer) ||
      normalizeAcceptedAnswers(rawItem?.accepted, answer) ||
      normalizeAcceptedAnswers(rawItem?.alternatives, answer) ||
      normalizeAcceptedAnswers(rawItem?.alternateAnswers, answer),
  };
}

function normalizeUseItem(source: unknown): JourneyUseItem | null {
  const item = source as Partial<JourneyUseItem> | null | undefined;
  const rawItem = item as (Partial<JourneyUseItem> & {
    acceptedAnswers?: string[];
    accepted?: string[];
    alternatives?: string[];
    alternateAnswers?: string[];
  }) | null | undefined;
  const situation = typeof item?.situation === "string" ? cleanJourneyText(item.situation) : "";
  const prompt = typeof item?.prompt === "string" ? cleanJourneyText(item.prompt) : "";
  const translation = typeof item?.translation === "string" ? cleanJourneyText(item.translation) : "";
  const answer = typeof item?.answer === "string" ? cleanJourneyTargetText(item.answer, translation) : "";
  const support = typeof item?.support === "string" ? cleanJourneyText(item.support) : "";
  const safePrompt = prompt && !looksLikeJourneyAnswerLeak(prompt, answer) ? prompt : "";
  const safeSupport = support && !looksLikeJourneyAnswerLeak(support, answer) ? support : "";
  if (!situation || !safePrompt || !answer || !translation) {
    return null;
  }
  return {
    situation,
    prompt: safePrompt,
    answer,
    translation,
    support: safeSupport || undefined,
    acceptedAnswers:
      normalizeAcceptedAnswers(rawItem?.acceptedAnswers, answer) ||
      normalizeAcceptedAnswers(rawItem?.accepted, answer) ||
      normalizeAcceptedAnswers(rawItem?.alternatives, answer) ||
      normalizeAcceptedAnswers(rawItem?.alternateAnswers, answer),
  };
}

export function normalizeJourneyLessonContent(source: unknown): JourneyLessonContent | null {
  const lesson = source as Partial<JourneyLessonContent> | null | undefined;
  const chapterId = typeof lesson?.chapterId === "string" ? lesson.chapterId : "";
  const partId = typeof lesson?.partId === "string" ? lesson.partId : "";
  if (!getJourneyPart(chapterId, partId)) {
    return null;
  }

  const readItems = Array.isArray(lesson?.readItems)
    ? lesson.readItems
        .map((item, index) => normalizeSentenceItem(item, `read-${index + 1}`))
        .filter((item): item is JourneySentenceItem => Boolean(item))
    : [];
  const repeatItems = Array.isArray(lesson?.repeatItems)
    ? lesson.repeatItems
        .map((item, index) => normalizeSentenceItem(item, `repeat-${index + 1}`))
        .filter((item): item is JourneySentenceItem => Boolean(item))
    : [];
  const changeItems = Array.isArray(lesson?.changeItems)
    ? lesson.changeItems
        .map((item, index) => normalizeChangeItem(item, `change-${index + 1}`))
        .filter((item): item is JourneyChangeItem => Boolean(item))
    : [];
  const buildItems = Array.isArray(lesson?.buildItems)
    ? lesson.buildItems
        .map((item, index) => normalizeBuildItem(item, `build-${index + 1}`))
        .filter((item): item is JourneyBuildItem => Boolean(item))
    : [];
  const useSource = Array.isArray((lesson as { useItems?: unknown[] } | null | undefined)?.useItems)
    ? ((lesson as { useItems?: unknown[] }).useItems || [])
    : (lesson as { useItem?: unknown } | null | undefined)?.useItem
      ? [(lesson as { useItem?: unknown }).useItem]
      : [];
  const useItems = useSource
    .map((item) => normalizeUseItem(item))
    .filter((item): item is JourneyUseItem => Boolean(item));
  const targetCount = getJourneyStepItemTarget(chapterId, partId);
  const normalizedRepeatItems =
    repeatItems.length >= targetCount
      ? repeatItems
      : readItems.map((item, index) => ({
          id: `repeat-${index + 1}`,
          target: item.target,
          translation: item.translation,
        }));

  if (
    readItems.length < targetCount ||
    normalizedRepeatItems.length < targetCount ||
    changeItems.length < targetCount ||
    buildItems.length < targetCount ||
    useItems.length < targetCount
  ) {
    return null;
  }

  return {
    chapterId,
    partId,
    summary: typeof lesson?.summary === "string" && lesson.summary.trim() ? lesson.summary.trim() : "",
    grammarFocus:
      typeof lesson?.grammarFocus === "string" && lesson.grammarFocus.trim()
        ? lesson.grammarFocus.trim()
        : getJourneyPart(chapterId, partId)?.focus || "",
    carryForwardNote:
      typeof lesson?.carryForwardNote === "string" && lesson.carryForwardNote.trim()
        ? lesson.carryForwardNote.trim()
        : undefined,
    readItems: readItems.slice(0, targetCount),
    repeatItems: normalizedRepeatItems.slice(0, targetCount),
    changeItems: changeItems.slice(0, targetCount),
    buildItems: buildItems.slice(0, targetCount),
    useItems: useItems.slice(0, targetCount),
  };
}

export function normalizeJourneySnapshot(activeLanguage: string, source: unknown): JourneyStateSnapshot | null {
  const parsed = source as Partial<JourneyStateSnapshot> | null | undefined;
  if (!parsed || typeof parsed !== "object" || parsed.language !== activeLanguage) {
    return null;
  }

  const contentCache: Record<string, JourneyLessonContent> = {};
  if (parsed.contentCache && typeof parsed.contentCache === "object") {
    Object.entries(parsed.contentCache).forEach(([key, value]) => {
      const normalized = normalizeJourneyLessonContent(value);
      if (normalized) {
        contentCache[key] = normalized;
      }
    });
  }

  const progress: Record<string, JourneyPartProgress> = {};
  if (parsed.progress && typeof parsed.progress === "object") {
    Object.entries(parsed.progress).forEach(([key, value]) => {
      const record = value as Partial<JourneyPartProgress>;
      if (!record || typeof record !== "object") return;
      if (!getJourneyPart(String(record.chapterId || ""), String(record.partId || ""))) return;
      progress[key] = {
        chapterId: String(record.chapterId),
        partId: String(record.partId),
        status: record.status === "completed" ? "completed" : record.status === "started" ? "started" : "new",
        completedSteps: Array.isArray(record.completedSteps)
          ? JOURNEY_STEP_ORDER.filter((step) => record.completedSteps?.includes(step))
          : [],
        startedAt: typeof record.startedAt === "number" ? record.startedAt : undefined,
        lastOpenedAt: typeof record.lastOpenedAt === "number" ? record.lastOpenedAt : undefined,
        completedAt: typeof record.completedAt === "number" ? record.completedAt : undefined,
        runCount: Number.isFinite(record.runCount) ? Number(record.runCount) : 0,
        learnedSentences: Array.isArray(record.learnedSentences)
          ? record.learnedSentences
              .map((item, index) => normalizeSentenceItem(item, `learned-${index + 1}`))
              .filter((item): item is JourneySentenceItem => Boolean(item))
          : [],
        updatedAt: typeof record.updatedAt === "number" ? record.updatedAt : Date.now(),
      };
    });
  }

  let activeLesson: JourneyActiveLesson | null = null;
  if (parsed.activeLesson && typeof parsed.activeLesson === "object") {
    const lesson = parsed.activeLesson as Partial<JourneyActiveLesson>;
    const partKey = getJourneyPartKey(String(lesson.chapterId || ""), String(lesson.partId || ""));
    const cachedLesson = contentCache[partKey];
    if (cachedLesson) {
      activeLesson = {
        chapterId: cachedLesson.chapterId,
        partId: cachedLesson.partId,
        step: JOURNEY_STEP_ORDER.includes(lesson.step as JourneyStepId) ? (lesson.step as JourneyStepId) : "read",
        itemIndex: Number.isFinite(lesson.itemIndex) ? Math.max(0, Number(lesson.itemIndex)) : 0,
        revealed: Boolean(lesson.revealed),
        input: typeof lesson.input === "string" ? lesson.input : "",
        hintCount: Number.isFinite(lesson.hintCount) ? Math.max(0, Number(lesson.hintCount)) : 0,
        feedback:
          lesson.feedback &&
          typeof lesson.feedback === "object" &&
          ((lesson.feedback as JourneyFeedback).status === "correct" || (lesson.feedback as JourneyFeedback).status === "wrong") &&
          typeof (lesson.feedback as JourneyFeedback).expected === "string"
            ? {
                status: (lesson.feedback as JourneyFeedback).status,
                expected: (lesson.feedback as JourneyFeedback).expected,
                note:
                  typeof (lesson.feedback as JourneyFeedback).note === "string"
                    ? (lesson.feedback as JourneyFeedback).note
                    : undefined,
              }
            : null,
        repeatMode: lesson.repeatMode === "type" ? "type" : "match",
        match:
          lesson.match &&
          typeof lesson.match === "object" &&
          Array.isArray((lesson.match as JourneyMatchState).targets) &&
          Array.isArray((lesson.match as JourneyMatchState).translations) &&
          Array.isArray((lesson.match as JourneyMatchState).matchedIds)
            ? {
                targets: (lesson.match as JourneyMatchState).targets.filter((item): item is string => typeof item === "string"),
                translations: (lesson.match as JourneyMatchState).translations.filter((item): item is string => typeof item === "string"),
                matchedIds: (lesson.match as JourneyMatchState).matchedIds.filter((item): item is string => typeof item === "string"),
                selectedTargetId:
                  typeof (lesson.match as JourneyMatchState).selectedTargetId === "string"
                    ? (lesson.match as JourneyMatchState).selectedTargetId
                    : null,
                selectedTranslationId:
                  typeof (lesson.match as JourneyMatchState).selectedTranslationId === "string"
                    ? (lesson.match as JourneyMatchState).selectedTranslationId
                    : null,
              }
            : createJourneyMatchState(cachedLesson.repeatItems),
        completed: Boolean(lesson.completed),
      };
    }
  }

  return {
    language: activeLanguage,
    selectedChapterId:
      typeof parsed.selectedChapterId === "string" && getJourneyChapter(parsed.selectedChapterId)
        ? parsed.selectedChapterId
        : JOURNEY_CHAPTERS[0]?.id || null,
    selectedPartId:
      typeof parsed.selectedPartId === "string" &&
      getJourneyPart(
        typeof parsed.selectedChapterId === "string" ? parsed.selectedChapterId : "",
        parsed.selectedPartId
      )
        ? parsed.selectedPartId
        : null,
    progress,
    contentCache,
    activeLesson,
    updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
  };
}

export function createEmptyJourneyState(language: string): JourneyStateSnapshot {
  return {
    language,
    selectedChapterId: JOURNEY_CHAPTERS[0]?.id || null,
    selectedPartId: null,
    progress: {},
    contentCache: {},
    activeLesson: null,
    updatedAt: Date.now(),
  };
}

export function createJourneyMatchState(items: JourneySentenceItem[]): JourneyMatchState {
  const ids = items.map((item) => item.id);
  return {
    targets: shuffle(ids),
    translations: shuffle(ids),
    matchedIds: [],
    selectedTargetId: null,
    selectedTranslationId: null,
  };
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function createJourneyActiveLesson(content: JourneyLessonContent): JourneyActiveLesson {
  return {
    chapterId: content.chapterId,
    partId: content.partId,
    step: "read",
    itemIndex: 0,
    revealed: false,
    input: "",
    hintCount: 0,
    feedback: null,
    repeatMode: "match",
    match: createJourneyMatchState(content.repeatItems),
    completed: false,
  };
}

export function createJourneyProgressRecord(chapterId: string, partId: string): JourneyPartProgress {
  return {
    chapterId,
    partId,
    status: "new",
    completedSteps: [],
    runCount: 0,
    learnedSentences: [],
    updatedAt: Date.now(),
  };
}

export function collectJourneyLearnedSentences(content: JourneyLessonContent) {
  const map = new Map<string, JourneySentenceItem>();
  [...content.readItems, ...content.repeatItems].forEach((item) => {
    if (!item.target || !item.translation) return;
    map.set(`${item.target}::${item.translation}`, item);
  });
  content.buildItems.forEach((item, index) => {
    if (!item.answer || !item.translation) return;
    map.set(`${item.answer}::${item.translation}`, {
      id: `build-${index}`,
      target: item.answer,
      translation: item.translation,
    });
  });
  content.useItems.forEach((item, index) => {
    if (!item.answer || !item.translation) return;
    map.set(`${item.answer}::${item.translation}`, {
      id: `use-${index}`,
      target: item.answer,
      translation: item.translation,
    });
  });
  return Array.from(map.values()).slice(0, 8);
}

export function getJourneyNextPart(chapterId: string, partId: string) {
  const chapterIndex = JOURNEY_CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
  if (chapterIndex === -1) return null;
  const chapter = JOURNEY_CHAPTERS[chapterIndex];
  const partIndex = chapter.parts.findIndex((part) => part.id === partId);
  if (partIndex === -1) return null;
  if (chapter.parts[partIndex + 1]) {
    return {
      chapterId,
      partId: chapter.parts[partIndex + 1].id,
    };
  }
  const nextChapter = JOURNEY_CHAPTERS[chapterIndex + 1];
  if (!nextChapter?.parts[0]) {
    return null;
  }
  return {
    chapterId: nextChapter.id,
    partId: nextChapter.parts[0].id,
  };
}
