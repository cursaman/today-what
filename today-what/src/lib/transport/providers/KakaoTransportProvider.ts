import type { Coordinates } from "@/types/activity";
import type { TransportProvider } from "../TransportProvider";
import type { TransportRoute } from "@/types/travel";

interface KakaoDirectionsResponse {
  routes?: Array<{ result_code?: number; summary?: { distance?: number; duration?: number } }>;
}

export class KakaoTransportProvider implements TransportProvider {
  async getRoute(from: Coordinates, to: Coordinates): Promise<TransportRoute> {
    const key = process.env.KAKAO_REST_API_KEY;
    if (!key) throw new Error("KAKAO_REST_API_KEY가 없습니다.");

    const url = new URL("https://apis-navi.kakaomobility.com/v1/directions");
    url.searchParams.set("origin", `${from.longitude},${from.latitude}`);
    url.searchParams.set("destination", `${to.longitude},${to.latitude}`);
    url.searchParams.set("summary", "true");

    const response = await fetch(url, {
      headers: { Authorization: `KakaoAK ${key}`, "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Kakao Mobility ${response.status}`);

    const data = (await response.json()) as KakaoDirectionsResponse;
    const summary = data.routes?.[0]?.summary;
    if (!summary?.distance || !summary.duration) throw new Error("경로 요약정보가 없습니다.");

    return {
      distanceKm: summary.distance / 1000,
      durationMinutes: Math.max(1, Math.ceil(summary.duration / 60)),
      mode: "car",
      source: "kakao-mobility",
    };
  }
}
