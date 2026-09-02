import { NextRequest, NextResponse } from "next/server";
import { enrichPlanWithTravel } from "@/lib/plan/enrichPlanWithTravel";
import type { DailyPlan, PlanStyle } from "@/types/plan";
import type { UserLocation } from "@/types/location";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { plan?: DailyPlan; style?: PlanStyle; startLocation?: UserLocation };
  if (!body.plan || !body.style || !body.startLocation) {
    return NextResponse.json({ message: "일정 재계산 정보가 부족합니다." }, { status: 400 });
  }
  const plan = await enrichPlanWithTravel(body.plan, body.style, body.startLocation);
  return NextResponse.json({ success: true, plan });
}
