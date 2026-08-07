import { NextRequest } from "next/server";
import { callOpenAIStreaming } from "@/lib/openai";
import { scenarioGoalContext, scenarioSystemPrompt } from "@/lib/prompts";
import { FREE_CHAT, getScenario } from "@/content/scenarios";
import type { CefrLevel } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  scenarioId?: string;
  level?: CefrLevel;
  turns?: Array<{ role: "user" | "assistant"; content: string }>;
};

const MAX_TURNS = 24;

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const scenario = (body.scenarioId ? getScenario(body.scenarioId) : undefined) ?? FREE_CHAT;
  const level: CefrLevel = body.level ?? "A1";
  const turns = Array.isArray(body.turns) ? body.turns.slice(-MAX_TURNS) : [];

  const messages = [
    {
      role: "system",
      content: [{ type: "text", text: scenarioSystemPrompt(scenario, level) }],
    },
    {
      role: "system",
      content: [{ type: "text", text: scenarioGoalContext(scenario) }],
    },
    ...turns.map((turn) => ({
      role: turn.role,
      content: [{ type: "text", text: turn.content }],
    })),
  ];

  // No turns yet: ask the model to open the scene rather than waiting on the learner.
  if (turns.length === 0) {
    messages.push({
      role: "user",
      content: [{ type: "text", text: `[Start the scene] ${scenario.opener}` }],
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of callOpenAIStreaming(messages, {
          reasoningEffort: "low",
          verbosity: "low",
          maxCompletionTokens: 400,
          promptCacheKey: `neolingo-chat-${scenario.id}-${level}`,
        })) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        console.error("chat stream failed", err);
        controller.enqueue(encoder.encode("\n\n[Något gick fel. Försök igen.]"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
