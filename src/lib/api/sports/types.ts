export interface SportGame {
  id: string;
  league: "KBO" | "KLEAGUE" | "EPL" | "MLB";
  homeTeam: string;
  awayTeam: string;
  startAt: string;
  endAt?: string;
  stadium?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  status: "scheduled" | "live" | "finished" | "postponed";
  source: string;
}
