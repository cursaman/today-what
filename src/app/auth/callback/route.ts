import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/my/preferences";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const errorUrl = new URL(`/login?next=${encodeURIComponent(next)}&error=confirmation`, request.url);
  if (!code) return NextResponse.redirect(errorUrl);

  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(errorUrl);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(error ? errorUrl : next, request.url));
}
