import { NextRequest, NextResponse } from "next/server";
import { createTravelAwarePlan } from "@/lib/plan/createTravelAwarePlan";
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
    budget?: number;
  };
  try { body = await request.json(); }
  catch { return NextResponse.json({ message: "올바른 JSON 요청이 아닙니다." }, { status: 400 }); }
  if (!isDailyPlan(body.plan) || !isPlanStyle(body.style) || !isUserLocation(body.startLocation)) {
    return NextResponse.json({ message: "일정 재계산 정보가 부족합니다." }, { status: 400 });
  }
  if (body.budget !== undefined && (!Number.isFinite(body.budget) || body.budget < 0)) {
    return NextResponse.json({ message: "예산 정보가 올바르지 않습니다." }, { status: 400 });
  }
  const activities = body.plan.items.map((item) => ({
    ...item.activity,
    metadata: { ...item.activity.metadata, manuallySelected: true },
  }));
  const result = await createTravelAwarePlan(
    activities,
    body.plan.startTime,
    body.plan.endTime,
    body.budget ?? Math.max(body.plan.totalCost, activities.reduce((sum, activity) => sum + activity.cost, 0)),
    body.style,
    body.startLocation,
    body.preferredTransportMode ?? "car",
  );
  return NextResponse.json({ success: true, plan: result.plan, draftFailures: result.draftFailures });
}
