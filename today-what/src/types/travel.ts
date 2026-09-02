export type TransportMode = "car" | "transit" | "walk" | "estimate";

export interface TransportRoute {
  distanceKm: number;
  durationMinutes: number;
  mode: TransportMode;
  source: string;
}
