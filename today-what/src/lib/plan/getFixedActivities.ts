import type { Activity } from "@/types/activity";
import { timeToMinutes } from "./timeUtils";

export function getFixedActivities(activities: Activity[], startTime: string, endTime: string) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  return activities
    .filter((activity) => {
      if (!activity.fixedTime || !activity.startAt) return false;
      const activityStart = timeToMinutes(activity.startAt);
      const activityEnd = activityStart + activity.durationMinutes;
      return activityStart >= start && activityEnd <= end;
    })
    .sort((a, b) => timeToMinutes(a.startAt!) - timeToMinutes(b.startAt!));
}
