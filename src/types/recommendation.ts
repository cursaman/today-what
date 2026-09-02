import type { ActivityPreferenceMode, UserTransportMode } from "./preferences";

export interface RecommendationCondition {
  region: string;
  startTime: string;
  endTime: string;
  budget: number;
  raining: boolean;
  companion: string;
  interests: string[];
  favoriteTeams?: string[];
  preferredActivityMode?: ActivityPreferenceMode;
  transportMode?: UserTransportMode;
  ottServices?: string[];
}
