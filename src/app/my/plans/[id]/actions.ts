"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sampleActivities } from "@/data/sampleActivities";
import { calculateDistanceKm } from "@/lib/location/calculateDistance";
import { estimateTravelMinutes } from "@/lib/location/estimateTravelTime";
import { getRegionLocation } from "@/lib/location/regionCoordinates";

async function getOwnedPlan(planId: number) {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null, plan: null };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, plan: null };

  const { data: plan } = await supabase
    .from("plans")
    .select("id,user_id,region")
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

  const { data: target } = await supabase
    .from("plan_items")
    .select("id,plan_id,fixed_time,start_time,end_time")
    .eq("id", itemId)
    .eq("plan_id", planId)
    .maybeSingle();

  if (!target || target.fixed_time) return;

  await supabase
    .from("plan_items")
    .update({
      activity_id: replacement.id,
      title: replacement.title,
      activity_type: replacement.type,
      fixed_time: replacement.fixedTime,
      cost: replacement.cost,
      latitude: replacement.coordinates?.latitude ?? null,
      longitude: replacement.coordinates?.longitude ?? null,
      metadata: { ...(replacement.metadata ?? {}), location: replacement.location ?? null },
    })
    .eq("id", itemId)
    .eq("plan_id", planId);

  const { data: items } = await supabase
    .from("plan_items")
    .select("id,cost,sort_order,latitude,longitude,metadata")
    .eq("plan_id", planId)
    .order("sort_order", { ascending: true });

  const start = getRegionLocation(plan.region ?? "부산");
  let previous = { latitude: start.latitude, longitude: start.longitude };
  let totalCost = 0;
  let totalDistanceKm = 0;
  let totalTravelMinutes = 0;

  for (const item of items ?? []) {
    totalCost += Number(item.cost ?? 0);
    const location = typeof item.metadata?.location === "string" ? item.metadata.location : "";
    const isHome = location === "집";
    let distanceKm = 0;
    let travelMinutes = 0;

    if (!isHome && item.latitude != null && item.longitude != null) {
      const current = { latitude: Number(item.latitude), longitude: Number(item.longitude) };
      distanceKm = calculateDistanceKm(previous.latitude, previous.longitude, current.latitude, current.longitude);
      travelMinutes = estimateTravelMinutes(distanceKm);
      previous = current;
    }

    totalDistanceKm += distanceKm;
    totalTravelMinutes += travelMinutes;

    await supabase
      .from("plan_items")
      .update({ distance_km: Number(distanceKm.toFixed(2)), travel_minutes: travelMinutes, transport_mode: "estimate" })
      .eq("id", item.id)
      .eq("plan_id", planId);
  }

  await supabase
    .from("plans")
    .update({
      total_cost: totalCost,
      total_distance_km: Number(totalDistanceKm.toFixed(2)),
      total_travel_minutes: totalTravelMinutes,
    })
    .eq("id", planId)
    .eq("user_id", user.id);

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
