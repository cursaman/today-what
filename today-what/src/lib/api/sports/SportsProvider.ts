import type { SportGame } from "./types";
export interface SportsProvider { getGames(date: string, region?: string): Promise<SportGame[]>; }
