import Link from "next/link";
import { sampleActivities } from "@/data/sampleActivities";
import { getRecommendationReasons } from "@/lib/recommendation/getReasons";
import { recommendActivities } from "@/lib/recommendation/recommend";

export default function RecommendPage() {
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

  const recommendations = recommendActivities(sampleActivities, condition).slice(0, 6);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 pb-24">
      <p className="text-sm font-bold text-neutral-500">RECOMMEND</p>
      <h1 className="mt-1 text-4xl font-black">오늘의 추천</h1>
      <p className="mt-3 text-neutral-600">부산 · 비 · 13:00~23:00 · 예산 50,000원 기준</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((activity) => (
          <article key={activity.id} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
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
        <Link href="/plan" className="inline-flex rounded-full bg-neutral-900 px-5 py-3 font-black text-white">추천으로 일정 만들기</Link>
      </div>
    </main>
  );
}
