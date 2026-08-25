import type { Title } from './types'

export function metaLine(t: Title): string {
  if (t.kind === 'film') return `${t.year} · ${t.mins} min`
  if (t.kind === 'saga') return `${t.year}–${String(t.endYear).slice(2)} · ${t.parts} films`
  const end = t.endYear ? String(t.endYear).slice(2) : 'now'
  return `${t.year}–${end} · ${t.seasons} ${t.seasons === 1 ? 'season' : 'seasons'}`
}

export function letterboxdUrl(t: Title): string {
  return `https://letterboxd.com/search/films/${encodeURIComponent(t.name)}/`
}

export function kindLabel(t: Title): string {
  return t.kind === 'film' ? 'film' : t.kind === 'saga' ? 'film series' : 'tv show'
}
