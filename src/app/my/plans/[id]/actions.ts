"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sampleActivities } from "@/data/sampleActivities";
import { getRegionLocation } from "@/lib/location/regionCoordinates";
import { createTravelAwarePlan } from "@/lib/plan/createTravelAwarePlan";
import { timeToMinutes } from "@/lib/plan/timeUtils";
import type { Activity, ActivityType } from "@/types/activity";
import type { PlanStyle } from "@/types/plan";
import type { UserTransportMode } from "@/types/preferences";

async function getOwnedPlan(planId: number) {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null, plan: null };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, plan: null };

  const { data: plan } = await supabase
    .from("plans")
    .select("id,user_id,region,style,start_time,end_time,total_cost")
    .eq("id", planId)
    .eq("user_id", user.id)
    .maybeSingle();

  return { supabase, user, plan };
}

export async function updatePlanTitle(planId: number, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  if (!title) return;

  const { supabase, user, plan } = await getOwnedPlan(planId);
  if (!supabase || !user) redirect("/login");
  if (!plan) redirect("/my");

  await supabase.from("plans").update({ title }).eq("id", planId).eq("user_id", user.id);
  revalidatePath(`/my/plans/${planId}`);
  revalidatePath("/my");
}

export async function replacePlanItem(planId: number, itemId: number, activityId: string) {
  const replacement = sampleActivities.find((activity) => activity.id === activityId);
  if (!replacement) return;

  const { supabase, user, plan } = await getOwnedPlan(planId);
  if (!supabase || !user) redirect("/login");
  if (!plan) redirect("/my");

  const { data: dbItems } = await supabase
    .from("plan_items")
    .select("id,activity_id,title,activity_type,start_time,end_time,fixed_time,duration_minutes,cost,sort_order,latitude,longitude,travel_minutes,distance_km,transport_mode,metadata")
    .eq("plan_id", planId)
    .order("sort_order", { ascending: true });

  const target = dbItems?.find((item) => Number(item.id) === itemId);
  if (!target || target.fixed_time) return;
  const activities: Activity[] = (dbItems ?? []).map((item) => {
    if (Number(item.id) === itemId) return { ...replacement, metadata: { ...replacement.metadata, manuallySelected: true } };
    const durationMinutes = Number(item.duration_minutes ?? Math.max(1, timeToMinutes(item.end_time) - timeToMinutes(item.start_time)));
    return {
      id: item.activity_id,
      type: item.activity_type as ActivityType,
      title: item.title,
      startAt: item.fixed_time ? item.start_time : undefined,
      durationMinutes,
      fixedTime: item.fixed_time,
      indoor: typeof item.metadata?.indoor === "boolean" ? item.metadata.indoor : item.metadata?.location === "집",
      cost: Number(item.cost ?? 0),
      location: typeof item.metadata?.location === "string" ? item.metadata.location : undefined,
      coordinates: item.latitude != null && item.longitude != null ? { latitude: Number(item.latitude), longitude: Number(item.longitude) } : undefined,
      interests: [], source: "saved", metadata: { ...(item.metadata ?? {}), manuallySelected: true },
    };
  });
  const transportMode: UserTransportMode = dbItems?.[0]?.transport_mode === "walk" || dbItems?.[0]?.transport_mode === "transit" ? dbItems[0].transport_mode : "car";
  const recalculated = await createTravelAwarePlan(
    activities, plan.start_time, plan.end_time, Number.MAX_SAFE_INTEGER,
    (plan.style as PlanStyle) ?? "balanced", getRegionLocation(plan.region ?? "부산"), transportMode,
  );
  if (recalculated.plan.items.length !== dbItems?.length) throw new Error("교체 활동을 현재 일정 시간에 배치할 수 없습니다.");

  const results = await Promise.all(recalculated.plan.items.map((item, index) => supabase
    .from("plan_items")
    .update({
      activity_id: item.activity.id, title: item.activity.title, activity_type: item.activity.type,
      start_time: item.startTime, end_time: item.endTime, fixed_time: item.fixedTime,
      duration_minutes: item.activity.durationMinutes, cost: item.activity.cost, sort_order: index,
      latitude: item.activity.coordinates?.latitude ?? null, longitude: item.activity.coordinates?.longitude ?? null,
      travel_minutes: item.travelFromPreviousMinutes ?? 0, distance_km: item.distanceFromPreviousKm ?? 0,
      transport_mode: item.transportMode ?? "estimate",
      metadata: { ...(item.activity.metadata ?? {}), manuallySelected: undefined, location: item.activity.location ?? null },
    })
    .eq("id", dbItems[index].id)
    .eq("plan_id", planId)));
  const itemsError = results.find((result) => result.error)?.error;
  if (itemsError) throw new Error(`활동 교체 실패: ${itemsError.message}`);

  const { error: planError } = await supabase
    .from("plans")
    .update({
      total_cost: recalculated.plan.totalCost,
      total_distance_km: Number(recalculated.plan.totalDistanceKm.toFixed(2)),
      total_travel_minutes: recalculated.plan.totalTravelMinutes,
    })
    .eq("id", planId)
    .eq("user_id", user.id);
  if (planError) throw new Error(`일정 합계 갱신 실패: ${planError.message}`);

  revalidatePath(`/my/plans/${planId}`);
  revalidatePath("/my");
}

export async function deletePlan(planId: number) {
  const { supabase, user, plan } = await getOwnedPlan(planId);
  if (!supabase || !user) redirect("/login");
  if (!plan) redirect("/my");

  const { error } = await supabase.from("plans").delete().eq("id", planId).eq("user_id", user.id);
  if (error) redirect(`/my/plans/${planId}?deleteError=${encodeURIComponent(error.message)}`);

  revalidatePath("/my");
  redirect("/my");
}
