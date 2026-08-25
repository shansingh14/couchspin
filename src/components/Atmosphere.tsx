import { useMemo } from 'react'

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
      <div className="haze" />
      <div className="vignette" />
    </div>
  )
}
