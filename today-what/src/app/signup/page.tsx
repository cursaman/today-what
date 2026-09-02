"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({ email, password });
      setMessage(error ? error.message : "가입 요청이 완료되었습니다. 이메일 인증 설정이 켜져 있다면 메일을 확인해주세요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 pb-24">
      <p className="text-sm font-bold text-neutral-500">ACCOUNT</p>
      <h1 className="mt-1 text-4xl font-black">회원가입</h1>

      <form onSubmit={handleSignup} className="mt-8 space-y-4 rounded-3xl border bg-white p-6 shadow-sm">
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border px-4 py-3" placeholder="이메일" />
        <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border px-4 py-3" placeholder="비밀번호 (6자 이상)" />
        <button disabled={loading} className="w-full rounded-2xl bg-neutral-900 px-4 py-3 font-black text-white disabled:opacity-50">
          {loading ? "가입 중..." : "가입하기"}
        </button>
        {message && <p className="rounded-xl bg-neutral-100 p-3 text-sm">{message}</p>}
      </form>

      <p className="mt-5 text-center text-sm">이미 계정이 있나요? <Link href="/login" className="font-black underline">로그인</Link></p>
    </main>
  );
}
