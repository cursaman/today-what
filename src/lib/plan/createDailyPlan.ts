import type { Activity } from "@/types/activity";
import type { DailyPlan, PlanItem } from "@/types/plan";
import { getFixedActivities } from "./getFixedActivities";
import { getFreeTimeSlots } from "./getTimeSlots";
import { fillTimeSlots } from "./fillTimeSlots";
import { minutesToTime, timeToMinutes } from "./timeUtils";

function activityScore(activity: Activity) {
  return typeof (activity as Activity & { score?: number }).score === "number"
    ? (activity as Activity & { score: number }).score
    : 0;
}

function isManuallySelected(activity: Activity) {
  return activity.metadata?.manuallySelected === true;
}

function overlaps(a: Activity, b: Activity) {
  if (!a.startAt || !b.startAt) return false;
  const aStart = timeToMinutes(a.startAt);
  const aEnd = aStart + a.durationMinutes;
  const bStart = timeToMinutes(b.startAt);
  const bEnd = bStart + b.durationMinutes;
  return aStart < bEnd && bStart < aEnd;
}

// 고정시간 활동끼리 겹치면 단순히 빠른 시간 순서가 아니라 추천 점수가 높은 활동을 우선합니다.
function selectNonOverlappingFixedActivities(activities: Activity[]) {
  const selected: Activity[] = [];
  const ranked = [...activities].sort((a, b) => {
    const aManual = isManuallySelected(a);
    const bManual = isManuallySelected(b);
    if (aManual !== bManual) return aManual ? -1 : 1;
    return activityScore(b) - activityScore(a);
  });

  for (const activity of ranked) {
    if (selected.some((picked) => overlaps(activity, picked))) continue;
    selected.push(activity);
  }

  return selected.sort((a, b) => timeToMinutes(a.startAt!) - timeToMinutes(b.startAt!));
}

export function createDailyPlan(
  activities: Activity[],
  startTime: string,
  endTime: string,
  budget = Number.POSITIVE_INFINITY
): DailyPlan {
  const fixedActivities = selectNonOverlappingFixedActivities(
    getFixedActivities(activities, startTime, endTime)
  );

  const fixedItems: PlanItem[] = fixedActivities.map((activity) => {
    const start = timeToMinutes(activity.startAt!);
    return {
      activity,
      startTime: minutesToTime(start),
      endTime: minutesToTime(start + activity.durationMinutes),
      fixedTime: true,
    };
  });

  const fixedCost = fixedItems.reduce((sum, item) => sum + item.activity.cost, 0);
  const remainingBudget = Math.max(0, budget - fixedCost);
  const freeSlots = getFreeTimeSlots(startTime, endTime, fixedActivities);
  const flexibleCandidates = activities
    .filter((activity) => !activity.fixedTime && activity.cost <= remainingBudget)
    .sort((a, b) => {
      const aManual = isManuallySelected(a);
      const bManual = isManuallySelected(b);

      // 사용자가 직접 선택한 일정이 오늘 일정의 뼈대입니다.
      // 자동 추천은 직접 선택 후보가 배치된 뒤 남는 시간에만 들어갑니다.
      if (aManual !== bManual) return aManual ? -1 : 1;
      return activityScore(b) - activityScore(a);
    });
  const flexibleItems = fillTimeSlots(freeSlots, flexibleCandidates);

  const items = [...fixedItems, ...flexibleItems]
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // 예산도 사용자가 직접 선택한 활동을 먼저 확보한 뒤 자동 추천에 사용합니다.
  // 이렇게 해야 앞 시간대의 자동 추천이 예산을 먼저 써서 직접 선택 후보를 밀어내지 않습니다.
  const allowedIds = new Set<string>();
  let runningCost = 0;

  for (const item of items.filter((value) => isManuallySelected(value.activity))) {
    if (runningCost + item.activity.cost > budget) continue;
    allowedIds.add(item.activity.id);
    runningCost += item.activity.cost;
  }

  for (const item of items.filter((value) => !isManuallySelected(value.activity))) {
    if (runningCost + item.activity.cost > budget) continue;
    allowedIds.add(item.activity.id);
    runningCost += item.activity.cost;
  }

  const budgetSafeItems = items.filter((item) => allowedIds.has(item.activity.id));

  return {
    startTime,
    endTime,
    items: budgetSafeItems,
    totalCost: runningCost,
    totalDistanceKm: 0,
    totalTravelMinutes: 0,
  };
}
