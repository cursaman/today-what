import Link from "next/link";
import { sampleActivities } from "@/data/sampleActivities";
import { getRecommendationReasons } from "@/lib/recommendation/getReasons";
import { recommendActivities } from "@/lib/recommendation/recommend";
import SubpageHero from "@/components/layout/SubpageHero";

export default function RecommendPage() {
  const condition = {
    region: "부산",
    startTime: "06:00",
    endTime: "23:00",
    budget: 50000,
    raining: true,
    companion: "couple",
    interests: ["movie", "sports", "travel", "ott"],
    favoriteTeams: ["롯데"],
  };

  const recommendations = recommendActivities(sampleActivities, condition).slice(0, 6);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 pb-24">
      <SubpageHero eyebrow="RECOMMEND FOR TODAY" title="오늘의 추천" description="부산 · 비 · 06:00~23:00 · 예산 50,000원 기준으로 지금 잘 맞는 활동을 골랐어요." icon="✦" tone="lime" />

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((activity) => (
          <article key={activity.id} className="group rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,.04)] transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase text-neutral-400">{activity.type}</span>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold">추천 {activity.score}점</span>
            </div>
            <h2 className="mt-3 text-xl font-black">{activity.title}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{activity.description}</p>
            <div className="mt-4 text-sm text-neutral-500">
              {activity.startAt ? `${activity.startAt} · ` : ""}{activity.durationMinutes}분 · {activity.cost.toLocaleString()}원
            </div>
            <ul className="mt-4 space-y-1 text-sm text-neutral-700">
              {getRecommendationReasons(activity, condition).slice(0, 3).map((reason) => (
                <li key={reason}>✓ {reason}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/plan" className="inline-flex rounded-2xl bg-[#18210f] px-6 py-4 font-black text-white shadow-lg">추천으로 일정 만들기 →</Link>
      </div>
    </main>
  );
}
