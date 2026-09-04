import type { Activity } from "@/types/activity";
import type {
  TmdbMovie,
  TmdbMovieResponse,
  TmdbProvider,
  TmdbProviderListResponse,
  TmdbWatchResponse,
} from "./types";
import { tmdbFetch } from "./tmdbFetch";

export const SUPPORTED_OTT_SERVICES = ["Netflix", "TVING", "Disney+", "Wavve", "Watcha"] as const;
export type SupportedOttService = (typeof SUPPORTED_OTT_SERVICES)[number];

const SERVICE_ALIASES: Record<SupportedOttService, string[]> = {
  Netflix: ["netflix"],
  TVING: ["tving"],
  "Disney+": ["disney plus", "disney+"],
  Wavve: ["wavve"],
  Watcha: ["watcha"],
};

const GENRE_NAMES: Record<number, string> = {
  12: "모험", 14: "판타지", 16: "애니메이션", 18: "드라마", 27: "공포",
  28: "액션", 35: "코미디", 36: "역사", 37: "서부", 53: "스릴러",
  80: "범죄", 99: "다큐멘터리", 878: "SF", 9648: "미스터리",
  10402: "음악", 10749: "로맨스", 10751: "가족", 10752: "전쟁", 10770: "TV 영화",
};

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function serviceForProvider(provider: TmdbProvider): SupportedOttService | null {
  const name = normalize(provider.provider_name);
  for (const service of SUPPORTED_OTT_SERVICES) {
    if (SERVICE_ALIASES[service].some((alias) => name.includes(normalize(alias)))) return service;
  }
  return null;
}

function normalizeRequestedServices(services: string[]): SupportedOttService[] {
  const valid = services.filter((service): service is SupportedOttService =>
    (SUPPORTED_OTT_SERVICES as readonly string[]).includes(service)
  );
  return valid.length ? valid : [...SUPPORTED_OTT_SERVICES];
}

async function getKoreanProviders() {
  const data = await tmdbFetch<TmdbProviderListResponse>(
    "/watch/providers/movie?language=ko-KR&watch_region=KR"
  );

  const byService = new Map<SupportedOttService, TmdbProvider[]>();
  for (const provider of data.results ?? []) {
    const service = serviceForProvider(provider);
    if (!service) continue;
    const current = byService.get(service) ?? [];
    current.push(provider);
    byService.set(service, current);
  }
  return byService;
}

export interface OttMovieCard {
  activity: Activity;
  tmdbId: number;
  posterUrl: string | null;
  rating: number;
  releaseYear: string | null;
  providers: Array<{
    id: number;
    name: string;
    service: SupportedOttService;
    logoUrl: string | null;
  }>;
  watchLink: string | null;
  genres: string[];
}

function toActivity(movie: TmdbMovie, providers: TmdbProvider[], services: SupportedOttService[]): Activity {
  return {
    id: `tmdb-ott-${movie.id}`,
    type: "ott",
    title: movie.title,
    description: movie.overview || "줄거리 정보가 없습니다.",
    durationMinutes: 120,
    fixedTime: false,
    indoor: true,
    cost: 0,
    location: "집",
    interests: ["movie", "ott"],
    source: "tmdb",
    metadata: {
      tmdbId: movie.id,
      poster: movie.poster_path,
      rating: movie.vote_average,
      providers: providers.map((provider) => provider.provider_name),
      services,
      genreIds: movie.genre_ids ?? [],
      genres: (movie.genre_ids ?? []).map((id) => GENRE_NAMES[id]).filter(Boolean),
      attribution: "JustWatch",
      releaseDate: movie.release_date ?? null,
    },
  };
}

export function diversifyOttMovieCards(cards: OttMovieCard[], requestedServices: SupportedOttService[]): OttMovieCard[] {
  const remaining = cards.map((card, popularityIndex) => ({ card, popularityIndex }));
  const result: OttMovieCard[] = [];
  const genreCounts = new Map<string, number>();
  const serviceCounts = new Map<SupportedOttService, number>();

  while (remaining.length) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < remaining.length; index += 1) {
      const { card, popularityIndex } = remaining[index];
      const services = [...new Set(card.providers.map((provider) => provider.service))];
      const uncoveredServiceBonus = services.some((service) => requestedServices.includes(service) && !serviceCounts.has(service)) ? 35 : 0;
      const genrePenalty = card.genres.reduce((total, genre) => total + (genreCounts.get(genre) ?? 0) * 14, 0);
      const servicePenalty = services.reduce((total, service) => total + (serviceCounts.get(service) ?? 0) * 4, 0);
      const score = card.rating * 2 + uncoveredServiceBonus - genrePenalty - servicePenalty - popularityIndex;
      if (score > bestScore) { bestScore = score; bestIndex = index; }
    }

    const [{ card }] = remaining.splice(bestIndex, 1);
    result.push(card);
    for (const genre of card.genres) genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    for (const service of new Set(card.providers.map((provider) => provider.service))) {
      serviceCounts.set(service, (serviceCounts.get(service) ?? 0) + 1);
    }
  }

  return result;
}

export async function getOttMovieCards(services: string[]): Promise<OttMovieCard[]> {
  if (!process.env.TMDB_ACCESS_TOKEN) return [];

  try {
    const requested = normalizeRequestedServices(services);
    const providerMap = await getKoreanProviders();
    const selectedProviders = requested.flatMap((service) => providerMap.get(service) ?? []);

    if (!selectedProviders.length) return [];

    const providerIds = [...new Set(selectedProviders.map((provider) => provider.provider_id))];
    const query = new URLSearchParams({
      language: "ko-KR",
      region: "KR",
      watch_region: "KR",
      with_watch_monetization_types: "flatrate",
      with_watch_providers: providerIds.join("|"),
      sort_by: "popularity.desc",
      include_adult: "false",
      include_video: "false",
      page: "1",
    });

    const discovered = await tmdbFetch<TmdbMovieResponse>(`/discover/movie?${query.toString()}`);
    const movies = (discovered.results ?? []).slice(0, 18);

    const cards = await Promise.all(
      movies.map(async (movie): Promise<OttMovieCard | null> => {
        try {
          const watch = await tmdbFetch<TmdbWatchResponse>(`/movie/${movie.id}/watch/providers`);
          const flatrate = watch.results?.KR?.flatrate ?? [];
          const matched = flatrate
            .map((provider) => ({ provider, service: serviceForProvider(provider) }))
            .filter(
              (entry): entry is { provider: TmdbProvider; service: SupportedOttService } =>
                Boolean(entry.service && requested.includes(entry.service))
            );

          if (!matched.length) return null;

          const uniqueServices = [...new Set(matched.map((entry) => entry.service))];
          const activity = toActivity(movie, matched.map((entry) => entry.provider), uniqueServices);

          return {
            activity,
            tmdbId: movie.id,
            posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            rating: Number(movie.vote_average || 0),
            releaseYear: movie.release_date?.slice(0, 4) || null,
            providers: matched.map(({ provider, service }) => ({
              id: provider.provider_id,
              name: provider.provider_name,
              service,
              logoUrl: provider.logo_path ? `https://image.tmdb.org/t/p/w92${provider.logo_path}` : null,
            })),
            watchLink: watch.results?.KR?.link ?? null,
            genres: (movie.genre_ids ?? []).map((id) => GENRE_NAMES[id]).filter(Boolean),
          };
        } catch {
          return null;
        }
      })
    );

    return diversifyOttMovieCards(cards.filter((card): card is OttMovieCard => card !== null), requested);
  } catch (error) {
    console.error("TMDB OTT error", error);
    return [];
  }
}

export async function getOttActivities(services: string[]): Promise<Activity[]> {
  const cards = await getOttMovieCards(services);
  return cards.map((card) => card.activity);
}
