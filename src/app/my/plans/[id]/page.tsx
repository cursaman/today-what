import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DailyPlanMap from "@/components/map/DailyPlanMap";
import { getRegionLocation } from "@/lib/location/regionCoordinates";
import type { PlanItem } from "@/types/plan";
import type { ActivityType } from "@/types/activity";
import { deletePlan, replacePlanItem, updatePlanTitle } from "./actions";
import { sampleActivities } from "@/data/sampleActivities";
import { minutesToTime, timeToMinutes } from "@/lib/plan/timeUtils";
import SubpageHero from "@/components/layout/SubpageHero";

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const planId = Number(id);
  if (!Number.isFinite(planId)) notFound();

  const supabase = await createClient();
  if (!supabase) return <main className="mx-auto max-w-4xl px-4 py-12"><h1 className="text-3xl font-black">Supabase 설정이 필요합니다.</h1></main>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: plan, error } = await supabase.from("plans").select(`id,title,style,region,plan_date,total_cost,total_distance_km,total_travel_minutes,start_time,end_time,plan_items(id,activity_id,title,activity_type,start_time,end_time,fixed_time,duration_minutes,cost,sort_order,latitude,longitude,travel_minutes,distance_km,transport_mode,metadata)`).eq("id", planId).eq("user_id", user.id).maybeSingle();
  if (error || !plan) notFound();

  const dbItems = [...(plan.plan_items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const items: PlanItem[] = dbItems.map((item) => ({
    activity: {
      id: item.activity_id,
      type: item.activity_type as ActivityType,
      title: item.title,
      durationMinutes: Number(item.duration_minutes ?? Math.max(1, timeToMinutes(item.end_time) - timeToMinutes(item.start_time))),
      fixedTime: item.fixed_time,
      indoor: false,
      cost: Number(item.cost ?? 0),
      location: typeof item.metadata?.location === "string" ? item.metadata.location : undefined,
      coordinates: item.latitude != null && item.longitude != null ? { latitude: Number(item.latitude), longitude: Number(item.longitude) } : undefined,
      interests: [],
      source: "saved",
      metadata: item.metadata ?? {},
    },
    startTime: item.start_time,
    endTime: item.end_time,
    fixedTime: item.fixed_time,
    travelFromPreviousMinutes: Number(item.travel_minutes ?? 0),
    distanceFromPreviousKm: Number(item.distance_km ?? 0),
    transportMode: item.transport_mode ?? "estimate",
  }));
  const itemTravelMinutes = items.reduce((total, item) => total + (item.travelFromPreviousMinutes ?? 0), 0);
  const itemDistanceKm = items.reduce((total, item) => total + (item.distanceFromPreviousKm ?? 0), 0);
  const returnTravelMinutes = Math.max(0, Number(plan.total_travel_minutes ?? 0) - itemTravelMinutes);
  const returnDistanceKm = Math.max(0, Number(plan.total_distance_km ?? 0) - itemDistanceKm);
  const lastEndTime = items.at(-1)?.endTime ?? plan.start_time;
  const estimatedReturnTime = minutesToTime(timeToMinutes(lastEndTime) + returnTravelMinutes);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 pb-24">
      <Link href="/my" className="text-sm font-bold text-neutral-500">← MY 일정</Link>
      <div className="mt-5"><SubpageHero eyebrow={`${plan.region} · ${plan.plan_date}`} title={plan.title} description={`${plan.style === "outdoor" ? "A · 밖에서 즐기기" : plan.style === "relaxed" ? "C · 편하게 보내기" : "B · 적당히 즐기기"} · ${Number(plan.total_distance_km ?? 0).toFixed(1)}km · 이동 ${Number(plan.total_travel_minutes ?? 0)}분 · ${Number(plan.total_cost ?? 0).toLocaleString()}원`} icon="▦" tone="sky" /></div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3">{items.map((item, index) => <div key={`${item.activity.id}-${index}`} className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs font-bold text-neutral-400">↓ 이동 {item.travelFromPreviousMinutes ?? 0}분 · {(item.distanceFromPreviousKm ?? 0).toFixed(1)}km</p><strong>{item.startTime} ~ {item.endTime}</strong><p className="mt-1 font-black">{item.activity.title}</p>{!item.fixedTime && dbItems[index] ? <div className="mt-3 flex flex-wrap gap-2">{sampleActivities.filter((candidate) => !candidate.fixedTime && candidate.id !== item.activity.id).slice(0, 3).map((candidate) => <form key={candidate.id} action={replacePlanItem.bind(null, planId, Number(dbItems[index].id), candidate.id)}><button className="rounded-full border px-3 py-1.5 text-xs font-bold">{candidate.title}로 교체</button></form>)}</div> : null}</div>)}{returnTravelMinutes > 0 ? <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-bold text-blue-600">↓ 귀가 {returnTravelMinutes}분 · {returnDistanceKm.toFixed(1)}km</p><strong className="mt-2 block">{lastEndTime} ~ {estimatedReturnTime}</strong><p className="mt-1 font-black">귀가</p></div> : null}</div>
        <DailyPlanMap items={items} startLocation={getRegionLocation(plan.region ?? "부산")} returnTravelMinutes={returnTravelMinutes} />
      </div>

      <section className="mt-8 grid gap-4 rounded-3xl bg-white p-6 sm:grid-cols-2">
        <form action={updatePlanTitle.bind(null, planId)}><label className="text-sm font-bold">일정 제목 수정</label><div className="mt-2 flex gap-2"><input name="title" defaultValue={plan.title} className="min-w-0 flex-1 rounded-2xl border p-3" /><button className="rounded-2xl bg-neutral-900 px-4 font-black text-white">수정</button></div></form>
        <form action={deletePlan.bind(null, planId)} className="flex items-end justify-end"><button className="rounded-2xl border border-rose-200 px-5 py-3 font-black text-rose-700">이 일정 삭제</button></form>
      </section>
    </main>
  );
}
