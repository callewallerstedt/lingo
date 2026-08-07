import { NextRequest, NextResponse } from "next/server";
import { isCloudConfigured, loadSnapshot, normalizeProfileId, saveSnapshot } from "@/lib/db";
import { mergeProgress } from "@/lib/merge";
import { hydrateProgress } from "@/lib/progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Optional shared passphrase. It isn't real auth — it just stops a stranger who
 * guesses the profile name from reading or trashing the snapshot.
 */
function authorized(req: NextRequest) {
  const secret = process.env.SYNC_SECRET || "";
  if (!secret) return true;
  return req.headers.get("x-sync-secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!isCloudConfigured) {
    return NextResponse.json({ cloud: false, snapshot: null });
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profileId = normalizeProfileId(req.nextUrl.searchParams.get("profile"));
  if (!profileId) {
    return NextResponse.json({ error: "bad profile" }, { status: 400 });
  }

  try {
    const snapshot = await loadSnapshot(profileId);
    return NextResponse.json({ cloud: true, snapshot: snapshot?.data ?? null });
  } catch (err) {
    console.error("sync GET failed", err);
    return NextResponse.json({ cloud: true, snapshot: null, error: "read failed" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  if (!isCloudConfigured) {
    return NextResponse.json({ cloud: false, snapshot: null });
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { profile?: string; snapshot?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const profileId = normalizeProfileId(body.profile);
  if (!profileId || !body.snapshot) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const incoming = hydrateProgress(body.snapshot);

  try {
    // Read-merge-write rather than blind overwrite, so a session finished on the
    // phone isn't erased by a stale tab on the laptop flushing afterwards.
    const existing = await loadSnapshot(profileId);
    const merged = existing ? mergeProgress(hydrateProgress(existing.data), incoming) : incoming;
    await saveSnapshot(profileId, { updatedAt: merged.updatedAt, data: merged as unknown as Record<string, unknown> });
    return NextResponse.json({ cloud: true, snapshot: merged });
  } catch (err) {
    console.error("sync POST failed", err);
    return NextResponse.json({ cloud: true, snapshot: null, error: "write failed" }, { status: 502 });
  }
}
