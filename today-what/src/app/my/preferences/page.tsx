import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PreferencesForm from "./PreferencesForm";

export default async function PreferencesPage() {
  const supabase = await createClient();
  if (!supabase) return <main className="mx-auto max-w-2xl px-4 py-12"><h1 className="text-3xl font-black">Supabase 설정이 필요합니다.</h1></main>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle();
  return <main className="mx-auto max-w-2xl px-4 py-12 pb-24"><p className="text-sm font-bold text-neutral-500">DAY 14</p><h1 className="mt-1 text-4xl font-black">나의 추천 설정</h1><p className="mt-3 text-neutral-600">한 번 저장하면 다음 일정 생성부터 기본값으로 반영됩니다.</p><PreferencesForm initialData={data} /></main>;
}
