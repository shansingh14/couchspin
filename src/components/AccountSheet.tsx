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
  if (/invalid login credentials/i.test(raw)) {
    return "That email and password don't match an account. If you haven't made one yet, create an account instead."
  }
  if (/already registered|already been registered/i.test(raw)) {
    return 'There is already an account with that email — sign in instead.'
  }
  if (/password should be at least/i.test(raw)) {
    return 'Password needs to be at least 6 characters.'
  }
  return raw || 'Something went wrong. Try again in a moment.'
}

type Mode = 'signin' | 'signup'

interface AccountSheetProps {
  open: boolean
  onClose: () => void
  sync: SyncState
  email: string | null
  signedIn: boolean
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  onSignOut: () => Promise<void>
}

export function AccountSheet({
  open,
  onClose,
  sync,
  email,
  signedIn,
  onSignIn,
  onSignUp,
  onSignOut,
}: AccountSheetProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { needsConfirmation } = await onSignUp(address.trim(), password)
        if (needsConfirmation) setConfirmSent(true)
      } else {
        await onSignIn(address.trim(), password)
      }
      setPassword('')
    } catch (err) {
      setError(readableError(err))
    } finally {
      setBusy(false)
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setConfirmSent(false)
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
              Adding <code>VITE_SUPABASE_URL</code> and{' '}
              <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> turns on sync — see the README.
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
        ) : confirmSent ? (
          <>
            <h2 className="detail-title">Confirm your email</h2>
            <p className="account-body">
              Your project has email confirmation switched on, so there's a link waiting at{' '}
              <strong>{address}</strong>. Open it, then come back and sign in.
            </p>
            <p className="account-body subtle">
              To skip this step in future, turn off <em>Confirm email</em> in Supabase under
              Authentication → Sign In / Providers → Email.
            </p>
            <button className="link-btn" onClick={() => switchMode('signin')}>
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <h2 className="detail-title">
              {mode === 'signin' ? 'Sign in to sync' : 'Create an account'}
            </h2>
            <p className="account-body">
              {mode === 'signin'
                ? 'Your shelf is only in this browser until you sign in. Signed in, it lives in the cloud and reaches every device you use.'
                : 'One account keeps your shelf safe from a browser wipe and carries it between your phone and laptop.'}
            </p>

            <form className="detail-section account-form" onSubmit={submit}>
              <input
                className="notes account-field"
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                aria-label="Email address"
              />
              <input
                className="notes account-field"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                placeholder={mode === 'signin' ? 'Password' : 'Password (6+ characters)'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Password"
              />
              <button className="btn-primary full" type="submit" disabled={busy}>
                {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            {error && <p className="account-error">{error}</p>}

            <p className="account-switch">
              {mode === 'signin' ? (
                <>
                  No account yet?{' '}
                  <button className="link-btn" onClick={() => switchMode('signup')}>
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have one?{' '}
                  <button className="link-btn" onClick={() => switchMode('signin')}>
                    Sign in
                  </button>
                </>
              )}
            </p>
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
