import { useEffect, useRef } from 'react'

const PETAL_COLORS = ['#c2a678', '#b9785c', '#8b9a7c', '#e6ddcd', '#a8896f']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vrot: number
  size: number
  color: string
  shape: 'rect' | 'dot'
  life: number
}

/** Fires a burst of cozy confetti whenever `burst` increments. */
export function Confetti({ burst }: { burst: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const raf = useRef(0)

  useEffect(() => {
    if (burst === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // clientWidth, not innerWidth: the latter includes a classic scrollbar,
    // which would offset every particle from the visible centre
    const vw = document.documentElement.clientWidth
    const vh = document.documentElement.clientHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = vw * dpr
    canvas.height = vh * dpr
    ctx.scale(dpr, dpr)

    const cx = vw / 2
    const cy = Math.min(vh * 0.38, 420)
    for (let i = 0; i < 44; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2
      const speed = 3 + Math.random() * 5.5
      particles.current.push({
        x: cx + (Math.random() - 0.5) * 90,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.14,
        size: 5 + Math.random() * 5,
        color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
        shape: Math.random() > 0.45 ? 'rect' : 'dot',
        life: 110 + Math.random() * 50,
      })
    }

    const tick = () => {
      const w = vw
      const h = vh
      ctx.clearRect(0, 0, w, h)
      particles.current = particles.current.filter((p) => p.life > 0 && p.y < h + 20)
      for (const p of particles.current) {
        p.x += p.vx + Math.sin((p.life + p.size) / 18) * 0.5
        p.y += p.vy
        p.vy += 0.13
        p.vx *= 0.99
        p.rot += p.vrot
        p.life -= 1
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = Math.min(0.72, p.life / 45)
        ctx.fillStyle = p.color
        if (p.shape === 'rect') {
          ctx.beginPath()
          ctx.ellipse(0, 0, p.size / 1.7, p.size / 3.4, 0, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
      if (particles.current.length > 0) {
        raf.current = requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, w, h)
      }
    }
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [burst])

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />
}
