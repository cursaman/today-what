import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

export default async function MyPage() {
  const supabase = await createClient();
<<<<<<< HEAD

  if (!supabase) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 pb-24">
        <h1 className="text-3xl font-black">Supabase 설정이 필요합니다.</h1>
        <p className="mt-3 text-neutral-600">Vercel 환경변수에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 등록하세요.</p>
      </main>
    );
  }
=======
  if (!supabase) return <main className="mx-auto max-w-3xl px-4 py-12 pb-24"><h1 className="text-3xl font-black">Supabase 설정이 필요합니다.</h1><p className="mt-3 text-neutral-600">Vercel 환경변수에 Supabase URL과 Publishable Key를 등록하세요.</p></main>;
>>>>>>> 89392e5 (20일차 전체 기능 구현)

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

<<<<<<< HEAD
  const { data: plans, error } = await supabase
    .from("plans")
    .select(`
      id,
      title,
      style,
      region,
      plan_date,
      total_cost,
      created_at,
      plan_items (
        id,
        title,
        activity_type,
        start_time,
        end_time,
        fixed_time,
        cost,
        sort_order
      )
    `)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-neutral-500">MY</p>
          <h1 className="mt-1 text-4xl font-black">나의 일정</h1>
          <p className="mt-2 text-sm text-neutral-500">{user.email}</p>
        </div>
        <form action={logout}><button className="rounded-full border px-4 py-2 text-sm font-bold">로그아웃</button></form>
      </div>

      {error && <p className="mt-6 rounded-2xl bg-rose-50 p-4 text-rose-700">{error.message}</p>}

      {!plans?.length && !error && (
        <div className="mt-8 rounded-3xl border border-dashed p-10 text-center">
          <p className="text-neutral-500">아직 저장한 일정이 없습니다.</p>
          <Link href="/plan" className="mt-4 inline-block rounded-full bg-neutral-900 px-5 py-3 font-black text-white">일정 만들기</Link>
        </div>
      )}

      <div className="mt-8 space-y-6">
        {plans?.map((plan) => {
          const items = [...(plan.plan_items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
          return (
            <article key={plan.id} className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black">{plan.title}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{plan.region} · {plan.plan_date}</p>
                </div>
                <strong>{Number(plan.total_cost ?? 0).toLocaleString()}원</strong>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {items.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-neutral-50 p-4">
                    <strong className="text-sm">{item.start_time} ~ {item.end_time}</strong>
                    <p className="mt-1 font-black">{item.title}</p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
=======
  const { data: plans, error } = await supabase.from("plans").select(`id,title,style,region,plan_date,total_cost,total_distance_km,total_travel_minutes,created_at,plan_items(id,title,start_time,end_time,sort_order)`).order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-neutral-500">MY</p><h1 className="mt-1 text-4xl font-black">나의 일정</h1><p className="mt-2 text-sm text-neutral-500">{user.email}</p></div><div className="flex gap-2"><Link href="/my/preferences" className="rounded-full border px-4 py-2 text-sm font-bold">추천 설정</Link><form action={logout}><button className="rounded-full border px-4 py-2 text-sm font-bold">로그아웃</button></form></div></div>
      {error && <p className="mt-6 rounded-2xl bg-rose-50 p-4 text-rose-700">{error.message}</p>}
      {!plans?.length && !error && <div className="mt-8 rounded-3xl border border-dashed p-10 text-center"><p className="text-neutral-500">아직 저장한 일정이 없습니다.</p><Link href="/plan" className="mt-4 inline-block rounded-full bg-neutral-900 px-5 py-3 font-black text-white">일정 만들기</Link></div>}
      <div className="mt-8 space-y-5">{plans?.map((plan) => { const items = [...(plan.plan_items ?? [])].sort((a, b) => a.sort_order - b.sort_order); return <Link href={`/my/plans/${plan.id}`} key={plan.id} className="block rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-black">{plan.title}</h2><p className="mt-1 text-sm text-neutral-500">{plan.region} · {plan.plan_date}</p></div><div className="text-right"><strong>{Number(plan.total_cost ?? 0).toLocaleString()}원</strong><p className="text-xs text-neutral-500">{Number(plan.total_distance_km ?? 0).toFixed(1)}km · {Number(plan.total_travel_minutes ?? 0)}분</p></div></div><div className="mt-4 flex flex-wrap gap-2">{items.slice(0, 4).map((item) => <span key={item.id} className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-bold">{item.start_time} {item.title}</span>)}</div></Link>; })}</div>
>>>>>>> 89392e5 (20일차 전체 기능 구현)
    </main>
  );
}
