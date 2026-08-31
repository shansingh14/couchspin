import type { Title } from '../lib/types'

/**
 * Overflow catalogue from TMDB's top-rated lists, built by `npm run reserve`.
 *
 * Loaded lazily and only when the curated pool has thinned, so the ~50KB never
 * reaches anyone who hasn't watched their way through the canon first. Kept
 * separate from TITLES so the curated list stays what the wheel shows by default.
 */
let cache: Title[] | null = null
let inflight: Promise<Title[]> | null = null

export function loadReserve(): Promise<Title[]> {
  if (cache) return Promise.resolve(cache)
  if (inflight) return inflight
  inflight = import('./reserve.json').then((mod) => {
    const raw = (mod.default ?? mod) as Array<Omit<Title, 'kind'> & { kind: string }>
    cache = raw.map((t) => ({ ...t, kind: t.kind === 'show' ? 'show' : 'film', fromReserve: true }) as Title)
    return cache
  })
  return inflight
}
