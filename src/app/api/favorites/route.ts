import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decodeFavorites, encodeFavorites, favoriteCookieName } from "@/lib/favorite/favoriteCookie";
import type { FavoriteItem } from "@/types/favorite";

async function context(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const cookieName = favoriteCookieName(user?.id);
  return { supabase, user, cookieName, cookieItems: decodeFavorites(request.cookies.get(cookieName)?.value) };
}

function options() {
  return { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 };
}

function writeCookie(response: NextResponse, cookieName: string, items: FavoriteItem[]) {
  const result = encodeFavorites(items);
  response.cookies.set(cookieName, result.encoded, options());
  return result.items;
}

export async function GET(request: NextRequest) {
  const { supabase, user, cookieItems } = await context(request);
  let databaseItems: FavoriteItem[] = [];
  if (supabase && user) {
    const { data } = await supabase.from("favorites").select("content_type,content_id,title,image_url,source,metadata").eq("user_id", user.id).order("created_at", { ascending: false });
    databaseItems = (data ?? []).map((item) => ({ contentType: item.content_type, contentId: item.content_id, title: item.title, imageUrl: item.image_url ?? undefined, source: item.source ?? undefined, metadata: item.metadata ?? undefined }));
  }
  const merged = [...databaseItems, ...cookieItems].filter((item, index, all) => all.findIndex((value) => value.contentType === item.contentType && value.contentId === item.contentId) === index);
  return NextResponse.json({ success: true, items: merged, count: merged.length, persisted: databaseItems.length > 0 });
}

export async function POST(request: NextRequest) {
  let item: FavoriteItem | undefined;
  try { item = ((await request.json()) as { item?: FavoriteItem }).item; } catch { return NextResponse.json({ success: false, message: "올바른 요청이 아닙니다." }, { status: 400 }); }
  if (!item?.contentType || !item.contentId || !item.title) return NextResponse.json({ success: false, message: "찜할 콘텐츠 정보가 없습니다." }, { status: 400 });
  const { supabase, user, cookieName, cookieItems } = await context(request);
  let savedToDatabase = false;
  if (supabase && user) {
    const { error } = await supabase.from("favorites").upsert({ user_id: user.id, content_type: item.contentType, content_id: item.contentId, title: item.title.slice(0, 200), image_url: item.imageUrl ?? null, source: item.source ?? null, metadata: item.metadata ?? {} }, { onConflict: "user_id,content_type,content_id" });
    savedToDatabase = !error;
  }
  const next = [...cookieItems.filter((value) => value.contentType !== item!.contentType || value.contentId !== item!.contentId), item];
  const response = NextResponse.json({ success: true, items: next, count: next.length, persisted: savedToDatabase });
  writeCookie(response, cookieName, next);
  return response;
}

export async function DELETE(request: NextRequest) {
  const contentType = request.nextUrl.searchParams.get("contentType") ?? "";
  const contentId = request.nextUrl.searchParams.get("contentId") ?? "";
  const { supabase, user, cookieName, cookieItems } = await context(request);
  if (supabase && user) await supabase.from("favorites").delete().eq("user_id", user.id).eq("content_type", contentType).eq("content_id", contentId);
  const next = cookieItems.filter((item) => item.contentType !== contentType || item.contentId !== contentId);
  const response = NextResponse.json({ success: true, items: next, count: next.length });
  writeCookie(response, cookieName, next);
  return response;
}
