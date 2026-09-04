"use client";

import { useMemo, useState, useTransition } from "react";
import type { Activity } from "@/types/activity";
import type { PlanOption, DailyPlan, PlanItem } from "@/types/plan";
import type { UserLocation } from "@/types/location";
import SavePlanButton from "./SavePlanButton";
import { minutesToTime, timeToMinutes } from "@/lib/plan/timeUtils";

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
  const [addingOpen, setAddingOpen] = useState(false);
  const [editMessage, setEditMessage] = useState("");
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
  const additionCandidates = useMemo(
    () => candidates.filter((activity) => !usedIds.has(activity.id)).slice(0, 8),
    [candidates, usedIds],
  );

  function provisionalPlan(items: PlanItem[]): DailyPlan {
    return {
      ...plan,
      items,
      totalCost: items.reduce((sum, item) => sum + item.activity.cost, 0),
    };
  }

  async function recalculate(nextPlan: DailyPlan, expectedIds: string[]) {
    try {
      const response = await fetch("/api/plan/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: nextPlan, style: option.style, startLocation, preferredTransportMode, budget }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message ?? "일정을 다시 계산하지 못했습니다.");
      const recalculated = data.plan as DailyPlan;
      const recalculatedIds = new Set(recalculated.items.map((item) => item.activity.id));
      if (recalculated.items.length !== expectedIds.length || expectedIds.some((id) => !recalculatedIds.has(id))) {
        const reason = Array.isArray(data.draftFailures) ? data.draftFailures[0]?.reason : undefined;
        throw new Error(reason ?? "변경 후 일부 활동을 배치할 수 없어 기존 일정을 유지했습니다.");
      }
      setPlan(recalculated);
      setEditMessage("일정 시간·이동·예산·귀가정보를 다시 계산했습니다.");
      return true;
    } catch (error) {
      setEditMessage(error instanceof Error ? error.message : "일정을 변경하지 못했습니다.");
      return false;
    }
  }

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
      setEditMessage("");
      const current = plan.items[index];
      const nextItems = plan.items.map((item, itemIndex) => itemIndex === index ? {
          ...item,
          activity,
          fixedTime: activity.fixedTime,
          endTime: minutesToTime(timeToMinutes(current.startTime) + activity.durationMinutes),
        } : item);
      await recalculate(provisionalPlan(nextItems), nextItems.map((item) => item.activity.id));
      setReplacingIndex(null);
    });
  }

  function deleteActivity(index: number) {
    startTransition(async () => {
      setEditMessage("");
      const nextItems = plan.items.filter((_, itemIndex) => itemIndex !== index);
      if (await recalculate(provisionalPlan(nextItems), nextItems.map((item) => item.activity.id))) setReplacingIndex(null);
    });
  }

  function addActivity(activity: Activity) {
    startTransition(async () => {
      setEditMessage("");
      const startTime = activity.fixedTime && activity.startAt ? activity.startAt : plan.startTime;
      const addedItem: PlanItem = {
        activity,
        startTime,
        endTime: minutesToTime(timeToMinutes(startTime) + activity.durationMinutes),
        fixedTime: activity.fixedTime,
      };
      const nextItems = [...plan.items, addedItem];
      if (await recalculate(provisionalPlan(nextItems), nextItems.map((item) => item.activity.id))) setAddingOpen(false);
    });
  }

  function movableIndex(index: number, direction: -1 | 1) {
    for (let target = index + direction; target >= 0 && target < plan.items.length; target += direction) {
      if (!plan.items[target].fixedTime) return target;
    }
    return -1;
  }

  function moveActivity(index: number, direction: -1 | 1) {
    const target = movableIndex(index, direction);
    if (target < 0 || plan.items[index].fixedTime) return;
    startTransition(async () => {
      setEditMessage("");
      const nextItems = [...plan.items];
      [nextItems[index], nextItems[target]] = [nextItems[target], nextItems[index]];
      await recalculate(provisionalPlan(nextItems), nextItems.map((item) => item.activity.id));
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

      <div className="mt-6">
        <div className="grid gap-3 md:grid-cols-2">
          {plan.items.map((item, index) => (
            <div key={`${option.id}-${item.activity.id}-${index}`} className="rounded-2xl border border-black/[0.04] bg-neutral-50 p-4">
              <div className="mb-3 flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#18210f] text-xs font-black text-white">{index + 1}</span>{(item.travelFromPreviousMinutes ?? 0) > 0 ? <p className="text-xs font-bold text-neutral-400">이동 {item.travelFromPreviousMinutes}분 · {(item.distanceFromPreviousKm ?? 0).toFixed(1)}km</p> : <p className="text-xs font-bold text-neutral-400">일정 시작</p>}</div>
              <div className="flex items-center justify-between gap-2"><strong>{item.startTime} ~ {item.endTime}</strong><span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold">{item.fixedTime ? "시간 고정" : "조정 가능"}</span></div>
              <p className="mt-1 font-black">{item.activity.title}</p>
              <p className="mt-1 text-xs text-neutral-500">{item.activity.location ?? "장소 미정"} · {item.activity.cost.toLocaleString()}원</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setReplacingIndex(replacingIndex === index ? null : index)} disabled={pending} className="rounded-xl border px-3 py-2 text-xs font-black">교체</button>
                <button type="button" onClick={() => deleteActivity(index)} disabled={pending} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-700">삭제</button>
                {!item.fixedTime ? <><button type="button" onClick={() => moveActivity(index, -1)} disabled={pending || movableIndex(index, -1) < 0} className="rounded-xl border px-3 py-2 text-xs font-black disabled:opacity-30" aria-label={`${item.activity.title} 위로 이동`}>↑ 위로</button><button type="button" onClick={() => moveActivity(index, 1)} disabled={pending || movableIndex(index, 1) < 0} className="rounded-xl border px-3 py-2 text-xs font-black disabled:opacity-30" aria-label={`${item.activity.title} 아래로 이동`}>↓ 아래로</button></> : null}
              </div>
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
          {(plan.returnTravelMinutes ?? 0) > 0 ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 md:col-span-2">
              <p className="text-xs font-bold text-blue-600">↓ 귀가 {plan.returnTravelMinutes}분 · {(plan.returnDistanceKm ?? 0).toFixed(1)}km</p>
              <div className="mt-2 flex items-center justify-between gap-2"><strong>{plan.items.at(-1)?.endTime} ~ {plan.estimatedReturnTime}</strong><span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold">출발지 도착</span></div>
              <p className="mt-1 font-black">귀가</p>
            </div>
          ) : null}
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-dashed p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">활동 직접 추가</h3><p className="text-xs text-neutral-500">추가 후 전체 시간과 이동·귀가 가능성을 다시 검사합니다.</p></div><button type="button" onClick={() => setAddingOpen((current) => !current)} disabled={pending} className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-black text-white">{addingOpen ? "닫기" : "+ 활동 추가"}</button></div>
        {addingOpen ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{additionCandidates.length ? additionCandidates.map((candidate) => <button key={candidate.id} type="button" onClick={() => addActivity(candidate)} disabled={pending} className="rounded-xl bg-neutral-50 p-3 text-left text-sm"><strong className="block">{candidate.title}</strong><span className="text-xs text-neutral-500">{candidate.durationMinutes}분 · {candidate.cost.toLocaleString()}원 · {candidate.fixedTime ? "시간 고정" : "조정 가능"}</span></button>) : <p className="text-sm text-neutral-500">추가할 수 있는 새 후보가 없습니다.</p>}</div> : null}
      </section>

      {editMessage ? <p role="status" className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${editMessage.includes("다시 계산했습니다") ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{editMessage}</p> : null}

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
