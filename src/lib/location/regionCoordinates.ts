import type { UserLocation } from "@/types/location";

export const REGION_COORDINATES: Record<string, UserLocation> = {
  부산: { latitude: 35.1796, longitude: 129.0756, region: "부산" },
  서울: { latitude: 37.5665, longitude: 126.978, region: "서울" },
  대구: { latitude: 35.8714, longitude: 128.6014, region: "대구" },
  울산: { latitude: 35.5384, longitude: 129.3114, region: "울산" },
};

export function getRegionLocation(region: string): UserLocation {
  return REGION_COORDINATES[region] ?? REGION_COORDINATES["부산"];
}
