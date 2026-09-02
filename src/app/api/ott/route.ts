import { NextRequest, NextResponse } from "next/server";
import { getOttMovieCards, SUPPORTED_OTT_SERVICES } from "@/lib/api/tmdb/getOttActivities";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!process.env.TMDB_ACCESS_TOKEN) {
    return NextResponse.json(
      {
        success: false,
        configured: false,
        message: "Vercel 환경변수 TMDB_ACCESS_TOKEN을 설정해 주세요.",
        services: SUPPORTED_OTT_SERVICES,
        items: [],
      },
      { status: 200 }
    );
  }

  const raw = request.nextUrl.searchParams.get("services") ?? "";
  const services = raw.split(",").map((value) => value.trim()).filter(Boolean);

  try {
    const items = await getOttMovieCards(services);
    return NextResponse.json({
      success: true,
      configured: true,
      services: SUPPORTED_OTT_SERVICES,
      count: items.length,
      items,
      attribution: "Streaming availability data powered by JustWatch via TMDB.",
    });
  } catch (error) {
    console.error("/api/ott error", error);
    return NextResponse.json(
      {
        success: false,
        configured: true,
        message: "TMDB 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        services: SUPPORTED_OTT_SERVICES,
        items: [],
      },
      { status: 200 }
    );
  }
}
