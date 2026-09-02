import type { Activity } from "@/types/activity";
import type { SportGame } from "./types";

export function sportToActivity(game: SportGame, watchAtHome = false): Activity {
  return {
    id: `${watchAtHome ? "sport-watch" : "sport"}-${game.id}`,
    type: "sport",
    title: `${game.awayTeam} vs ${game.homeTeam}${watchAtHome ? " 시청" : ""}`,
    startAt: game.startAt,
    endAt: game.endAt,
    durationMinutes: 180,
    fixedTime: true,
    indoor: watchAtHome,
    cost: watchAtHome ? 0 : 20000,
    location: watchAtHome ? "집" : game.stadium,
    coordinates: !watchAtHome && game.latitude != null && game.longitude != null ? { latitude: game.latitude, longitude: game.longitude } : undefined,
    interests: ["sports", game.homeTeam, game.awayTeam],
    source: game.source,
    metadata: { league: game.league, homeTeam: game.homeTeam, awayTeam: game.awayTeam, status: game.status, mode: watchAtHome ? "watch" : "stadium" },
  };
}
