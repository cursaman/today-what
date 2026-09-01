"use server";

import { createClient } from "@/lib/supabase/server";

export interface SavePlanInput {
  title: string;
  style: string;
  region: string;
  startTime: string;
  endTime: string;
  totalCost: number;
  items: Array<{
    activityId: string;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    fixedTime: boolean;
    cost: number;
  }>;
}

export async function savePlan(input: SavePlanInput) {
  const supabase = await createClient();
  if (!supabase) return { success: false, message: "Supabase 환경변수를 먼저 설정해주세요." };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, message: "일정을 저장하려면 먼저 로그인해주세요." };

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
    })
    .select("id")
    .single();

  if (planError || !plan) {
    return { success: false, message: planError?.message ?? "일정 저장에 실패했습니다." };
  }

  if (input.items.length > 0) {
    const { error: itemError } = await supabase.from("plan_items").insert(
      input.items.map((item, index) => ({
        plan_id: plan.id,
        activity_id: item.activityId,
        title: item.title,
        activity_type: item.type,
        start_time: item.startTime,
        end_time: item.endTime,
        fixed_time: item.fixedTime,
        cost: item.cost,
        sort_order: index,
      }))
    );

    if (itemError) {
      await supabase.from("plans").delete().eq("id", plan.id);
      return { success: false, message: itemError.message };
    }
  }

  return { success: true, planId: plan.id, message: "MY 일정에 저장했습니다." };
}
