import type { Coordinates } from "@/types/activity";
import type { TransportProvider } from "../TransportProvider";
import type { TransportRoute } from "@/types/travel";
import { calculateDistanceKm } from "@/lib/location/calculateDistance";
import { estimateTravelMinutes } from "@/lib/location/estimateTravelTime";

export class EstimateTransportProvider implements TransportProvider {
  async getRoute(from: Coordinates, to: Coordinates): Promise<TransportRoute> {
    const distanceKm = calculateDistanceKm(from.latitude, from.longitude, to.latitude, to.longitude);
    return { distanceKm, durationMinutes: estimateTravelMinutes(distanceKm), mode: "estimate", source: "estimate" };
  }
}
