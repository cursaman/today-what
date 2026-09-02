import { NextRequest, NextResponse } from "next/server";
import { enrichPlanWithTravel } from "@/lib/plan/enrichPlanWithTravel";
import type { DailyPlan, PlanStyle } from "@/types/plan";
import type { UserLocation } from "@/types/location";
import { isDailyPlan, isPlanStyle, isUserLocation } from "@/lib/plan/validatePlan";

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 100_000) return NextResponse.json({ message: "요청이 너무 큽니다." }, { status: 413 });
  let body: {
    plan?: DailyPlan;
    style?: PlanStyle;
    startLocation?: UserLocation;
    preferredTransportMode?: "car" | "transit" | "walk";
  };
  try { body = await request.json(); }
  catch { return NextResponse.json({ message: "올바른 JSON 요청이 아닙니다." }, { status: 400 }); }
  if (!isDailyPlan(body.plan) || !isPlanStyle(body.style) || !isUserLocation(body.startLocation)) {
    return NextResponse.json({ message: "일정 재계산 정보가 부족합니다." }, { status: 400 });
  }
  const plan = await enrichPlanWithTravel(body.plan, body.style, body.startLocation, body.preferredTransportMode ?? "car");
  return NextResponse.json({ success: true, plan });
}
