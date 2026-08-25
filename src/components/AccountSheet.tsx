import { useState } from 'react'
import type { FormEvent } from 'react'
import { cloudConfigured } from '../lib/supabase'
import type { SyncState } from '../lib/useLibrary'
import { Sheet } from './Sheet'

/** Supabase surfaces transport failures as the browser's bare "Failed to fetch". */
function readableError(err: unknown): string {
  const raw = err instanceof Error ? err.message : ''
  if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    return "Couldn't reach the server. Check your connection, or that the Supabase URL and key are right."
  }
  return raw || 'Could not send the link. Try again in a moment.'
}

interface AccountSheetProps {
  open: boolean
  onClose: () => void
  sync: SyncState
  email: string | null
  signedIn: boolean
  onSignIn: (email: string) => Promise<void>
  onSignOut: () => Promise<void>
}

export function AccountSheet({ open, onClose, sync, email, signedIn, onSignIn, onSignOut }: AccountSheetProps) {
  const [address, setAddress] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      await onSignIn(address.trim())
      setSent(true)
    } catch (err) {
      setError(readableError(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} label="Sync your shelf">
      <div className="detail">
        <p className="kicker">Your shelf</p>

        {!cloudConfigured ? (
          <>
            <h2 className="detail-title">Saved on this device</h2>
            <p className="account-body">
              Cloud sync isn't switched on for this build, so your shelf lives only in this
              browser. Clearing site data will erase it, and it won't reach your other devices.
            </p>
            <p className="account-body">
              Use <strong>Back up</strong> at the bottom of the shelf to keep a copy you own.
              Adding <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> turns
              on sync — see the README.
            </p>
          </>
        ) : signedIn ? (
          <>
            <h2 className="detail-title">Synced</h2>
            <p className="account-body">
              Signed in as <strong>{email}</strong>. Your shelf is saved to the cloud and follows
              you to any device you sign in on. Clearing this browser won't lose it.
            </p>
            <div className="detail-section">
              <button className="btn-ghost full" onClick={onSignOut}>
                Sign out
              </button>
            </div>
          </>
        ) : sent ? (
          <>
            <h2 className="detail-title">Check your inbox</h2>
            <p className="account-body">
              A sign-in link is on its way to <strong>{address}</strong>. Open it on this device
              and your shelf will start syncing. The link works once and expires in an hour.
            </p>
            <button className="link-btn" onClick={() => setSent(false)}>
              Use a different address
            </button>
          </>
        ) : (
          <>
            <h2 className="detail-title">Sync across devices</h2>
            <p className="account-body">
              Right now your shelf is only in this browser — clearing site data would wipe it.
              Sign in and it's kept in the cloud instead, on every device you use.
            </p>
            <p className="account-body subtle">
              No password. We email you a one-time link.
            </p>
            <form className="detail-section account-form" onSubmit={submit}>
              <input
                className="notes account-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                aria-label="Email address"
              />
              <button className="btn-primary full" type="submit" disabled={sending}>
                {sending ? 'Sending…' : 'Email me a link'}
              </button>
            </form>
            {error && <p className="account-error">{error}</p>}
          </>
        )}

        {cloudConfigured && signedIn && sync === 'error' && (
          <p className="account-error">
            Couldn't reach the server on the last save. Your changes are safe on this device and
            will go up when the connection returns.
          </p>
        )}
      </div>
    </Sheet>
  )
}
