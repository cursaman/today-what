import { describe, expect, it } from "vitest";
import type { Activity } from "@/types/activity";
import { diversifyOttMovieCards, type OttMovieCard, type SupportedOttService } from "./getOttActivities";

function card(id: number, genre: string, service: SupportedOttService, rating = 8): OttMovieCard {
  const activity: Activity = {
    id: `movie-${id}`, type: "ott", title: `영화 ${id}`, durationMinutes: 120,
    fixedTime: false, indoor: true, cost: 0, location: "집", interests: ["movie", "ott"],
    source: "test",
  };
  return {
    activity, tmdbId: id, posterUrl: null, rating, releaseYear: null, genres: [genre], watchLink: null,
    providers: [{ id, name: service, service, logoUrl: null }],
  };
}

describe("diversifyOttMovieCards", () => {
  it("선택한 여러 OTT와 장르가 추천 앞부분에 고르게 나오도록 재정렬한다", () => {
    const cards = [
      card(1, "액션", "Netflix", 9), card(2, "액션", "Netflix", 8.8),
      card(3, "코미디", "TVING", 8), card(4, "드라마", "Disney+", 7.5),
    ];

    const result = diversifyOttMovieCards(cards, ["Netflix", "TVING", "Disney+"]);

    expect(new Set(result.slice(0, 3).map((item) => item.providers[0].service)).size).toBe(3);
    expect(new Set(result.slice(0, 3).map((item) => item.genres[0])).size).toBe(3);
  });
});
