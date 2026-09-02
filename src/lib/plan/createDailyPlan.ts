import type { Activity } from "@/types/activity";
import type { DailyPlan, PlanItem } from "@/types/plan";
import { getFixedActivities } from "./getFixedActivities";
import { getFreeTimeSlots } from "./getTimeSlots";
import { fillTimeSlots } from "./fillTimeSlots";
import { minutesToTime, timeToMinutes } from "./timeUtils";

function removeOverlappingFixedActivities(activities: Activity[]) {
  const selected: Activity[] = [];
  let lastEnd = -1;

  for (const activity of activities) {
    const start = timeToMinutes(activity.startAt!);
    const end = start + activity.durationMinutes;
    if (start >= lastEnd) {
      selected.push(activity);
      lastEnd = end;
    }
  }

  return selected;
}

export function createDailyPlan(
  activities: Activity[],
  startTime: string,
  endTime: string,
  budget = Number.POSITIVE_INFINITY
): DailyPlan {
  const fixedActivities = removeOverlappingFixedActivities(
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
  const flexibleCandidates = activities.filter(
    (activity) => !activity.fixedTime && activity.cost <= remainingBudget
  );
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
<<<<<<< HEAD
=======
    totalDistanceKm: 0,
    totalTravelMinutes: 0,
>>>>>>> 89392e5 (20일차 전체 기능 구현)
  };
}
