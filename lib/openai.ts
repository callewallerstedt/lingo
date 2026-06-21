export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
// Heavy reasoning model — used for big structuring tasks (e.g. building courses).
export const OPENAI_HEAVY_MODEL = process.env.OPENAI_HEAVY_MODEL || "gpt-5.5";
export const TRANSLATION_MODEL = process.env.OPENAI_TRANSLATION_MODEL || OPENAI_MODEL;
export const TTS_MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
export const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe";

type OpenAIMessages = Array<{ role: string; content: Array<{ type: string; text: string }> }>;

type OpenAIRequestOptions = {
  model?: string;
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
  verbosity?: "low" | "medium" | "high";
  maxCompletionTokens?: number;
  promptCacheKey?: string;
};

function isGpt5FamilyModel(model: string) {
  return /^gpt-5([.-]|$)/i.test(model);
}

function buildChatCompletionBody(messages: OpenAIMessages, options: OpenAIRequestOptions = {}) {
  const model = options.model || OPENAI_MODEL;
  const body: Record<string, unknown> = {
    model,
    messages,
  };

  if (typeof options.maxCompletionTokens === "number") {
    body.max_completion_tokens = options.maxCompletionTokens;
  }

  if (options.promptCacheKey) {
    body.prompt_cache_key = options.promptCacheKey;
  }

  if (isGpt5FamilyModel(model)) {
    body.reasoning_effort = options.reasoningEffort || "low";
    if (options.verbosity) {
      body.verbosity = options.verbosity;
    }
  }

  return body;
}

export async function callOpenAI(messages: OpenAIMessages, options: OpenAIRequestOptions = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(buildChatCompletionBody(messages, options)),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const output = data.choices?.[0]?.message?.content || "";
  return output.trim();
}

export async function callOpenAIForTranslation(messages: OpenAIMessages) {
  return callOpenAI(messages, {
    model: TRANSLATION_MODEL,
    reasoningEffort: "none",
    verbosity: "low",
    maxCompletionTokens: 24,
  });
}

export async function* callOpenAIStreaming(messages: OpenAIMessages, options: OpenAIRequestOptions = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      ...buildChatCompletionBody(messages, options),
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${text}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function callOpenAITTS({
  input,
  voice = "alloy",
  instructions,
  speed,
}: {
  input: string;
  voice?: string;
  instructions?: string;
  speed?: number;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      voice,
      input,
      instructions,
      ...(typeof speed === "number" ? { speed } : {}),
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI TTS error: ${response.status} ${text}`);
  }

  return response.arrayBuffer();
}

export async function callOpenAITranscription({
  audioBuffer,
  mimeType,
  language,
  prompt,
}: {
  audioBuffer: Buffer;
  mimeType?: string;
  language?: string;
  prompt?: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const formData = new FormData();
  const normalizedMimeType = (mimeType || "audio/webm").split(";")[0].trim().toLowerCase();
  const extension =
    normalizedMimeType === "audio/mp4" || normalizedMimeType === "audio/m4a" || normalizedMimeType === "audio/x-m4a"
      ? "m4a"
      : normalizedMimeType === "audio/ogg"
        ? "ogg"
        : normalizedMimeType === "audio/wav" || normalizedMimeType === "audio/x-wav"
          ? "wav"
          : normalizedMimeType === "audio/mpeg" || normalizedMimeType === "audio/mp3"
            ? "mp3"
          : "webm";
  const blob = new Blob([audioBuffer], {
    type: normalizedMimeType || "audio/webm",
  });

  formData.append("file", blob, `recording.${extension}`);
  formData.append("model", TRANSCRIBE_MODEL);
  formData.append("response_format", "json");
  if (language) {
    formData.append("language", language);
  }
  if (prompt) {
    formData.append("prompt", prompt);
  }

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI transcription error: ${response.status} ${text}`);
  }

  const data = await response.json() as { text?: string };
  return (data.text || "").trim();
}
