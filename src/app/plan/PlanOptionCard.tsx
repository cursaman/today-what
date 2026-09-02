"use client";

import { useMemo, useState, useTransition } from "react";
import DailyPlanMap from "@/components/map/DailyPlanMap";
import type { Activity } from "@/types/activity";
import type { PlanOption, DailyPlan } from "@/types/plan";
import type { UserLocation } from "@/types/location";
import SavePlanButton from "./SavePlanButton";
import { timeToMinutes } from "@/lib/plan/timeUtils";

export default function PlanOptionCard({ option, candidates, region, budget, startLocation, preferredTransportMode = "car", selectedDraftIds = [] }: {
  option: PlanOption;
  candidates: Activity[];
  region: string;
  budget: number;
  startLocation: UserLocation;
  preferredTransportMode?: "car" | "transit" | "walk";
  selectedDraftIds?: string[];
}) {
  const [plan, setPlan] = useState(option.plan);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const usedIds = useMemo(() => new Set(plan.items.map((item) => item.activity.id)), [plan.items]);
  const selectedDraftSet = useMemo(() => new Set(selectedDraftIds), [selectedDraftIds]);
  const reflectedDraftCount = useMemo(
    () => plan.items.filter((item) => selectedDraftSet.has(item.activity.id)).length,
    [plan.items, selectedDraftSet],
  );
  const missingDraftIds = useMemo(
    () => selectedDraftIds.filter((id) => !usedIds.has(id)),
    [selectedDraftIds, usedIds],
  );
  const failureById = useMemo(() => new Map((option.draftFailures ?? []).map((failure) => [failure.id, failure])), [option.draftFailures]);

  function replacementCandidates(index: number) {
    const current = plan.items[index];
    const slotMinutes = Math.max(30, timeToMinutes(current.endTime) - timeToMinutes(current.startTime));
    const otherCost = plan.totalCost - current.activity.cost;
    return candidates
      .filter((activity) => !usedIds.has(activity.id))
      .filter((activity) => !activity.fixedTime)
      .filter((activity) => activity.durationMinutes <= slotMinutes)
      .filter((activity) => otherCost + activity.cost <= budget)
      .slice(0, 6);
  }

  function replaceActivity(index: number, activity: Activity) {
    startTransition(async () => {
      const current = plan.items[index];
      const provisional: DailyPlan = {
        ...plan,
        items: plan.items.map((item, itemIndex) => itemIndex === index ? {
          ...item,
          activity,
          fixedTime: false,
          endTime: current.endTime,
        } : item),
        totalCost: plan.totalCost - current.activity.cost + activity.cost,
      };
      const response = await fetch("/api/plan/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: provisional, style: option.style, startLocation, preferredTransportMode, budget }),
      });
      if (response.ok) {
        const data = await response.json();
        setPlan(data.plan);
      }
      setReplacingIndex(null);
    });
  }

  return (
    <article className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-wider text-neutral-400">{option.style}</p><h2 className="mt-1 text-2xl font-black">{option.title}</h2><p className="mt-2 text-sm text-neutral-500">{option.description}</p></div>
        <div className="grid grid-cols-3 gap-3 text-right text-xs sm:text-sm">
          <div><p className="text-neutral-400">비용</p><strong>{plan.totalCost.toLocaleString()}원</strong></div>
          <div><p className="text-neutral-400">이동</p><strong>{plan.totalTravelMinutes}분</strong></div>
          <div><p className="text-neutral-400">거리</p><strong>{plan.totalDistanceKm.toFixed(1)}km</strong></div>
        </div>
      </div>

      {selectedDraftIds.length > 0 ? (
        <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
          선택 후보 {selectedDraftIds.length}개 중 {reflectedDraftCount}개 반영
          {reflectedDraftCount === selectedDraftIds.length ? (
            <span className="ml-2 font-medium text-emerald-700/80">내가 선택한 일정을 먼저 배치했습니다.</span>
          ) : (
            <span className="ml-2 font-medium text-amber-700">반영하지 못한 후보 {missingDraftIds.length}개의 이유를 아래에서 확인하세요.</span>
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">직접 선택한 후보 없이 취향·날씨 기준으로 자동 구성한 일정입니다.</div>
      )}

      {missingDraftIds.length > 0 ? (
        <ul className="mt-3 space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {missingDraftIds.map((id) => {
            const failure = failureById.get(id);
            return <li key={id}><strong>{failure?.title ?? id}</strong> — {failure?.reason ?? "다른 직접 선택 후보를 먼저 배치한 뒤 남은 시간이 부족합니다."}</li>;
          })}
        </ul>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3">
          {plan.items.map((item, index) => (
            <div key={`${option.id}-${item.activity.id}-${index}`} className="rounded-2xl bg-neutral-50 p-4">
              {(item.travelFromPreviousMinutes ?? 0) > 0 && <p className="mb-2 text-xs font-bold text-neutral-400">↓ 이동 {item.travelFromPreviousMinutes}분 · {(item.distanceFromPreviousKm ?? 0).toFixed(1)}km</p>}
              <div className="flex items-center justify-between gap-2"><strong>{item.startTime} ~ {item.endTime}</strong><span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold">{item.fixedTime ? "시간 고정" : "조정 가능"}</span></div>
              <p className="mt-1 font-black">{item.activity.title}</p>
              <p className="mt-1 text-xs text-neutral-500">{item.activity.location ?? "장소 미정"} · {item.activity.cost.toLocaleString()}원</p>
              <button onClick={() => setReplacingIndex(replacingIndex === index ? null : index)} disabled={pending} className="mt-3 rounded-xl border px-3 py-2 text-xs font-black">이 활동 바꾸기</button>
              {replacingIndex === index && (
                <div className="mt-3 grid gap-2">
                  {replacementCandidates(index).length ? replacementCandidates(index).map((candidate) => (
                    <button key={candidate.id} onClick={() => replaceActivity(index, candidate)} className="rounded-xl bg-white p-3 text-left text-xs shadow-sm">
                      <strong className="block">{candidate.title}</strong>
                      <span className="text-neutral-500">{candidate.durationMinutes}분 · {candidate.cost.toLocaleString()}원 · {candidate.location ?? "장소 미정"}</span>
                    </button>
                  )) : <p className="text-xs text-neutral-500">현재 시간·예산에 맞는 교체 후보가 없습니다.</p>}
                </div>
              )}
            </div>
          ))}
        </div>
        <DailyPlanMap items={plan.items} startLocation={startLocation} />
      </div>

      <div className="ml-auto mt-6 max-w-sm">
        <SavePlanButton input={{
          title: option.title,
          style: option.style,
          region,
          startTime: plan.startTime,
          endTime: plan.endTime,
          totalCost: plan.totalCost,
          totalDistanceKm: plan.totalDistanceKm,
          totalTravelMinutes: plan.totalTravelMinutes,
          items: plan.items.map((item) => ({
            activityId: item.activity.id,
            title: item.activity.title,
            type: item.activity.type,
            startTime: item.startTime,
            endTime: item.endTime,
            fixedTime: item.fixedTime,
            durationMinutes: item.activity.durationMinutes,
            cost: item.activity.cost,
            latitude: item.activity.coordinates?.latitude,
            longitude: item.activity.coordinates?.longitude,
            travelMinutes: item.travelFromPreviousMinutes,
            distanceKm: item.distanceFromPreviousKm,
            transportMode: item.transportMode,
            metadata: { ...(item.activity.metadata ?? {}), location: item.activity.location ?? null },
          })),
        }} />
      </div>
    </article>
  );
}
