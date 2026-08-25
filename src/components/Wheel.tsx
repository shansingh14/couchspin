import { useEffect, useRef, useState } from 'react'
import type { Title } from '../lib/types'
import { SEGMENT_COLORS, SPIN_PHRASES, spinTarget } from '../lib/wheel'

const SIZE = 420
const C = SIZE / 2
const R = 176

interface WheelProps {
  titles: Title[]
  onResult: (t: Title) => void
  /** increment to trigger a spin from outside (e.g. "spin again") */
  autoSpin: number
}

function polar(angleDeg: number, r: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180
  return [C + r * Math.cos(a), C + r * Math.sin(a)]
}

function segmentPath(i: number, count: number): string {
  const seg = 360 / count
  const a0 = -90 + i * seg
  const a1 = a0 + seg
  const [x0, y0] = polar(a0, R)
  const [x1, y1] = polar(a1, R)
  const large = seg > 180 ? 1 : 0
  return `M ${C} ${C} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`
}

export function Wheel({ titles, onResult, autoSpin }: WheelProps) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [phrase, setPhrase] = useState('')
  const pendingWinner = useRef<Title | null>(null)
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const count = titles.length
  const seg = 360 / count

  const spin = () => {
    if (spinning || count === 0) return
    const winnerIdx = Math.floor(Math.random() * count)
    pendingWinner.current = titles[winnerIdx]
    setPhrase(SPIN_PHRASES[Math.floor(Math.random() * SPIN_PHRASES.length)])
    setSpinning(true)
    setRotation((r) => spinTarget(r, winnerIdx, count))
  }

  const spinRef = useRef(spin)
  spinRef.current = spin

  useEffect(() => {
    if (autoSpin > 0) {
      const t = setTimeout(() => spinRef.current(), 350)
      return () => clearTimeout(t)
    }
  }, [autoSpin])

  const handleEnd = () => {
    if (!spinning) return
    setSpinning(false)
    setPhrase('')
    if (pendingWinner.current) {
      onResult(pendingWinner.current)
      pendingWinner.current = null
    }
  }

  return (
    <div className="wheel-area">
      <div className={spinning ? 'wheel-pointer spinning' : 'wheel-pointer'} aria-hidden="true">
        <svg width="26" height="30" viewBox="0 0 26 30">
          <path d="M13 29 L1.6 7.5 A13 13 0 0 1 24.4 7.5 Z" className="pointer-body" />
        </svg>
      </div>

      <div className="wheel-frame">
        <div
          className={reducedMotion.current ? 'wheel-rotor instant' : 'wheel-rotor'}
          style={{ transform: `rotate(${rotation}deg)` }}
          onTransitionEnd={handleEnd}
        >
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="wheel-svg" role="img" aria-label="Picker wheel">
            <circle cx={C} cy={C} r={R + 9} className="wheel-rim" />
            {titles.map((t, i) => (
              <path
                key={`seg-${t.id}`}
                d={segmentPath(i, count)}
                fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                className="wheel-seg"
              />
            ))}
            {titles.map((t, i) => {
              const mid = -90 + i * seg + seg / 2
              const norm = ((mid % 360) + 360) % 360
              const flip = norm > 90 && norm < 270
              const [x, y] = polar(mid, R - 15)
              const label = t.name.length > 17 ? t.name.slice(0, 16).trimEnd() + '…' : t.name
              return (
                <text
                  key={`label-${t.id}`}
                  x={x}
                  y={y}
                  transform={`rotate(${flip ? mid + 180 : mid} ${x} ${y})`}
                  textAnchor={flip ? 'start' : 'end'}
                  dominantBaseline="middle"
                  className="wheel-label"
                >
                  {label}
                </text>
              )
            })}
            <circle cx={C} cy={C} r={54} className="wheel-hub-ring" />
          </svg>
        </div>

        <button className="wheel-hub" onClick={spin} disabled={spinning} aria-label="Spin the wheel">
          <span className="hub-word">{spinning ? '' : 'Spin'}</span>
          {spinning && <span className="hub-dots" aria-hidden="true"><i /><i /><i /></span>}
        </button>
      </div>

      <p className={phrase ? 'spin-phrase visible' : 'spin-phrase'} aria-live="polite">
        {phrase || ' '}
      </p>
    </div>
  )
}
