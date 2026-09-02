import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";
import PlanList, { type MyPlanSummary } from "./PlanList";

export default async function MyPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 pb-24">
        <h1 className="text-3xl font-black">Supabase 설정이 필요합니다.</h1>
        <p className="mt-3 text-neutral-600">
          Vercel 환경변수에 Supabase URL과 Publishable Key를 등록하세요.
        </p>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: plans, error } = await supabase
    .from("plans")
    .select(
      `id,title,style,region,plan_date,total_cost,total_distance_km,total_travel_minutes,created_at,plan_items(id,title,start_time,end_time,sort_order)`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-neutral-500">MY</p>
          <h1 className="mt-1 text-4xl font-black">나의 일정</h1>
          <p className="mt-2 text-sm text-neutral-500">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/my/preferences" className="rounded-full border px-4 py-2 text-sm font-bold">
            추천 설정
          </Link>
          <form action={logout}>
            <button className="rounded-full border px-4 py-2 text-sm font-bold">로그아웃</button>
          </form>
        </div>
      </div>

      {error && <p className="mt-6 rounded-2xl bg-rose-50 p-4 text-rose-700">{error.message}</p>}

      {!plans?.length && !error && (
        <div className="mt-8 rounded-3xl border border-dashed p-10 text-center">
          <p className="text-neutral-500">아직 저장한 일정이 없습니다.</p>
          <Link href="/plan" className="mt-4 inline-block rounded-full bg-neutral-900 px-5 py-3 font-black text-white">
            일정 만들기
          </Link>
        </div>
      )}

      {plans?.length ? <PlanList plans={plans as MyPlanSummary[]} /> : null}
    </main>
  );
}
