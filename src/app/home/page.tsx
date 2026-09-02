import { createClient } from "@/lib/supabase/server";
import HomeExplorer from "./HomeExplorer";

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
    <main className="mx-auto max-w-6xl px-4 py-12 pb-24">
      <p className="text-sm font-bold text-neutral-500">HOME · REAL OTT</p>
      <h1 className="mt-1 text-4xl font-black">집에서 뭐하지?</h1>
      <p className="mt-3 max-w-3xl text-neutral-600">
        TMDB의 영화 정보와 한국 OTT 구독 제공 정보를 조합합니다. 내가 이용하는 OTT를 고르고 마음에 드는 영화를 오늘 일정에 바로 넣을 수 있습니다.
      </p>
      <HomeExplorer initialServices={initialServices} />
    </main>
  );
}
