"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface PreferenceInput { defaultRegion:string; budgetLevel:number; companionType:string; interests:string[]; favoriteTeams:string[]; ottServices:string[]; activityMode:string; transportMode:string; }
const validRegions = new Set(["부산","서울","인천","대전","대구","광주","울산","세종","경기","강원","충북","충남","경북","경남","전북","전남","제주"]);
const validCompanions = new Set(["alone","friend","couple","family"]);
const validModes = new Set(["indoor","balanced","outdoor"]);
const validTransport = new Set(["car","transit","walk"]);
const validOtt = new Set(["Netflix","TVING","Disney+","Wavve","Watcha"]);

export async function savePreferences(input: PreferenceInput) {
  const supabase = await createClient();
  if (!supabase) return {success:false,message:"Supabase 환경변수를 먼저 설정해주세요."};
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {success:false,message:"로그인이 필요합니다."};
  const payload={
    user_id:user.id,
    default_region:validRegions.has(input.defaultRegion)?input.defaultRegion:"부산",
    budget_level:Math.max(0,Math.min(Number(input.budgetLevel)||50000,1000000)),
    companion_type:validCompanions.has(input.companionType)?input.companionType:"alone",
    interests:[...new Set(input.interests)].slice(0,20),
    favorite_teams:[...new Set(input.favoriteTeams.map(v=>v.trim()).filter(Boolean))].slice(0,10),
    ott_services:[...new Set(input.ottServices.filter(v=>validOtt.has(v)))],
    activity_mode:validModes.has(input.activityMode)?input.activityMode:"balanced",
    transport_mode:validTransport.has(input.transportMode)?input.transportMode:"car",
    updated_at:new Date().toISOString(),
  };
  const {error}=await supabase.from("user_preferences").upsert(payload,{onConflict:"user_id"});
  if(error) return {success:false,message:error.message};
  ["/my/preferences","/outdoor","/home","/plan"].forEach(revalidatePath);
  return {success:true,message:"저장했습니다. 다음 추천부터 내 취향이 반영됩니다."};
}
