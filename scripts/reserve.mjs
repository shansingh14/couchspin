/**
 * Builds src/data/reserve.json — an overflow catalogue drawn from TMDB's
 * top-rated lists, used only when the curated pool runs thin.
 *
 *   npm run reserve      (needs TMDB_API_KEY, same credential as enrich)
 *
 * Deliberately fetched at build time rather than from the browser: it keeps the
 * TMDB credential out of the shipped bundle, costs no request latency at spin
 * time, and works offline. The wheel still shows ten titles — the reserve only
 * changes what is available to draw from once you have watched enough of the
 * curated list to thin it out.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const envPath = resolve(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

const CRED = process.env.TMDB_API_KEY || process.env.TMDB_READ_TOKEN
if (!CRED) {
  console.error('\n  Needs TMDB_API_KEY (or TMDB_READ_TOKEN) in .env.local.\n')
  process.exit(1)
}
const IS_TOKEN = CRED.startsWith('eyJ')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function tmdb(path, params = {}) {
  const url = new URL('https://api.themoviedb.org/3' + path)
  if (!IS_TOKEN) url.searchParams.set('api_key', CRED)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, IS_TOKEN ? { headers: { Authorization: `Bearer ${CRED}` } } : undefined)
    if (res.status === 429) {
      await sleep(1500 * (i + 1))
      continue
    }
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} on ${path}`)
    return res.json()
  }
  throw new Error('rate limited repeatedly')
}

// TMDB's genre ids mapped onto ours. Anything with no counterpart is dropped
// rather than forced — a Documentary is not one of our sixteen.
const MOVIE_GENRES = {
  28: ['Action'], 12: ['Adventure'], 16: ['Animation'], 35: ['Comedy'], 80: ['Crime'],
  18: ['Drama'], 14: ['Fantasy'], 27: ['Horror'], 9648: ['Mystery'], 10749: ['Romance'],
  878: ['Sci-Fi'], 53: ['Thriller'], 10752: ['War'], 10751: ['Feel-Good'],
}
const TV_GENRES = {
  10759: ['Action', 'Adventure'], 16: ['Animation'], 35: ['Comedy'], 80: ['Crime'],
  18: ['Drama'], 9648: ['Mystery'], 10765: ['Sci-Fi', 'Fantasy'], 10768: ['War'],
  10751: ['Feel-Good'],
}

const POSTER = (p) => (p ? `https://image.tmdb.org/t/p/w342${p}` : null)
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Trim TMDB's synopsis to one sentence so cards stay readable. */
function shortBlurb(overview) {
  if (!overview) return ''
  const first = overview.split(/(?<=[.!?])\s/)[0].trim()
  return first.length > 150 ? first.slice(0, 147).trimEnd() + '…' : first
}

// Everything already curated, so the reserve never duplicates the canon
const src = readFileSync(resolve(root, 'src/data/titles.ts'), 'utf8')
const curatedNames = new Set(
  [...src.matchAll(/^\s*(?:film|saga|show)\('[^']+',\s*'((?:[^'\\]|\\.)*)'/gm)].map((m) =>
    norm(m[1].replace(/\\'/g, "'"))
  )
)
const enriched = existsSync(resolve(root, 'src/data/enriched.json'))
  ? JSON.parse(readFileSync(resolve(root, 'src/data/enriched.json'), 'utf8'))
  : {}
const curatedTmdbIds = new Set(
  Object.values(enriched).filter((r) => r.source === 'tmdb').map((r) => r.sourceId)
)

const MOVIE_PAGES = 18
const TV_PAGES = 12
const out = []
let skipped = 0

console.log(`Building reserve from TMDB top-rated (${MOVIE_PAGES} film pages, ${TV_PAGES} tv pages)…\n`)

for (let page = 1; page <= MOVIE_PAGES; page++) {
  const { results = [] } = await tmdb('/movie/top_rated', { page, language: 'en-US' })
  for (const r of results) {
    if (curatedTmdbIds.has(r.id) || curatedNames.has(norm(r.title || ''))) { skipped++; continue }
    if (!r.poster_path || !r.release_date) continue
    const genres = [...new Set((r.genre_ids || []).flatMap((g) => MOVIE_GENRES[g] || []))]
    if (!genres.length) continue
    if (r.original_language === 'ja' && genres.includes('Animation')) genres.push('Anime')
    out.push({
      id: `tmdb-m-${r.id}`,
      name: r.title,
      kind: 'film',
      year: Number(r.release_date.slice(0, 4)),
      genres,
      poster: POSTER(r.poster_path),
      blurb: shortBlurb(r.overview),
    })
  }
  await sleep(90)
}

for (let page = 1; page <= TV_PAGES; page++) {
  const { results = [] } = await tmdb('/tv/top_rated', { page, language: 'en-US' })
  for (const r of results) {
    if (curatedNames.has(norm(r.name || ''))) { skipped++; continue }
    if (!r.poster_path || !r.first_air_date) continue
    const genres = [...new Set((r.genre_ids || []).flatMap((g) => TV_GENRES[g] || []))]
    if (!genres.length) continue
    if (r.original_language === 'ja' && genres.includes('Animation')) genres.push('Anime')
    out.push({
      id: `tmdb-t-${r.id}`,
      name: r.name,
      kind: 'show',
      year: Number(r.first_air_date.slice(0, 4)),
      genres,
      poster: POSTER(r.poster_path),
      blurb: shortBlurb(r.overview),
    })
  }
  await sleep(90)
}

writeFileSync(resolve(root, 'src/data/reserve.json'), JSON.stringify(out) + '\n')

const films = out.filter((t) => t.kind === 'film').length
const shows = out.length - films
const tally = {}
for (const t of out) for (const g of t.genres) tally[g] = (tally[g] || 0) + 1
console.log(`Reserve: ${out.length} titles (${films} films, ${shows} shows); skipped ${skipped} already curated.`)
console.log('Per genre:', Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g} ${n}`).join(', '))
console.log('Wrote src/data/reserve.json')
