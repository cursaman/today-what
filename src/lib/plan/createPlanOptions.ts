import type { ScoredActivity } from "@/lib/recommendation/recommend";
import { getStyleScore } from "@/lib/recommendation/styleScore";
import type { PlanOption, PlanStyle } from "@/types/plan";
import { createDailyPlan } from "./createDailyPlan";

export const PLAN_STYLES: Array<{
  style: PlanStyle;
  title: string;
  description: string;
}> = [
  {
    style: "outdoor",
    title: "A. 밖에서 즐기기",
    description: "외출과 현장 활동을 조금 더 적극적으로 구성합니다.",
  },
  {
    style: "balanced",
    title: "B. 적당히 즐기기",
    description: "외출과 휴식을 균형 있게 섞어 구성합니다.",
  },
  {
    style: "relaxed",
    title: "C. 편하게 보내기",
    description: "실내·짧은 활동을 우선해 이동과 부담을 줄입니다.",
  },
];

export function createPlanOptions(
  activities: ScoredActivity[],
  startTime: string,
  endTime: string,
  budget: number
): PlanOption[] {
  return PLAN_STYLES.map((option) => {
    const ranked = rankActivitiesForStyle(activities, option.style);

    return {
      id: option.style,
      title: option.title,
      description: option.description,
      style: option.style,
      plan: createDailyPlan(ranked, startTime, endTime, budget),
    };
  });
}

export function rankActivitiesForStyle(activities: ScoredActivity[], style: PlanStyle) {
  return activities
    .map((activity) => ({ ...activity, score: activity.score + getStyleScore(activity, style) }))
    .sort((a, b) => {
      const aManual = a.metadata?.manuallySelected === true;
      const bManual = b.metadata?.manuallySelected === true;
      if (aManual !== bManual) return aManual ? -1 : 1;
      return b.score - a.score;
    });
}
