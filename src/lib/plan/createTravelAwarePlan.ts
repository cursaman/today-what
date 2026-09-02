import type { Activity, Coordinates } from "@/types/activity";
import type { DailyPlan, PlanItem, PlanStyle, DraftFailure } from "@/types/plan";
import type { UserLocation } from "@/types/location";
import type { UserTransportMode } from "@/types/preferences";
import { getTravelInfo } from "@/lib/transport/getTravelInfo";
import { minutesToTime, timeToMinutes } from "./timeUtils";

const ARRIVAL_BUFFER = 10;
const MAX_AUTO_TRAVEL: Record<PlanStyle, number> = { outdoor: 60, balanced: 40, relaxed: 25 };

function isManual(activity: Activity) {
  return activity.metadata?.manuallySelected === true;
}

function isHome(activity: Activity) {
  return activity.location === "집" || activity.type === "ott";
}

function score(activity: Activity) {
  return typeof (activity as Activity & { score?: number }).score === "number"
    ? (activity as Activity & { score: number }).score
    : 0;
}

export async function createTravelAwarePlan(
  activities: Activity[],
  startTime: string,
  endTime: string,
  budget: number,
  style: PlanStyle,
  startLocation: UserLocation,
  transportMode: UserTransportMode,
): Promise<{ plan: DailyPlan; draftFailures: DraftFailure[] }> {
  const dayStart = timeToMinutes(startTime);
  const dayEnd = timeToMinutes(endTime);
  const origin: Coordinates = { latitude: startLocation.latitude, longitude: startLocation.longitude };
  let cursor = dayStart;
  let previous = origin;
  let totalCost = 0;
  let totalDistanceKm = 0;
  let totalTravelMinutes = 0;
  const items: PlanItem[] = [];
  const draftFailures: DraftFailure[] = [];
  const routeCache = new Map<string, Awaited<ReturnType<typeof getTravelInfo>>>();

  async function route(from: Coordinates, activity: Activity) {
    if (isHome(activity) || !activity.coordinates) {
      return { distanceKm: 0, durationMinutes: 0, mode: "estimate" as const, source: "home-or-unknown" };
    }
    const key = `${from.latitude},${from.longitude}:${activity.coordinates.latitude},${activity.coordinates.longitude}`;
    const cached = routeCache.get(key);
    if (cached) return cached;
    const value = await getTravelInfo(from, activity.coordinates);
    routeCache.set(key, value);
    return value;
  }

  async function tryPlace(activity: Activity, manual: boolean) {
    if (totalCost + activity.cost > budget) {
      if (manual) draftFailures.push({ id: activity.id, title: activity.title, reason: "예산 초과" });
      return false;
    }

    const travel = await route(previous, activity);
    if (!manual && !activity.fixedTime && travel.durationMinutes > MAX_AUTO_TRAVEL[style]) return false;
    let actualStart = cursor + travel.durationMinutes;

    if (activity.fixedTime && activity.startAt) {
      const fixedStart = timeToMinutes(activity.startAt);
      const fixedEnd = fixedStart + activity.durationMinutes;
      if (fixedStart < dayStart || fixedEnd > dayEnd) {
        if (manual) draftFailures.push({ id: activity.id, title: activity.title, reason: "선택한 운영 시간이 일정 범위 밖입니다." });
        return false;
      }
      if (actualStart + ARRIVAL_BUFFER > fixedStart) {
        if (manual) draftFailures.push({ id: activity.id, title: activity.title, reason: "이동시간 때문에 고정 시작 시간에 도착할 수 없습니다." });
        return false;
      }
      actualStart = fixedStart;
    }

    const actualEnd = actualStart + activity.durationMinutes;
    if (actualEnd > dayEnd) {
      if (manual) draftFailures.push({ id: activity.id, title: activity.title, reason: "이동시간을 포함하면 종료 시간 안에 끝낼 수 없습니다." });
      return false;
    }

    items.push({
      activity,
      startTime: minutesToTime(actualStart),
      endTime: minutesToTime(actualEnd),
      fixedTime: activity.fixedTime,
      travelFromPreviousMinutes: travel.durationMinutes,
      distanceFromPreviousKm: travel.distanceKm,
      transportMode: travel.mode,
    });
    cursor = actualEnd;
    totalCost += activity.cost;
    totalDistanceKm += travel.distanceKm;
    totalTravelMinutes += travel.durationMinutes;
    previous = isHome(activity) ? origin : (activity.coordinates ?? previous);
    return true;
  }

  const manual = activities.filter(isManual);
  const manualFixed = manual.filter((activity) => activity.fixedTime && activity.startAt)
    .sort((a, b) => timeToMinutes(a.startAt!) - timeToMinutes(b.startAt!));
  const manualFlexible = manual.filter((activity) => !activity.fixedTime || !activity.startAt);

  // 고정 후보 전에는 실제 이동시간까지 포함해 들어가는 직접 선택 후보만 배치합니다.
  for (const fixed of manualFixed) {
    for (let index = 0; index < manualFlexible.length;) {
      const candidate = manualFlexible[index];
      const toCandidate = await route(previous, candidate);
      const candidateEnd = cursor + toCandidate.durationMinutes + candidate.durationMinutes;
      const candidatePosition = isHome(candidate) ? origin : (candidate.coordinates ?? previous);
      const toFixed = await route(candidatePosition, fixed);
      if (candidateEnd + toFixed.durationMinutes + ARRIVAL_BUFFER <= timeToMinutes(fixed.startAt!)) {
        await tryPlace(candidate, true);
        manualFlexible.splice(index, 1);
      } else {
        index += 1;
      }
    }
    await tryPlace(fixed, true);
  }

  for (const candidate of manualFlexible) await tryPlace(candidate, true);

  // 직접 선택 후보가 자리를 잡은 후에만 자동 추천으로 남은 시간을 채웁니다.
  const automatic = activities.filter((activity) => !isManual(activity))
    .sort((a, b) => score(b) - score(a))
    .slice(0, 20);
  for (const candidate of automatic) await tryPlace(candidate, false);

  return {
    plan: {
      startTime,
      endTime,
      items: items.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
      totalCost,
      totalDistanceKm,
      totalTravelMinutes,
    },
    draftFailures,
  };
}
