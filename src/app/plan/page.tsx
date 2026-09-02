import { sampleActivities } from "@/data/sampleActivities";
import { PLAN_STYLES, rankActivitiesForStyle } from "@/lib/plan/createPlanOptions";
import { createTravelAwarePlan, type TravelRouteCache } from "@/lib/plan/createTravelAwarePlan";
import { recommendActivities } from "@/lib/recommendation/recommend";
import { createClient } from "@/lib/supabase/server";
import { getRegionLocation } from "@/lib/location/regionCoordinates";
import type { PlanOption } from "@/types/plan";
import PlanOptionCard from "./PlanOptionCard";
import PlanDraftSummary from "./PlanDraftSummary";
import { getPlanDraftCookieName } from "@/lib/plan/draftCookie";
import { getWeather } from "@/lib/api/weather/getWeather";
import { getTours } from "@/lib/api/tour/getTours";
import { tourToActivity } from "@/lib/api/tour/tourToActivity";
import { getOttActivities } from "@/lib/api/tmdb/getOttActivities";
import { cookies } from "next/headers";
import type { Activity } from "@/types/activity";
import type { RecommendationCondition } from "@/types/recommendation";
import type { UserTransportMode } from "@/types/preferences";
import { decodePlanDraft } from "@/lib/plan/draftCodec";

function validTime(value: string | undefined, fallback: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value ?? "") ? value! : fallback;
}

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ start?: string; end?: string }> }) {
  const query = await searchParams;
  const cookieStore = await cookies();
  const supabase = await createClient();
  let preferences: Record<string, unknown> | null = null;
  let userId: string | null = null;

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
    if (user) {
      const { data } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle();
      preferences = data;
    }
  }

  const planDraft = decodePlanDraft(cookieStore.get(getPlanDraftCookieName(userId))?.value);

  const region = typeof preferences?.default_region === "string" ? preferences.default_region : "부산";
  const budget = typeof preferences?.budget_level === "number" ? preferences.budget_level : 50000;
  const interests = Array.isArray(preferences?.interests) ? preferences.interests.filter((v): v is string => typeof v === "string") : ["movie", "sports", "travel", "ott"];
  const favoriteTeams = Array.isArray(preferences?.favorite_teams) ? preferences.favorite_teams.filter((v): v is string => typeof v === "string") : ["롯데"];
  const startTime = validTime(query.start, "06:00");
  const requestedEndTime = validTime(query.end, "23:00");
  const endTime = requestedEndTime > startTime ? requestedEndTime : "23:59";
  const startLocation = getRegionLocation(region);
  const ottServices = Array.isArray(preferences?.ott_services) ? preferences.ott_services.filter((v): v is string => typeof v === "string") : [];
  const [weather, tourItems, liveOtt] = await Promise.all([
    getWeather(region, startLocation, startTime, endTime),
    getTours(region),
    getOttActivities(ottServices),
  ]);
  const liveTours = tourItems.map(tourToActivity);

  const transportMode: UserTransportMode =
    preferences?.transport_mode === "walk" || preferences?.transport_mode === "transit"
      ? preferences.transport_mode
      : "car";

  const condition: RecommendationCondition = {
    region,
    startTime,
    endTime,
    budget,
    raining: weather.raining,
    companion: typeof preferences?.companion_type === "string" ? preferences.companion_type : "alone",
    interests,
    favoriteTeams,
    preferredActivityMode:
      preferences?.activity_mode === "indoor" || preferences?.activity_mode === "outdoor"
        ? preferences.activity_mode
        : "balanced",
    transportMode,
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
  const sharedRouteCache: TravelRouteCache = new Map();
  const options: PlanOption[] = await Promise.all(PLAN_STYLES.map(async (option) => {
    const ranked = rankActivitiesForStyle(recommendations, option.style);
    const result = await createTravelAwarePlan(
      ranked, condition.startTime, condition.endTime, condition.budget,
      option.style, startLocation, transportMode, sharedRouteCache,
    );
    return { ...option, id: option.style, plan: result.plan, draftFailures: result.draftFailures };
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 pb-24">
      <p className="text-sm font-bold text-neutral-500">DAY 20 COMPLETE</p>
      <h1 className="mt-1 text-4xl font-black">오늘 일정 A/B/C</h1>
      <p className="mt-3 text-neutral-600">개인 취향·날씨·관광/OTT Provider·이동 동선을 반영합니다. /outdoor 또는 /home에서 직접 추가한 활동은 일정 후보에서 우선 반영됩니다.</p>
      <PlanDraftSummary items={planDraft.map((activity) => ({ id: activity.id, title: activity.title, type: activity.type, location: activity.location }))} />

      <form method="get" className="mt-6 grid gap-3 rounded-3xl border bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-sm font-black">일정 시작
          <input type="time" name="start" defaultValue={condition.startTime} className="mt-2 block w-full rounded-2xl border px-4 py-3 font-normal" />
        </label>
        <label className="text-sm font-black">일정 종료
          <input type="time" name="end" defaultValue={condition.endTime} className="mt-2 block w-full rounded-2xl border px-4 py-3 font-normal" />
        </label>
        <button className="rounded-2xl bg-neutral-900 px-5 py-3 font-black text-white">이 시간으로 다시 짜기</button>
      </form>

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
            selectedDraftIds={[...draftIds]}
          />
        ))}
      </div>
    </main>
  );
}
