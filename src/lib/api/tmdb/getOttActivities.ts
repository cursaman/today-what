import type { Activity } from "@/types/activity";
import type { TmdbMovieResponse, TmdbProvider, TmdbWatchResponse } from "./types";
import { tmdbFetch } from "./tmdbFetch";

function matches(provider: TmdbProvider, services: string[]) {
  if (!services.length) return true;
  const aliases: Record<string, string[]> = { "Disney+": ["Disney Plus", "Disney+"], Wavve: ["wavve", "Wavve"] };
  return services.some((service) => (aliases[service] ?? [service]).some((name) => provider.provider_name.toLowerCase().includes(name.toLowerCase())));
}

export async function getOttActivities(services: string[]): Promise<Activity[]> {
  if (!process.env.TMDB_ACCESS_TOKEN) return [];
  try {
    const data = await tmdbFetch<TmdbMovieResponse>("/movie/popular?language=ko-KR&region=KR&page=1");
    const movies = data.results.slice(0, 8);
    const rows: Array<Activity | null> = await Promise.all(movies.map(async (movie): Promise<Activity | null> => {
      try {
        const watch = await tmdbFetch<TmdbWatchResponse>(`/movie/${movie.id}/watch/providers`);
        const providers = (watch.results?.KR?.flatrate ?? []).filter((provider) => matches(provider, services));
        if (!providers.length) return null;
        const activity: Activity = {
          id: `tmdb-ott-${movie.id}`,
          type: "ott" as const,
          title: movie.title,
          description: movie.overview,
          durationMinutes: 120,
          fixedTime: false,
          indoor: true,
          cost: 0,
          location: "집",
          interests: ["movie", "ott"],
          source: "tmdb",
          metadata: { tmdbId: movie.id, poster: movie.poster_path, rating: movie.vote_average, providers: providers.map((p) => p.provider_name), attribution: "JustWatch" },
        };
        return activity;
      } catch { return null; }
    }));
    return rows.filter((row): row is Activity => row !== null);
  } catch (error) {
    console.error("TMDB error", error);
    return [];
  }
}
