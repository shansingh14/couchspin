export type Kind = 'film' | 'saga' | 'show'

export interface Title {
  id: string
  name: string
  kind: Kind
  year: number
  endYear?: number
  genres: string[]
  /** runtime in minutes for films, avg episode length for shows */
  mins?: number
  /** number of films in a saga */
  parts?: number
  /** number of seasons for a show */
  seasons?: number
  blurb: string
  /**
   * Pin a TMDB id when title matching picks the wrong film — remakes and common
   * names are the usual offenders. `npm run enrich` reports what it guessed.
   */
  tmdb?: number
  /** Filled in from enriched.json at module load; absent until `npm run enrich`. */
  poster?: string | null
  /** True for TMDB overflow titles, which only appear once the canon thins out. */
  fromReserve?: boolean
}

/**
 * Facts fetched by `npm run enrich` and merged over the curated entry.
 * Films and franchises come from TMDB, television from TVmaze.
 * `poster` is a complete URL so the app needs no base-path knowledge.
 */
export interface Enrichment {
  source: 'tmdb' | 'tvmaze'
  sourceId: number
  poster: string | null
  year?: number
  mins?: number
  seasons?: number
  endYear?: number
  /** the provider's own title, kept so a bad match is auditable */
  matchedName: string
}

export type Status = 'not_started' | 'watching' | 'watched'

export interface Entry {
  status: Status
  rating?: number // 1–5 mugs
  notes?: string
  logged?: boolean // logged on Letterboxd
  updatedAt: string
}

export type Library = Record<string, Entry>

export const GENRES = [
  'Feel-Good',
  'Comedy',
  'Drama',
  'Romance',
  'Thriller',
  'Crime',
  'Mystery',
  'Sci-Fi',
  'Fantasy',
  'Action',
  'Adventure',
  'Animation',
  'Anime',
  'Horror',
  'War',
  'Coming-of-Age',
] as const
