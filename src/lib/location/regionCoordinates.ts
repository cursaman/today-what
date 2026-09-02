import type { UserLocation } from "@/types/location";

export const REGION_COORDINATES: Record<string, UserLocation> = {
  서울: { latitude: 37.5665, longitude: 126.978, region: "서울" },
  부산: { latitude: 35.1796, longitude: 129.0756, region: "부산" },
  대구: { latitude: 35.8714, longitude: 128.6014, region: "대구" },
  인천: { latitude: 37.4563, longitude: 126.7052, region: "인천" },
  광주: { latitude: 35.1595, longitude: 126.8526, region: "광주" },
  대전: { latitude: 36.3504, longitude: 127.3845, region: "대전" },
  울산: { latitude: 35.5384, longitude: 129.3114, region: "울산" },
  세종: { latitude: 36.48, longitude: 127.289, region: "세종" },
  경기: { latitude: 37.4138, longitude: 127.5183, region: "경기" },
  강원: { latitude: 37.8228, longitude: 128.1555, region: "강원" },
  충북: { latitude: 36.8, longitude: 127.7, region: "충북" },
  충남: { latitude: 36.5184, longitude: 126.8, region: "충남" },
  경북: { latitude: 36.4919, longitude: 128.8889, region: "경북" },
  경남: { latitude: 35.4606, longitude: 128.2132, region: "경남" },
  전북: { latitude: 35.7175, longitude: 127.153, region: "전북" },
  전남: { latitude: 34.8679, longitude: 126.991, region: "전남" },
  제주: { latitude: 33.4996, longitude: 126.5312, region: "제주" },
};

export function getRegionLocation(region: string): UserLocation {
  return REGION_COORDINATES[region] ?? REGION_COORDINATES["부산"];
}
