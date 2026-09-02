import { NextRequest, NextResponse } from "next/server";
import type { Activity } from "@/types/activity";

const COOKIE_NAME = "today_what_outdoor_draft";
const MAX_ITEMS = 5;

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

function writeDraft(response: NextResponse, items: DraftActivity[]) {
  response.cookies.set(COOKIE_NAME, encodeURIComponent(JSON.stringify(items.slice(-MAX_ITEMS))), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function GET(request: NextRequest) {
  const items = parseDraft(request.cookies.get(COOKIE_NAME)?.value);
  return NextResponse.json({ success: true, count: items.length, items });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { activity?: DraftActivity };
  const activity = body.activity;
  if (!activity?.id || !activity.title) {
    return NextResponse.json({ success: false, message: "추가할 활동 정보가 없습니다." }, { status: 400 });
  }

  const existing = parseDraft(request.cookies.get(COOKIE_NAME)?.value);
  const withoutDuplicate = existing.filter((item) => item.id !== activity.id);
  const items = [...withoutDuplicate, activity].slice(-MAX_ITEMS);
  const response = NextResponse.json({ success: true, count: items.length, message: "일정 후보에 추가했습니다." });
  writeDraft(response, items);
  return response;
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const existing = parseDraft(request.cookies.get(COOKIE_NAME)?.value);
  const items = id ? existing.filter((item) => item.id !== id) : [];
  const response = NextResponse.json({ success: true, count: items.length });
  writeDraft(response, items);
  return response;
}
