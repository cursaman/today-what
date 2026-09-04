import { createClient } from "@/lib/supabase/server";
import HomeExplorer from "./HomeExplorer";
import SubpageHero from "@/components/layout/SubpageHero";

export const dynamic = "force-dynamic";

export default async function HomeActivityPage() {
  const supabase = await createClient();
  let initialServices: string[] = [];

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("user_preferences")
        .select("ott_services")
        .eq("user_id", user.id)
        .maybeSingle();

      if (Array.isArray(data?.ott_services)) {
        initialServices = data.ott_services.filter((value): value is string => typeof value === "string");
      }
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 pb-24">
      <SubpageHero eyebrow="AT HOME · REAL OTT" title="집에서 뭐하지?" description="내가 이용하는 OTT와 취향을 조합해 오늘 집에서 즐길 영화를 찾고 일정에 바로 담아보세요." icon="⌂" tone="coral" />
      <HomeExplorer initialServices={initialServices} />
    </main>
  );
}
