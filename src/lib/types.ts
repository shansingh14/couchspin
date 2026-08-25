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
