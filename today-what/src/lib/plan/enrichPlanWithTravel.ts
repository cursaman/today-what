import type { DailyPlan, PlanStyle } from "@/types/plan";
import type { UserLocation } from "@/types/location";
import { getTravelInfo } from "@/lib/transport/getTravelInfo";

const MAX_TRAVEL: Record<PlanStyle, number> = { outdoor: 60, balanced: 40, relaxed: 25 };

export async function enrichPlanWithTravel(plan: DailyPlan, style: PlanStyle, startLocation: UserLocation): Promise<DailyPlan> {
  let previous = { latitude: startLocation.latitude, longitude: startLocation.longitude };
  let totalDistanceKm = 0;
  let totalTravelMinutes = 0;

  const items = [];
  for (const item of plan.items) {
    const coordinates = item.activity.coordinates;
    if (!coordinates || item.activity.location === "집") {
      items.push({ ...item, travelFromPreviousMinutes: 0, distanceFromPreviousKm: 0, transportMode: "estimate" as const });
      continue;
    }

    const route = await getTravelInfo(previous, coordinates);
    // 스타일별 이동 허용 범위가 너무 크면 해당 가변활동은 건너뜁니다. 고정시간 활동은 유지합니다.
    if (!item.fixedTime && route.durationMinutes > MAX_TRAVEL[style]) continue;

    totalDistanceKm += route.distanceKm;
    totalTravelMinutes += route.durationMinutes;
    items.push({
      ...item,
      travelFromPreviousMinutes: route.durationMinutes,
      distanceFromPreviousKm: route.distanceKm,
      transportMode: route.mode,
    });
    previous = coordinates;
  }

  return { ...plan, items, totalDistanceKm, totalTravelMinutes };
}
