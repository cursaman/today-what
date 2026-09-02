export interface TmdbMovie { id: number; title: string; overview: string; poster_path: string | null; vote_average: number; }
export interface TmdbMovieResponse { results: TmdbMovie[]; }
export interface TmdbProvider { provider_id: number; provider_name: string; logo_path: string | null; }
export interface TmdbWatchResponse { results?: { KR?: { flatrate?: TmdbProvider[]; link?: string } } }
