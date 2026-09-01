import type { Activity } from "./activity";

export interface PlanItem {
  activity: Activity;
  startTime: string;
  endTime: string;
  fixedTime: boolean;
}

export interface DailyPlan {
  startTime: string;
  endTime: string;
  items: PlanItem[];
  totalCost: number;
}
