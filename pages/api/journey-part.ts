import type { NextApiRequest, NextApiResponse } from "next";
import { OPENAI_HEAVY_MODEL, callOpenAI } from "../../lib/openai";
import {
  getJourneyStepItemTarget,
  getJourneyPart,
  normalizeJourneyAnswer,
  normalizeJourneyLessonContent,
  type JourneyBuildItem,
  type JourneyChangeItem,
  type JourneyLessonContent,
  type JourneySentenceItem,
  type JourneyUseItem,
} from "../../lib/journey";

const JOURNEY_MAX_ATTEMPTS = 2;
const JOURNEY_OPTION_LIMIT = 6;
const JOURNEY_ACCEPTED_ANSWER_LIMIT = 3;

function getJourneyGenerationItemCount(targetCount: number) {
  return targetCount + 1;
}

function getJourneyCoverageInstruction(chapterId: string, partId: string) {
  if (
    chapterId === "basics-conversation" &&
    ["pronouns", "to-be", "simple-statements", "yes-no-questions", "short-answers"].includes(partId)
  ) {
    return "For every list, cover the full subject set in a natural way: I, you, he, she, it, we, you all, they. Do not skip any of them.";
  }
  return "";
}

type RawSentenceItem = {
  id?: string;
  target?: string;
  sentence?: string;
  text?: string;
  translation?: string;
  english?: string;
  meaning?: string;
};

type RawChangeItem = {
  id?: string;
  cue?: string;
  prompt?: string;
  template?: string;
  sentence?: string;
  answer?: string;
  blank?: string;
  translation?: string;
  english?: string;
  options?: string[];
};

type RawBuildItem = {
  id?: string;
  cue?: string;
  prompt?: string;
  answer?: string;
  target?: string;
  translation?: string;
  english?: string;
  support?: string;
  hint?: string;
  acceptedAnswers?: string[];
  accepted?: string[];
  alternatives?: string[];
  alternateAnswers?: string[];
};

type RawUseItem = {
  situation?: string;
  prompt?: string;
  answer?: string;
  target?: string;
  translation?: string;
  english?: string;
  support?: string;
  hint?: string;
  acceptedAnswers?: string[];
  accepted?: string[];
  alternatives?: string[];
  alternateAnswers?: string[];
};

type RawJourneyLesson = {
  summary?: string;
  grammarFocus?: string;
  grammar_focus?: string;
  carryForwardNote?: string;
  carry_forward_note?: string;
  readItems?: RawSentenceItem[];
  read?: RawSentenceItem[];
  repeatItems?: RawSentenceItem[];
  repeat?: RawSentenceItem[];
  changeItems?: RawChangeItem[];
  change?: RawChangeItem[];
  buildItems?: RawBuildItem[];
  build?: RawBuildItem[];
  useItems?: RawUseItem[];
  useItem?: RawUseItem;
  use?: RawUseItem | RawUseItem[];
};

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    const start = value.indexOf("{");
    const end = value.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      return null;
    }
    try {
      return JSON.parse(value.slice(start, end + 1)) as T;
    } catch {
      return null;
    }
  }
}

function cleanLessonText(value: string) {
  return value.replace(/\s+/g, " ").replace(/\s+([?!.,;:])/g, "$1").trim();
}

function cleanTargetText(value: string, translation = "") {
  const cleaned = cleanLessonText(value);
  const cleanedTranslation = cleanLessonText(translation);
  if (/\?$/.test(cleanedTranslation) && !/\?$/.test(cleaned)) {
    return `${cleaned.replace(/[.!]+$/g, "").trim()}?`;
  }
  return cleaned;
}

function cleanBlankText(value: string) {
  return cleanLessonText(value).replace(/[?!.,;:]+$/g, "").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractBlankAnswer(template: string, value: string) {
  const candidate = cleanBlankText(value);
  if (!template.includes("___")) {
    return candidate;
  }

  const [beforeRaw, afterRaw] = template.split("___");
  const before = cleanBlankText(beforeRaw || "");
  const after = cleanBlankText(afterRaw || "");
  let extracted = candidate;

  if (before) {
    extracted = extracted.replace(new RegExp(`^${escapeRegExp(before)}\\s*`, "i"), "").trim();
  }
  if (after) {
    extracted = extracted.replace(new RegExp(`\\s*${escapeRegExp(after)}$`, "i"), "").trim();
  }

  return cleanBlankText(extracted || candidate);
}

function normalizeAcceptedAnswers(source: unknown, primary: string, translation = "") {
  if (!Array.isArray(source)) {
    return undefined;
  }

  const primaryKey = normalizeJourneyAnswer(primary);
  const seen = new Set<string>(primaryKey ? [primaryKey] : []);
  const accepted = source
    .filter((value): value is string => typeof value === "string")
    .map((value) => cleanTargetText(value, translation))
    .filter((value) => {
      const key = normalizeJourneyAnswer(value);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, JOURNEY_ACCEPTED_ANSWER_LIMIT);

  return accepted.length ? accepted : undefined;
}

function looksLikeAnswerLeak(text: string, answer: string) {
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

function uniqueItems<T>(items: T[], keyForItem: (item: T) => string, limit: number) {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const item of items) {
    const key = keyForItem(item);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(item);
    if (unique.length >= limit) {
      break;
    }
  }
  return unique;
}

function toSentenceItem(item: RawSentenceItem | null | undefined, index: number): JourneySentenceItem | null {
  const targetSource =
    typeof item?.target === "string"
      ? item.target
      : typeof item?.sentence === "string"
        ? item.sentence
        : typeof item?.text === "string"
          ? item.text
          : "";
  const translationSource =
    typeof item?.translation === "string"
      ? item.translation
      : typeof item?.english === "string"
        ? item.english
        : typeof item?.meaning === "string"
          ? item.meaning
          : "";
  const translation = cleanLessonText(translationSource.trim());
  const target = cleanTargetText(targetSource.trim(), translation);
  if (!target || !translation) {
    return null;
  }
  return {
    id: typeof item?.id === "string" && item.id.trim() ? item.id.trim() : `sentence-${index + 1}`,
    target,
    translation,
  };
}

function toChangeItem(item: RawChangeItem | null | undefined, index: number): JourneyChangeItem | null {
  const cueSource = typeof item?.cue === "string" ? item.cue : typeof item?.prompt === "string" ? item.prompt : "";
  const templateSource =
    typeof item?.template === "string"
      ? item.template
      : typeof item?.sentence === "string"
        ? item.sentence
        : "";
  const answerSource =
    typeof item?.answer === "string" ? item.answer : typeof item?.blank === "string" ? item.blank : "";
  const translationSource =
    typeof item?.translation === "string"
      ? item.translation
      : typeof item?.english === "string"
        ? item.english
        : "";

  const translation = cleanLessonText(translationSource.trim());
  const cue = cleanLessonText(cueSource.trim());
  const template = cleanTargetText(templateSource.trim(), translation);
  const answer = extractBlankAnswer(template, answerSource.trim());
  if (!template || !answer || !translation || !template.includes("___")) {
    return null;
  }
  return {
    id: typeof item?.id === "string" && item.id.trim() ? item.id.trim() : `change-${index + 1}`,
    cue: cue || `Fill the blank ${index + 1}`,
    template,
    answer,
    translation,
    options: Array.isArray(item?.options)
      ? item.options
          .filter((option): option is string => typeof option === "string" && Boolean(option.trim()))
          .map((option) => extractBlankAnswer(template, option))
      : undefined,
  };
}

function toBuildItem(item: RawBuildItem | null | undefined, index: number): JourneyBuildItem | null {
  const cueSource = typeof item?.cue === "string" ? item.cue : typeof item?.prompt === "string" ? item.prompt : "";
  const answerSource =
    typeof item?.answer === "string" ? item.answer : typeof item?.target === "string" ? item.target : "";
  const translationSource =
    typeof item?.translation === "string"
      ? item.translation
      : typeof item?.english === "string"
        ? item.english
        : "";
  const supportSource =
    typeof item?.support === "string" ? item.support : typeof item?.hint === "string" ? item.hint : "";

  const translation = cleanLessonText(translationSource.trim());
  const cue = cleanLessonText(cueSource.trim());
  const answer = cleanTargetText(answerSource.trim(), translation);
  const support = cleanLessonText(supportSource.trim());
  if (!cue || !answer || !translation) {
    return null;
  }
  return {
    id: typeof item?.id === "string" && item.id.trim() ? item.id.trim() : `build-${index + 1}`,
    cue,
    answer,
    translation,
    support: support || undefined,
    acceptedAnswers:
      normalizeAcceptedAnswers(item?.acceptedAnswers, answer, translation) ||
      normalizeAcceptedAnswers(item?.accepted, answer, translation) ||
      normalizeAcceptedAnswers(item?.alternatives, answer, translation) ||
      normalizeAcceptedAnswers(item?.alternateAnswers, answer, translation),
  };
}

function toUseItem(item: RawUseItem | null | undefined): JourneyUseItem | null {
  const situation = typeof item?.situation === "string" ? cleanLessonText(item.situation.trim()) : "";
  const prompt = typeof item?.prompt === "string" ? cleanLessonText(item.prompt.trim()) : "";
  const answer =
    typeof item?.answer === "string"
      ? item.answer.trim()
      : typeof item?.target === "string"
        ? item.target.trim()
        : "";
  const translation =
    typeof item?.translation === "string"
      ? cleanLessonText(item.translation.trim())
      : typeof item?.english === "string"
        ? cleanLessonText(item.english.trim())
        : "";
  const support =
    typeof item?.support === "string"
      ? cleanLessonText(item.support.trim())
      : typeof item?.hint === "string"
        ? cleanLessonText(item.hint.trim())
        : "";
  const normalizedAnswer = cleanTargetText(answer, translation);
  const safePrompt = prompt && !looksLikeAnswerLeak(prompt, normalizedAnswer) ? prompt : "";
  const safeSupport = support && !looksLikeAnswerLeak(support, normalizedAnswer) ? support : "";

  if (!situation || !safePrompt || !normalizedAnswer || !translation) {
    return null;
  }

  return {
    situation,
    prompt: safePrompt,
    answer: normalizedAnswer,
    translation,
    support: safeSupport || undefined,
    acceptedAnswers:
      normalizeAcceptedAnswers(item?.acceptedAnswers, normalizedAnswer, translation) ||
      normalizeAcceptedAnswers(item?.accepted, normalizedAnswer, translation) ||
      normalizeAcceptedAnswers(item?.alternatives, normalizedAnswer, translation) ||
      normalizeAcceptedAnswers(item?.alternateAnswers, normalizedAnswer, translation),
  };
}

function finalizeSentenceItems(items: JourneySentenceItem[], prefix: string, limit: number) {
  return uniqueItems(
    items,
    (item) => `${normalizeJourneyAnswer(item.target)}::${item.translation.toLocaleLowerCase()}`,
    limit
  ).map((item, index) => ({
    ...item,
    id: `${prefix}-${index + 1}`,
  }));
}

function finalizeChangeItems(items: JourneyChangeItem[], limit: number) {
  return uniqueItems(
    items.map((item) => {
      const answerKey = normalizeJourneyAnswer(item.answer);
      const options = uniqueItems(
        [item.answer, ...(item.options || [])].map((option) => cleanBlankText(option)),
        (option) => normalizeJourneyAnswer(option),
        JOURNEY_OPTION_LIMIT
      );
      const ensuredOptions = options.some((option) => normalizeJourneyAnswer(option) === answerKey)
        ? options
        : [item.answer, ...options].slice(0, JOURNEY_OPTION_LIMIT);
      return {
        ...item,
        options: ensuredOptions,
      };
    }),
    (item) => normalizeJourneyAnswer(item.template.replace("___", item.answer)),
    limit
  ).map((item, index) => ({
    ...item,
    id: `change-${index + 1}`,
  }));
}

function finalizeBuildItems(items: JourneyBuildItem[], limit: number) {
  return uniqueItems(items, (item) => normalizeJourneyAnswer(item.answer), limit).map((item, index) => ({
    ...item,
    id: `build-${index + 1}`,
  }));
}

function finalizeUseItems(items: JourneyUseItem[], limit: number) {
  return uniqueItems(
    items,
    (item) => `${cleanLessonText(item.prompt).toLocaleLowerCase()}::${normalizeJourneyAnswer(item.answer)}`,
    limit
  );
}

function buildJourneyPrompt(
  language: string,
  difficulty: string,
  chapterId: string,
  part: NonNullable<ReturnType<typeof getJourneyPart>>,
  reviewList: Array<{ target: string; translation: string }>,
  targetCount: number,
  attempt: number
) {
  const generationCount = getJourneyGenerationItemCount(targetCount);
  const coverageInstruction = getJourneyCoverageInstruction(chapterId, part.id);
  return [
    {
      role: "system",
      content: [
        {
          type: "text" as const,
          text: [
            "You create polished beginner language-learning lesson JSON.",
            "Return JSON only.",
            "Design one coherent micro-skill arc for a single part.",
            "Every exercise must teach the same core pattern and progress logically from clear examples to small changes to full production to real use.",
            "Use short, natural target-language sentences a native speaker would actually say in daily life.",
            "Do not output duplicate target-language sentences inside any list.",
            "The app creates repeat practice from readItems, so do not output repeatItems.",
            "Every cue and prompt must match the exact expected answer. Do not ask for extra information that the answer does not say.",
            "For changeItems and buildItems, the cue must be a short English task instruction, not a duplicate of the translation line.",
            "If the English translation is a question, the target-language sentence must also be a question.",
            "changeItems must blank only one short chunk from a sentence pattern already taught in readItems.",
            "In changeItems, blank the content chunk that changes the meaning. Do not blank generic subject pronouns or helper words unless the part is specifically about those forms.",
            "buildItems must be solvable using only the lesson material already introduced.",
            "useItems must be tiny realistic situations with one strong answer and optional natural alternatives.",
            "In useItems, situation, prompt, and support must stay in English and must never include the exact target-language answer or a starter chunk from it.",
            "For buildItems and useItems, include acceptedAnswers only when there are other short natural phrasings that genuinely fit.",
            coverageInstruction,
            attempt > 0
              ? "Retry fix: the last draft had duplicates, not enough usable items, or cue-answer mismatches. Fix those problems."
              : "",
            "Output exactly this shape:",
            "{\"summary\":\"...\",\"grammarFocus\":\"...\",\"carryForwardNote\":\"...\",\"readItems\":[{\"target\":\"...\",\"translation\":\"...\"}],\"changeItems\":[{\"cue\":\"...\",\"template\":\"... ___ ...\",\"answer\":\"...\",\"translation\":\"...\",\"options\":[\"...\",\"...\",\"...\",\"...\",\"...\",\"...\"]}],\"buildItems\":[{\"cue\":\"...\",\"answer\":\"...\",\"translation\":\"...\",\"support\":\"...\",\"acceptedAnswers\":[\"...\"]}],\"useItems\":[{\"situation\":\"...\",\"prompt\":\"...\",\"answer\":\"...\",\"translation\":\"...\",\"support\":\"...\",\"acceptedAnswers\":[\"...\"]}]}",
          ]
            .filter(Boolean)
            .join(" "),
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "text" as const,
          text: [
            `Target language: ${language}`,
            `Difficulty: ${difficulty || "easy"}`,
            `Part title: ${part.title}`,
            `Part focus: ${part.focus}`,
            `Part summary: ${part.summary}`,
            `Anchor English sentences:\n${part.anchorEnglish.map((sentence) => `- ${sentence}`).join("\n")}`,
            reviewList.length
              ? `Previous patterns to weave in lightly:\n${reviewList
                  .map((item) => `- ${item.target} = ${item.translation}`)
                  .join("\n")}`
              : "Previous patterns to weave in lightly: none",
            "Requirements:",
            `- ${generationCount} readItems`,
            `- ${generationCount} changeItems`,
            `- ${generationCount} buildItems`,
            `- ${generationCount} useItems`,
            "- Order each list from easiest to slightly more flexible",
            "- readItems should establish the base pattern cleanly",
            "- changeItems should swap only one meaningful chunk at a time",
            "- buildItems should feel like direct recall of taught material",
            "- useItems should feel like tiny real-life moments, not abstract grammar drills",
            "- Keep cues in plain English and make them specific",
            "- Keep target-language answers short, natural, and beginner-friendly",
            coverageInstruction ? `- ${coverageInstruction}` : "",
            "- No duplicate sentences or near-duplicate prompts",
          ].join("\n\n"),
        },
      ],
    },
  ];
}

function buildLessonFromReply(
  reply: string,
  chapterId: string,
  partId: string,
  part: NonNullable<ReturnType<typeof getJourneyPart>>,
  targetCount: number
) {
  const parsed = safeJsonParse<RawJourneyLesson>(reply);
  const readItems = finalizeSentenceItems(
    (parsed?.readItems || parsed?.read || []).map(toSentenceItem).filter(Boolean) as JourneySentenceItem[],
    "read",
    targetCount
  );
  const changeItems = finalizeChangeItems(
    (parsed?.changeItems || parsed?.change || []).map(toChangeItem).filter(Boolean) as JourneyChangeItem[],
    targetCount
  );
  const buildItems = finalizeBuildItems(
    (parsed?.buildItems || parsed?.build || []).map(toBuildItem).filter(Boolean) as JourneyBuildItem[],
    targetCount
  );
  const rawUseItems = Array.isArray(parsed?.useItems)
    ? parsed.useItems
    : Array.isArray(parsed?.use)
      ? parsed.use
      : parsed?.useItem
        ? [parsed.useItem]
        : parsed?.use
          ? [parsed.use]
          : [];
  const useItems = finalizeUseItems(
    rawUseItems.map((item) => toUseItem(item)).filter(Boolean) as JourneyUseItem[],
    targetCount
  );
  const repeatItems = readItems.map((item, index) => ({
    id: `repeat-${index + 1}`,
    target: item.target,
    translation: item.translation,
  }));

  const lessonCandidate: JourneyLessonContent = {
    chapterId,
    partId,
    summary:
      typeof parsed?.summary === "string" && parsed.summary.trim()
        ? cleanLessonText(parsed.summary.trim())
        : part.summary,
    grammarFocus:
      typeof parsed?.grammarFocus === "string" && parsed.grammarFocus.trim()
        ? cleanLessonText(parsed.grammarFocus.trim())
        : typeof parsed?.grammar_focus === "string" && parsed.grammar_focus.trim()
          ? cleanLessonText(parsed.grammar_focus.trim())
          : part.focus,
    carryForwardNote:
      typeof parsed?.carryForwardNote === "string" && parsed.carryForwardNote.trim()
        ? cleanLessonText(parsed.carryForwardNote.trim())
        : typeof parsed?.carry_forward_note === "string" && parsed.carry_forward_note.trim()
          ? cleanLessonText(parsed.carry_forward_note.trim())
          : undefined,
    readItems,
    repeatItems,
    changeItems,
    buildItems,
    useItems,
  };

  return normalizeJourneyLessonContent(lessonCandidate);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const { language, chapterId, partId, reviewSentences, difficulty } = body || {};

  if (!language || !chapterId || !partId) {
    res.status(400).json({ error: "Missing language, chapterId, or partId" });
    return;
  }

  const part = getJourneyPart(String(chapterId), String(partId));
  if (!part) {
    res.status(404).json({ error: "Journey part not found" });
    return;
  }

  const reviewList = Array.isArray(reviewSentences)
    ? reviewSentences
        .filter(
          (item): item is { target: string; translation: string } =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof item.target === "string" &&
            typeof item.translation === "string"
        )
        .slice(-10)
    : [];
  const targetCount = getJourneyStepItemTarget(String(chapterId), String(partId));

  let lastReply = "";

  try {
    for (let attempt = 0; attempt < JOURNEY_MAX_ATTEMPTS; attempt += 1) {
      const reply = await callOpenAI(
        buildJourneyPrompt(String(language), String(difficulty || "easy"), String(chapterId), part, reviewList, targetCount, attempt),
        {
          model: OPENAI_HEAVY_MODEL,
          reasoningEffort: "low",
          verbosity: "low",
          maxCompletionTokens: 3200,
        }
      );
      lastReply = reply;

      const lesson = buildLessonFromReply(reply, String(chapterId), String(partId), part, targetCount);
      if (lesson) {
        res.json({ lesson });
        return;
      }
    }

    console.error("Invalid journey lesson payload:", lastReply);
    res.status(500).json({ error: "Journey lesson generation failed" });
  } catch (error) {
    console.error("Failed to generate journey part:", error);
    res.status(500).json({ error: "Failed to generate journey part" });
  }
}
