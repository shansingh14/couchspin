import type { SyncState } from '../lib/useLibrary'

interface HeaderProps {
  theme: 'day' | 'night'
  onToggleTheme: () => void
  view: 'spin' | 'shelf'
  onNavigate: (v: 'spin' | 'shelf') => void
  sync: SyncState
  onOpenAccount: () => void
}

const SYNC_LABEL: Record<SyncState, string> = {
  off: 'Saved on this device only',
  signed_out: 'Saved on this device only — sign in to sync',
  syncing: 'Saving…',
  synced: 'Synced to the cloud',
  error: "Couldn't reach the server — changes saved locally",
}

function SyncBadge({ sync, onClick }: { sync: SyncState; onClick: () => void }) {
  return (
    <button
      className={`sync-badge s-${sync}`}
      onClick={onClick}
      aria-label={SYNC_LABEL[sync]}
      title={SYNC_LABEL[sync]}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6.8 18.5a4.3 4.3 0 0 1-.5-8.57 5.9 5.9 0 0 1 11.3-1.1 3.9 3.9 0 0 1 .1 7.75"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {sync === 'synced' && (
          <path d="M9.4 15.4l1.9 1.9 3.6-3.9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {(sync === 'off' || sync === 'signed_out') && (
          <path d="M9.6 17.2h5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        )}
        {sync === 'error' && (
          <path d="M12 12.6v2.5M12 17.4v.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        )}
      </svg>
      {sync === 'syncing' && <span className="sync-pulse" aria-hidden="true" />}
    </button>
  )
}

function ThemeToggle({ theme, onToggle }: { theme: 'day' | 'night'; onToggle: () => void }) {
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      aria-label={theme === 'day' ? 'Switch to dusk' : 'Switch to daylight'}
      title={theme === 'day' ? 'dusk' : 'daylight'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        {theme === 'day' ? (
          <>
            <circle cx="12" cy="12" r="4.4" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M12 2.4v2.3M12 19.3v2.3M2.4 12h2.3M19.3 12h2.3M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
            </g>
          </>
        ) : (
          <path
            d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z"
            fill="currentColor"
          />
        )}
      </svg>
    </button>
  )
}

export function Header({ theme, onToggleTheme, view, onNavigate, sync, onOpenAccount }: HeaderProps) {
  return (
    <header className="header">
      <div className="nav-bar">
        <div className="brand">
          <svg className="brand-mark" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 12 L12 1.8 M12 12 L20.8 17.1 M12 12 L3.2 17.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2.4" fill="currentColor" />
          </svg>
          <span className="brand-name">CouchSpin</span>
        </div>

        <nav className="nav-links" aria-label="Views">
          <button className={view === 'spin' ? 'nav-link active' : 'nav-link'} onClick={() => onNavigate('spin')}>
            Wheel
          </button>
          <button className={view === 'shelf' ? 'nav-link active' : 'nav-link'} onClick={() => onNavigate('shelf')}>
            Shelf
          </button>
        </nav>

        <div className="header-actions">
          <SyncBadge sync={sync} onClick={onOpenAccount} />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  )
}
