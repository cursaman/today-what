import type { DailyPlan, PlanStyle } from "@/types/plan";
import type { UserLocation } from "@/types/location";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const STYLES = new Set<PlanStyle>(["outdoor", "balanced", "relaxed"]);

export function isPlanStyle(value: unknown): value is PlanStyle {
  return typeof value === "string" && STYLES.has(value as PlanStyle);
}

export function isUserLocation(value: unknown): value is UserLocation {
  if (!value || typeof value !== "object") return false;
  const location = value as UserLocation;
  return Number.isFinite(location.latitude) && Math.abs(location.latitude) <= 90 &&
    Number.isFinite(location.longitude) && Math.abs(location.longitude) <= 180;
}

export function isDailyPlan(value: unknown): value is DailyPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as DailyPlan;
  if (!TIME.test(plan.startTime) || !TIME.test(plan.endTime) || !Array.isArray(plan.items) || plan.items.length > 30) return false;
  return plan.items.every((item) => {
    const activity = item?.activity;
    return Boolean(activity && typeof activity.id === "string" && activity.id.length <= 200 &&
      typeof activity.title === "string" && activity.title.length <= 200 &&
      Number.isFinite(activity.durationMinutes) && activity.durationMinutes > 0 && activity.durationMinutes <= 1440 &&
      Number.isFinite(activity.cost) && activity.cost >= 0 && activity.cost <= 100_000_000 &&
      TIME.test(item.startTime) && TIME.test(item.endTime));
  });
}
