import type { Activity } from "@/types/activity";
import type { RecommendationCondition } from "@/types/recommendation";
import { timeToMinutes } from "@/lib/plan/timeUtils";

export function scoreActivity(activity: Activity, condition: RecommendationCondition) {
  let score=50;
  if(activity.metadata?.manuallySelected===true) score+=150;
  const matched=activity.interests.filter(i=>condition.interests.includes(i)).length; score+=matched*20;
  if(condition.raining) score+=activity.indoor?30:-40; else if(!activity.indoor) score+=10;
  if(condition.preferredActivityMode==="indoor") score+=activity.indoor?25:-15;
  if(condition.preferredActivityMode==="outdoor") score+=activity.indoor?-10:25;
  if(condition.companion==="family" && (activity.interests.includes("travel")||activity.interests.includes("culture"))) score+=10;
  if(condition.companion==="couple" && (activity.interests.includes("cafe")||activity.interests.includes("movie")||activity.interests.includes("culture"))) score+=10;
  if(condition.companion==="friend" && (activity.interests.includes("sports")||activity.interests.includes("activity"))) score+=10;
  if(typeof activity.metadata?.mealType === "string") score+=35;
  if(activity.cost>condition.budget) return -999;
  if(activity.fixedTime&&activity.startAt){const a=timeToMinutes(activity.startAt),s=timeToMinutes(condition.startTime),e=timeToMinutes(condition.endTime);if(a<s||a>e)return -999;score+=30;}
  const home=String(activity.metadata?.homeTeam??"").trim().toLocaleLowerCase("ko-KR");
  const away=String(activity.metadata?.awayTeam??"").trim().toLocaleLowerCase("ko-KR");
  if((home || away) && condition.favoriteTeams?.some((value) => {
    const team=value.trim().toLocaleLowerCase("ko-KR");
    return Boolean(team) && ((Boolean(home) && (home.includes(team)||team.includes(home))) || (Boolean(away) && (away.includes(team)||team.includes(away))));
  })) score+=40;
  if(activity.type==="ott" && condition.ottServices?.length){const providers=Array.isArray(activity.metadata?.providers)?activity.metadata.providers:[];if(providers.some((p)=>condition.ottServices?.includes(String(p))))score+=20;}
  return score;
}
