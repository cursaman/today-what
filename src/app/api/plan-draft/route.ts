import { NextRequest, NextResponse } from "next/server";
import type { Activity } from "@/types/activity";
import { createClient } from "@/lib/supabase/server";
import {
  GUEST_PLAN_DRAFT_COOKIE_NAME,
  LEGACY_PLAN_DRAFT_COOKIE_NAME,
  getPlanDraftCookieName,
} from "@/lib/plan/draftCookie";

const MAX_ITEMS = 10;

type DraftActivity = Pick<
  Activity,
  | "id"
  | "type"
  | "title"
  | "description"
  | "durationMinutes"
  | "fixedTime"
  | "indoor"
  | "cost"
  | "location"
  | "coordinates"
  | "interests"
  | "source"
  | "metadata"
>;

function parseDraft(raw?: string): DraftActivity[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function currentCookieName() {
  const supabase = await createClient();
  if (!supabase) return GUEST_PLAN_DRAFT_COOKIE_NAME;
  const { data: { user } } = await supabase.auth.getUser();
  return getPlanDraftCookieName(user?.id);
}

function cookieOptions(maxAge = 60 * 60 * 24) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function writeDraft(response: NextResponse, cookieName: string, items: DraftActivity[]) {
  response.cookies.set(cookieName, encodeURIComponent(JSON.stringify(items.slice(-MAX_ITEMS))), cookieOptions());
  // 구버전에서 사용하던 브라우저 공용 쿠키는 더 이상 사용하지 않습니다.
  response.cookies.set(LEGACY_PLAN_DRAFT_COOKIE_NAME, "", cookieOptions(0));
}

export async function GET(request: NextRequest) {
  const cookieName = await currentCookieName();
  const items = parseDraft(request.cookies.get(cookieName)?.value);
  return NextResponse.json({ success: true, count: items.length, items, maxItems: MAX_ITEMS });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { activity?: DraftActivity };
  const activity = body.activity;
  if (!activity?.id || !activity.title) {
    return NextResponse.json({ success: false, message: "추가할 활동 정보가 없습니다." }, { status: 400 });
  }

  const cookieName = await currentCookieName();
  const existing = parseDraft(request.cookies.get(cookieName)?.value);
  const withoutDuplicate = existing.filter((item) => item.id !== activity.id);
  const items = [...withoutDuplicate, activity].slice(-MAX_ITEMS);
  const response = NextResponse.json({
    success: true,
    count: items.length,
    items,
    maxItems: MAX_ITEMS,
    message: `일정 후보에 추가했습니다. 현재 ${items.length}개가 선택되어 있습니다.`,
  });
  writeDraft(response, cookieName, items);
  return response;
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const scope = request.nextUrl.searchParams.get("scope");
  const cookieName = await currentCookieName();

  if (scope === "all") {
    const response = NextResponse.json({ success: true, count: 0, items: [], maxItems: MAX_ITEMS, message: "일정 후보를 모두 비웠습니다." });
    response.cookies.set(cookieName, "", cookieOptions(0));
    response.cookies.set(GUEST_PLAN_DRAFT_COOKIE_NAME, "", cookieOptions(0));
    response.cookies.set(LEGACY_PLAN_DRAFT_COOKIE_NAME, "", cookieOptions(0));
    return response;
  }

  const existing = parseDraft(request.cookies.get(cookieName)?.value);
  const items = id ? existing.filter((item) => item.id !== id) : [];
  const response = NextResponse.json({ success: true, count: items.length, items, maxItems: MAX_ITEMS });
  writeDraft(response, cookieName, items);
  return response;
}
