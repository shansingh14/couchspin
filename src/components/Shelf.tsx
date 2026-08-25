import { useMemo, useRef, useState } from 'react'
import { TITLES } from '../data/titles'
import type { Library, Status, Title } from '../lib/types'
import { exportLibrary, parseImport, statusOf } from '../lib/storage'
import { metaLine } from '../lib/format'
import { StarRating } from './StarRating'

const STATUS_META: Record<Status, { label: string }> = {
  not_started: { label: 'Not started' },
  watching: { label: 'Partly' },
  watched: { label: 'Watched' },
}

const NEXT_STATUS: Record<Status, Status> = {
  not_started: 'watching',
  watching: 'watched',
  watched: 'not_started',
}

function StatusGlyph({ status }: { status: Status }) {
  if (status === 'watched') {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 8.4l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (status === 'watching') {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 1.6a6.4 6.4 0 0 1 0 12.8Z" fill="currentColor" />
        <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

interface ShelfProps {
  library: Library
  onSetStatus: (id: string, s: Status) => void
  onOpen: (t: Title) => void
  onReplaceLibrary: (lib: Library) => void
}

type KindFilter = 'all' | 'films' | 'tv'
type StatusFilter = 'all' | Status

export function Shelf({ library, onSetStatus, onOpen, onReplaceLibrary }: ShelfProps) {
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const fileRef = useRef<HTMLInputElement>(null)

  const stats = useMemo(() => {
    let watched = 0
    let watching = 0
    for (const t of TITLES) {
      const s = statusOf(library, t.id)
      if (s === 'watched') watched++
      else if (s === 'watching') watching++
    }
    return { watched, watching, togo: TITLES.length - watched - watching }
  }, [library])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return TITLES.filter((t) => {
      if (kindFilter === 'films' && t.kind === 'show') return false
      if (kindFilter === 'tv' && t.kind !== 'show') return false
      if (statusFilter !== 'all' && statusOf(library, t.id) !== statusFilter) return false
      if (q && !t.name.toLowerCase().includes(q)) return false
      return true
    }).sort((a, b) => a.name.localeCompare(b.name))
  }, [query, kindFilter, statusFilter, library])

  const handleImport = async (file: File) => {
    const text = await file.text()
    const lib = parseImport(text)
    if (lib) {
      onReplaceLibrary({ ...library, ...lib })
    } else {
      alert("That file doesn't look like a CouchSpin backup.")
    }
  }

  return (
    <section className="shelf">
      <div className="shelf-stats">
        <div className="stat">
          <span className="stat-num">{stats.watched}</span>
          <span className="stat-label">watched</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.watching}</span>
          <span className="stat-label">in progress</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.togo}</span>
          <span className="stat-label">waiting</span>
        </div>
      </div>

      <input
        className="shelf-search"
        type="search"
        placeholder="Search your shelf"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search titles"
      />

      <div className="shelf-filters">
        <div className="pill-group" role="group" aria-label="Type">
          {(['all', 'films', 'tv'] as const).map((k) => (
            <button key={k} className={kindFilter === k ? 'fpill on' : 'fpill'} onClick={() => setKindFilter(k)}>
              {k === 'all' ? 'Everything' : k === 'films' ? 'Films' : 'TV'}
            </button>
          ))}
        </div>
        <div className="pill-group" role="group" aria-label="Status">
          {(['all', 'not_started', 'watching', 'watched'] as const).map((s) => (
            <button key={s} className={statusFilter === s ? 'fpill on' : 'fpill'} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'Any status' : STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      <ul className="shelf-list">
        {rows.map((t) => {
          const entry = library[t.id]
          const s = entry?.status ?? 'not_started'
          return (
            <li key={t.id} className={`shelf-row s-${s}`}>
              <button
                className="status-stamp"
                onClick={() => onSetStatus(t.id, NEXT_STATUS[s])}
                aria-label={`${t.name}: ${STATUS_META[s].label} — change to ${STATUS_META[NEXT_STATUS[s]].label}`}
                title={`${STATUS_META[s].label} → ${STATUS_META[NEXT_STATUS[s]].label}`}
              >
                <StatusGlyph status={s} />
              </button>
              <button className="shelf-main" onClick={() => onOpen(t)}>
                <span className="shelf-name">
                  {t.name}
                  {entry?.notes ? <span className="row-mark" title="Has notes"> ✎</span> : null}
                  {entry?.logged ? <span className="row-mark" title="Logged on Letterboxd"> ◆</span> : null}
                </span>
                <span className="shelf-meta">{metaLine(t)}</span>
              </button>
              <span className="shelf-side">
                {entry?.rating ? <StarRating value={entry.rating} readonly size={12} /> : <span className="shelf-chev">›</span>}
              </span>
            </li>
          )
        })}
        {rows.length === 0 && <li className="shelf-empty">Nothing matches those filters.</li>}
      </ul>

      <div className="shelf-data">
        <span>Saved in this browser.</span>
        <button className="link-btn" onClick={() => exportLibrary(library)}>
          Back up
        </button>
        <button className="link-btn" onClick={() => fileRef.current?.click()}>
          Restore
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleImport(f)
            e.target.value = ''
          }}
        />
      </div>
    </section>
  )
}
