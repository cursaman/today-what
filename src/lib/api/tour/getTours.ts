import type { TourApiItem, TourCategory } from "./types";

interface TourResponse {
  response?: {
    header?: { resultCode?: string; resultMsg?: string };
    body?: {
      totalCount?: number;
      items?: { item?: TourApiItem | TourApiItem[] } | "";
    };
  };
}

export const AREA_CODES: Record<string, string> = {
  서울: "1",
  인천: "2",
  대전: "3",
  대구: "4",
  광주: "5",
  부산: "6",
  울산: "7",
  세종: "8",
  경기: "31",
  강원: "32",
  충북: "33",
  충남: "34",
  경북: "35",
  경남: "36",
  전북: "37",
  전남: "38",
  제주: "39",
};

export const TOUR_CATEGORIES = [
  { id: "all", label: "전체" },
  { id: "12", label: "관광지" },
  { id: "14", label: "문화·전시" },
  { id: "15", label: "축제·행사" },
  { id: "28", label: "레저·체험" },
] as const;

function normalizeServiceKey(value: string) {
  // 공공데이터포털에서 Encoding 키를 복사했을 때도 한 번만 인코딩되도록 처리합니다.
  if (!value.includes("%")) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function getTours(
  region: string,
  category: TourCategory = "all",
  numOfRows = 24,
): Promise<TourApiItem[]> {
  const key = process.env.TOUR_API_KEY;
  if (!key) return [];

  const categories = category === "all" ? (["12", "14", "15", "28"] as const) : [category];
  const rowsPerCategory = category === "all" ? Math.max(6, Math.ceil(numOfRows / categories.length)) : numOfRows;

  try {
    const results = await Promise.all(
      categories.map(async (contentTypeId) => {
        const url = new URL("https://apis.data.go.kr/B551011/KorService2/areaBasedList2");
        url.searchParams.set("serviceKey", normalizeServiceKey(key));
        url.searchParams.set("MobileOS", "ETC");
        url.searchParams.set("MobileApp", "today-what");
        url.searchParams.set("_type", "json");
        url.searchParams.set("areaCode", AREA_CODES[region] ?? AREA_CODES["부산"]);
        url.searchParams.set("contentTypeId", contentTypeId);
        url.searchParams.set("numOfRows", String(rowsPerCategory));
        url.searchParams.set("pageNo", "1");
        url.searchParams.set("arrange", "Q");

        const response = await fetch(url, {
          next: { revalidate: 1800 },
        });
        if (!response.ok) throw new Error(`TourAPI HTTP ${response.status}`);

        const data = (await response.json()) as TourResponse;
        const resultCode = data.response?.header?.resultCode;
        if (resultCode && resultCode !== "0000") {
          throw new Error(data.response?.header?.resultMsg ?? `TourAPI ${resultCode}`);
        }

        const items = data.response?.body?.items;
        if (!items || typeof items !== "object") return [];
        const item = items.item;
        if (!item) return [];
        return Array.isArray(item) ? item : [item];
      }),
    );

    const unique = new Map<string, TourApiItem>();
    results.flat().forEach((item) => {
      if (item.contentid && item.title) unique.set(item.contentid, item);
    });
    return [...unique.values()].slice(0, numOfRows);
  } catch (error) {
    console.error("TourAPI error", error);
    return [];
  }
}
