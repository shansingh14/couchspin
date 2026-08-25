import { useMemo } from 'react'
import type { CSSProperties } from 'react'

/**
 * An out-of-focus valley at golden hour (dusk in night mode), built entirely
 * from layered gradients — no image payload, crisp at any viewport.
 */
export function Atmosphere() {
  // Deterministic bokeh field: soft, defocused wildflowers in the near meadow.
  const bokeh = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const golden = (i * 137.508) % 100
        const depth = (i * 29) % 24
        return {
          left: `${golden}%`,
          bottom: `${1 + depth}%`,
          // nearer to the camera = larger and softer
          size: 9 + (24 - depth) * 0.9 + ((i * 7) % 11),
          opacity: 0.2 + ((i % 5) * 0.09),
          tint: ['warm', 'pale', 'blush'][i % 3],
          delay: `${(i % 9) * 1.4}s`,
        }
      }),
    []
  )

  // Fireflies at dusk, sunlit dust motes by day. Positions lean toward the left
  // and right edges so they fill the space either side of the wheel on desktop,
  // with every fourth one left unbiased for depth behind the content.
  const motes = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const t = (i * 137.508) % 100
        const biased = t < 50 ? t * 0.72 : 100 - (100 - t) * 0.72
        return {
          left: `${i % 4 === 0 ? t : biased}%`,
          top: `${6 + ((i * 43) % 80)}%`,
          size: 2.5 + ((i * 11) % 4),
          dx: `${((i % 7) - 3) * 24}px`,
          dy: `${((i % 5) - 2) * 28}px`,
          drift: `${24 + (i % 9) * 5}s`,
          glow: `${3.6 + (i % 6) * 0.9}s`,
          delay: `-${(i * 2.7) % 20}s`,
          peak: 0.4 + (i % 4) * 0.17,
        }
      }),
    []
  )

  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="sky" />
      <div className="sun" />
      <div className="ridge ridge-far" />
      <div className="ridge ridge-mid" />
      <div className="ridge ridge-near" />
      <div className="meadow" />
      <div className="bokeh-field">
        {bokeh.map((b, i) => (
          <span
            key={i}
            className={`bokeh bokeh-${b.tint}`}
            style={{
              left: b.left,
              bottom: b.bottom,
              width: b.size,
              height: b.size,
              opacity: b.opacity,
              animationDelay: b.delay,
            }}
          />
        ))}
      </div>
      <div className="fireflies">
        {motes.map((m, i) => (
          <span
            key={i}
            className="firefly"
            style={
              {
                left: m.left,
                top: m.top,
                width: m.size,
                height: m.size,
                animationDuration: m.drift,
                animationDelay: m.delay,
                '--dx': m.dx,
                '--dy': m.dy,
                '--glow': m.glow,
                '--peak': m.peak,
              } as CSSProperties
            }
          >
            <i style={{ animationDelay: m.delay }} />
          </span>
        ))}
      </div>
      <div className="haze" />
      <div className="vignette" />
    </div>
  )
}
