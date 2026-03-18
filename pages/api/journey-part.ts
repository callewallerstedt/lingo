import type { NextApiRequest, NextApiResponse } from "next";
import { callOpenAI } from "../../lib/openai";
import {
  getJourneyPart,
  type JourneyBuildItem,
  type JourneyChangeItem,
  type JourneyLessonContent,
  type JourneySentenceItem,
  type JourneyUseItem,
} from "../../lib/journey";

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
  useItem?: RawUseItem;
  use?: RawUseItem;
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
  const target = targetSource.trim();
  const translation = translationSource.trim();
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

  const cue = cueSource.trim();
  const template = templateSource.trim();
  const answer = answerSource.trim();
  const translation = translationSource.trim();
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
      ? item.options.filter((option): option is string => typeof option === "string" && option.trim()).slice(0, 4)
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

  const cue = cueSource.trim();
  const answer = answerSource.trim();
  const translation = translationSource.trim();
  if (!cue || !answer || !translation) {
    return null;
  }
  return {
    id: typeof item?.id === "string" && item.id.trim() ? item.id.trim() : `build-${index + 1}`,
    cue,
    answer,
    translation,
    support: supportSource.trim() || undefined,
  };
}

function toUseItem(item: RawUseItem | null | undefined): JourneyUseItem | null {
  const situation = typeof item?.situation === "string" ? item.situation.trim() : "";
  const prompt = typeof item?.prompt === "string" ? item.prompt.trim() : "";
  const answer =
    typeof item?.answer === "string"
      ? item.answer.trim()
      : typeof item?.target === "string"
        ? item.target.trim()
        : "";
  const translation =
    typeof item?.translation === "string"
      ? item.translation.trim()
      : typeof item?.english === "string"
        ? item.english.trim()
        : "";
  const support =
    typeof item?.support === "string"
      ? item.support.trim()
      : typeof item?.hint === "string"
        ? item.hint.trim()
        : "";

  if (!situation || !prompt || !answer || !translation) {
    return null;
  }

  return {
    situation,
    prompt,
    answer,
    translation,
    support: support || undefined,
  };
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

  const prompt = [
    {
      role: "system",
      content: [
        {
          type: "text" as const,
          text: [
            "You create compact, highly practical language-learning lesson JSON.",
            "The learner is a beginner and needs full sentences, not isolated vocabulary lists.",
            "Return JSON only.",
            "Every target-language sentence must be short, natural, and actually useful in daily life.",
            "Keep the grammar tightly focused on the part goal.",
            "Use natural English translations only for the translation fields.",
            "Repeat items must reuse the same sentence patterns from read items so the learner repeats exact material.",
            "Change items must be fill-in-the-blank sentences using ___ in the target-language template.",
            "Build items must ask the learner to make a full target-language sentence from a small English cue.",
            "The use item must be a tiny real-life situation with one strong target-language answer.",
            "If previous review sentences are provided, weave one old pattern into the lesson naturally.",
            "Keep everything concise.",
            "Output exactly this shape:",
            "{\"summary\":\"...\",\"grammarFocus\":\"...\",\"carryForwardNote\":\"...\",\"readItems\":[{\"target\":\"...\",\"translation\":\"...\"}],\"repeatItems\":[{\"target\":\"...\",\"translation\":\"...\"}],\"changeItems\":[{\"cue\":\"...\",\"template\":\"... ___ ...\",\"answer\":\"...\",\"translation\":\"...\",\"options\":[\"...\",\"...\"]}],\"buildItems\":[{\"cue\":\"...\",\"answer\":\"...\",\"translation\":\"...\",\"support\":\"...\"}],\"useItem\":{\"situation\":\"...\",\"prompt\":\"...\",\"answer\":\"...\",\"translation\":\"...\",\"support\":\"...\"}}",
          ].join(" "),
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
              ? `Previous sentences to recycle softly:\n${reviewList
                  .map((item) => `- ${item.target} = ${item.translation}`)
                  .join("\n")}`
              : "Previous sentences to recycle softly: none",
            "Requirements:",
            "- 4 readItems",
            "- 3 repeatItems",
            "- 3 changeItems",
            "- 3 buildItems",
            "- 1 useItem",
            "- All target-language text must stay beginner-friendly and short",
            "- Prefer sentence frames the learner can reuse immediately",
            "- Make the lesson feel cumulative and practical",
          ].join("\n\n"),
        },
      ],
    },
  ];

  try {
    const reply = await callOpenAI(prompt);
    const parsed = safeJsonParse<RawJourneyLesson>(reply);
    const readItems = (parsed?.readItems || parsed?.read || []).map(toSentenceItem).filter(Boolean) as JourneySentenceItem[];
    const repeatItems = (parsed?.repeatItems || parsed?.repeat || []).map(toSentenceItem).filter(Boolean) as JourneySentenceItem[];
    const changeItems = (parsed?.changeItems || parsed?.change || []).map(toChangeItem).filter(Boolean) as JourneyChangeItem[];
    const buildItems = (parsed?.buildItems || parsed?.build || []).map(toBuildItem).filter(Boolean) as JourneyBuildItem[];
    const useItem = toUseItem(parsed?.useItem || parsed?.use);

    if (
      readItems.length < 3 ||
      repeatItems.length < 2 ||
      changeItems.length < 2 ||
      buildItems.length < 2 ||
      !useItem
    ) {
      console.error("Invalid journey lesson payload:", reply);
      res.status(500).json({ error: "Journey lesson generation failed" });
      return;
    }

    const lesson: JourneyLessonContent = {
      chapterId: String(chapterId),
      partId: String(partId),
      summary:
        typeof parsed?.summary === "string" && parsed.summary.trim()
          ? parsed.summary.trim()
          : part.summary,
      grammarFocus:
        typeof parsed?.grammarFocus === "string" && parsed.grammarFocus.trim()
          ? parsed.grammarFocus.trim()
          : typeof parsed?.grammar_focus === "string" && parsed.grammar_focus.trim()
            ? parsed.grammar_focus.trim()
            : part.focus,
      carryForwardNote:
        typeof parsed?.carryForwardNote === "string" && parsed.carryForwardNote.trim()
          ? parsed.carryForwardNote.trim()
          : typeof parsed?.carry_forward_note === "string" && parsed.carry_forward_note.trim()
            ? parsed.carry_forward_note.trim()
            : undefined,
      readItems: readItems.slice(0, 4).map((item, index) => ({ ...item, id: `read-${index + 1}` })),
      repeatItems: repeatItems.slice(0, 3).map((item, index) => ({ ...item, id: `repeat-${index + 1}` })),
      changeItems: changeItems.slice(0, 3).map((item, index) => ({ ...item, id: `change-${index + 1}` })),
      buildItems: buildItems.slice(0, 3).map((item, index) => ({ ...item, id: `build-${index + 1}` })),
      useItem,
    };

    res.json({ lesson });
  } catch (error) {
    console.error("Failed to generate journey part:", error);
    res.status(500).json({ error: "Failed to generate journey part" });
  }
}
