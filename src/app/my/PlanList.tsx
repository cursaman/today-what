"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { deleteMyPlan, deleteSelectedPlans } from "./actions";

interface PlanItemSummary {
  id: number;
  title: string;
  start_time: string | null;
  end_time: string | null;
  sort_order: number;
}

export interface MyPlanSummary {
  id: number;
  title: string;
  style: string | null;
  region: string | null;
  plan_date: string;
  total_cost: number | null;
  total_distance_km: number | null;
  total_travel_minutes: number | null;
  created_at: string;
  plan_items: PlanItemSummary[] | null;
}

const STYLE_LABELS: Record<string, { label: string; description: string }> = {
  outdoor: { label: "A · 밖에서 즐기기", description: "외부 활동을 더 많이 반영" },
  balanced: { label: "B · 적당히 즐기기", description: "실내외 활동을 균형 있게 반영" },
  relaxed: { label: "C · 편하게 보내기", description: "이동과 활동 강도를 줄인 일정" },
};

export default function PlanList({ plans }: { plans: MyPlanSummary[] }) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const filteredPlans = useMemo(
    () => (filterDate ? plans.filter((plan) => plan.plan_date === filterDate) : plans),
    [plans, filterDate],
  );

  const visibleIds = filteredPlans.map((plan) => plan.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function togglePlan(id: number) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  function toggleAll() {
    setSelectedIds((current) => {
      if (allSelected) return current.filter((id) => !visibleIds.includes(id));
      return [...new Set([...current, ...visibleIds])];
    });
  }

  function removeOne(planId: number, title: string) {
    if (!window.confirm(`"${title}" 일정을 삭제할까요?`)) return;

    startTransition(async () => {
      const result = await deleteMyPlan(planId);
      setMessage(result.message);
      if (result.success) setSelectedIds((current) => current.filter((id) => id !== planId));
    });
  }

  function removeSelected() {
    if (!selectedIds.length) {
      setMessage("삭제할 일정을 먼저 선택해주세요.");
      return;
    }
    if (!window.confirm(`선택한 ${selectedIds.length}개의 일정을 삭제할까요?`)) return;

    startTransition(async () => {
      const result = await deleteSelectedPlans(selectedIds);
      setMessage(result.message);
      if (result.success) setSelectedIds([]);
    });
  }

  return (
    <section className="mt-8">
      <div className="grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block">
          <span className="text-sm font-black">날짜별 보기</span>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
            />
            {filterDate && (
              <button type="button" onClick={() => setFilterDate("")} className="rounded-xl border px-3 py-2 text-sm font-bold">
                전체 날짜
              </button>
            )}
          </div>
        </label>
        <div className="text-sm text-neutral-500 sm:text-right">
          <strong className="text-neutral-900">{filteredPlans.length}개</strong> 일정 표시
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4" />
          현재 목록 전체 선택
        </label>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">{selectedIds.length}개 선택</span>
          <button
            type="button"
            onClick={removeSelected}
            disabled={pending || selectedIds.length === 0}
            className="rounded-full border border-rose-200 px-4 py-2 text-sm font-black text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "처리 중..." : "선택 삭제"}
          </button>
        </div>
      </div>

      {message && <p className="mt-3 rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-bold text-neutral-700">{message}</p>}

      {!filteredPlans.length ? (
        <div className="mt-5 rounded-3xl border bg-white p-8 text-center">
          <p className="font-black">{filterDate ? "선택한 날짜에 저장된 일정이 없습니다." : "아직 저장한 일정이 없습니다."}</p>
          <Link href="/plan" className="mt-4 inline-block rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-black text-white">
            일정 만들기
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {filteredPlans.map((plan) => {
            const items = [...(plan.plan_items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
            const selected = selectedIds.includes(plan.id);
            const style = STYLE_LABELS[plan.style ?? ""] ?? { label: plan.style ?? "스타일 미지정", description: "" };

            return (
              <article key={plan.id} className={`rounded-3xl border bg-white p-6 shadow-sm transition ${selected ? "ring-2 ring-neutral-900" : ""}`}>
                <div className="flex gap-4">
                  <label className="mt-1 flex cursor-pointer items-start">
                    <input type="checkbox" checked={selected} onChange={() => togglePlan(plan.id)} aria-label={`${plan.title} 선택`} className="h-5 w-5" />
                  </label>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex rounded-full bg-neutral-900 px-3 py-1 text-xs font-black text-white">{style.label}</span>
                        <h2 className="mt-2 text-2xl font-black">{plan.title}</h2>
                        <p className="mt-1 text-sm text-neutral-500">{plan.region ?? "지역 미지정"} · {plan.plan_date}</p>
                        {style.description && <p className="mt-1 text-xs text-neutral-400">{style.description}</p>}
                      </div>
                      <div className="text-right">
                        <strong>{Number(plan.total_cost ?? 0).toLocaleString()}원</strong>
                        <p className="text-xs text-neutral-500">{Number(plan.total_distance_km ?? 0).toFixed(1)}km · 이동 {Number(plan.total_travel_minutes ?? 0)}분</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {items.slice(0, 4).map((item) => (
                        <span key={item.id} className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-bold">
                          {item.start_time} {item.title}
                        </span>
                      ))}
                      {items.length > 4 && <span className="rounded-full bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-500">+{items.length - 4}</span>}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link href={`/my/plans/${plan.id}`} className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-black text-white">상세보기 · 수정</Link>
                      <button type="button" onClick={() => removeOne(plan.id, plan.title)} disabled={pending} className="rounded-full border border-rose-200 px-4 py-2 text-sm font-black text-rose-700 disabled:opacity-40">삭제</button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
