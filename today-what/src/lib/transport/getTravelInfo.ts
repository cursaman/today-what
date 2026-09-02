import type { Coordinates } from "@/types/activity";
import type { TransportRoute } from "@/types/travel";
import { KakaoTransportProvider } from "./providers/KakaoTransportProvider";
import { EstimateTransportProvider } from "./providers/EstimateTransportProvider";

export async function getTravelInfo(from: Coordinates, to: Coordinates): Promise<TransportRoute> {
  if (process.env.KAKAO_REST_API_KEY) {
    try {
      return await new KakaoTransportProvider().getRoute(from, to);
    } catch (error) {
      console.error("Kakao route fallback:", error);
    }
  }
  return new EstimateTransportProvider().getRoute(from, to);
}
