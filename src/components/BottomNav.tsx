interface BottomNavProps {
  view: 'spin' | 'shelf'
  onNavigate: (v: 'spin' | 'shelf') => void
}

export function BottomNav({ view, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Views">
      <button
        className={view === 'spin' ? 'bn-btn active' : 'bn-btn'}
        onClick={() => onNavigate('spin')}
        aria-label="Wheel"
        aria-current={view === 'spin' ? 'page' : undefined}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 12 L12 2 M12 12 L20.6 17 M12 12 L3.4 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.3" fill="currentColor" />
        </svg>
        <span>Wheel</span>
      </button>
      <button
        className={view === 'shelf' ? 'bn-btn active' : 'bn-btn'}
        onClick={() => onNavigate('shelf')}
        aria-label="Shelf"
        aria-current={view === 'shelf' ? 'page' : undefined}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 20h18M5 20V8.6a1.6 1.6 0 0 1 3.2 0V20M10.8 20V6a1.6 1.6 0 0 1 3.2 0v14M17.6 20l-2.4-11.4a1.6 1.6 0 0 1 3.1-.7L20.8 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Shelf</span>
      </button>
    </nav>
  )
}
