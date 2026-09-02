import { deflateRawSync, inflateRawSync } from "node:zlib";
import type { FavoriteItem } from "@/types/favorite";

const PREFIX = "v1.";
const MAX_BYTES = 3800;
export const GUEST_FAVORITES_COOKIE = "today_what_favorites_guest";

export function favoriteCookieName(userId?: string | null) {
  return userId ? `today_what_favorites_${userId}` : GUEST_FAVORITES_COOKIE;
}

function clean(item: FavoriteItem): FavoriteItem {
  return {
    contentType: item.contentType.slice(0, 30),
    contentId: item.contentId.slice(0, 200),
    title: item.title.slice(0, 200),
    imageUrl: item.imageUrl?.slice(0, 500),
    source: item.source?.slice(0, 50),
    metadata: item.metadata ? Object.fromEntries(Object.entries(item.metadata).slice(0, 8)) : undefined,
  };
}

export function decodeFavorites(raw?: string): FavoriteItem[] {
  if (!raw?.startsWith(PREFIX)) return [];
  try {
    const json = inflateRawSync(Buffer.from(raw.slice(PREFIX.length), "base64url"), { maxOutputLength: 50_000 }).toString();
    const value = JSON.parse(json);
    return Array.isArray(value) ? value.filter((item) => item?.contentId && item?.title).map(clean) : [];
  } catch {
    return [];
  }
}

export function encodeFavorites(items: FavoriteItem[]) {
  const kept = items.map(clean).slice(-30);
  while (kept.length) {
    const encoded = PREFIX + deflateRawSync(Buffer.from(JSON.stringify(kept))).toString("base64url");
    if (Buffer.byteLength(encoded) <= MAX_BYTES) return { encoded, items: kept };
    kept.shift();
  }
  return { encoded: PREFIX + deflateRawSync(Buffer.from("[]")).toString("base64url"), items: [] as FavoriteItem[] };
}
