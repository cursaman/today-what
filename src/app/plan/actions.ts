"use server";

import { createClient } from "@/lib/supabase/server";

export interface SavePlanInput {
  title: string;
  style: string;
  region: string;
  startTime: string;
  endTime: string;
  totalCost: number;
  totalDistanceKm: number;
  totalTravelMinutes: number;
  items: Array<{
    activityId: string;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    fixedTime: boolean;
    durationMinutes: number;
    cost: number;
    latitude?: number;
    longitude?: number;
    travelMinutes?: number;
    distanceKm?: number;
    transportMode?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export async function savePlan(input: SavePlanInput) {
  const supabase = await createClient();
  if (!supabase) return { success: false, message: "Supabase 환경변수를 먼저 설정해주세요." };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, message: "일정을 저장하려면 먼저 로그인해주세요." };

  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!input || input.title.trim().length < 1 || input.title.length > 80 || input.region.length > 50 ||
      !["outdoor", "balanced", "relaxed"].includes(input.style) || !timePattern.test(input.startTime) || !timePattern.test(input.endTime) ||
      !Number.isFinite(input.totalCost) || input.totalCost < 0 || input.items.length > 30 ||
      input.items.some((item) => !item.activityId || item.activityId.length > 200 || !item.title || item.title.length > 200 ||
        !timePattern.test(item.startTime) || !timePattern.test(item.endTime) || !Number.isFinite(item.cost) || item.cost < 0 ||
        !Number.isFinite(item.durationMinutes) || item.durationMinutes <= 0 || item.durationMinutes > 1440 ||
        JSON.stringify(item.metadata ?? {}).length > 10_000)) {
    return { success: false, message: "저장할 일정 데이터가 올바르지 않습니다." };
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .insert({
      user_id: user.id,
      title: input.title,
      style: input.style,
      region: input.region,
      start_time: input.startTime,
      end_time: input.endTime,
      total_cost: input.totalCost,
      total_distance_km: input.totalDistanceKm,
      total_travel_minutes: input.totalTravelMinutes,
    })
    .select("id")
    .single();

  if (planError || !plan) return { success: false, message: planError?.message ?? "일정 저장에 실패했습니다." };

  if (input.items.length) {
    const { error: itemError } = await supabase.from("plan_items").insert(
      input.items.map((item, index) => ({
        plan_id: plan.id,
        activity_id: item.activityId,
        title: item.title,
        activity_type: item.type,
        start_time: item.startTime,
        end_time: item.endTime,
        fixed_time: item.fixedTime,
        duration_minutes: item.durationMinutes,
        cost: item.cost,
        sort_order: index,
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
        travel_minutes: item.travelMinutes ?? 0,
        distance_km: item.distanceKm ?? 0,
        transport_mode: item.transportMode ?? "estimate",
        metadata: item.metadata ?? {},
      }))
    );

    if (itemError) {
      const { error: rollbackError } = await supabase.from("plans").delete().eq("id", plan.id).eq("user_id", user.id);
      return { success: false, message: rollbackError ? `${itemError.message} (정리 실패: ${rollbackError.message})` : itemError.message };
    }
  }

  return { success: true, planId: plan.id, message: "MY 일정에 저장했습니다." };
}
