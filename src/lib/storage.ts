import type { Entry, Library, Status } from './types'

const KEY = 'couchspin.library.v1'

export function loadLibrary(): Library {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? (parsed as Library) : {}
  } catch {
    return {}
  }
}

export function saveLibrary(lib: Library) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lib))
  } catch {
    // storage full or unavailable — nothing sensible to do
  }
}

export function statusOf(lib: Library, id: string): Status {
  return lib[id]?.status ?? 'not_started'
}

export function exportLibrary(lib: Library) {
  const blob = new Blob([JSON.stringify({ app: 'couchspin', version: 1, library: lib }, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `couchspin-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseImport(text: string): Library | null {
  try {
    const parsed = JSON.parse(text)
    const lib = parsed?.library ?? parsed
    if (typeof lib !== 'object' || lib === null || Array.isArray(lib)) return null
    const clean: Library = {}
    for (const [id, entry] of Object.entries(lib as Record<string, Partial<Entry>>)) {
      if (!entry || typeof entry !== 'object') continue
      const status = entry.status
      if (status !== 'not_started' && status !== 'watching' && status !== 'watched') continue
      clean[id] = {
        status,
        rating: typeof entry.rating === 'number' ? Math.min(5, Math.max(1, entry.rating)) : undefined,
        notes: typeof entry.notes === 'string' ? entry.notes : undefined,
        logged: entry.logged === true,
        updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : new Date().toISOString(),
      }
    }
    return clean
  } catch {
    return null
  }
}

const THEME_KEY = 'couchspin.theme'

export function loadTheme(): 'day' | 'night' {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'day' || saved === 'night') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'night' : 'day'
}

export function saveTheme(theme: 'day' | 'night') {
  localStorage.setItem(THEME_KEY, theme)
}
