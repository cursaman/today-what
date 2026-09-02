import type { Activity } from "@/types/activity";
import type { TourApiItem } from "./types";

const CATEGORY_LABELS: Record<string, string> = {
  "12": "관광지",
  "14": "문화·전시",
  "15": "축제·행사",
  "28": "레저·체험",
};

const CATEGORY_INTERESTS: Record<string, string[]> = {
  "12": ["travel"],
  "14": ["travel", "culture"],
  "15": ["travel", "festival"],
  "28": ["travel", "activity"],
};

function isIndoor(title: string, contentTypeId?: string) {
  if (contentTypeId === "14") return true;
  return ["박물관", "미술관", "전시", "아쿠아리움", "문화관", "센터", "기념관", "과학관", "도서관"].some(
    (keyword) => title.includes(keyword),
  );
}

export function tourToActivity(item: TourApiItem): Activity {
  const latitude = Number(item.mapy);
  const longitude = Number(item.mapx);
  const contentTypeId = item.contenttypeid ?? "12";
  const location = [item.addr1, item.addr2].filter(Boolean).join(" ").trim();

  return {
    id: `tour-${item.contentid}`,
    type: "tour",
    title: item.title,
    description: location || "관광지 상세 주소를 확인해주세요.",
    durationMinutes: contentTypeId === "15" ? 150 : 120,
    fixedTime: false,
    indoor: isIndoor(item.title, contentTypeId),
    cost: 0,
    location: location || undefined,
    coordinates:
      Number.isFinite(latitude) && Number.isFinite(longitude) && latitude !== 0 && longitude !== 0
        ? { latitude, longitude }
        : undefined,
    interests: CATEGORY_INTERESTS[contentTypeId] ?? ["travel"],
    source: "tourapi",
    metadata: {
      contentId: item.contentid,
      image: item.firstimage || item.firstimage2 || "",
      contentTypeId,
      contentTypeLabel: CATEGORY_LABELS[contentTypeId] ?? "관광",
      tel: item.tel ?? "",
    },
  };
}
