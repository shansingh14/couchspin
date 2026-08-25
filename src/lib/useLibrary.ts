import { useCallback, useEffect, useRef, useState } from 'react'
import type { Entry, Library } from './types'
import { loadLibrary, saveLibrary } from './storage'
import { supabase, cloudConfigured } from './supabase'
import { mergeLibraries, pullLibrary, pushLibrary } from './sync'

export type SyncState = 'off' | 'signed_out' | 'syncing' | 'synced' | 'error'

const PUSH_DEBOUNCE_MS = 1200

export function useLibrary() {
  // localStorage is the offline cache and the instant first paint; the cloud is
  // the durable copy. State starts local so the app is usable before any network.
  const [library, setLibrary] = useState<Library>(() => loadLibrary())
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [sync, setSync] = useState<SyncState>(cloudConfigured ? 'signed_out' : 'off')

  const pushTimer = useRef(0)
  const pending = useRef<Library | null>(null)

  // Track the session
  useEffect(() => {
    if (!supabase) return
    let alive = true

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setUserId(data.session?.user.id ?? null)
      setEmail(data.session?.user.email ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return
      setUserId(session?.user.id ?? null)
      setEmail(session?.user.email ?? null)
      if (!session) setSync('signed_out')
    })

    return () => {
      alive = false
      listener.subscription.unsubscribe()
    }
  }, [])

  // On sign-in: pull, merge with whatever is local, and write the union back.
  // Nothing is lost in either direction the first time a device connects.
  useEffect(() => {
    if (!supabase || !userId) return
    let alive = true
    setSync('syncing')
    ;(async () => {
      try {
        const remote = await pullLibrary(userId)
        if (!alive) return
        const local = loadLibrary()
        const merged = mergeLibraries(remote, local)
        setLibrary(merged)
        saveLibrary(merged)
        await pushLibrary(userId, merged)
        if (alive) setSync('synced')
      } catch {
        if (alive) setSync('error')
      }
    })()
    return () => {
      alive = false
    }
  }, [userId])

  const schedulePush = useCallback(
    (next: Library) => {
      if (!supabase || !userId) return
      pending.current = next
      window.clearTimeout(pushTimer.current)
      setSync('syncing')
      pushTimer.current = window.setTimeout(async () => {
        const payload = pending.current
        if (!payload) return
        try {
          const merged = await pushLibrary(userId, payload)
          setLibrary((cur) => {
            const reconciled = mergeLibraries(merged, cur)
            saveLibrary(reconciled)
            return reconciled
          })
          setSync('synced')
        } catch {
          setSync('error')
        }
      }, PUSH_DEBOUNCE_MS)
    },
    [userId]
  )

  // Flush any queued write before the tab goes away
  useEffect(() => {
    const flush = () => {
      if (pushTimer.current && pending.current && userId) {
        window.clearTimeout(pushTimer.current)
        void pushLibrary(userId, pending.current)
      }
    }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [userId])

  const update = useCallback(
    (id: string, patch: Partial<Entry>) => {
      setLibrary((prev) => {
        const existing = prev[id] ?? { status: 'not_started' as const, updatedAt: '' }
        const next: Library = {
          ...prev,
          [id]: { ...existing, ...patch, updatedAt: new Date().toISOString() },
        }
        saveLibrary(next)
        schedulePush(next)
        return next
      })
    },
    [schedulePush]
  )

  const replace = useCallback(
    (lib: Library) => {
      setLibrary(lib)
      saveLibrary(lib)
      schedulePush(lib)
    },
    [schedulePush]
  )

  const signIn = useCallback(async (address: string) => {
    if (!supabase) throw new Error('Cloud sync is not configured.')
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setSync('signed_out')
  }, [])

  return { library, update, replace, sync, email, signedIn: userId !== null, signIn, signOut }
}
