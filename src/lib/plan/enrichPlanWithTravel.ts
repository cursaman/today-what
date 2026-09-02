import type { DailyPlan, PlanItem, PlanStyle } from "@/types/plan";
import type { UserLocation } from "@/types/location";
import type { Coordinates } from "@/types/activity";
import { getTravelInfo } from "@/lib/transport/getTravelInfo";
import { minutesToTime, timeToMinutes } from "./timeUtils";

const MAX_TRAVEL: Record<PlanStyle, number> = { outdoor: 60, balanced: 40, relaxed: 25 };
const ARRIVAL_BUFFER_MINUTES = 10;

function isHome(item: PlanItem) {
  return item.activity.location === "집" || item.activity.type === "ott";
}

function isManuallySelected(item: PlanItem) {
  return item.activity.metadata?.manuallySelected === true;
}

async function routeBetween(from: Coordinates, item: PlanItem) {
  if (isHome(item) || !item.activity.coordinates) {
    return { distanceKm: 0, durationMinutes: 0, mode: "estimate" as const, source: "home-or-unknown" };
  }
  return getTravelInfo(from, item.activity.coordinates);
}

export async function enrichPlanWithTravel(
  plan: DailyPlan,
  style: PlanStyle,
  startLocation: UserLocation,
  preferredTransportMode: "car" | "transit" | "walk" = "car"
): Promise<DailyPlan> {
  let previousCoordinates: Coordinates = {
    latitude: startLocation.latitude,
    longitude: startLocation.longitude,
  };
  let cursor = timeToMinutes(plan.startTime);
  let totalDistanceKm = 0;
  let totalTravelMinutes = 0;
  const items: PlanItem[] = [];

  const sorted = [...plan.items].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  for (let index = 0; index < sorted.length; index += 1) {
    const item = sorted[index];
    const route = await routeBetween(previousCoordinates, item);

    const transportFactor = preferredTransportMode === "walk" ? 0.65 : preferredTransportMode === "transit" ? 0.85 : 1;
    // 자동 추천은 스타일별 이동 한도를 적용하지만, 직접 선택한 후보는
    // 사용자의 의사를 우선하여 이동이 길다는 이유만으로 제거하지 않습니다.
    if (!item.fixedTime && !isManuallySelected(item) && route.durationMinutes > MAX_TRAVEL[style] * transportFactor) continue;

    const earliestArrival = cursor + route.durationMinutes;

    if (item.fixedTime) {
      const fixedStart = timeToMinutes(item.startTime);
      // 고정시간 활동은 우선하지만 현재 위치에서 제시간 도착 자체가 불가능하면 제외합니다.
      if (earliestArrival + ARRIVAL_BUFFER_MINUTES > fixedStart) continue;

      const fixedEnd = timeToMinutes(item.endTime);
      items.push({
        ...item,
        travelFromPreviousMinutes: route.durationMinutes,
        distanceFromPreviousKm: route.distanceKm,
        transportMode: route.mode,
      });
      totalDistanceKm += route.distanceKm;
      totalTravelMinutes += route.durationMinutes;
      cursor = fixedEnd;
      if (item.activity.coordinates) previousCoordinates = item.activity.coordinates;
      continue;
    }

    const actualStart = Math.max(timeToMinutes(item.startTime), earliestArrival);
    const actualEnd = actualStart + item.activity.durationMinutes;

    // 다음 고정시간까지 이동 + 10분 도착 여유시간을 포함해 실제로 들어갈 수 있는지 확인합니다.
    const nextFixed = sorted.slice(index + 1).find((candidate) => candidate.fixedTime);
    if (nextFixed) {
      let nextTravel = 0;
      if (item.activity.coordinates && nextFixed.activity.coordinates) {
        const nextRoute = await getTravelInfo(item.activity.coordinates, nextFixed.activity.coordinates);
        nextTravel = nextRoute.durationMinutes;
      }
      if (actualEnd + nextTravel + ARRIVAL_BUFFER_MINUTES > timeToMinutes(nextFixed.startTime)) {
        continue;
      }
    }

    if (actualEnd > timeToMinutes(plan.endTime)) continue;

    items.push({
      ...item,
      startTime: minutesToTime(actualStart),
      endTime: minutesToTime(actualEnd),
      travelFromPreviousMinutes: route.durationMinutes,
      distanceFromPreviousKm: route.distanceKm,
      transportMode: route.mode,
    });
    totalDistanceKm += route.distanceKm;
    totalTravelMinutes += route.durationMinutes;
    cursor = actualEnd;
    if (item.activity.coordinates) previousCoordinates = item.activity.coordinates;
  }

  return {
    ...plan,
    items,
    totalCost: items.reduce((sum, item) => sum + item.activity.cost, 0),
    totalDistanceKm,
    totalTravelMinutes,
  };
}
