import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Activity = {
  id: number;
  title: string;
  description: string | null;
  activity_type: string;
  category: string;
  duration_minutes: number | null;
};

async function getActivities(): Promise<Activity[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("activities").select("id,title,description,activity_type,category,duration_minutes").eq("is_active", true).limit(6);
  return (data ?? []) as Activity[];
}

export default async function Home() {
  const activities = await getActivities();
  return (
    <main className="pb-24">
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="rounded-[2rem] bg-neutral-900 px-6 py-12 text-white md:px-12 md:py-16">
          <p className="mb-3 text-sm font-semibold text-white/60">TODAY LIFE PLANNER</p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">오늘 뭐하지?<br />날씨와 시간에 맞춰 하루를 골라보세요.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/70">관광·영화관·OTT·스포츠·요리·독서를 한곳에서 보고, 고정된 경기·상영 시간부터 먼저 배치해 오늘의 일정을 만듭니다.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/outdoor" className="rounded-full bg-white px-5 py-3 font-bold text-black">밖에서 놀기</Link>
            <Link href="/home" className="rounded-full border border-white/30 px-5 py-3 font-bold">집에서 놀기</Link>
            <Link href="/recommend" className="rounded-full border border-white/30 px-5 py-3 font-bold">알아서 추천</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-end justify-between">
          <div><p className="text-sm font-bold text-neutral-500">SUPABASE</p><h2 className="text-2xl font-black">추천 활동</h2></div>
          {!process.env.NEXT_PUBLIC_SUPABASE_URL && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold">환경변수 연결 전</span>}
        </div>
        {activities.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((item) => (
              <article key={item.id} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                <span className="text-xs font-bold uppercase text-neutral-400">{item.activity_type} · {item.category}</span>
                <h3 className="mt-2 text-xl font-black">{item.title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-neutral-600">{item.description}</p>
                <div className="mt-5 flex items-center justify-between text-sm"><span>{item.duration_minutes ? `${item.duration_minutes}분` : "시간 자유"}</span><button className="font-bold">＋ 일정에 추가</button></div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-8">
            <h3 className="font-black">첫 배포 준비 완료</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Vercel에 Supabase 환경변수를 등록하고 제공된 schema.sql을 실행하면 이 영역에 실제 활동 데이터가 표시됩니다.</p>
          </div>
        )}
      </section>
    </main>
  );
}
