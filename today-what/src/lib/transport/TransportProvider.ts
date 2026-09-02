import type { Coordinates } from "@/types/activity";
import type { TransportMode, TransportRoute } from "@/types/travel";

export interface TransportProvider {
  getRoute(from: Coordinates, to: Coordinates, mode?: TransportMode): Promise<TransportRoute>;
}
