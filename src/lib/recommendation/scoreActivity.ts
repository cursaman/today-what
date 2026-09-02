import type { Activity } from "@/types/activity";
import type { RecommendationCondition } from "@/types/recommendation";
import { timeToMinutes } from "@/lib/plan/timeUtils";

export function scoreActivity(activity: Activity, condition: RecommendationCondition) {
  let score = 50;

  // /outdoor에서 사용자가 직접 일정에 추가한 활동은 추천 엔진에서 우선 배치합니다.
  if (activity.metadata?.manuallySelected === true) score += 150;

  const matchedInterests = activity.interests.filter((interest) =>
    condition.interests.includes(interest)
  ).length;
  score += matchedInterests * 20;

  if (condition.raining) {
    score += activity.indoor ? 30 : -40;
  } else if (!activity.indoor) {
    score += 10;
  }

  if (activity.cost > condition.budget) return -999;

  if (activity.fixedTime && activity.startAt) {
    const activityTime = timeToMinutes(activity.startAt);
    const userStart = timeToMinutes(condition.startTime);
    const userEnd = timeToMinutes(condition.endTime);

    if (activityTime < userStart || activityTime > userEnd) return -999;
    score += 30;
  }

  const homeTeam = String(activity.metadata?.homeTeam ?? "");
  const awayTeam = String(activity.metadata?.awayTeam ?? "");
  if (
    condition.favoriteTeams?.some((team) => team === homeTeam || team === awayTeam)
  ) {
    score += 40;
  }

  return score;
}
