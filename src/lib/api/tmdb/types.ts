export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  vote_count?: number;
  release_date?: string;
  genre_ids?: number[];
}

export interface TmdbMovieResponse {
  page?: number;
  results: TmdbMovie[];
  total_pages?: number;
  total_results?: number;
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priorities?: Record<string, number>;
}

export interface TmdbProviderListResponse {
  results: TmdbProvider[];
}

export interface TmdbCountryWatchData {
  link?: string;
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
}

export interface TmdbWatchResponse {
  id?: number;
  results?: {
    KR?: TmdbCountryWatchData;
    [country: string]: TmdbCountryWatchData | undefined;
  };
}
