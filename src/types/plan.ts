import type { Activity } from "./activity";
import type { TransportMode } from "./travel";

export interface PlanItem {
  activity: Activity;
  startTime: string;
  endTime: string;
  fixedTime: boolean;
  travelFromPreviousMinutes?: number;
  distanceFromPreviousKm?: number;
  transportMode?: TransportMode;
}

export interface DailyPlan {
  startTime: string;
  endTime: string;
  items: PlanItem[];
  totalCost: number;
  totalDistanceKm: number;
  totalTravelMinutes: number;
  returnTravelMinutes?: number;
  returnDistanceKm?: number;
  returnTransportMode?: TransportMode;
  estimatedReturnTime?: string;
}

export type PlanStyle = "outdoor" | "balanced" | "relaxed";

export interface DraftFailure {
  id: string;
  title: string;
  reason: string;
}

export interface PlanOption {
  id: PlanStyle;
  title: string;
  description: string;
  style: PlanStyle;
  plan: DailyPlan;
  draftFailures?: DraftFailure[];
}
