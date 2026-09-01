import { sampleActivities } from "@/data/sampleActivities";
import { createPlanOptions } from "@/lib/plan/createPlanOptions";
import { recommendActivities } from "@/lib/recommendation/recommend";
import SavePlanButton from "./SavePlanButton";

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
  const options = createPlanOptions(
    recommendations,
    condition.startTime,
    condition.endTime,
    condition.budget
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 pb-24">
      <p className="text-sm font-bold text-neutral-500">DAY 11 + DAY 12</p>
      <h1 className="mt-1 text-4xl font-black">오늘 일정 A/B/C</h1>
      <p className="mt-3 text-neutral-600">마음에 드는 일정을 선택해 Supabase의 MY 일정에 저장합니다.</p>

      <section className="mt-8 grid gap-3 rounded-3xl bg-neutral-900 p-6 text-white sm:grid-cols-4">
        <div><p className="text-xs text-white/50">지역</p><strong>{condition.region}</strong></div>
        <div><p className="text-xs text-white/50">시간</p><strong>{condition.startTime}~{condition.endTime}</strong></div>
        <div><p className="text-xs text-white/50">날씨</p><strong>{condition.raining ? "비" : "맑음"}</strong></div>
        <div><p className="text-xs text-white/50">예산</p><strong>{condition.budget.toLocaleString()}원</strong></div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {options.map((option) => (
          <article key={option.id} className="flex flex-col rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-neutral-400">{option.style}</p>
            <h2 className="mt-1 text-2xl font-black">{option.title}</h2>
            <p className="mt-2 min-h-10 text-sm text-neutral-500">{option.description}</p>

            <div className="mt-6 space-y-3">
              {option.plan.items.map((item, index) => (
                <div key={`${option.id}-${item.activity.id}-${index}`} className="rounded-2xl bg-neutral-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <strong>{item.startTime} ~ {item.endTime}</strong>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold">
                      {item.fixedTime ? "시간 고정" : "조정 가능"}
                    </span>
                  </div>
                  <p className="mt-1 font-black">{item.activity.title}</p>
                  <p className="mt-1 text-xs text-neutral-500">{item.activity.location ?? "장소 미정"} · {item.activity.cost.toLocaleString()}원</p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-5">
              <p className="text-right text-sm text-neutral-500">예상비용 <strong className="text-lg text-black">{option.plan.totalCost.toLocaleString()}원</strong></p>
              <SavePlanButton input={{
                title: option.title,
                style: option.style,
                region: condition.region,
                startTime: option.plan.startTime,
                endTime: option.plan.endTime,
                totalCost: option.plan.totalCost,
                items: option.plan.items.map((item) => ({
                  activityId: item.activity.id,
                  title: item.activity.title,
                  type: item.activity.type,
                  startTime: item.startTime,
                  endTime: item.endTime,
                  fixedTime: item.fixedTime,
                  cost: item.activity.cost,
                })),
              }} />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
