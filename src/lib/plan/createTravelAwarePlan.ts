import type { Activity, Coordinates } from "@/types/activity";
import type { DailyPlan, PlanItem, PlanStyle, DraftFailure } from "@/types/plan";
import type { UserLocation } from "@/types/location";
import type { UserTransportMode } from "@/types/preferences";
import { getTravelInfo } from "@/lib/transport/getTravelInfo";
import { minutesToTime, timeToMinutes } from "./timeUtils";
import type { TransportRoute } from "@/types/travel";

export type TravelRouteCache = Map<string, Promise<TransportRoute>>;

const ARRIVAL_BUFFER = 10;
const MAX_AUTO_TRAVEL: Record<PlanStyle, number> = { outdoor: 60, balanced: 40, relaxed: 25 };
const AUTO_POLICY: Record<PlanStyle, {
  maxItems: number;
  restMinutes: number;
  groupLimits: Record<string, number>;
}> = {
  outdoor: { maxItems: 7, restMinutes: 10, groupLimits: { screen: 2, sport: 1, tour: 3, activity: 2 } },
  balanced: { maxItems: 6, restMinutes: 20, groupLimits: { screen: 2, sport: 1, tour: 2, activity: 2 } },
  relaxed: { maxItems: 4, restMinutes: 45, groupLimits: { screen: 1, sport: 1, tour: 1, activity: 2 } },
};

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

function activityGroup(activity: Activity) {
  if (activity.type === "ott" || activity.type === "movie") return "screen";
  return activity.type;
}

export async function createTravelAwarePlan(
  activities: Activity[],
  startTime: string,
  endTime: string,
  budget: number,
  style: PlanStyle,
  startLocation: UserLocation,
  transportMode: UserTransportMode,
  sharedRouteCache?: TravelRouteCache,
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
  const routeCache = sharedRouteCache ?? new Map<string, Promise<TransportRoute>>();

  function samePosition(a: Coordinates, b: Coordinates) {
    return Math.abs(a.latitude - b.latitude) < 0.00001 && Math.abs(a.longitude - b.longitude) < 0.00001;
  }

  async function routeCoordinates(from: Coordinates, destination: Coordinates) {
    if (samePosition(from, destination)) {
      return { distanceKm: 0, durationMinutes: 0, mode: "estimate" as const, source: "same-position" };
    }
    const key = `${transportMode}:${from.latitude},${from.longitude}:${destination.latitude},${destination.longitude}`;
    const cached = routeCache.get(key);
    if (cached) return await cached;
    const pending = getTravelInfo(from, destination, transportMode);
    routeCache.set(key, pending);
    return await pending;
  }

  async function route(from: Coordinates, activity: Activity) {
    const destination = isHome(activity) ? origin : activity.coordinates;
    if (!destination) {
      return { distanceKm: 0, durationMinutes: 0, mode: "estimate" as const, source: "same-or-unknown" };
    }
    return routeCoordinates(from, destination);
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
    const activityPosition = isHome(activity) ? origin : (activity.coordinates ?? previous);
    const returnTrip = await routeCoordinates(activityPosition, origin);
    if (actualEnd + returnTrip.durationMinutes > dayEnd) {
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
  const automatic = activities.filter((activity) => !isManual(activity)).slice(0, 30);
  const automaticFixed = automatic.filter((activity) => activity.fixedTime && activity.startAt)
    .sort((a, b) => timeToMinutes(a.startAt!) - timeToMinutes(b.startAt!));
  const automaticFlexible = automatic.filter((activity) => !activity.fixedTime || !activity.startAt)
    .sort((a, b) => score(b) - score(a));
  const policy = AUTO_POLICY[style];
  const groupCounts = new Map<string, number>();
  let automaticCount = 0;

  function allowed(candidate: Activity) {
    if (automaticCount >= policy.maxItems) return false;
    const group = activityGroup(candidate);
    const limit = policy.groupLimits[group] ?? 1;
    return (groupCounts.get(group) ?? 0) < limit;
  }

  async function placeAutomatic(candidate: Activity) {
    if (!allowed(candidate)) return false;
    const group = activityGroup(candidate);
    if (await tryPlace(candidate, false)) {
      automaticCount += 1;
      groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
      cursor = Math.min(dayEnd, cursor + policy.restMinutes);
      return true;
    }
    return false;
  }

  // 시간 고정 활동을 먼저 '예약'하고, 그 전의 빈 구간만 자유 활동으로 채웁니다.
  for (const fixed of automaticFixed) {
    for (let index = 0; index < automaticFlexible.length && allowed(fixed);) {
      const candidate = automaticFlexible[index];
      if (!allowed(candidate)) { index += 1; continue; }
      const candidateGroup = activityGroup(candidate);
      const fixedGroup = activityGroup(fixed);
      if (automaticCount + 1 >= policy.maxItems ||
          (candidateGroup === fixedGroup && (groupCounts.get(candidateGroup) ?? 0) + 1 >= (policy.groupLimits[candidateGroup] ?? 1))) {
        index += 1;
        continue;
      }
      const toCandidate = await route(previous, candidate);
      const candidateEnd = cursor + toCandidate.durationMinutes + candidate.durationMinutes + policy.restMinutes;
      const candidatePosition = isHome(candidate) ? origin : (candidate.coordinates ?? previous);
      const toFixed = await route(candidatePosition, fixed);
      if (candidateEnd + toFixed.durationMinutes + ARRIVAL_BUFFER <= timeToMinutes(fixed.startAt!)) {
        if (await placeAutomatic(candidate)) automaticFlexible.splice(index, 1);
        else index += 1;
      } else index += 1;
    }
    await placeAutomatic(fixed);
  }

  for (const candidate of automaticFlexible) {
    if (automaticCount >= policy.maxItems) break;
    await placeAutomatic(candidate);
  }

  // 화면에 별도 항목을 만들지는 않더라도 마지막 장소에서 출발지까지의 귀가를 총 이동량에 포함합니다.
  if (!samePosition(previous, origin)) {
    const homebound = await routeCoordinates(previous, origin);
    totalDistanceKm += homebound.distanceKm;
    totalTravelMinutes += homebound.durationMinutes;
  }

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
