import type { Entry, Status, Title } from '../lib/types'
import { kindLabel, letterboxdUrl, metaLine } from '../lib/format'
import { Poster } from './Poster'
import { StarRating } from './StarRating'
import { Sheet } from './Sheet'

interface TitleSheetProps {
  title: Title | null
  entry?: Entry
  onClose: () => void
  onUpdate: (id: string, patch: Partial<Entry>) => void
}

const STATUSES: { value: Status; label: string }[] = [
  { value: 'not_started', label: 'Not started' },
  { value: 'watching', label: 'Partly' },
  { value: 'watched', label: 'Watched' },
]

export function TitleSheet({ title, entry, onClose, onUpdate }: TitleSheetProps) {
  if (!title) return null
  const status = entry?.status ?? 'not_started'

  return (
    <Sheet open={!!title} onClose={onClose} label={`Details for ${title.name}`}>
      <div className="detail">
        <p className="kicker">{kindLabel(title)}</p>
        <div className="result-head">
          <Poster title={title} size="lg" />
          <div className="result-head-text">
            <h2 className="detail-title">{title.name}</h2>
            <p className="detail-meta">{metaLine(title)}</p>
            <p className="result-genres">{title.genres.join(', ')}</p>
          </div>
        </div>
        <p className="detail-blurb">{title.blurb}</p>

        <div className="detail-section">
          <span className="detail-label">Status</span>
          <div className="status-seg" role="radiogroup" aria-label="Watch status">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                role="radio"
                aria-checked={status === s.value}
                className={status === s.value ? `seg-btn on seg-${s.value}` : 'seg-btn'}
                onClick={() => onUpdate(title.id, { status: s.value })}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <span className="detail-label">Rating</span>
          <StarRating value={entry?.rating} onChange={(v) => onUpdate(title.id, { rating: v })} />
        </div>

        <div className="detail-section">
          <span className="detail-label">Thoughts</span>
          <textarea
            className="notes"
            placeholder="A line or two for later — what stayed with you, who you watched it with."
            value={entry?.notes ?? ''}
            onChange={(e) => onUpdate(title.id, { notes: e.target.value })}
            rows={4}
          />
        </div>

        {title.kind !== 'show' && (
          <div className="detail-section letterboxd-row">
            <label className="logged-check">
              <input
                type="checkbox"
                checked={entry?.logged ?? false}
                onChange={(e) => onUpdate(title.id, { logged: e.target.checked })}
              />
              <span>Logged on Letterboxd</span>
            </label>
            <a className="link-btn" href={letterboxdUrl(title)} target="_blank" rel="noreferrer">
              Open ↗
            </a>
          </div>
        )}
      </div>
    </Sheet>
  )
}
