export type ActivityType = "tour" | "movie" | "sport" | "ott" | "activity";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  durationMinutes: number;
  fixedTime: boolean;
  indoor: boolean;
  cost: number;
  location?: string;
  coordinates?: Coordinates;
  interests: string[];
  source: string;
  metadata?: Record<string, unknown>;
}
