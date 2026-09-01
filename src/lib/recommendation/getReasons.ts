import type { Activity } from "@/types/activity";
import type { RecommendationCondition } from "@/types/recommendation";

export function getRecommendationReasons(
  activity: Activity,
  condition: RecommendationCondition
) {
  const reasons: string[] = [];

  if (condition.raining && activity.indoor) {
    reasons.push("비 오는 날 이용하기 좋은 실내 활동입니다.");
  }

  if (!condition.raining && !activity.indoor) {
    reasons.push("날씨가 좋아 야외 활동에 적합합니다.");
  }

  if (activity.interests.some((interest) => condition.interests.includes(interest))) {
    reasons.push("선택한 관심 분야와 일치합니다.");
  }

  if (activity.cost <= condition.budget) {
    reasons.push("설정한 예산 범위 안에서 이용할 수 있습니다.");
  }

  if (activity.fixedTime) {
    reasons.push("시간이 정해진 활동이라 일정의 기준점으로 배치합니다.");
  }

  return reasons;
}
