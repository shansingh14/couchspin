import { useState } from 'react'
import type { Title } from '../lib/types'

interface PosterProps {
  title: Title
  size: 'sm' | 'lg'
}

/**
 * Falls back to a lettered plate rather than a broken image, so titles that
 * haven't been enriched yet (or whose artwork 404s) still look deliberate.
 */
export function Poster({ title, size }: PosterProps) {
  const [failed, setFailed] = useState(false)
  const src = title.poster

  if (!src || failed) {
    return (
      <div className={`poster poster-${size} poster-blank`} aria-hidden="true">
        <span>{title.name.replace(/^(The|A|An)\s+/i, '').charAt(0)}</span>
      </div>
    )
  }

  return (
    <div className={`poster poster-${size}`}>
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
