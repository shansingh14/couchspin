import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
}

/** Bottom sheet on mobile, centered cozy card on desktop. */
export function Sheet({ open, onClose, label, children }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="sheet-grip" aria-hidden="true" />
        <button className="sheet-close" onClick={onClose} aria-label="Close">
          <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}
