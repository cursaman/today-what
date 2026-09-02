import type { UserTransportMode } from "@/types/preferences";

export function estimateTravelMinutes(distanceKm: number, mode: UserTransportMode = "car") {
  if (distanceKm <= 0.05) return 0;
  if (mode === "walk") return Math.max(2, Math.ceil((distanceKm / 4.5) * 60));
  if (mode === "transit") return Math.max(8, Math.ceil((distanceKm / 22) * 60) + 10);
  if (distanceKm <= 1) return 15;
  if (distanceKm <= 3) return 25;
  if (distanceKm <= 7) return 40;
  if (distanceKm <= 15) return 60;
  return 90;
}
