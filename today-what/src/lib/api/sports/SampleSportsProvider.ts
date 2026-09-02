import type { SportsProvider } from "./SportsProvider";
import type { SportGame } from "./types";

export class SampleSportsProvider implements SportsProvider {
  async getGames(date: string): Promise<SportGame[]> {
    return [{
      id: `kbo-lotte-home-${date}`,
      league: "KBO",
      homeTeam: "롯데",
      awayTeam: "LG",
      startAt: `${date}T18:30:00+09:00`,
      endAt: `${date}T21:30:00+09:00`,
      stadium: "사직야구장",
      region: "부산",
      latitude: 35.194,
      longitude: 129.0616,
      status: "scheduled",
      source: "sample-sports-provider",
    }];
  }
}
