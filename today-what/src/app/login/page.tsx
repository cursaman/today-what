"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

      router.push("/my");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 pb-24">
      <p className="text-sm font-bold text-neutral-500">ACCOUNT</p>
      <h1 className="mt-1 text-4xl font-black">로그인</h1>
      <p className="mt-3 text-neutral-600">저장한 오늘의 일정을 MY에서 다시 확인할 수 있습니다.</p>

      <form onSubmit={handleLogin} className="mt-8 space-y-4 rounded-3xl border bg-white p-6 shadow-sm">
        <label className="block text-sm font-bold">
          이메일
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border px-4 py-3 font-normal outline-none focus:ring-2"
            placeholder="you@example.com"
          />
        </label>

        <label className="block text-sm font-bold">
          비밀번호
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border px-4 py-3 font-normal outline-none focus:ring-2"
            placeholder="비밀번호"
          />
        </label>

        <button disabled={loading} className="w-full rounded-2xl bg-neutral-900 px-4 py-3 font-black text-white disabled:opacity-50">
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
