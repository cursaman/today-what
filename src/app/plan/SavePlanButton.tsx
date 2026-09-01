"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SavePlanInput } from "./actions";
import { savePlan } from "./actions";

export default function SavePlanButton({ input }: { input: SavePlanInput }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setMessage("");
    startTransition(async () => {
      const result = await savePlan(input);
      setMessage(result.message);
      if (result.success) {
        router.push("/my");
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-5">
      <button onClick={handleSave} disabled={pending} className="w-full rounded-2xl bg-neutral-900 px-4 py-3 font-black text-white disabled:opacity-50">
        {pending ? "저장 중..." : "이 일정 저장"}
      </button>
      {message && <p className="mt-2 text-center text-sm text-neutral-600">{message}</p>}
    </div>
  );
}
