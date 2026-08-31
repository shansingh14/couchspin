import { useCallback, useEffect, useMemo, useState } from 'react'
import { TITLES } from '../data/titles'
import { loadReserve } from '../data/reserve'
import type { Library, Title } from '../lib/types'
import { GENRES } from '../lib/types'
import { statusOf } from '../lib/storage'
import { sample } from '../lib/wheel'
import { Wheel } from './Wheel'

export type Category = 'films' | 'tv'

/** How many titles are on the wheel at once — enough to feel like a choice,
 *  few enough that the labels stay readable. */
const SLOTS = 10

/** Below this many curated options, start topping up from the TMDB reserve. */
const TOPUP_BELOW = 25

/** Ceiling on the topped-up pool, so the wheel stays a curated-first experience. */
const TOPUP_TO = 80

interface SpinViewProps {
  category: Category
  onCategoryChange: (c: Category) => void
  library: Library
  onResult: (t: Title) => void
  autoSpin: number
}

export function SpinView({ category, onCategoryChange, library, onResult, autoSpin }: SpinViewProps) {
  const [genres, setGenres] = useState<Set<string>>(new Set())
  const [rewatch, setRewatch] = useState(false)
  const [nonce, setNonce] = useState(0)

  const toggleGenre = (g: string) => {
    setGenres((prev) => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g)
      else next.add(g)
      return next
    })
  }

  const [reserve, setReserve] = useState<Title[] | null>(null)

  const matches = useCallback(
    (t: Title) => {
      if (category === 'films' ? t.kind === 'show' : t.kind !== 'show') return false
      if (genres.size > 0 && !t.genres.some((g) => genres.has(g))) return false
      if (!rewatch && statusOf(library, t.id) === 'watched') return false
      return true
    },
    [category, genres, rewatch, library]
  )

  const curatedPool = useMemo(() => TITLES.filter(matches), [matches])

  // Fetch the overflow catalogue only once the canon has actually thinned —
  // either watched through, or narrowed by a genre we hold few of.
  useEffect(() => {
    if (curatedPool.length >= TOPUP_BELOW || reserve) return
    let alive = true
    loadReserve().then((r) => {
      if (alive) setReserve(r)
    })
    return () => {
      alive = false
    }
  }, [curatedPool.length, reserve])

  const pool = useMemo(() => {
    if (curatedPool.length >= TOPUP_BELOW || !reserve) return curatedPool
    const topUp = reserve.filter(matches).slice(0, Math.max(0, TOPUP_TO - curatedPool.length))
    return [...curatedPool, ...topUp]
  }, [curatedPool, reserve, matches])

  const [slots, setSlots] = useState<Title[]>(() => sample(pool, SLOTS))

  // Reconcile the wheel with the pool without re-dealing it. A title that
  // leaves the pool (you watched it, or a filter changed) is replaced in place
  // by one that isn't on the wheel yet; every other slot keeps its title, so
  // marking one thing watched doesn't shuffle the nine you were still choosing
  // between. Filter or category changes empty the wheel wholesale, which the
  // same logic handles by refilling every slot.
  useEffect(() => {
    setSlots((current) => {
      const inPool = new Set(pool.map((t) => t.id))
      const survivors = current.filter((t) => inPool.has(t.id))
      if (survivors.length === current.length && current.length === Math.min(SLOTS, pool.length)) {
        return current
      }
      const taken = new Set(survivors.map((t) => t.id))
      const replacements = sample(
        pool.filter((t) => !taken.has(t.id)),
        Math.min(SLOTS, pool.length) - survivors.length
      )
      let next = 0
      const filled = current.map((t) => (inPool.has(t.id) ? t : replacements[next++]))
      // drop any slot we couldn't refill, then top up if the wheel grew
      return [...filled.filter(Boolean), ...replacements.slice(next)].slice(0, SLOTS)
    })
  }, [pool])

  // "Deal a fresh wheel" is the one path that replaces everything
  useEffect(() => {
    if (nonce > 0) setSlots(sample(pool, SLOTS))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce])

  const wheelTitles = slots

  return (
    <section className="spin-view">
      <div className="category-toggle" role="tablist" aria-label="Category">
        <span className={category === 'films' ? 'cat-thumb' : 'cat-thumb tv'} aria-hidden="true" />
        <button
          role="tab"
          aria-selected={category === 'films'}
          className={category === 'films' ? 'cat-btn active' : 'cat-btn'}
          onClick={() => onCategoryChange('films')}
        >
          Films &amp; series
        </button>
        <button
          role="tab"
          aria-selected={category === 'tv'}
          className={category === 'tv' ? 'cat-btn active' : 'cat-btn'}
          onClick={() => onCategoryChange('tv')}
        >
          Television
        </button>
      </div>

      <div className="chip-row" role="group" aria-label="Genre filters">
        <button
          className={rewatch ? 'chip rewatch on' : 'chip rewatch'}
          onClick={() => setRewatch((r) => !r)}
          aria-pressed={rewatch}
          title="Include titles you've already finished"
        >
          Include rewatches
        </button>
        {GENRES.map((g) => (
          <button
            key={g}
            className={genres.has(g) ? 'chip on' : 'chip'}
            onClick={() => toggleGenre(g)}
            aria-pressed={genres.has(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {wheelTitles.length >= 2 ? (
        <>
          <Wheel titles={wheelTitles} onResult={onResult} autoSpin={autoSpin} />
          <div className="under-wheel">
            <span className="pool-count">
              {pool.length} in the pool
              {pool.length > curatedPool.length && (
                <span className="pool-topup"> · {pool.length - curatedPool.length} topped up</span>
              )}
            </span>
            <button className="reshuffle" onClick={() => setNonce((n) => n + 1)}>
              Reshuffle the wheel
            </button>
          </div>
        </>
      ) : (
        <div className="empty-wheel">
          <p className="empty-title">Nothing left to land on</p>
          <p className="empty-sub">
            {rewatch
              ? 'No titles match these filters. Try removing a genre.'
              : "You've finished everything that matches. Include rewatches, or loosen the filters."}
          </p>
          {!rewatch && (
            <button className="btn-primary" onClick={() => setRewatch(true)}>
              Include rewatches
            </button>
          )}
        </div>
      )}
    </section>
  )
}
