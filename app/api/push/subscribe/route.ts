import { NextRequest, NextResponse } from "next/server";
import { normalizeProfileId } from "@/lib/db";
import { isPushConfigured, removeSubscription, saveSubscription } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    configured: isPushConfigured,
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  });
}

export async function POST(req: NextRequest) {
  if (!isPushConfigured) {
    return NextResponse.json({ error: "push not configured" }, { status: 503 });
  }

  let body: {
    profile?: string;
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    timeZone?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const profileId = normalizeProfileId(body.profile);
  const endpoint = body.subscription?.endpoint;
  const p256dh = body.subscription?.keys?.p256dh;
  const auth = body.subscription?.keys?.auth;

  if (!profileId || !endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  }

  await saveSubscription(profileId, {
    endpoint,
    keys: { p256dh, auth },
    timeZone: typeof body.timeZone === "string" && body.timeZone ? body.timeZone : "Europe/Stockholm",
    createdAt: Date.now(),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  let body: { profile?: string; endpoint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const profileId = normalizeProfileId(body.profile);
  if (!profileId || !body.endpoint) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  await removeSubscription(profileId, body.endpoint);
  return NextResponse.json({ ok: true });
}
