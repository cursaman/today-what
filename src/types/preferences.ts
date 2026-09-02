export type CompanionType = "alone" | "friend" | "couple" | "family";
export type ActivityPreferenceMode = "indoor" | "balanced" | "outdoor";
export type UserTransportMode = "car" | "transit" | "walk";

export interface UserPreferences {
  default_region: string;
  budget_level: number;
  companion_type: CompanionType;
  interests: string[];
  favorite_teams: string[];
  ott_services: string[];
  activity_mode: ActivityPreferenceMode;
  transport_mode: UserTransportMode;
}
