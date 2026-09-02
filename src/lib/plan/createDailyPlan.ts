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
  const ranked = [...activities].sort((a, b) => activityScore(b) - activityScore(a));

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
      const aManual = a.metadata?.manuallySelected === true;
      const bManual = b.metadata?.manuallySelected === true;

      // 직접 선택한 활동은 자동 추천 활동보다 먼저 빈 시간에 배치합니다.
      // 같은 직접 선택 후보끼리는 기존 추천 순서를 유지합니다.
      if (aManual !== bManual) return aManual ? -1 : 1;
      return 0;
    });
  const flexibleItems = fillTimeSlots(freeSlots, flexibleCandidates);

  const items = [...fixedItems, ...flexibleItems]
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  let runningCost = 0;
  const budgetSafeItems = items.filter((item) => {
    if (runningCost + item.activity.cost > budget) return false;
    runningCost += item.activity.cost;
    return true;
  });

  return {
    startTime,
    endTime,
    items: budgetSafeItems,
    totalCost: runningCost,
    totalDistanceKm: 0,
    totalTravelMinutes: 0,
  };
}
