import type { Title } from './types'

export function metaLine(t: Title): string {
  // Reserve titles carry no runtime or season count, so every part is optional
  if (t.kind === 'film') return t.mins ? `${t.year} · ${t.mins} min` : `${t.year}`
  if (t.kind === 'saga') return `${t.year}–${String(t.endYear).slice(2)} · ${t.parts} films`
  const end = t.endYear ? String(t.endYear).slice(2) : 'now'
  if (!t.seasons) return `${t.year}–${end}`
  return `${t.year}–${end} · ${t.seasons} ${t.seasons === 1 ? 'season' : 'seasons'}`
}

export function letterboxdUrl(t: Title): string {
  return `https://letterboxd.com/search/films/${encodeURIComponent(t.name)}/`
}

export function kindLabel(t: Title): string {
  return t.kind === 'film' ? 'film' : t.kind === 'saga' ? 'film series' : 'tv show'
}
