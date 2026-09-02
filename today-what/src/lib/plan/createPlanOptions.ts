import type { ScoredActivity } from "@/lib/recommendation/recommend";
import { getStyleScore } from "@/lib/recommendation/styleScore";
import type { PlanOption, PlanStyle } from "@/types/plan";
import { createDailyPlan } from "./createDailyPlan";

const styles: Array<{
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
  return styles.map((option) => {
    const ranked = activities
      .map((activity) => ({
        ...activity,
        score: activity.score + getStyleScore(activity, option.style),
      }))
      .sort((a, b) => b.score - a.score);

    return {
      id: option.style,
      title: option.title,
      description: option.description,
      style: option.style,
      plan: createDailyPlan(ranked, startTime, endTime, budget),
    };
  });
}
