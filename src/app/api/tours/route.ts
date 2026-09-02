import { NextRequest, NextResponse } from "next/server";
import { getTours, TOUR_CATEGORIES } from "@/lib/api/tour/getTours";
import { tourToActivity } from "@/lib/api/tour/tourToActivity";
import type { TourCategory } from "@/lib/api/tour/types";
import { getRegionLocation } from "@/lib/location/regionCoordinates";
import { getWeather } from "@/lib/api/weather/getWeather";
import { calculateDistanceKm } from "@/lib/location/calculateDistance";

const validCategories = new Set(TOUR_CATEGORIES.map((item) => item.id));

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region")?.trim() || "부산";
  const categoryParam = request.nextUrl.searchParams.get("category") || "all";
  const category = (validCategories.has(categoryParam as TourCategory) ? categoryParam : "all") as TourCategory;
  const center = getRegionLocation(region);

  const [tourItems, weather] = await Promise.all([
    getTours(region, category, 24),
    getWeather(region, center),
  ]);

  const activities = tourItems
    .map(tourToActivity)
    .map((activity) => {
      const distanceKm = activity.coordinates ? calculateDistanceKm(center.latitude, center.longitude, activity.coordinates.latitude, activity.coordinates.longitude) : null;
      let score = 60;
      const reasons: string[] = [];

      if (weather.raining) {
        if (activity.indoor) {
          score += 30;
          reasons.push("비 오는 날 즐기기 좋은 실내 활동");
        } else {
          score -= 20;
          reasons.push("우천 시 운영 여부를 확인하세요");
        }
      } else if (!activity.indoor) {
        score += 15;
        reasons.push("현재 날씨와 잘 맞는 야외 활동");
      } else {
        reasons.push("날씨와 관계없이 즐기기 좋은 실내 활동");
      }

      if (distanceKm !== null) {
        if (distanceKm <= 5) {
          score += 20;
          reasons.push("지역 중심에서 가까운 편");
        } else if (distanceKm <= 15) {
          score += 10;
          reasons.push("오늘 이동하기 부담 적은 거리");
        }
      }

      const typeLabel = String(activity.metadata?.contentTypeLabel ?? "관광");
      reasons.push(`${typeLabel} 추천 후보`);

      return { ...activity, score, distanceKm, reasons: reasons.slice(0, 3) };
    })
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({
    success: true,
    region,
    category,
    weather,
    count: activities.length,
    activities,
    configured: Boolean(process.env.TOUR_API_KEY),
  });
}
