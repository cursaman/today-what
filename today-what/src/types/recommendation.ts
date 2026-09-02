export interface RecommendationCondition {
  region: string;
  startTime: string;
  endTime: string;
  budget: number;
  raining: boolean;
  companion: string;
  interests: string[];
  favoriteTeams?: string[];
}
