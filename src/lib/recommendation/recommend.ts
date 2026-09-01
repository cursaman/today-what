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
    .filter((activity) => activity.score > 0)
    .sort((a, b) => b.score - a.score);
}
