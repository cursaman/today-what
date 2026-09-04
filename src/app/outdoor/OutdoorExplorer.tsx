"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Activity } from "@/types/activity";
import type { FavoriteItem } from "@/types/favorite";

type OutdoorActivity = Activity & {
  score: number;
  distanceKm: number | null;
  reasons: string[];
};

type Weather = {
  temperature: number;
  condition: string;
  precipitationProbability: number;
  raining: boolean;
};

type ApiResponse = {
  success: boolean;
  region: string;
  count: number;
  configured: boolean;
  weather: Weather;
  activities: OutdoorActivity[];
};

const REGIONS = ["부산", "서울", "인천", "대전", "대구", "광주", "울산", "세종", "경기", "강원", "충북", "충남", "경북", "경남", "전북", "전남", "제주"];
const CATEGORIES = [
  { id: "all", label: "전체" },
  { id: "12", label: "관광지" },
  { id: "14", label: "문화·전시" },
  { id: "15", label: "축제·행사" },
  { id: "28", label: "레저·체험" },
  { id: "golf", label: "골프" },
];

export default function OutdoorExplorer({ initialRegion = "부산", personalized = false }: { initialRegion?: string; personalized?: boolean }) {
  const [region, setRegion] = useState(initialRegion);
  const [category, setCategory] = useState("all");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [draftCount, setDraftCount] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void Promise.all([fetch("/api/plan-draft").then((res) => res.json()), fetch("/api/favorites").then((res) => res.json())])
      .then(([drafts, favorites]) => {
        if (Array.isArray(drafts.items)) {
          setAddedIds(new Set(drafts.items.map((item: Activity) => item.id)));
          setDraftCount(drafts.items.length);
        }
        const favoriteList: FavoriteItem[] = Array.isArray(favorites.items) ? favorites.items : [];
        setFavoriteIds(new Set(favoriteList.map((item) => `${item.contentType}:${item.contentId}`)));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void fetch(`/api/tours?region=${encodeURIComponent(region)}&category=${encodeURIComponent(category)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("관광 데이터를 불러오지 못했습니다.");
        return (await response.json()) as ApiResponse;
      })
      .then(setData)
      .catch((err: Error) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [region, category]);

  const activities = useMemo(() => data?.activities ?? [], [data]);

  async function togglePlan(activity: OutdoorActivity, added: boolean) {
    const response = await fetch(
      added ? `/api/plan-draft?id=${encodeURIComponent(activity.id)}` : "/api/plan-draft",
      added
        ? { method: "DELETE" }
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              activity: {
                id: activity.id,
                type: activity.type,
                title: activity.title,
                description: activity.description,
                durationMinutes: activity.durationMinutes,
                fixedTime: activity.fixedTime,
                indoor: activity.indoor,
                cost: activity.cost,
                location: activity.location,
                coordinates: activity.coordinates,
                interests: activity.interests,
                source: activity.source,
                metadata: activity.metadata,
              },
            }),
          }
    );
    const result = await response.json();
    if (!response.ok || !result.success) {
      alert(result.message ?? (added ? "일정 후보 취소에 실패했습니다." : "일정 추가에 실패했습니다."));
      return;
    }
    const serverItems: Activity[] = Array.isArray(result.items) ? result.items : [];
    setAddedIds(new Set(serverItems.map((item) => item.id)));
    setDraftCount(Number(result.count ?? serverItems.length));
  }

  async function toggleFavorite(activity: OutdoorActivity) {
    const key = `tour:${activity.id}`;
    const added = favoriteIds.has(key);
    const imageUrl = typeof activity.metadata?.image === "string" ? activity.metadata.image : undefined;
    const response = await fetch(added ? `/api/favorites?contentType=tour&contentId=${encodeURIComponent(activity.id)}` : "/api/favorites", added ? { method: "DELETE" } : {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item: { contentType: "tour", contentId: activity.id, title: activity.title, imageUrl, source: activity.source, metadata: { location: activity.location ?? null } } }),
    });
    if (!response.ok) return;
    setFavoriteIds((current) => { const next = new Set(current); added ? next.delete(key) : next.add(key); return next; });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 pb-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black tracking-wider text-emerald-700">OUTDOOR · LIVE TOURAPI</p>
          <h1 className="mt-1 text-4xl font-black">밖에서 뭐하지?</h1>
          <p className="mt-3 text-neutral-600">지역과 오늘 날씨를 기준으로 실제 관광·전시·행사·체험 정보를 추천합니다.</p>
          <p className="mt-2 text-xs font-bold text-emerald-700">밖에서 + 집에서 선택한 후보를 합쳐 최대 10개까지 일정에 담을 수 있습니다.</p>
        </div>
        <Link href="/plan" className="rounded-full bg-neutral-900 px-5 py-3 text-sm font-black text-white">
          전체 일정 후보 {draftCount}개 보기 →
        </Link>
      </div>

      <section className="mt-8 rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-end">
          <label className="block">
            <span className="mb-2 block text-xs font-black text-neutral-500">지역 선택</span>
            <select
              value={region}
              onChange={(event) => { setLoading(true); setError(""); setRegion(event.target.value); }}
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 font-bold outline-none focus:border-neutral-500"
            >
              {REGIONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          <div>
            <p className="mb-2 text-xs font-black text-neutral-500">카테고리</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setLoading(true); setError(""); setCategory(item.id); }}
                  className={`rounded-full px-4 py-2 text-sm font-bold ${category === item.id ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {data?.weather ? (
          <div className="mt-5 grid gap-3 rounded-2xl bg-neutral-900 p-4 text-white sm:grid-cols-3">
            <div><p className="text-xs text-white/50">현재 지역</p><strong>{region}</strong></div>
            <div><p className="text-xs text-white/50">오늘 날씨</p><strong>{data.weather.condition} · {Math.round(data.weather.temperature)}℃</strong></div>
            <div><p className="text-xs text-white/50">강수확률</p><strong>{data.weather.precipitationProbability}%</strong></div>
          </div>
        ) : null}
      </section>

      {!data?.configured && !loading ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Vercel에 <strong>TOUR_API_KEY</strong>가 아직 설정되지 않았습니다. 환경변수를 추가하고 Redeploy하면 실제 관광 데이터가 표시됩니다.
        </div>
      ) : null}

      {loading ? <div className="mt-8 rounded-3xl bg-white p-10 text-center font-bold text-neutral-500">관광 정보를 불러오는 중입니다...</div> : null}
      {error ? <div className="mt-8 rounded-3xl bg-red-50 p-6 text-red-700">{error}</div> : null}

      {!loading && !error && activities.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white p-10 text-center">
          <p className="text-lg font-black">표시할 관광 정보가 없습니다.</p>
          <p className="mt-2 text-sm text-neutral-500">TourAPI 키와 Vercel 환경변수, API 활용승인 상태를 확인해주세요.</p>
        </div>
      ) : null}

      <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => {
          const image = typeof activity.metadata?.image === "string" ? activity.metadata.image : "";
          const categoryLabel = String(activity.metadata?.contentTypeLabel ?? "관광");
          const added = addedIds.has(activity.id);
          const favorite = favoriteIds.has(`tour:${activity.id}`);

          return (
            <article key={activity.id} className="overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-sm">
              <div className="aspect-[16/10] bg-neutral-100">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-bold text-neutral-400">이미지 없음</div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{categoryLabel}</span>
                  <span className="text-xs font-bold text-neutral-400">추천 {activity.score}점</span>
                </div>
                <h2 className="mt-3 line-clamp-2 text-xl font-black">{activity.title}</h2>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm text-neutral-500">{activity.location ?? "주소 정보 없음"}</p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-neutral-600">
                  <span className="rounded-full bg-neutral-100 px-3 py-1.5">{activity.indoor ? "실내" : "야외"}</span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1.5">약 {activity.durationMinutes}분</span>
                  {activity.distanceKm !== null ? <span className="rounded-full bg-neutral-100 px-3 py-1.5">중심지 약 {activity.distanceKm.toFixed(1)}km</span> : null}
                </div>

                <div className="mt-4 rounded-2xl bg-neutral-50 p-3">
                  <p className="text-xs font-black text-neutral-500">추천 이유</p>
                  <ul className="mt-1 space-y-1 text-xs text-neutral-600">
                    {activity.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
                  </ul>
                </div>

                <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
                  <button type="button" onClick={() => void toggleFavorite(activity)} aria-pressed={favorite} className={`rounded-2xl border px-4 py-3 text-sm font-black ${favorite ? "border-rose-200 bg-rose-50 text-rose-600" : "bg-white"}`}>{favorite ? "♥ 찜됨" : "♡ 찜"}</button>
                  <button type="button" onClick={() => void togglePlan(activity, added)} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${added ? "bg-emerald-100 text-emerald-700 hover:bg-rose-50 hover:text-rose-700" : "bg-neutral-900 text-white hover:bg-neutral-700"}`} aria-pressed={added}>{added ? "✓ 추가됨 · 취소" : "+ 일정에 추가"}</button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
