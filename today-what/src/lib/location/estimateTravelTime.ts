export function estimateTravelMinutes(distanceKm: number) {
  if (distanceKm <= 1) return 15;
  if (distanceKm <= 3) return 25;
  if (distanceKm <= 7) return 40;
  if (distanceKm <= 15) return 60;
  return 90;
}
