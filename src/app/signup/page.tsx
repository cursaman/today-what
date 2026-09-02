"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setNeedsEmailConfirmation(false);

    try {
      const supabase = createClient();

      // 운영 배포에서는 NEXT_PUBLIC_SITE_URL을 우선 사용합니다.
      // 값이 없으면 현재 접속 중인 도메인(Vercel/localhost)을 자동으로 사용합니다.
      const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
      const siteUrl = configuredSiteUrl || window.location.origin;
      const emailRedirectTo = `${siteUrl}/my/preferences`;

      // 같은 브라우저에서 이전 사용자가 남긴 일정 후보가 새 계정에 보이지 않도록
      // 회원가입 시작 시 게스트/구버전 후보 쿠키를 정리합니다.
      await fetch("/api/plan-draft?scope=all", { method: "DELETE" });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      // 이메일 확인이 꺼져 있으면 Supabase가 바로 세션을 발급합니다.
      // 첫 사용자가 길을 잃지 않도록 곧바로 취향 설정으로 이동합니다.
      if (data.session) {
        router.push("/my/preferences");
        router.refresh();
        return;
      }

      // 이메일 확인이 켜진 프로젝트는 메일 인증 후 로그인이 필요합니다.
      setNeedsEmailConfirmation(true);
      setMessage("가입 요청이 완료되었습니다. 이메일의 인증 링크를 누르면 취향 설정 화면으로 이동합니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 pb-24">
      <p className="text-sm font-bold text-neutral-500">FIRST STEP</p>
      <h1 className="mt-1 text-4xl font-black">처음 오셨나요?</h1>
      <p className="mt-3 leading-7 text-neutral-600">
        1분이면 가입할 수 있습니다. 가입 후 내 지역과 취향을 설정하면 오늘의 추천이 더 정확해집니다.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs font-bold text-neutral-500">
        <div className="rounded-2xl bg-neutral-100 px-2 py-3"><strong className="block text-neutral-900">1</strong>회원가입</div>
        <div className="rounded-2xl bg-neutral-100 px-2 py-3"><strong className="block text-neutral-900">2</strong>취향설정</div>
        <div className="rounded-2xl bg-neutral-100 px-2 py-3"><strong className="block text-neutral-900">3</strong>추천보기</div>
      </div>

      <form onSubmit={handleSignup} className="mt-6 space-y-4 rounded-3xl border bg-white p-6 shadow-sm">
        <label className="block text-sm font-bold">
          이메일
          <input
            required
            type="email"
            autoComplete="email"
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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border px-4 py-3 font-normal outline-none focus:ring-2"
            placeholder="6자 이상 입력해주세요"
          />
        </label>

        <button disabled={loading} className="w-full rounded-2xl bg-neutral-900 px-4 py-3 font-black text-white disabled:opacity-50">
          {loading ? "가입 중..." : "가입하고 취향 설정하기"}
        </button>

        {message && (
          <div className={`rounded-xl p-3 text-sm ${needsEmailConfirmation ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
            <p>{message}</p>
            {needsEmailConfirmation ? (
              <Link href="/login?next=/my/preferences" className="mt-3 inline-block font-black underline">
                인증 후 로그인하기
              </Link>
            ) : null}
          </div>
        )}
      </form>

      <p className="mt-5 text-center text-sm text-neutral-600">
        이미 계정이 있나요? <Link href="/login?next=/my/preferences" className="font-black underline">로그인</Link>
      </p>
    </main>
  );
}
