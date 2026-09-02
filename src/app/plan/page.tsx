import { sampleActivities } from "@/data/sampleActivities";
import { createPlanOptions } from "@/lib/plan/createPlanOptions";
import { enrichPlanWithTravel } from "@/lib/plan/enrichPlanWithTravel";
import { recommendActivities } from "@/lib/recommendation/recommend";
import { createClient } from "@/lib/supabase/server";
import { getRegionLocation } from "@/lib/location/regionCoordinates";
import type { PlanOption } from "@/types/plan";
import PlanOptionCard from "./PlanOptionCard";
import { getWeather } from "@/lib/api/weather/getWeather";
import { getTours } from "@/lib/api/tour/getTours";
import { tourToActivity } from "@/lib/api/tour/tourToActivity";
import { getOttActivities } from "@/lib/api/tmdb/getOttActivities";
import { cookies } from "next/headers";
import type { Activity } from "@/types/activity";

function currentKoreanTime() {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date()).replace("24:", "00:");
}

function parsePlanDraft(raw?: string): Activity[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Activity => Boolean(item && typeof item.id === "string" && typeof item.title === "string"))
      .map((item) => ({
        ...item,
        metadata: { ...(item.metadata ?? {}), manuallySelected: true },
      }));
  } catch {
    return [];
  }
}

export default async function PlanPage() {
  const cookieStore = await cookies();
  const planDraft = parsePlanDraft(cookieStore.get("today_what_outdoor_draft")?.value);
  const supabase = await createClient();
  let preferences: Record<string, unknown> | null = null;

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle();
      preferences = data;
    }
  }

  const region = typeof preferences?.default_region === "string" ? preferences.default_region : "부산";
  const budget = typeof preferences?.budget_level === "number" ? preferences.budget_level : 50000;
  const interests = Array.isArray(preferences?.interests) ? preferences.interests.filter((v): v is string => typeof v === "string") : ["movie", "sports", "travel", "ott"];
  const favoriteTeams = Array.isArray(preferences?.favorite_teams) ? preferences.favorite_teams.filter((v): v is string => typeof v === "string") : ["롯데"];
  const startTime = currentKoreanTime();
  const startLocation = getRegionLocation(region);
  const weather = await getWeather(region, startLocation);
  const tourItems = await getTours(region);
  const liveTours = tourItems.map(tourToActivity);
  const ottServices = Array.isArray(preferences?.ott_services) ? preferences.ott_services.filter((v): v is string => typeof v === "string") : [];
  const liveOtt = await getOttActivities(ottServices);

  const condition = {
    region,
    startTime,
    endTime: "23:00",
    budget,
    raining: weather.raining,
    companion: typeof preferences?.companion_type === "string" ? preferences.companion_type : "alone",
    interests,
    favoriteTeams,
    preferredActivityMode: (preferences?.activity_mode === "indoor" || preferences?.activity_mode === "outdoor") ? preferences.activity_mode : "balanced",
    transportMode: (preferences?.transport_mode === "walk" || preferences?.transport_mode === "transit") ? preferences.transport_mode : "car",
    ottServices,
  };

  const baseActivities = sampleActivities.filter((activity) =>
    (liveTours.length ? activity.type !== "tour" : true) &&
    (liveOtt.length ? activity.type !== "ott" : true)
  );
  const draftIds = new Set(planDraft.map((activity) => activity.id));
  const activities = [
    ...planDraft,
    ...baseActivities.filter((activity) => !draftIds.has(activity.id)),
    ...liveTours.filter((activity) => !draftIds.has(activity.id)),
    ...liveOtt.filter((activity) => !draftIds.has(activity.id)),
  ];
  const recommendations = recommendActivities(activities, condition);
  const baseOptions = createPlanOptions(recommendations, condition.startTime, condition.endTime, condition.budget);
  const options: PlanOption[] = await Promise.all(baseOptions.map(async (option) => ({
    ...option,
    plan: await enrichPlanWithTravel(option.plan, option.style, startLocation, condition.transportMode),
  })));

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 pb-24">
      <p className="text-sm font-bold text-neutral-500">DAY 20 COMPLETE</p>
      <h1 className="mt-1 text-4xl font-black">오늘 일정 A/B/C</h1>
      <p className="mt-3 text-neutral-600">개인 취향·날씨·관광/OTT Provider·이동 동선을 반영합니다. /outdoor 또는 /home에서 직접 추가한 활동은 일정 후보에서 우선 반영됩니다.</p>
      {planDraft.length > 0 ? <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">직접 선택한 활동 {planDraft.length}개를 일정 후보에 우선 반영했습니다.</div> : null}

      <section className="mt-8 grid gap-3 rounded-3xl bg-neutral-900 p-6 text-white sm:grid-cols-4">
        <div><p className="text-xs text-white/50">지역</p><strong>{condition.region}</strong></div>
        <div><p className="text-xs text-white/50">시간</p><strong>{condition.startTime}~{condition.endTime}</strong></div>
        <div><p className="text-xs text-white/50">날씨</p><strong>{weather.condition} {Math.round(weather.temperature)}℃</strong></div>
        <div><p className="text-xs text-white/50">예산</p><strong>{condition.budget.toLocaleString()}원</strong><p className="mt-1 text-[11px] text-white/50">{condition.preferredActivityMode === "indoor" ? "실내 선호" : condition.preferredActivityMode === "outdoor" ? "실외 선호" : "균형 선호"} · {condition.transportMode === "walk" ? "도보" : condition.transportMode === "transit" ? "대중교통" : "자동차"}</p></div>
      </section>

      <div className="mt-8 space-y-10">
        {options.map((option) => (
          <PlanOptionCard
            key={option.id}
            option={option}
            candidates={recommendations.slice(0, 30)}
            region={condition.region}
            budget={condition.budget}
            startLocation={startLocation}
            preferredTransportMode={condition.transportMode}
          />
        ))}
      </div>
    </main>
  );
}
