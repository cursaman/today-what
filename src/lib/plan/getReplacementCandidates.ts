import type { Activity } from "@/types/activity";

export function getReplacementCandidates(currentId: string, currentDuration: number, activities: Activity[], limit = 3) {
  return activities
    .filter((activity) => activity.id !== currentId && !activity.fixedTime && activity.durationMinutes <= Math.max(currentDuration, 120))
    .slice(0, limit);
}
