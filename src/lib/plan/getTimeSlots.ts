import type { Activity } from "@/types/activity";
import { minutesToTime, timeToMinutes } from "./timeUtils";

export interface TimeSlot {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export function getFreeTimeSlots(startTime: string, endTime: string, fixedActivities: Activity[]) {
  const slots: TimeSlot[] = [];
  let current = timeToMinutes(startTime);
  const dayEnd = timeToMinutes(endTime);

  for (const activity of fixedActivities) {
    if (!activity.startAt) continue;
    const fixedStart = timeToMinutes(activity.startAt);
    const fixedEnd = fixedStart + activity.durationMinutes;

    if (fixedStart < current) continue;

    if (current < fixedStart) {
      slots.push({
        startTime: minutesToTime(current),
        endTime: minutesToTime(fixedStart),
        durationMinutes: fixedStart - current,
      });
    }

    current = Math.max(current, fixedEnd);
  }

  if (current < dayEnd) {
    slots.push({
      startTime: minutesToTime(current),
      endTime: minutesToTime(dayEnd),
      durationMinutes: dayEnd - current,
    });
  }

  return slots;
}
