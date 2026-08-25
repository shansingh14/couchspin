/**
 * Matches the curated titles against real databases and writes
 * src/data/enriched.json.  Run occasionally, not at request time:
 *
 *   npm run enrich
 *
 * Television uses TVmaze, which needs no API key and knows season counts.
 * Films and franchises use TMDB, which needs a free key in TMDB_API_KEY
 * (environment or .env.local). Without one the script still runs and does
 * every show, reporting the films it skipped.
 *
 * The output is committed, so the deployed app makes no API calls and needs no
 * key — posters are served from the providers' public image CDNs.
 *
 * Curated genres and blurbs are never touched. Only the facts I can get wrong
 * from memory come from the providers: year, runtime, season count, artwork.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Tiny .env.local reader, so this needs no dependencies
const envPath = resolve(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

const TMDB_KEY = process.env.TMDB_API_KEY
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJSON(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url)
    if (res.status === 429) {
      await sleep(1500 * (i + 1)) // providers ask callers to back off
      continue
    }
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return res.json()
  }
  throw new Error('rate limited repeatedly')
}

/**
 * For comparison only. Flattens punctuation so "WALL·E" and "Wall-E" match.
 * Never send this to a search endpoint — dropping apostrophes turns
 * "Schitt's Creek" into "schitt s creek", which matches nothing.
 */
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[·:',!?&.\-–—…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Titles the databases file under a different name than everyone calls them.
 * Keyed by entry id so the display name in titles.ts stays the familiar one.
 */
const SEARCH_ALIASES = {
  'money-heist': 'La Casa de Papel',
}

/** What actually goes to the provider: drop qualifiers, keep the words intact. */
const searchQuery = (s) =>
  s
    .replace(/\([^)]*\)/g, ' ')
    .replace(/,\s*M\.D\.?/i, '')
    .replace(/[·…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const queryFor = (entry) => searchQuery(SEARCH_ALIASES[entry.id] ?? entry.name)

function titleScore(candidateName, candidateYear, wantName, wantYear) {
  let score = 0
  const a = norm(candidateName)
  const b = norm(wantName)
  if (a === b) score += 100
  else if (a.startsWith(b) || b.startsWith(a)) score += 60
  else if (a.includes(b) || b.includes(a)) score += 35

  if (candidateYear && wantYear) {
    const gap = Math.abs(candidateYear - wantYear)
    if (gap === 0) score += 40
    else if (gap <= 1) score += 30
    else if (gap <= 3) score += 12
    else score -= gap * 2
  }
  return score
}

// ——————————————— TVmaze (television, no key) ———————————————

async function enrichShow(entry) {
  const q = encodeURIComponent(queryFor(entry))
  const results = (await getJSON(`https://api.tvmaze.com/search/shows?q=${q}`)) ?? []
  if (!results.length) return null

  // score against the alias too, or an aliased title can never match its own result
  const want = SEARCH_ALIASES[entry.id] ?? entry.name
  const ranked = results
    .map(({ show }) => {
      const year = show.premiered ? Number(show.premiered.slice(0, 4)) : undefined
      return { show, year, s: titleScore(show.name, year, want, entry.year) }
    })
    .sort((a, b) => b.s - a.s)

  const best = ranked[0]
  if (!best) return null

  let seasons
  const seasonList = await getJSON(`https://api.tvmaze.com/shows/${best.show.id}/seasons`)
  if (Array.isArray(seasonList)) {
    // TVmaze lists announced-but-unaired seasons too; count only those that started
    const aired = seasonList.filter((s) => s.premiereDate)
    seasons = (aired.length || seasonList.length) || undefined
  }

  const ended = best.show.ended ? Number(best.show.ended.slice(0, 4)) : undefined

  return {
    rec: {
      source: 'tvmaze',
      sourceId: best.show.id,
      // medium is ~210px wide; `original` is a multi-megabyte 1800x2700 scan,
      // which is absurd for a 34px shelf thumbnail
      poster: best.show.image?.medium ?? best.show.image?.original ?? null,
      matchedName: best.show.name,
      ...(best.year ? { year: best.year } : {}),
      ...(seasons ? { seasons } : {}),
      ...(best.show.averageRuntime ? { mins: best.show.averageRuntime } : {}),
      ...(ended ? { endYear: ended } : {}),
    },
    score: best.s,
  }
}

// ——————————————— TMDB (films and franchises, needs key) ———————————————

async function tmdb(path, params = {}) {
  const url = new URL('https://api.themoviedb.org/3' + path)
  url.searchParams.set('api_key', TMDB_KEY)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  }
  return getJSON(url.toString())
}

const POSTER = (p) => (p ? `https://image.tmdb.org/t/p/w342${p}` : null)

async function bestMovie(name, year) {
  const data = await tmdb('/search/movie', { query: searchQuery(name), include_adult: false })
  const results = data?.results ?? []
  if (!results.length) return null
  return results
    .map((r) => {
      const y = r.release_date ? Number(r.release_date.slice(0, 4)) : undefined
      // popularity is a tiebreak only — it must never outweigh an exact title+year hit
      return { r, y, s: titleScore(r.title, y, name, year) + Math.min(r.popularity ?? 0, 60) / 12 }
    })
    .sort((a, b) => b.s - a.s)[0]
}

async function enrichFilm(entry) {
  if (entry.pinned) {
    const d = await tmdb(`/movie/${entry.pinned}`)
    if (!d) return null
    return {
      rec: {
        source: 'tmdb',
        sourceId: d.id,
        poster: POSTER(d.poster_path),
        matchedName: d.title,
        ...(d.release_date ? { year: Number(d.release_date.slice(0, 4)) } : {}),
        ...(d.runtime ? { mins: d.runtime } : {}),
      },
      score: 999,
    }
  }

  const best = await bestMovie(SEARCH_ALIASES[entry.id] ?? entry.name, entry.year)
  if (!best) return null
  const detail = (await tmdb(`/movie/${best.r.id}`)) ?? best.r
  return {
    rec: {
      source: 'tmdb',
      sourceId: detail.id,
      poster: POSTER(detail.poster_path ?? best.r.poster_path),
      matchedName: detail.title || best.r.title,
      ...(detail.release_date ? { year: Number(detail.release_date.slice(0, 4)) } : {}),
      ...(detail.runtime ? { mins: detail.runtime } : {}),
    },
    score: best.s,
  }
}

/** Franchises prefer TMDB collection artwork, falling back to the first film. */
async function enrichSaga(entry) {
  const data = await tmdb('/search/collection', { query: queryFor(entry) })
  const best = (data?.results ?? [])
    .map((r) => ({ r, s: titleScore(r.name, undefined, entry.name, undefined) }))
    .sort((a, b) => b.s - a.s)[0]

  if (best && best.s >= 55 && best.r.poster_path) {
    return {
      rec: {
        source: 'tmdb',
        sourceId: best.r.id,
        poster: POSTER(best.r.poster_path),
        matchedName: best.r.name,
      },
      score: best.s,
    }
  }
  const film = await enrichFilm(entry)
  if (film) delete film.rec.mins // a franchise has no single runtime
  return film
}

// ——————————————— drive it ———————————————

const src = readFileSync(resolve(root, 'src/data/titles.ts'), 'utf8')
const entries = []
const re = /^\s*(film|saga|show)\('([^']+)',\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*,\s*(\d{4})/gm
let m
while ((m = re.exec(src))) {
  entries.push({
    kind: m[1],
    id: m[2],
    name: (m[3] ?? m[4]).replace(/\\'/g, "'").replace(/\\"/g, '"'),
    year: Number(m[5]),
  })
}
for (const pm of src.matchAll(/'([a-z0-9-]+)'[^\n]*tmdb:\s*(\d+)/g)) {
  const e = entries.find((x) => x.id === pm[1])
  if (e) e.pinned = Number(pm[2])
}

// Curated end years, kept so an implausible provider value can be rejected
const showRe = /^\s*show\('([^']+)',\s*'(?:[^'\\]|\\.)*',\s*\d{4},\s*(undefined|\d{4})/gm
let sm
while ((sm = showRe.exec(src))) {
  const e = entries.find((x) => x.id === sm[1])
  if (e && sm[2] !== 'undefined') e.curatedEnd = Number(sm[2])
}

const shows = entries.filter((e) => e.kind === 'show')
const films = entries.filter((e) => e.kind !== 'show')

console.log(`Curated list: ${films.length} films/franchises, ${shows.length} shows.`)
console.log(`TVmaze: no key needed.`)
console.log(TMDB_KEY ? 'TMDB: key found.\n' : 'TMDB: no key — skipping films. Set TMDB_API_KEY to include them.\n')

// Keep any existing entries so a keyless run doesn't discard previous film data
const outPath = resolve(root, 'src/data/enriched.json')
const out = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : {}

const review = []
let done = 0
const todo = TMDB_KEY ? [...shows, ...films] : shows

for (const e of todo) {
  try {
    const res =
      e.kind === 'show' ? await enrichShow(e) : e.kind === 'saga' ? await enrichSaga(e) : await enrichFilm(e)

    if (!res) {
      review.push({ ...e, why: 'no match found' })
    } else {
      // Providers sometimes push a finished show's end date decades forward
      // because of a special or a re-air. Trust the curated value when they
      // disagree wildly rather than printing "2005–26" for a show that ended
      // in 2008.
      if (e.curatedEnd && res.rec.endYear && Math.abs(res.rec.endYear - e.curatedEnd) > 3) {
        review.push({
          ...e,
          why: `end year ${res.rec.endYear} vs curated ${e.curatedEnd} — keeping curated run`,
        })
        // Drop the season count with it: they describe the same run, and taking
        // one without the other prints things like "1990–91 · 3 seasons".
        delete res.rec.endYear
        delete res.rec.seasons
      }
      out[e.id] = res.rec
      const drift = res.rec.year && Math.abs(res.rec.year - e.year) > 2
      if (res.score < 60 || drift) {
        review.push({
          ...e,
          why: `score ${res.score.toFixed(0)} → "${res.rec.matchedName}" (${res.rec.year ?? '?'})`,
        })
      }
    }
  } catch (err) {
    review.push({ ...e, why: err.message })
  }

  if (++done % 25 === 0) console.log(`  …${done}/${todo.length}`)
  await sleep(120) // stay well inside both providers' rate limits
}

writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n')

const posters = Object.values(out).filter((r) => r.poster).length
console.log(`\nEnriched ${Object.keys(out).length} titles; ${posters} have poster art.`)
console.log(`Wrote src/data/enriched.json`)

if (review.length) {
  console.log(`\n${review.length} to eyeball — add \`tmdb: <id>\` to a titles.ts entry to pin a correction:`)
  for (const r of review) console.log(`  ${r.id.padEnd(22)} ${r.name} — ${r.why}`)
}
