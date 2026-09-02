"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DraftItem = { id: string; title: string; type: string; location?: string };

export default function PlanDraftSummary({ items }: { items: DraftItem[] }) {
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

  async function clearAll() {
    if (!items.length || clearing) return;
    setClearing(true);
    try {
      await fetch("/api/plan-draft?scope=all", { method: "DELETE" });
      router.refresh();
    } finally {
      setClearing(false);
    }
  }

  if (!items.length) {
    return (
      <section className="mt-6 rounded-3xl border border-dashed bg-white p-5">
        <p className="font-black">내가 선택한 일정 후보 0개</p>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          아직 직접 선택한 활동이 없습니다. 밖에서 또는 집에서 마음에 드는 활동을 고르면 여기에 표시됩니다.
          선택하지 않아도 취향과 날씨를 기준으로 A/B/C 추천 일정은 만들 수 있습니다.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-3xl border bg-emerald-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-emerald-900">내가 선택한 일정 후보 {items.length}개</p>
          <p className="mt-1 text-xs text-emerald-800/70">A/B/C 일정은 이 후보들을 우선 반영하고, 시간·예산·이동 조건에 따라 일부가 빠질 수 있습니다.</p>
        </div>
        <button type="button" onClick={clearAll} disabled={clearing} className="rounded-xl border border-emerald-900/15 bg-white px-3 py-2 text-xs font-black text-emerald-900 disabled:opacity-50">
          {clearing ? "비우는 중..." : "후보 전체 비우기"}
        </button>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((item, index) => (
          <div key={item.id} className="rounded-2xl bg-white px-4 py-3 text-sm">
            <span className="mr-2 font-black text-emerald-700">✓ {index + 1}</span>
            <strong>{item.title}</strong>
            <p className="mt-1 text-xs text-neutral-500">{item.location ?? "장소 정보 없음"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
