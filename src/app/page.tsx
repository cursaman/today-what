import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Activity = { id: number; title: string; description: string | null; activity_type: string; category: string; duration_minutes: number | null };

const quickStarts = [
  { href: "/outdoor", eyebrow: "OUTSIDE", icon: "↗", title: "밖으로 나가볼까?", description: "날씨와 거리를 살펴 지금 갈 수 있는 장소를 찾아요.", color: "bg-[#dff36b]" },
  { href: "/home", eyebrow: "AT HOME", icon: "⌂", title: "오늘은 집이 좋아", description: "내가 구독한 OTT와 취향에 맞는 집콕 활동을 골라요.", color: "bg-[#ffd8c7]" },
  { href: "/recommend", eyebrow: "PICK FOR ME", icon: "✦", title: "그냥 알아서 골라줘", description: "지역·시간·예산만 알려주면 오늘 하루를 추천해요.", color: "bg-[#cde9ff]" },
] as const;

const schedule = [
  { time: "11:30", icon: "🍜", title: "점심 식사", meta: "동선 주변 · 60분" },
  { time: "14:00", icon: "🎬", title: "영화 관람", meta: "고정 시간 · 실내" },
  { time: "17:00", icon: "☕", title: "카페에서 쉬기", meta: "이동 12분" },
  { time: "18:30", icon: "⚾", title: "롯데 경기", meta: "고정 시간 · 사직" },
] as const;

const categoryStyle: Record<string, { icon: string; label: string; className: string }> = {
  walk: { icon: "🌿", label: "산책", className: "bg-lime-100 text-lime-900" }, cinema: { icon: "🎬", label: "영화관", className: "bg-violet-100 text-violet-900" },
  ott: { icon: "📺", label: "OTT", className: "bg-rose-100 text-rose-900" }, book: { icon: "📚", label: "독서", className: "bg-amber-100 text-amber-900" },
  cooking: { icon: "🍳", label: "요리", className: "bg-orange-100 text-orange-900" }, sports: { icon: "⚾", label: "스포츠", className: "bg-sky-100 text-sky-900" },
  "golf-field": { icon: "⛳", label: "필드 골프", className: "bg-emerald-100 text-emerald-900" }, "golf-screen": { icon: "🏌️", label: "스크린골프", className: "bg-teal-100 text-teal-900" },
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
    <main className="overflow-hidden pb-24">
      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-5 md:pb-20 md:pt-8">
        <div className="home-hero relative overflow-hidden rounded-[2rem] border border-black/5 px-6 py-10 shadow-[0_24px_80px_rgba(36,44,20,0.12)] md:rounded-[3rem] md:px-14 md:py-16">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#dff36b]/70 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-28 left-[35%] h-72 w-72 rounded-full bg-[#ffd1bb]/60 blur-3xl" />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-extrabold backdrop-blur"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#dff36b]">✦</span>날씨부터 귀가 시간까지, 한 번에</div>
              <h1 className="mt-7 max-w-3xl text-[2.8rem] font-black leading-[1.04] tracking-[-0.055em] text-[#18210f] sm:text-6xl md:text-7xl">고민은 짧게,<br />오늘은 <span className="relative whitespace-nowrap"><span className="relative z-10">재미있게.</span><span className="absolute inset-x-0 bottom-1 h-4 -rotate-1 rounded-full bg-[#dff36b] md:h-5" /></span></h1>
              <p className="mt-7 max-w-xl text-base font-medium leading-7 text-[#4c5742] md:text-lg md:leading-8">지역과 시간, 날씨, 취향을 모아 밖에서 할 일과 집에서 할 일을 추천하고 이동까지 계산해 하루 일정으로 완성해드려요.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/recommend" className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-[#18210f] px-6 py-4 font-black text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-black">내 하루 추천받기 <span className="transition group-hover:translate-x-1">→</span></Link><Link href="/plan" className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white/70 px-6 py-4 font-black text-[#18210f] transition hover:bg-white">바로 일정 만들기</Link></div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-[#68725f]"><span>✓ 가입 전에도 추천 가능</span><span>✓ 실제 날씨 반영</span><span>✓ 귀가 시간 계산</span></div>
            </div>
            <div className="relative mx-auto w-full max-w-md lg:mr-2">
              <div className="home-float absolute -left-8 top-20 z-10 hidden rounded-2xl bg-[#18210f] px-4 py-3 text-sm font-black text-white shadow-xl sm:block">부산 · 23℃ ☀️</div>
              <div className="rotate-[1.5deg] rounded-[2rem] border border-black/10 bg-white/90 p-4 shadow-[0_30px_70px_rgba(44,54,27,0.18)] backdrop-blur md:p-6">
                <div className="flex items-center justify-between border-b border-black/5 pb-4"><div><p className="text-xs font-black text-neutral-400">TODAY PLAN</p><h2 className="mt-1 text-xl font-black">금요일, 기분 좋은 하루</h2></div><span className="rounded-full bg-[#dff36b] px-3 py-1.5 text-xs font-black">균형 있게</span></div>
                <div className="mt-5 space-y-1">{schedule.map((item, index) => <div key={item.time} className="grid grid-cols-[3.3rem_2rem_1fr] items-start gap-2"><span className="pt-2 text-xs font-black text-neutral-400">{item.time}</span><div className="flex flex-col items-center"><span className="grid h-8 w-8 place-items-center rounded-xl bg-neutral-100 text-sm">{item.icon}</span>{index < schedule.length - 1 ? <span className="h-9 w-px bg-neutral-200" /> : null}</div><div className="pt-1"><p className="text-sm font-black">{item.title}</p><p className="mt-0.5 text-[11px] font-semibold text-neutral-400">{item.meta}</p></div></div>)}</div>
                <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#f1f5e5] px-4 py-3 text-sm"><span className="font-bold text-[#697257]">예상 귀가</span><strong>22:05 🏠</strong></div>
              </div>
              <div className="home-float-delayed absolute -bottom-5 -right-3 rounded-2xl border border-white bg-[#ffd8c7] px-4 py-3 text-xs font-black shadow-lg sm:right-[-2rem]">이동 동선까지 계산 완료 ✓</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="max-w-2xl"><p className="text-xs font-black tracking-[0.18em] text-lime-700">CHOOSE YOUR MOOD</p><h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">오늘의 기분은 어떤가요?</h2><p className="mt-4 leading-7 text-neutral-500">어디서 보낼지만 골라도 시작할 수 있어요. 나머지는 오늘 뭐하지?가 채워드릴게요.</p></div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">{quickStarts.map((item) => <Link key={item.href} href={item.href} className={`${item.color} group relative min-h-64 overflow-hidden rounded-[2rem] border border-black/5 p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl`}><div className="flex items-center justify-between"><span className="text-[11px] font-black tracking-[0.18em] opacity-50">{item.eyebrow}</span><span className="grid h-11 w-11 place-items-center rounded-full bg-white/70 text-xl transition group-hover:rotate-12 group-hover:scale-110">{item.icon}</span></div><h3 className="mt-12 text-2xl font-black tracking-tight">{item.title}</h3><p className="mt-3 max-w-xs text-sm font-semibold leading-6 text-black/55">{item.description}</p><span className="absolute bottom-6 right-7 text-2xl transition group-hover:translate-x-1">→</span></Link>)}</div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="grid overflow-hidden rounded-[2rem] bg-[#18210f] text-white md:grid-cols-[.85fr_1.15fr] md:rounded-[2.5rem]">
          <div className="p-8 md:p-12"><p className="text-xs font-black tracking-[0.18em] text-[#dff36b]">SMART SCHEDULING</p><h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">추천만 하지 않고<br />하루를 완성해요.</h2><p className="mt-5 text-sm leading-7 text-white/55">고정된 상영·경기 시간부터 잡고, 이동과 식사, 휴식, 마지막 귀가까지 현실적으로 계산합니다.</p><Link href="/guide" className="mt-7 inline-flex border-b border-[#dff36b] pb-1 text-sm font-black text-[#dff36b]">작동 방식 알아보기 →</Link></div>
          <div className="grid grid-cols-2 border-t border-white/10 md:border-l md:border-t-0">{[["01","날씨","비가 오면 실내 활동에 더 높은 점수"],["02","고정시간","영화와 경기를 먼저 안전하게 배치"],["03","이동·예산","선호 이동수단과 전체 비용을 검사"],["04","귀가","종료 시각 안에 집에 도착하도록 계산"]].map(([number,title,description]) => <div key={number} className="border-b border-r border-white/10 p-6 md:p-8"><span className="text-xs font-black text-white/30">{number}</span><h3 className="mt-8 font-black text-[#dff36b]">{title}</h3><p className="mt-2 text-xs leading-5 text-white/50">{description}</p></div>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black tracking-[0.18em] text-neutral-400">IDEAS FOR TODAY</p><h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">이런 하루는 어때요?</h2></div><Link href="/recommend" className="text-sm font-black">내 취향으로 더 보기 →</Link></div>
        {activities.length > 0 ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{activities.map((item) => { const category = categoryStyle[item.category] ?? { icon: "✦", label: item.category, className: "bg-neutral-100 text-neutral-700" }; const href = item.activity_type === "home" ? "/home" : "/outdoor"; return <article key={item.id} className="group flex min-h-64 flex-col rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition hover:-translate-y-1 hover:shadow-xl"><div className="flex items-center justify-between"><span className={`rounded-full px-3 py-1.5 text-xs font-black ${category.className}`}>{category.icon} {category.label}</span><span className="text-xs font-bold text-neutral-400">{item.duration_minutes ? `${item.duration_minutes}분` : "시간 자유"}</span></div><h3 className="mt-8 text-xl font-black">{item.title}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-500">{item.description}</p><Link href={href} className="mt-auto flex items-center justify-between border-t border-black/5 pt-5 text-sm font-black"><span>{item.activity_type === "home" ? "집에서 더 보기" : "밖에서 더 보기"}</span><span className="transition group-hover:translate-x-1">→</span></Link></article>; })}</div> : <div className="mt-8 grid gap-4 sm:grid-cols-3">{quickStarts.map((item) => <Link key={item.href} href={item.href} className="rounded-3xl border border-dashed border-neutral-300 bg-white p-6"><span className="text-2xl">{item.icon}</span><h3 className="mt-5 font-black">{item.title}</h3><p className="mt-2 text-sm text-neutral-500">추천 둘러보기 →</p></Link>)}</div>}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:py-16"><div className="relative overflow-hidden rounded-[2rem] bg-[#dff36b] px-7 py-10 text-center md:rounded-[2.5rem] md:px-12 md:py-14"><div className="absolute -left-10 -top-10 h-32 w-32 rounded-full border-[24px] border-white/30" /><p className="text-xs font-black tracking-[0.18em] text-black/40">READY WHEN YOU ARE</p><h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">오늘을 그냥 보내지 마세요.</h2><p className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-6 text-black/55">지금 가능한 시간과 예산을 알려주면, 선택할 수 있는 세 가지 하루를 바로 만들어드릴게요.</p><Link href="/recommend" className="mt-7 inline-flex rounded-2xl bg-[#18210f] px-7 py-4 font-black text-white shadow-lg">오늘 일정 추천받기 →</Link></div></section>
    </main>
  );
}
