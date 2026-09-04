import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PreferencesForm from "./PreferencesForm";
import SubpageHero from "@/components/layout/SubpageHero";

export default async function PreferencesPage() {
  const supabase = await createClient();
  if (!supabase) return <main className="mx-auto max-w-2xl px-4 py-12"><h1 className="text-3xl font-black">Supabase 설정이 필요합니다.</h1></main>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle();
  return <main className="mx-auto max-w-3xl px-4 py-8 pb-24"><SubpageHero eyebrow="MY PREFERENCES" title="나의 추천 설정" description="지역·예산·취향을 한 번 저장하면 다음 일정부터 나에게 맞춰 추천해드려요." icon="⚙" tone="violet" /><PreferencesForm initialData={data} /></main>;
}
