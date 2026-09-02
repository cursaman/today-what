import type { Coordinates } from "@/types/activity";
import type { TransportProvider } from "../TransportProvider";
import type { TransportRoute } from "@/types/travel";
import { calculateDistanceKm } from "@/lib/location/calculateDistance";
import { estimateTravelMinutes } from "@/lib/location/estimateTravelTime";
import type { TransportMode } from "@/types/travel";

export class EstimateTransportProvider implements TransportProvider {
  async getRoute(from: Coordinates, to: Coordinates, mode: TransportMode = "car"): Promise<TransportRoute> {
    const distanceKm = calculateDistanceKm(from.latitude, from.longitude, to.latitude, to.longitude);
    const requestedMode = mode === "walk" || mode === "transit" ? mode : "car";
    return {
      distanceKm,
      durationMinutes: estimateTravelMinutes(distanceKm, requestedMode),
      mode: requestedMode === "car" ? "estimate" : requestedMode,
      source: `estimate-${requestedMode}`,
    };
  }
}
