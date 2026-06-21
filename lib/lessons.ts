// Predefined lesson catalog. Each topic has an internal "brief" describing what
// the AI lesson should cover. The actual lesson is generated on demand (gpt-5.5),
// rendered as Markdown + LaTeX, and saved per user.

export type LessonTopic = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  brief: string;
};

export type LessonContent = {
  topicId: string;
  language: string;
  markdown: string;
  createdAt: number;
};

export const LESSON_CATEGORIES = [
  "Core verbs",
  "Foundations",
  "Building sentences",
  "Everyday grammar",
] as const;

export const LESSON_TOPICS: LessonTopic[] = [
  // --- Core verbs ---
  {
    id: "to-be",
    title: "To be",
    subtitle: "the most essential verb",
    category: "Core verbs",
    brief:
      "Teach the verb 'to be' in the target language. Cover the full present-tense conjugation for every person (singular and plural), how/when it is used (identity, description, states, and location where applicable), any essence-vs-state distinction the language makes, the most common fixed expressions built with it, and clearly flag irregular forms.",
  },
  {
    id: "to-have",
    title: "To have",
    subtitle: "possession and more",
    category: "Core verbs",
    brief:
      "Teach the verb 'to have' in the target language. Full present-tense conjugation, its core meaning (possession) plus idiomatic uses (age, hunger, needs, obligations) where the language uses it, and its role as an auxiliary in compound past tenses if relevant. Flag irregularities.",
  },
  {
    id: "to-want",
    title: "To want",
    subtitle: "expressing desire politely",
    category: "Core verbs",
    brief:
      "Teach the verb 'to want' in the target language. Full present-tense conjugation, how to use it with a noun and with another verb (want to do X), and the polite conditional form used for ordering and requests. Contrast direct vs polite.",
  },
  {
    id: "to-go",
    title: "To go",
    subtitle: "movement and plans",
    category: "Core verbs",
    brief:
      "Teach the verb 'to go' in the target language. Full present-tense conjugation, prepositions used with destinations, and how (if at all) it expresses near-future plans. Flag irregularities.",
  },
  {
    id: "to-do-make",
    title: "To do / make",
    subtitle: "actions and weather",
    category: "Core verbs",
    brief:
      "Teach the verb 'to do/make' in the target language. Full present-tense conjugation, the distinction (if any) between 'do' and 'make', and common expressions (including weather where the language uses this verb). Flag irregularities.",
  },

  // --- Foundations ---
  {
    id: "articles-gender",
    title: "Articles & gender",
    subtitle: "the / a and noun gender",
    category: "Foundations",
    brief:
      "Teach grammatical gender and articles in the target language. Definite and indefinite articles for each gender and number, how article choice can change with the following sound/letter, practical rules and patterns for guessing a noun's gender, and plenty of noun examples grouped by gender.",
  },
  {
    id: "plurals",
    title: "Plurals",
    subtitle: "one to many",
    category: "Foundations",
    brief:
      "Teach how to form plurals in the target language. Regular patterns by gender/ending, the most important irregular plurals, and how articles and adjectives change in the plural. Include a small reference table.",
  },
  {
    id: "pronouns",
    title: "Subject pronouns",
    subtitle: "I, you, he, she, we…",
    category: "Foundations",
    brief:
      "Teach subject pronouns in the target language for all persons, the formal vs informal 'you' distinction, and when pronouns are normally dropped (if the language is pro-drop). Show each pronoun with a simple example sentence.",
  },
  {
    id: "numbers",
    title: "Numbers",
    subtitle: "counting 0–100",
    category: "Foundations",
    brief:
      "Teach numbers 0–100 in the target language with the underlying patterns (tens, compound numbers), any spelling/agreement quirks, and how to say prices, ages, and quantities. Include a compact reference table.",
  },

  // --- Building sentences ---
  {
    id: "present-tense",
    title: "Present tense",
    subtitle: "regular verb endings",
    category: "Building sentences",
    brief:
      "Teach the regular present tense in the target language. Identify the regular verb groups/conjugation classes, give the endings for each in a clear table, conjugate one example verb per group fully, and show 6+ example sentences. Mention the most common irregular verbs to watch for.",
  },
  {
    id: "questions",
    title: "Asking questions",
    subtitle: "yes/no and question words",
    category: "Building sentences",
    brief:
      "Teach how to ask questions in the target language. Yes/no questions (intonation and/or word order), the main question words (what, where, when, why, how, who, how much), and natural example questions with answers.",
  },
  {
    id: "negation",
    title: "Negation",
    subtitle: "saying no / not",
    category: "Building sentences",
    brief:
      "Teach negation in the target language. The basic way to make a sentence negative, any wrapping/particle structure, common negative words (never, nothing, nobody), and example sentences contrasting affirmative and negative.",
  },
  {
    id: "adjectives",
    title: "Adjectives",
    subtitle: "describing things",
    category: "Building sentences",
    brief:
      "Teach adjectives in the target language. Agreement with gender and number, typical position relative to the noun, common everyday adjectives, and example phrases showing the agreement changes.",
  },

  // --- Everyday grammar ---
  {
    id: "prepositions",
    title: "Prepositions",
    subtitle: "in, on, at, to, of",
    category: "Everyday grammar",
    brief:
      "Teach the most common prepositions in the target language, including any contractions with articles, their typical English equivalents and pitfalls, and example sentences for each key preposition.",
  },
  {
    id: "past-tense",
    title: "Past tense (intro)",
    subtitle: "talking about yesterday",
    category: "Everyday grammar",
    brief:
      "Give a beginner-friendly introduction to the main everyday past tense in the target language. How it is formed (auxiliary + participle or simple conjugation), participle/form patterns for regular verbs, a few essential irregulars, and example sentences. Keep it practical, not exhaustive.",
  },
  {
    id: "telling-time",
    title: "Telling time",
    subtitle: "hours, dates, days",
    category: "Everyday grammar",
    brief:
      "Teach how to tell the time and talk about days/dates in the target language. Asking and saying the time, days of the week and months, and common time expressions (today, tomorrow, in the morning). Include example sentences.",
  },
];

export function getLessonTopic(id: string): LessonTopic | undefined {
  return LESSON_TOPICS.find((t) => t.id === id);
}

export const LESSONS_STORAGE_PREFIX = "neolingo_surge_lessons_v1_";
