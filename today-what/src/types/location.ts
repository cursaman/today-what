import type { Coordinates } from "./activity";

export interface UserLocation extends Coordinates {
  region?: string;
  address?: string;
}
