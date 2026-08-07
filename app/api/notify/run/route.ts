import { NextRequest, NextResponse } from "next/server";
import { loadSnapshot } from "@/lib/db";
import { hydrateProgress } from "@/lib/progress";
import { isPushConfigured, listProfiles, listSubscriptions, localDayFor, localHourFor, sendToProfile } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Nag loop. Runs several times a day and pushes a reminder only to learners who
 * haven't finished a lesson on their own local calendar day. Once a lesson is
 * done, the rest of the day's slots go quiet.
 *
 * Triggered by Vercel Cron (see vercel.json) or any external scheduler that can
 * send the CRON_SECRET header.
 */

/** Escalating nudges through the day. Slot is picked from the learner's local hour. */
const NUDGES = [
  {
    untilHour: 11,
    title: "God morgon, Tiffy! ☀️",
    body: "Fem Minuten Schwedisch vor dem Kaffee? Deine Streak wartet.",
  },
  {
    untilHour: 15,
    title: "Dags att plugga 📚",
    body: "Eine Lektion dauert nur ein paar Minuten. Du schaffst das!",
  },
  {
    untilHour: 19,
    title: "Hinner du en lektion? ⏰",
    body: "Noch keine Lektion heute. Kurz reinschauen?",
  },
  {
    untilHour: 24,
    title: "Sista chansen idag! 🔥",
    body: "Deine Streak endet um Mitternacht. Eine Lektion reicht.",
  },
];

function nudgeForHour(hour: number) {
  return NUDGES.find((nudge) => hour < nudge.untilHour) ?? NUDGES[NUDGES.length - 1];
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return true;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${secret}` || req.headers.get("x-cron-secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isPushConfigured) {
    return NextResponse.json({ error: "push not configured" }, { status: 503 });
  }

  const profiles = await listProfiles();
  const report: Array<{ profile: string; action: string; sent?: number }> = [];

  for (const profileId of profiles) {
    const subs = await listSubscriptions(profileId);
    if (!subs.length) {
      report.push({ profile: profileId, action: "no-subscriptions" });
      continue;
    }

    // All of a learner's devices share a timezone in practice; use the newest.
    const timeZone = subs[subs.length - 1].timeZone || "Europe/Stockholm";
    const hour = localHourFor(timeZone);

    // Don't wake anyone up.
    if (hour < 8 || hour >= 22) {
      report.push({ profile: profileId, action: "quiet-hours" });
      continue;
    }

    const snapshot = await loadSnapshot(profileId);
    const progress = snapshot ? hydrateProgress(snapshot.data) : null;
    const today = localDayFor(timeZone);
    const doneToday = Boolean(progress?.days?.[today]?.lessons);

    if (doneToday) {
      report.push({ profile: profileId, action: "already-studied" });
      continue;
    }

    const nudge = nudgeForHour(hour);
    const result = await sendToProfile(profileId, {
      title: nudge.title,
      body: nudge.body,
      url: "/?tab=course",
      // One tag means a new nudge replaces the old one instead of stacking up.
      tag: "neolingo-daily",
    });

    report.push({ profile: profileId, action: "nudged", sent: result.sent });
  }

  return NextResponse.json({ ok: true, checked: profiles.length, report });
}
