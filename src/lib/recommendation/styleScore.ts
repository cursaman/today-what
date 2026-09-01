import type { Activity } from "@/types/activity";
import type { PlanStyle } from "@/types/plan";

export function getStyleScore(activity: Activity, style: PlanStyle) {
  switch (style) {
    case "outdoor":
      // 외출형은 야외/현장 활동을 강하게 우대하되,
      // 기본 날씨 점수가 먼저 적용되므로 폭우 등에서는 무리한 야외 추천을 줄입니다.
      return (!activity.indoor ? 100 : 0) +
        (activity.type === "tour" || activity.type === "sport" ? 30 : 0);

    case "balanced":
      // 균형형은 기본 추천 점수를 최대한 유지하면서 시간 고정 활동을 기준점으로 사용합니다.
      return 10 + (activity.fixedTime ? 15 : 0);

    case "relaxed":
      // 여유형은 집/실내, OTT, 짧은 활동을 우대합니다.
      return (activity.indoor ? 30 : -30) +
        (activity.type === "ott" ? 25 : 0) +
        (activity.durationMinutes <= 60 ? 50 : activity.durationMinutes <= 90 ? 20 : 0);
  }
}
