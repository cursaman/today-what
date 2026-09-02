export type ActivityType = "tour" | "movie" | "sport" | "ott" | "activity";

<<<<<<< HEAD
=======
export interface Coordinates {
  latitude: number;
  longitude: number;
}

>>>>>>> 89392e5 (20일차 전체 기능 구현)
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
<<<<<<< HEAD
=======
  coordinates?: Coordinates;
>>>>>>> 89392e5 (20일차 전체 기능 구현)
  interests: string[];
  source: string;
  metadata?: Record<string, unknown>;
}
