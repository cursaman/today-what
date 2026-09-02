import { NextRequest, NextResponse } from "next/server";
import { getTravelInfo } from "@/lib/transport/getTravelInfo";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const fromLat = Number(params.get("fromLat"));
  const fromLng = Number(params.get("fromLng"));
  const toLat = Number(params.get("toLat"));
  const toLng = Number(params.get("toLng"));

  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) return NextResponse.json({ message: "좌표가 올바르지 않습니다." }, { status: 400 });
  const route = await getTravelInfo({ latitude: fromLat, longitude: fromLng }, { latitude: toLat, longitude: toLng });
  return NextResponse.json(route);
}
