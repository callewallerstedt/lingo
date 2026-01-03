import type { NextApiRequest, NextApiResponse } from "next";
import { checkRateLimit, getSession, saveSessions } from "../../lib/store";

function getIp(req: NextApiRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded;
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket.remoteAddress || "unknown";
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const { sessionId, scenarioPreset, scenarioCustom } = body || {};
  const session = getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const ip = getIp(req);
  if (!checkRateLimit(ip, sessionId)) {
    res.status(429).json({ error: "Rate limited" });
    return;
  }

  if (typeof scenarioPreset === "string") {
    session.scenarioPreset = scenarioPreset;
  }
  if (typeof scenarioCustom === "string") {
    session.scenarioCustom = scenarioCustom;
  }

  saveSessions();
  res.json({ ok: true });
}
