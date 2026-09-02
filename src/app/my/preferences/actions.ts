"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface PreferenceInput {
  defaultRegion: string;
  budgetLevel: number;
  companionType: string;
  interests: string[];
  favoriteTeams: string[];
  ottServices: string[];
  activityMode: string;
  transportMode: string;
}

export async function savePreferences(input: PreferenceInput) {
  const supabase = await createClient();
  if (!supabase) return { success: false, message: "Supabase 환경변수를 먼저 설정해주세요." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요합니다." };

  const { error } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    default_region: input.defaultRegion,
    budget_level: input.budgetLevel,
    companion_type: input.companionType,
    interests: input.interests,
    favorite_teams: input.favoriteTeams,
    ott_services: input.ottServices,
    activity_mode: input.activityMode,
    transport_mode: input.transportMode,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) return { success: false, message: error.message };
  revalidatePath("/my/preferences");
  revalidatePath("/plan");
  return { success: true, message: "추천 설정을 저장했습니다." };
}
