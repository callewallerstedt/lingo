import { xai } from "@ai-sdk/xai";
import { TALKING_MODEL } from "@/lib/talking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mint a short-lived xAI ephemeral token for the browser WebSocket.
 * Uses XAI_API_KEY on the server — never sent to the client.
 */
export async function POST() {
  if (!process.env.XAI_API_KEY) {
    return Response.json({ error: "Missing XAI_API_KEY" }, { status: 500 });
  }

  try {
    const { token, url, expiresAt } = await xai.experimental_realtime.getToken({
      model: TALKING_MODEL,
      expiresAfterSeconds: 300,
    });

    return Response.json({
      token,
      url,
      ...(expiresAt != null ? { expiresAt } : {}),
      tools: [],
    });
  } catch (err) {
    console.error("talking token failed", err);
    return Response.json({ error: "token failed" }, { status: 502 });
  }
}
