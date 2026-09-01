import { sampleActivities } from "@/data/sampleActivities";
import { recommendActivities } from "@/lib/recommendation/recommend";
import { createDailyPlan } from "@/lib/plan/createDailyPlan";

export default function PlanPage() {
  const condition = {
    region: "부산",
    startTime: "13:00",
    endTime: "23:00",
    budget: 50000,
    raining: true,
    companion: "couple",
    interests: ["movie", "sports", "travel", "ott"],
    favoriteTeams: ["롯데"],
  };

  const recommendations = recommendActivities(sampleActivities, condition);
  const plan = createDailyPlan(recommendations, condition.startTime, condition.endTime, condition.budget);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 pb-24">
      <p className="text-sm font-bold text-neutral-500">PLAN ENGINE</p>
      <h1 className="mt-1 text-4xl font-black">오늘 일정 자동 생성</h1>
      <p className="mt-3 text-neutral-600">고정시간 활동을 먼저 배치한 뒤 남은 시간에 추천 활동을 채웁니다.</p>

      <section className="mt-8 grid gap-3 rounded-3xl bg-neutral-900 p-6 text-white sm:grid-cols-4">
        <div><p className="text-xs text-white/50">지역</p><strong>부산</strong></div>
        <div><p className="text-xs text-white/50">시간</p><strong>{plan.startTime}~{plan.endTime}</strong></div>
        <div><p className="text-xs text-white/50">날씨</p><strong>비</strong></div>
        <div><p className="text-xs text-white/50">예상비용</p><strong>{plan.totalCost.toLocaleString()}원</strong></div>
      </section>

      <div className="mt-8 space-y-4">
        {plan.items.map((item, index) => (
          <article key={`${item.activity.id}-${index}`} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black">{item.startTime} ~ {item.endTime}</p>
                <h2 className="mt-1 text-xl font-black">{item.activity.title}</h2>
                <p className="mt-2 text-sm text-neutral-500">{item.activity.location} · {item.activity.durationMinutes}분</p>
              </div>
              {item.fixedTime ? (
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700">시간 고정</span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">시간 조정 가능</span>
              )}
            </div>
          </article>
        ))}
      </div>

      {plan.items.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed p-8 text-center text-neutral-500">조건에 맞는 일정이 없습니다.</div>
      )}
    </main>
  );
}
