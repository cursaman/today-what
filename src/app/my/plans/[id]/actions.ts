"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sampleActivities } from "@/data/sampleActivities";

export async function updatePlanTitle(planId: number, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const supabase = await createClient();
  if (!supabase) return;
  await supabase.from("plans").update({ title }).eq("id", planId);
  revalidatePath(`/my/plans/${planId}`);
  revalidatePath("/my");
}

export async function replacePlanItem(planId: number, itemId: number, activityId: string) {
  const replacement = sampleActivities.find((activity) => activity.id === activityId);
  const supabase = await createClient();
  if (!supabase || !replacement) return;

  await supabase.from("plan_items").update({
    activity_id: replacement.id,
    title: replacement.title,
    activity_type: replacement.type,
    fixed_time: replacement.fixedTime,
    cost: replacement.cost,
    latitude: replacement.coordinates?.latitude ?? null,
    longitude: replacement.coordinates?.longitude ?? null,
    metadata: { ...(replacement.metadata ?? {}), location: replacement.location ?? null },
  }).eq("id", itemId).eq("plan_id", planId);

  const { data: items } = await supabase.from("plan_items").select("cost").eq("plan_id", planId);
  const totalCost = (items ?? []).reduce((sum, item) => sum + Number(item.cost ?? 0), 0);
  await supabase.from("plans").update({ total_cost: totalCost }).eq("id", planId);

  revalidatePath(`/my/plans/${planId}`);
  revalidatePath("/my");
}

export async function deletePlan(planId: number) {
  const supabase = await createClient();
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/my/plans/${planId}?deleteError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/my");
  redirect("/my");
}
