"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SubpageHero from "@/components/layout/SubpageHero";

function getSafeNextPath() {
  if (typeof window === "undefined") return "/my";
  const value = new URLSearchParams(window.location.search).get("next");
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/my";
  return value;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.push(getSafeNextPath());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8 pb-24">
      <SubpageHero eyebrow="WELCOME BACK" title="다시 만났네요!" description="로그인하고 저장한 일정과 나만의 추천 설정을 이어서 관리하세요." icon="☻" tone="sky" />

      <form onSubmit={handleLogin} className="mt-6 space-y-5 rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,.06)] md:p-8">
        <label className="block text-sm font-bold">
          이메일
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 font-normal outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-100"
            placeholder="you@example.com"
          />
        </label>

        <label className="block text-sm font-bold">
          비밀번호
          <input
            required
            minLength={6}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 font-normal outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-100"
            placeholder="비밀번호"
          />
        </label>

        <button disabled={loading} className="w-full rounded-2xl bg-[#18210f] px-4 py-4 font-black text-white shadow-lg disabled:opacity-50">
          {loading ? "로그인 중..." : "로그인"}
        </button>

        {message && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{message}</p>}
      </form>

      <p className="mt-5 text-center text-sm text-neutral-600">
        아직 계정이 없나요? <Link href="/signup" className="font-black underline">회원가입</Link>
      </p>
    </main>
  );
}
