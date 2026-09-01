import type { Activity } from "@/types/activity";
import type { PlanItem } from "@/types/plan";
import type { TimeSlot } from "./getTimeSlots";
import { minutesToTime, timeToMinutes } from "./timeUtils";

export function fillTimeSlots(slots: TimeSlot[], activities: Activity[]): PlanItem[] {
  const result: PlanItem[] = [];
  const used = new Set<string>();
  const flexible = activities.filter((activity) => !activity.fixedTime);

  for (const slot of slots) {
    let current = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);

    for (const activity of flexible) {
      if (used.has(activity.id)) continue;
      const end = current + activity.durationMinutes;
      if (end > slotEnd) continue;

      result.push({
        activity,
        startTime: minutesToTime(current),
        endTime: minutesToTime(end),
        fixedTime: false,
      });
      used.add(activity.id);
      current = end;

      if (current >= slotEnd) break;
    }
  }

  return result;
}
