import { useEffect, useRef, useState } from 'react'
import type { Status, Title } from './lib/types'
import { loadTheme, saveTheme } from './lib/storage'
import { useLibrary } from './lib/useLibrary'
import { Header } from './components/Header'
import { BottomNav } from './components/BottomNav'
import { Atmosphere } from './components/Atmosphere'
import { Confetti } from './components/Confetti'
import { SpinView } from './components/SpinView'
import type { Category } from './components/SpinView'
import { ResultSheet } from './components/ResultSheet'
import { TitleSheet } from './components/TitleSheet'
import { AccountSheet } from './components/AccountSheet'
import { Shelf } from './components/Shelf'

export default function App() {
  const [theme, setTheme] = useState<'day' | 'night'>(() => loadTheme())
  const [view, setView] = useState<'spin' | 'shelf'>('spin')
  const [category, setCategory] = useState<Category>('films')
  const { library, update, replace, sync, email, signedIn, signIn, signUp, signOut } = useLibrary()

  const [result, setResult] = useState<Title | null>(null)
  const [detail, setDetail] = useState<Title | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [burst, setBurst] = useState(0)
  const [autoSpin, setAutoSpin] = useState(0)
  const resultTimer = useRef(0)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'day' ? '#dfe4de' : '#1d2229')
    saveTheme(theme)
  }, [theme])

  const handleResult = (t: Title) => {
    setBurst((b) => b + 1)
    window.clearTimeout(resultTimer.current)
    resultTimer.current = window.setTimeout(() => setResult(t), 550)
  }

  const setStatus = (id: string, status: Status) => update(id, { status })

  return (
    <div className="app">
      <Atmosphere />
      <Confetti burst={burst} />

      <Header
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'day' ? 'night' : 'day'))}
        view={view}
        onNavigate={setView}
        sync={sync}
        onOpenAccount={() => setAccountOpen(true)}
      />

      <main className="main">
        {view === 'spin' ? (
          <SpinView
            category={category}
            onCategoryChange={setCategory}
            library={library}
            onResult={handleResult}
            autoSpin={autoSpin}
          />
        ) : (
          <Shelf
            library={library}
            onSetStatus={setStatus}
            onOpen={setDetail}
            onReplaceLibrary={replace}
            sync={sync}
            onOpenAccount={() => setAccountOpen(true)}
          />
        )}
      </main>

      <footer className="footer">Made for slow evenings.</footer>

      <BottomNav view={view} onNavigate={setView} />

      <ResultSheet
        title={result}
        entry={result ? library[result.id] : undefined}
        onClose={() => setResult(null)}
        onStartWatching={(t) => setStatus(t.id, 'watching')}
        onSpinAgain={() => {
          setResult(null)
          setAutoSpin((n) => n + 1)
        }}
        onOpenDetails={(t) => {
          setResult(null)
          setDetail(t)
        }}
      />

      <TitleSheet
        title={detail}
        entry={detail ? library[detail.id] : undefined}
        onClose={() => setDetail(null)}
        onUpdate={update}
      />

      <AccountSheet
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        sync={sync}
        email={email}
        signedIn={signedIn}
        onSignIn={signIn}
        onSignUp={signUp}
        onSignOut={signOut}
      />
    </div>
  )
}
