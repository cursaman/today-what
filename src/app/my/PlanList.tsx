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

export default function PlanList({ plans }: { plans: MyPlanSummary[] }) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const allSelected = useMemo(
    () => plans.length > 0 && selectedIds.length === plans.length,
    [plans.length, selectedIds.length],
  );

  function togglePlan(id: number) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : plans.map((plan) => plan.id));
  }

  function removeOne(planId: number, title: string) {
    if (!window.confirm(`\"${title}\" 일정을 삭제할까요?`)) return;

    startTransition(async () => {
      const result = await deleteMyPlan(planId);
      setMessage(result.message);
      if (result.success) {
        setSelectedIds((current) => current.filter((id) => id !== planId));
      }
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4"
          />
          전체 선택
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

      {message && (
        <p className="mt-3 rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-bold text-neutral-700">
          {message}
        </p>
      )}

      <div className="mt-5 space-y-5">
        {plans.map((plan) => {
          const items = [...(plan.plan_items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
          const selected = selectedIds.includes(plan.id);

          return (
            <article
              key={plan.id}
              className={`rounded-3xl border bg-white p-6 shadow-sm transition ${selected ? "ring-2 ring-neutral-900" : ""}`}
            >
              <div className="flex gap-4">
                <label className="mt-1 flex cursor-pointer items-start">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => togglePlan(plan.id)}
                    aria-label={`${plan.title} 선택`}
                    className="h-5 w-5"
                  />
                </label>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black">{plan.title}</h2>
                      <p className="mt-1 text-sm text-neutral-500">
                        {plan.region ?? "지역 미지정"} · {plan.plan_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <strong>{Number(plan.total_cost ?? 0).toLocaleString()}원</strong>
                      <p className="text-xs text-neutral-500">
                        {Number(plan.total_distance_km ?? 0).toFixed(1)}km · {Number(plan.total_travel_minutes ?? 0)}분
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {items.slice(0, 4).map((item) => (
                      <span key={item.id} className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-bold">
                        {item.start_time} {item.title}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/my/plans/${plan.id}`}
                      className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-black text-white"
                    >
                      일정 선택 · 상세보기
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeOne(plan.id, plan.title)}
                      disabled={pending}
                      className="rounded-full border border-rose-200 px-4 py-2 text-sm font-black text-rose-700 disabled:opacity-40"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
