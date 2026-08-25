import type { Title } from './types'

/** Muted, tonal — reads as one palette rather than a carnival. */
export const SEGMENT_COLORS = ['#6d7c5e', '#a8896f', '#8b9a7c', '#b9785c', '#7e8a92', '#c2a678']

/** Fisher–Yates sample of up to n titles */
export function sample(pool: Title[], n: number): Title[] {
  const copy = [...pool]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

/**
 * Rotation (deg, clockwise) that lands segment `winner` under the top pointer.
 * Segment i occupies local angles [i*seg, (i+1)*seg) clockwise from the pointer
 * at rotation 0. Adds 4–6 full turns from `current` plus a little jitter so the
 * pointer never parks dead-center every time.
 */
export function spinTarget(current: number, winner: number, count: number): number {
  const seg = 360 / count
  const jitter = (Math.random() - 0.5) * seg * 0.55
  const desired = (((-(winner * seg + seg / 2 + jitter)) % 360) + 360) % 360
  const currentMod = ((current % 360) + 360) % 360
  const delta = (desired - currentMod + 360) % 360
  const turns = 4 + Math.floor(Math.random() * 3)
  return current + turns * 360 + delta
}

export const SPIN_PHRASES = [
  'reading the room',
  'finding something good',
  'checking the light',
  'letting it land',
  'narrowing it down',
  'consulting the shelf',
  'dimming the lamps',
  'taking its time',
]
