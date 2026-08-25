import { useMemo, useState } from 'react'
import { TITLES } from '../data/titles'
import type { Library, Title } from '../lib/types'
import { GENRES } from '../lib/types'
import { statusOf } from '../lib/storage'
import { sample } from '../lib/wheel'
import { Wheel } from './Wheel'

export type Category = 'films' | 'tv'

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

  const pool = useMemo(() => {
    return TITLES.filter((t) => {
      if (category === 'films' ? t.kind === 'show' : t.kind !== 'show') return false
      if (genres.size > 0 && !t.genres.some((g) => genres.has(g))) return false
      if (!rewatch && statusOf(library, t.id) === 'watched') return false
      return true
    })
  }, [category, genres, rewatch, library])

  const poolKey = useMemo(() => pool.map((t) => t.id).join('|'), [pool])
  const wheelTitles = useMemo(() => sample(pool, 10), [poolKey, nonce]) // eslint-disable-line react-hooks/exhaustive-deps

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
            <span className="pool-count">{pool.length} titles in the pool</span>
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
