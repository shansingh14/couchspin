import { useState } from 'react'
import type { Title } from '../lib/types'

interface PosterProps {
  title: Title
  size: 'sm' | 'lg'
}

/** Tints drawn from the wheel palette so plates read as part of the same set. */
const PLATE_TINTS = ['#6d7c5e', '#a8896f', '#8b9a7c', '#b9785c', '#7e8a92', '#c2a678']

/** Stable per-title tint — the same title always gets the same plate. */
function tintFor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PLATE_TINTS[h % PLATE_TINTS.length]
}

/**
 * Drops leading articles so "The Prestige" plates as P, not T, and skips
 * punctuation so "(500) Days of Summer" plates as 5 rather than "(".
 */
function initial(name: string): string {
  const stripped = name.replace(/^(The|A|An)\s+/i, '')
  const match = stripped.match(/[a-z0-9]/i)
  return (match ? match[0] : stripped.charAt(0)).toUpperCase()
}

/**
 * Falls back to a tinted monogram rather than a broken image, so titles without
 * artwork (films, until `npm run enrich` runs with a TMDB key) look deliberate
 * instead of failed.
 */
export function Poster({ title, size }: PosterProps) {
  const [failed, setFailed] = useState(false)
  const src = title.poster

  if (!src || failed) {
    const tint = tintFor(title.id)
    return (
      <div
        className={`poster poster-${size} poster-plate`}
        style={{ background: `linear-gradient(145deg, ${tint}, ${tint}99)` }}
        aria-hidden="true"
      >
        <span>{initial(title.name)}</span>
      </div>
    )
  }

  return (
    <div className={`poster poster-${size}`}>
      <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
    </div>
  )
}
