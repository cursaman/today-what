import { sampleActivities } from "@/data/sampleActivities";
import { createPlanOptions } from "@/lib/plan/createPlanOptions";
<<<<<<< HEAD
import { recommendActivities } from "@/lib/recommendation/recommend";
import SavePlanButton from "./SavePlanButton";

export default function PlanPage() {
  const condition = {
    region: "부산",
    startTime: "13:00",
    endTime: "23:00",
    budget: 50000,
    raining: true,
    companion: "couple",
    interests: ["movie", "sports", "travel", "ott"],
    favoriteTeams: ["롯데"],
  };

  const recommendations = recommendActivities(sampleActivities, condition);
  const options = createPlanOptions(
    recommendations,
    condition.startTime,
    condition.endTime,
    condition.budget
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 pb-24">
      <p className="text-sm font-bold text-neutral-500">DAY 11 + DAY 12</p>
      <h1 className="mt-1 text-4xl font-black">오늘 일정 A/B/C</h1>
      <p className="mt-3 text-neutral-600">마음에 드는 일정을 선택해 Supabase의 MY 일정에 저장합니다.</p>
=======
import { enrichPlanWithTravel } from "@/lib/plan/enrichPlanWithTravel";
import { recommendActivities } from "@/lib/recommendation/recommend";
import { createClient } from "@/lib/supabase/server";
import { getRegionLocation } from "@/lib/location/regionCoordinates";
import DailyPlanMap from "@/components/map/DailyPlanMap";
import type { PlanOption } from "@/types/plan";
import SavePlanButton from "./SavePlanButton";
import { getWeather } from "@/lib/api/weather/getWeather";
import { getTours } from "@/lib/api/tour/getTours";
import { tourToActivity } from "@/lib/api/tour/tourToActivity";
import { getOttActivities } from "@/lib/api/tmdb/getOttActivities";

function currentKoreanTime() {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date()).replace("24:", "00:");
}

export default async function PlanPage() {
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
  };

  const baseActivities = sampleActivities.filter((activity) =>
    (liveTours.length ? activity.type !== "tour" : true) &&
    (liveOtt.length ? activity.type !== "ott" : true)
  );
  const activities = [...baseActivities, ...liveTours, ...liveOtt];
  const recommendations = recommendActivities(activities, condition);
  const baseOptions = createPlanOptions(recommendations, condition.startTime, condition.endTime, condition.budget);
  const options: PlanOption[] = await Promise.all(baseOptions.map(async (option) => ({
    ...option,
    plan: await enrichPlanWithTravel(option.plan, option.style, startLocation),
  })));

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 pb-24">
      <p className="text-sm font-bold text-neutral-500">DAY 20 COMPLETE</p>
      <h1 className="mt-1 text-4xl font-black">오늘 일정 A/B/C</h1>
      <p className="mt-3 text-neutral-600">개인 취향·날씨·관광/OTT Provider·이동 동선을 반영합니다. API 키가 없으면 샘플 데이터로 자동 대체됩니다.</p>
>>>>>>> 89392e5 (20일차 전체 기능 구현)

      <section className="mt-8 grid gap-3 rounded-3xl bg-neutral-900 p-6 text-white sm:grid-cols-4">
        <div><p className="text-xs text-white/50">지역</p><strong>{condition.region}</strong></div>
        <div><p className="text-xs text-white/50">시간</p><strong>{condition.startTime}~{condition.endTime}</strong></div>
<<<<<<< HEAD
        <div><p className="text-xs text-white/50">날씨</p><strong>{condition.raining ? "비" : "맑음"}</strong></div>
        <div><p className="text-xs text-white/50">예산</p><strong>{condition.budget.toLocaleString()}원</strong></div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {options.map((option) => (
          <article key={option.id} className="flex flex-col rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-neutral-400">{option.style}</p>
            <h2 className="mt-1 text-2xl font-black">{option.title}</h2>
            <p className="mt-2 min-h-10 text-sm text-neutral-500">{option.description}</p>

            <div className="mt-6 space-y-3">
              {option.plan.items.map((item, index) => (
                <div key={`${option.id}-${item.activity.id}-${index}`} className="rounded-2xl bg-neutral-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <strong>{item.startTime} ~ {item.endTime}</strong>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold">
                      {item.fixedTime ? "시간 고정" : "조정 가능"}
                    </span>
                  </div>
                  <p className="mt-1 font-black">{item.activity.title}</p>
                  <p className="mt-1 text-xs text-neutral-500">{item.activity.location ?? "장소 미정"} · {item.activity.cost.toLocaleString()}원</p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-5">
              <p className="text-right text-sm text-neutral-500">예상비용 <strong className="text-lg text-black">{option.plan.totalCost.toLocaleString()}원</strong></p>
=======
        <div><p className="text-xs text-white/50">날씨</p><strong>{weather.condition} {Math.round(weather.temperature)}℃</strong></div>
        <div><p className="text-xs text-white/50">예산</p><strong>{condition.budget.toLocaleString()}원</strong></div>
      </section>

      <div className="mt-8 space-y-10">
        {options.map((option) => (
          <article key={option.id} className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-wider text-neutral-400">{option.style}</p><h2 className="mt-1 text-2xl font-black">{option.title}</h2><p className="mt-2 text-sm text-neutral-500">{option.description}</p></div>
              <div className="grid grid-cols-3 gap-2 text-right text-xs sm:text-sm">
                <div><p className="text-neutral-400">비용</p><strong>{option.plan.totalCost.toLocaleString()}원</strong></div>
                <div><p className="text-neutral-400">이동</p><strong>{option.plan.totalTravelMinutes}분</strong></div>
                <div><p className="text-neutral-400">거리</p><strong>{option.plan.totalDistanceKm.toFixed(1)}km</strong></div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
              <div className="space-y-3">
                {option.plan.items.map((item, index) => (
                  <div key={`${option.id}-${item.activity.id}-${index}`} className="rounded-2xl bg-neutral-50 p-4">
                    {index > 0 || (item.travelFromPreviousMinutes ?? 0) > 0 ? <p className="mb-2 text-xs font-bold text-neutral-400">↓ 이동 {item.travelFromPreviousMinutes ?? 0}분 · {(item.distanceFromPreviousKm ?? 0).toFixed(1)}km</p> : null}
                    <div className="flex items-center justify-between gap-2"><strong>{item.startTime} ~ {item.endTime}</strong><span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold">{item.fixedTime ? "시간 고정" : "조정 가능"}</span></div>
                    <p className="mt-1 font-black">{item.activity.title}</p>
                    <p className="mt-1 text-xs text-neutral-500">{item.activity.location ?? "장소 미정"} · {item.activity.cost.toLocaleString()}원</p>
                  </div>
                ))}
              </div>
              <DailyPlanMap items={option.plan.items} startLocation={startLocation} />
            </div>

            <div className="ml-auto mt-6 max-w-sm">
>>>>>>> 89392e5 (20일차 전체 기능 구현)
              <SavePlanButton input={{
                title: option.title,
                style: option.style,
                region: condition.region,
                startTime: option.plan.startTime,
                endTime: option.plan.endTime,
                totalCost: option.plan.totalCost,
<<<<<<< HEAD
=======
                totalDistanceKm: option.plan.totalDistanceKm,
                totalTravelMinutes: option.plan.totalTravelMinutes,
>>>>>>> 89392e5 (20일차 전체 기능 구현)
                items: option.plan.items.map((item) => ({
                  activityId: item.activity.id,
                  title: item.activity.title,
                  type: item.activity.type,
                  startTime: item.startTime,
                  endTime: item.endTime,
                  fixedTime: item.fixedTime,
                  cost: item.activity.cost,
<<<<<<< HEAD
=======
                  latitude: item.activity.coordinates?.latitude,
                  longitude: item.activity.coordinates?.longitude,
                  travelMinutes: item.travelFromPreviousMinutes,
                  distanceKm: item.distanceFromPreviousKm,
                  transportMode: item.transportMode,
                  metadata: { ...(item.activity.metadata ?? {}), location: item.activity.location ?? null },
>>>>>>> 89392e5 (20일차 전체 기능 구현)
                })),
              }} />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
