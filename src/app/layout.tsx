import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘 뭐하지?",
  description: "날씨·시간·지역·취향으로 오늘의 활동과 일정을 추천합니다.",
};

const nav = [
  ["오늘추천", "/"],
  ["밖에서", "/outdoor"],
  ["집에서", "/home"],
  ["일정만들기", "/plan"],
  ["사용법", "/guide"],
] as const;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  return (
    <html lang="ko">
      <body>
        <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
            <Link href="/" className="shrink-0 text-xl font-black tracking-tight">오늘 뭐하지?</Link>
            <nav className="hidden gap-6 text-sm font-semibold md:flex">
              {nav.map(([label, href]) => (
                <Link key={href} href={href} className="hover:opacity-60">{label}</Link>
              ))}
            </nav>
            <div className="flex shrink-0 items-center gap-2">
              <Link href="/guide" className="rounded-full bg-black px-3 py-2 text-xs font-bold text-white md:hidden">사용법</Link>
              <Link
                href={user ? "/my" : "/login"}
                className="rounded-full border px-4 py-2 text-sm font-semibold"
              >
                {user ? "MY" : "로그인"}
              </Link>
            </div>
          </div>
        </header>
        {children}
        <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t bg-white px-2 py-2 text-center text-xs md:hidden">
          <Link href="/">오늘</Link>
          <Link href="/outdoor">밖에서</Link>
          <Link href="/plan" className="font-black">＋일정</Link>
          <Link href="/home">집에서</Link>
          <Link href={user ? "/my" : "/login"}>{user ? "MY" : "로그인"}</Link>
        </nav>
      </body>
    </html>
  );
}
