import type { Activity } from "./activity";
<<<<<<< HEAD
=======
import type { TransportMode } from "./travel";
>>>>>>> 89392e5 (20일차 전체 기능 구현)

export interface PlanItem {
  activity: Activity;
  startTime: string;
  endTime: string;
  fixedTime: boolean;
<<<<<<< HEAD
=======
  travelFromPreviousMinutes?: number;
  distanceFromPreviousKm?: number;
  transportMode?: TransportMode;
>>>>>>> 89392e5 (20일차 전체 기능 구현)
}

export interface DailyPlan {
  startTime: string;
  endTime: string;
  items: PlanItem[];
  totalCost: number;
<<<<<<< HEAD
=======
  totalDistanceKm: number;
  totalTravelMinutes: number;
>>>>>>> 89392e5 (20일차 전체 기능 구현)
}

export type PlanStyle = "outdoor" | "balanced" | "relaxed";

export interface PlanOption {
  id: PlanStyle;
  title: string;
  description: string;
  style: PlanStyle;
  plan: DailyPlan;
}
