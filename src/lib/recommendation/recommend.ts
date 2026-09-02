import type { Activity } from "@/types/activity";
import type { RecommendationCondition } from "@/types/recommendation";
import { scoreActivity } from "./scoreActivity";

export type ScoredActivity = Activity & { score: number };

export function recommendActivities(
  activities: Activity[],
  condition: RecommendationCondition
): ScoredActivity[] {
  return activities
    .map((activity) => ({ ...activity, score: scoreActivity(activity, condition) }))
    .filter((activity) => activity.metadata?.manuallySelected === true || activity.score > 0)
    .sort((a, b) => {
      const aManual = a.metadata?.manuallySelected === true;
      const bManual = b.metadata?.manuallySelected === true;
      if (aManual !== bManual) return aManual ? -1 : 1;
      return b.score - a.score;
    });
}
