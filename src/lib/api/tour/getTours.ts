import type { TourApiItem } from "./types";

interface TourResponse {
  response?: { body?: { items?: { item?: TourApiItem | TourApiItem[] } } };
}

const AREA_CODES: Record<string, string> = { 서울: "1", 부산: "6", 대구: "4", 울산: "7" };

export async function getTours(region: string): Promise<TourApiItem[]> {
  const key = process.env.TOUR_API_KEY;
  if (!key) return [];

  try {
    const url = new URL("https://apis.data.go.kr/B551011/KorService2/areaBasedList2");
    url.searchParams.set("serviceKey", key);
    url.searchParams.set("MobileOS", "ETC");
    url.searchParams.set("MobileApp", "today-what");
    url.searchParams.set("_type", "json");
    url.searchParams.set("areaCode", AREA_CODES[region] ?? "6");
    url.searchParams.set("contentTypeId", "12");
    url.searchParams.set("numOfRows", "12");
    url.searchParams.set("pageNo", "1");
    url.searchParams.set("arrange", "Q");

    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error(String(response.status));
    const data = (await response.json()) as TourResponse;
    const item = data.response?.body?.items?.item;
    if (!item) return [];
    return Array.isArray(item) ? item : [item];
  } catch (error) {
    console.error("TourAPI error", error);
    return [];
  }
}
