import { deflateRawSync, inflateRawSync } from "node:zlib";
import type { Activity } from "@/types/activity";

const VERSION = "v1.";
const MAX_COOKIE_BYTES = 3800;
const MAX_DECOMPRESSED_BYTES = 32_000;

type CompactActivity = [
  string, Activity["type"], string, number, boolean, boolean, number,
  string?, number?, number?, string[]?, string?, string?, Record<string, unknown>?
];

function compactMetadata(metadata: Record<string, unknown> | undefined) {
  if (!metadata) return undefined;
  const allowed = ["manuallySelected", "providers", "homeTeam", "awayTeam", "contentTypeLabel", "golfType", "reservationRequired", "reservationStatus", "arrivalBufferMinutes"];
  return Object.fromEntries(allowed.filter((key) => key in metadata).map((key) => [key, metadata[key]]));
}

function compact(activity: Activity): CompactActivity {
  return [
    activity.id, activity.type, activity.title, activity.durationMinutes,
    activity.fixedTime, activity.indoor, activity.cost, activity.location,
    activity.coordinates?.latitude, activity.coordinates?.longitude,
    activity.interests.slice(0, 8), activity.source, activity.startAt,
    compactMetadata(activity.metadata),
  ];
}

function expand(value: CompactActivity): Activity | null {
  const [id, type, title, durationMinutes, fixedTime, indoor, cost, location, latitude, longitude, interests, source, startAt, metadata] = value;
  if (!id || !title || !["tour", "movie", "sport", "ott", "activity"].includes(type)) return null;
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > 1440) return null;
  if (!Number.isFinite(cost) || cost < 0 || cost > 100_000_000) return null;
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  return {
    id: id.slice(0, 200), type, title: title.slice(0, 200), durationMinutes,
    fixedTime: Boolean(fixedTime), indoor: Boolean(indoor), cost,
    location: location?.slice(0, 200),
    coordinates: hasCoordinates ? { latitude: latitude!, longitude: longitude! } : undefined,
    interests: Array.isArray(interests) ? interests.filter((item): item is string => typeof item === "string").slice(0, 8) : [],
    source: typeof source === "string" ? source.slice(0, 100) : "draft",
    startAt: typeof startAt === "string" ? startAt : undefined,
    metadata: { ...(metadata ?? {}), manuallySelected: true },
  };
}

function encode(items: Activity[]) {
  const compressed = deflateRawSync(Buffer.from(JSON.stringify(items.map(compact))));
  return `${VERSION}${compressed.toString("base64url")}`;
}

export function encodePlanDraft(items: Activity[]) {
  const kept = items.slice(-10);
  while (kept.length) {
    const encoded = encode(kept);
    if (Buffer.byteLength(encoded) <= MAX_COOKIE_BYTES) return { encoded, items: kept };
    kept.shift();
  }
  return { encoded: encode([]), items: [] as Activity[] };
}

export function decodePlanDraft(raw?: string): Activity[] {
  if (!raw) return [];
  try {
    if (raw.startsWith(VERSION)) {
      const json = inflateRawSync(Buffer.from(raw.slice(VERSION.length), "base64url"), { maxOutputLength: MAX_DECOMPRESSED_BYTES }).toString();
      const values = JSON.parse(json);
      return Array.isArray(values) ? values.map(expand).filter((item): item is Activity => item !== null) : [];
    }
    const legacy = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(legacy) ? legacy.map((item) => expand(compact(item as Activity))).filter((item): item is Activity => item !== null) : [];
  } catch {
    return [];
  }
}
