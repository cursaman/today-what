"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}

async function getAuthenticatedClient() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function deleteMyPlan(planId: number) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!supabase || !user) return { success: false, message: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", user.id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/my");
  return { success: true, message: "일정을 삭제했습니다." };
}

export async function deleteSelectedPlans(planIds: number[]) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!supabase || !user) return { success: false, message: "로그인이 필요합니다." };

  const ids = [...new Set(planIds)].filter((id) => Number.isFinite(id) && id > 0);
  if (!ids.length) return { success: false, message: "삭제할 일정을 선택해주세요." };

  const { error } = await supabase
    .from("plans")
    .delete()
    .in("id", ids)
    .eq("user_id", user.id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/my");
  return { success: true, message: `${ids.length}개의 일정을 삭제했습니다.` };
}
