import type { Activity } from "@/types/activity";
import type { TourApiItem } from "./types";

function isIndoor(title: string) {
  return ["박물관", "미술관", "전시", "아쿠아리움", "문화관", "센터"].some((keyword) => title.includes(keyword));
}

export function tourToActivity(item: TourApiItem): Activity {
  const latitude = Number(item.mapy);
  const longitude = Number(item.mapx);
  return {
    id: `tour-${item.contentid}`,
    type: "tour",
    title: item.title,
    description: item.addr1,
    durationMinutes: 120,
    fixedTime: false,
    indoor: isIndoor(item.title),
    cost: 0,
    location: item.addr1,
    coordinates: Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : undefined,
    interests: ["travel"],
    source: "tourapi",
    metadata: { image: item.firstimage, contentTypeId: item.contenttypeid },
  };
}
