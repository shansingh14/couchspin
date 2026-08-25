import type { Entry, Title } from '../lib/types'
import { kindLabel, letterboxdUrl, metaLine } from '../lib/format'
import { Poster } from './Poster'
import { Sheet } from './Sheet'

interface ResultSheetProps {
  title: Title | null
  entry?: Entry
  onClose: () => void
  onStartWatching: (t: Title) => void
  onSpinAgain: () => void
  onOpenDetails: (t: Title) => void
}

export function ResultSheet({ title, entry, onClose, onStartWatching, onSpinAgain, onOpenDetails }: ResultSheetProps) {
  if (!title) return null
  const watched = entry?.status === 'watched'
  const watching = entry?.status === 'watching'

  return (
    <Sheet open={!!title} onClose={onClose} label={`Tonight's pick: ${title.name}`}>
      <div className="result">
        <p className="kicker">Tonight's pick</p>
        <div className="result-head">
          <Poster title={title} size="lg" />
          <div className="result-head-text">
            <h2 className="result-title">{title.name}</h2>
            <p className="result-meta">
              <span className="meta-item">{kindLabel(title)}</span>
              <span className="meta-sep" />
              <span className="meta-item">{metaLine(title)}</span>
            </p>
            <p className="result-genres">{title.genres.join(', ')}</p>
          </div>
        </div>
        <p className="result-blurb">{title.blurb}</p>

        <div className="result-actions">
          <button
            className="btn-primary"
            onClick={() => {
              onStartWatching(title)
              onClose()
            }}
          >
            {watched ? 'Rewatch this' : watching ? 'Keep watching' : 'Start watching'}
          </button>
          <button className="btn-ghost" onClick={onSpinAgain}>
            Spin again
          </button>
        </div>

        <div className="result-links">
          <button className="link-btn" onClick={() => onOpenDetails(title)}>
            Notes &amp; rating
          </button>
          {title.kind !== 'show' && (
            <a className="link-btn" href={letterboxdUrl(title)} target="_blank" rel="noreferrer">
              Letterboxd ↗
            </a>
          )}
        </div>
      </div>
    </Sheet>
  )
}
