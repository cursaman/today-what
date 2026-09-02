"use client";

import { useEffect, useMemo, useState } from "react";
import type { Activity } from "@/types/activity";

const SERVICES = ["Netflix", "TVING", "Disney+", "Wavve", "Watcha"] as const;

type Service = (typeof SERVICES)[number];

interface OttCard {
  activity: Activity;
  tmdbId: number;
  posterUrl: string | null;
  rating: number;
  releaseYear: string | null;
  providers: Array<{
    id: number;
    name: string;
    service: Service;
    logoUrl: string | null;
  }>;
  watchLink: string | null;
}

interface ApiResponse {
  success: boolean;
  configured: boolean;
  message?: string;
  items: OttCard[];
  count?: number;
}

export default function HomeExplorer({ initialServices }: { initialServices: string[] }) {
  const validInitial = initialServices.filter((service): service is Service =>
    (SERVICES as readonly string[]).includes(service)
  );
  const [selected, setSelected] = useState<Service[]>(validInitial.length ? validInitial : [...SERVICES]);
  const [items, setItems] = useState<OttCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [configured, setConfigured] = useState(true);
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set());
  const [draftCount, setDraftCount] = useState(0);

  const query = useMemo(() => selected.join(","), [selected]);

  useEffect(() => {
    fetch("/api/plan-draft", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        const list = Array.isArray(data.items) ? data.items : [];
        setDraftIds(new Set(list.map((item: Activity) => item.id)));
        setDraftCount(Number(data.count ?? list.length));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/ott?services=${encodeURIComponent(query)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data: ApiResponse) => {
        setConfigured(data.configured);
        setItems(Array.isArray(data.items) ? data.items : []);
        if (!data.success && data.message) setMessage(data.message);
      })
      .catch((error) => {
        if (error?.name !== "AbortError") setMessage("영화 데이터를 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query]);

  function toggle(service: Service) {
    setLoading(true);
    setMessage("");
    setSelected((current) => {
      if (current.includes(service)) {
        const next = current.filter((value) => value !== service);
        return next.length ? next : [...SERVICES];
      }
      return [...current, service];
    });
  }

  async function togglePlan(activity: Activity, added: boolean) {
    setMessage("");
    try {
      const response = await fetch(
        added ? `/api/plan-draft?id=${encodeURIComponent(activity.id)}` : "/api/plan-draft",
        added
          ? { method: "DELETE" }
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ activity }),
            }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || (added ? "일정 후보 취소에 실패했습니다." : "일정 추가에 실패했습니다."));
      }
      const serverItems: Activity[] = Array.isArray(data.items) ? data.items : [];
      const nextCount = Number(data.count ?? serverItems.length);
      setDraftIds(new Set(serverItems.map((item) => item.id)));
      setDraftCount(nextCount);
      setMessage(
        added
          ? `‘${activity.title}’을 일정 후보에서 취소했습니다. 현재 ${nextCount}개입니다.`
          : `‘${activity.title}’을 일정 후보에 추가했습니다. 밖에서/집에서 후보를 합쳐 현재 ${nextCount}개입니다.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "일정 후보 변경에 실패했습니다.");
    }
  }

  return (
    <div className="mt-8">
      <section className="rounded-3xl bg-neutral-900 p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-white/50">MY OTT FILTER</p>
            <h2 className="mt-1 text-xl font-black">내가 이용하는 OTT만 보기</h2>
          </div>
          <a href="/plan" className="rounded-full bg-white px-4 py-2 text-sm font-black text-neutral-900">
            전체 일정 후보 {draftCount}개 보기 →
          </a>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {SERVICES.map((service) => (
            <button
              key={service}
              type="button"
              onClick={() => toggle(service)}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                selected.includes(service) ? "bg-white text-neutral-900" : "border border-white/20 text-white/60"
              }`}
            >
              {service}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/50">
          로그인 사용자는 MY에 저장한 OTT가 기본 선택됩니다. 선택을 바꾸면 즉시 한국 제공작을 다시 조회합니다.
        </p>
        <p className="mt-2 text-xs font-bold text-emerald-300">밖에서 선택한 후보와 집에서 선택한 후보는 하나로 합산됩니다. 최대 10개까지 선택할 수 있습니다.</p>
      </section>

      {message ? (
        <div className="mt-4 rounded-2xl border border-black/5 bg-white p-4 text-sm font-bold text-neutral-700">{message}</div>
      ) : null}

      {!configured ? (
        <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-black text-amber-900">TMDB 설정이 필요합니다.</h2>
          <p className="mt-2 text-sm text-amber-800">Vercel 환경변수에 서버 전용 `TMDB_ACCESS_TOKEN`을 추가하고 Redeploy해 주세요.</p>
        </section>
      ) : null}

      {loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-[470px] animate-pulse rounded-3xl bg-neutral-200" />
          ))}
        </div>
      ) : null}

      {!loading && configured && items.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-black">선택한 OTT에서 표시할 영화를 찾지 못했습니다.</p>
          <p className="mt-2 text-sm text-neutral-500">다른 OTT를 함께 선택해 보세요.</p>
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const added = draftIds.has(item.activity.id);
            const serviceNames = [...new Set(item.providers.map((provider) => provider.service))];
            return (
              <article key={item.tmdbId} className="overflow-hidden rounded-3xl bg-white shadow-sm">
                <div className="aspect-[2/3] bg-neutral-100">
                  {item.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.posterUrl} alt={`${item.activity.title} 포스터`} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-bold text-neutral-400">포스터 없음</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 text-xl font-black">{item.activity.title}</h2>
                      <p className="mt-1 text-sm font-bold text-amber-600">★ {item.rating.toFixed(1)} {item.releaseYear ? `· ${item.releaseYear}` : ""}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-black">약 120분</span>
                  </div>

                  <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-neutral-600">{item.activity.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {serviceNames.map((service) => (
                      <span key={service} className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-black text-white">{service}</span>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {item.watchLink ? (
                      <a href={item.watchLink} target="_blank" rel="noreferrer" className="rounded-2xl border p-3 text-center text-sm font-black">
                        제공처 보기
                      </a>
                    ) : (
                      <div className="rounded-2xl border p-3 text-center text-sm font-black text-neutral-400">한국 제공작</div>
                    )}
                    <button
                      type="button"
                      onClick={() => void togglePlan(item.activity, added)}
                      className={`rounded-2xl p-3 text-sm font-black transition ${added ? "bg-emerald-600 text-white hover:bg-rose-600" : "bg-neutral-900 text-white hover:bg-neutral-700"}`}
                      aria-pressed={added}
                    >
                      {added ? "추가됨 ✓ · 취소" : "일정에 추가"}
                    </button>
                  </div>

                  <p className="mt-4 text-[11px] leading-5 text-neutral-400">
                    영화 정보: TMDB · 스트리밍 제공 정보: JustWatch. 실제 제공 여부는 OTT에서 최종 확인하세요.
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
