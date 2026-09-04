import { NextRequest, NextResponse } from "next/server";
import { getTours, TOUR_CATEGORIES } from "@/lib/api/tour/getTours";
import { tourToActivity } from "@/lib/api/tour/tourToActivity";
import type { TourCategory } from "@/lib/api/tour/types";
import { getRegionLocation } from "@/lib/location/regionCoordinates";
import { getWeather } from "@/lib/api/weather/getWeather";
import { calculateDistanceKm } from "@/lib/location/calculateDistance";
import { createClient } from "@/lib/supabase/server";
import { sampleActivities } from "@/data/sampleActivities";

const validCategories = new Set<string>([...TOUR_CATEGORIES.map((item) => item.id), "golf"]);

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region")?.trim() || "부산";
  const categoryParam = request.nextUrl.searchParams.get("category") || "all";
  const category = validCategories.has(categoryParam) ? categoryParam : "all";
  const tourCategory = (category === "golf" ? "all" : category) as TourCategory;
  const center = getRegionLocation(region);
  let interests: string[] = [];
  let activityMode = "balanced";
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: pref } = await supabase.from("user_preferences").select("interests,activity_mode").eq("user_id", user.id).maybeSingle();
      interests = Array.isArray(pref?.interests) ? pref.interests.filter((v): v is string => typeof v === "string") : [];
      activityMode = typeof pref?.activity_mode === "string" ? pref.activity_mode : "balanced";
    }
  }

  const [tourItems, weather] = await Promise.all([
    category === "golf" ? Promise.resolve([]) : getTours(region, tourCategory, 24),
    getWeather(region, center),
  ]);

  const golfActivities = sampleActivities.filter((activity) =>
    activity.interests.includes("golf") && activity.metadata?.region === region && (category === "all" || category === "golf")
  );
  const activities = [...tourItems.map(tourToActivity), ...golfActivities]
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

      const matchedInterests = activity.interests.filter((interest) => interests.includes(interest)).length;
      if (matchedInterests > 0) { score += matchedInterests * 15; reasons.push("MY 관심사와 잘 맞는 활동"); }
      if (activityMode === "indoor") { score += activity.indoor ? 20 : -10; }
      if (activityMode === "outdoor") { score += activity.indoor ? -5 : 20; }

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
