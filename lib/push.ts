import webpush from "web-push";
import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:hej@neolingo.app";

export const isPushConfigured = Boolean(url && token && VAPID_PUBLIC && VAPID_PRIVATE);

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

const redis = url && token ? new Redis({ url, token }) : null;

export type StoredSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  /** IANA zone, so the cron can work out the learner's local day. */
  timeZone: string;
  createdAt: number;
};

const SUBS_KEY = (profileId: string) => `neolingo:push:subs:${profileId}`;
/** Set of profile ids that have at least one subscription. */
const PROFILES_KEY = "neolingo:push:profiles";

export async function saveSubscription(profileId: string, sub: StoredSubscription): Promise<void> {
  if (!redis) return;
  const existing = await listSubscriptions(profileId);
  // Re-subscribing on the same device returns the same endpoint; replace rather
  // than accumulate, or the learner gets one notification per reinstall.
  const next = [...existing.filter((entry) => entry.endpoint !== sub.endpoint), sub];
  await redis.set(SUBS_KEY(profileId), next);
  await redis.sadd(PROFILES_KEY, profileId);
}

export async function listSubscriptions(profileId: string): Promise<StoredSubscription[]> {
  if (!redis) return [];
  const raw = await redis.get<StoredSubscription[]>(SUBS_KEY(profileId));
  return Array.isArray(raw) ? raw : [];
}

export async function removeSubscription(profileId: string, endpoint: string): Promise<void> {
  if (!redis) return;
  const next = (await listSubscriptions(profileId)).filter((entry) => entry.endpoint !== endpoint);
  if (next.length) {
    await redis.set(SUBS_KEY(profileId), next);
  } else {
    await redis.del(SUBS_KEY(profileId));
    await redis.srem(PROFILES_KEY, profileId);
  }
}

export async function listProfiles(): Promise<string[]> {
  if (!redis) return [];
  const raw = await redis.smembers(PROFILES_KEY);
  return Array.isArray(raw) ? raw.map(String) : [];
}

/** The learner's local calendar day, so "did you study today" means their today. */
export function localDayFor(timeZone: string, now = new Date()): string {
  try {
    // en-CA formats as YYYY-MM-DD, which matches the snapshot's day keys.
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  }
}

export function localHourFor(timeZone: string, now = new Date()): number {
  try {
    const hour = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hour12: false }).format(now);
    return Number(hour);
  } catch {
    return now.getHours();
  }
}

export type PushResult = { sent: number; removed: number };

export async function sendToProfile(
  profileId: string,
  payload: { title: string; body: string; url?: string; tag?: string },
): Promise<PushResult> {
  if (!isPushConfigured) return { sent: 0, removed: 0 };

  const subs = await listSubscriptions(profileId);
  let sent = 0;
  let removed = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify(payload),
        { TTL: 6 * 60 * 60 },
      );
      sent += 1;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      // 404/410 mean the browser threw the subscription away. Stop retrying it.
      if (statusCode === 404 || statusCode === 410) {
        await removeSubscription(profileId, sub.endpoint);
        removed += 1;
      } else {
        console.error("push failed", statusCode, err);
      }
    }
  }

  return { sent, removed };
}
