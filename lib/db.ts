import { Redis } from "@upstash/redis";

/**
 * Storage is deliberately minimal: one Redis key per profile holding a single
 * JSON snapshot of that learner's progress. The browser is the source of truth
 * during a session (everything lives in localStorage); we only talk to Redis on
 * app open and on a debounced flush. That keeps us to a handful of commands per
 * session instead of one per answered card.
 */

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

export const isCloudConfigured = Boolean(url && token);

const redis = isCloudConfigured ? new Redis({ url, token }) : null;

const KEY_PREFIX = "neolingo:v2:";
/** Snapshots expire after two years of total inactivity. */
const TTL_SECONDS = 60 * 60 * 24 * 730;

export type Snapshot = {
  /** Millisecond timestamp of the last local mutation. Drives last-write-wins. */
  updatedAt: number;
  /** Opaque progress blob owned by the client. */
  data: Record<string, unknown>;
};

function keyFor(profileId: string) {
  return `${KEY_PREFIX}${profileId}`;
}

/**
 * Profile ids come from the URL/localStorage, so keep them boring: lowercase
 * alphanumerics and dashes, bounded length.
 */
export function normalizeProfileId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (cleaned.length < 2 || cleaned.length > 48) return null;
  return cleaned;
}

export async function loadSnapshot(profileId: string): Promise<Snapshot | null> {
  if (!redis) return null;
  const raw = await redis.get<Snapshot>(keyFor(profileId));
  if (!raw || typeof raw !== "object") return null;
  const updatedAt = typeof raw.updatedAt === "number" ? raw.updatedAt : 0;
  const data = raw.data && typeof raw.data === "object" ? raw.data : {};
  return { updatedAt, data: data as Record<string, unknown> };
}

export async function saveSnapshot(profileId: string, snapshot: Snapshot): Promise<void> {
  if (!redis) return;
  await redis.set(keyFor(profileId), snapshot, { ex: TTL_SECONDS });
}
