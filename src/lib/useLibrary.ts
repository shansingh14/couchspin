import { useCallback, useState } from 'react'
import type { Entry, Library } from './types'
import { loadLibrary, saveLibrary } from './storage'

export function useLibrary() {
  const [library, setLibrary] = useState<Library>(() => loadLibrary())

  const update = useCallback((id: string, patch: Partial<Entry>) => {
    setLibrary((prev) => {
      const existing = prev[id] ?? { status: 'not_started' as const, updatedAt: '' }
      const next: Library = {
        ...prev,
        [id]: { ...existing, ...patch, updatedAt: new Date().toISOString() },
      }
      saveLibrary(next)
      return next
    })
  }, [])

  const replace = useCallback((lib: Library) => {
    setLibrary(lib)
    saveLibrary(lib)
  }, [])

  return { library, update, replace }
}
