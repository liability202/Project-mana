import type { ReactNode } from 'react'
import type { BowlSpec, Garnish } from './data'

/**
 * Hand-made illustrations for Rasoi: top-down dishes, spice-tin fills and
 * Jaipur blue-pottery tiles. Rendered on the server only (they are passed to
 * client components as finished elements), so the "random" scatter is drawn
 * once from a fixed seed and never re-computed in the browser.
 */

const COBALT = '#1D3F9A'
const SKY = '#DCE6FB'
const SAFFRON = '#F2A51A'
const LEAF = '#2F7D32'

function random(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedOf(text: string) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const round = (value: number) => Math.round(value * 10) / 10

type Spot = { x: number; y: number; r: number }

/** Spread points inside a circle, keeping them from piling on top of each other. */
function scatter(count: number, maxRadius: number, gap: number, next: () => number, placed: Spot[]) {
  const points: Spot[] = []
  for (let index = 0; index < count; index++) {
    let best: Spot & { clearance: number } = { x: 0, y: 0, r: gap, clearance: -Infinity }
    for (let attempt = 0; attempt < 16; attempt++) {
      const radius = maxRadius * Math.sqrt(next())
      const angle = next() * Math.PI * 2
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      const clearance = placed.reduce((least, spot) => Math.min(least, Math.hypot(spot.x - x, spot.y - y) - spot.r - gap), Infinity)
      if (clearance > best.clearance) best = { x, y, r: gap, clearance }
      if (clearance > 0) break
    }
    placed.push({ x: best.x, y: best.y, r: gap })
    points.push(best)
  }
  return points
}

function starPoints(size: number) {
  const points: string[] = []
  for (let index = 0; index < 16; index++) {
    const radius = index % 2 === 0 ? size : size * 0.42
    const angle = (Math.PI / 8) * index
    points.push(`${round(Math.cos(angle) * radius)},${round(Math.sin(angle) * radius)}`)
  }
  return points.join(' ')
}

/** One garnish piece, drawn at the origin; the caller positions and rotates it. */
function piece(shape: Garnish['shape'], size: number, color: string, next: () => number): ReactNode {
  switch (shape) {
    case 'dot':
      return <circle r={round(size)} fill={color} />
    case 'sliver':
      return <ellipse rx={round(size)} ry={round(size * 0.36)} fill={color} />
    case 'seed':
      return <ellipse rx={round(size)} ry={round(size * 0.55)} fill={color} />
    case 'petal':
      return <ellipse rx={round(size)} ry={round(size * 0.62)} fill={color} opacity={0.92} />
    case 'star':
      return (
        <g>
          <polygon points={starPoints(size)} fill={color} stroke="rgba(0,0,0,0.18)" strokeWidth={0.8} />
          <circle r={round(size * 0.22)} fill="#3B1C10" />
        </g>
      )
    case 'pod':
      return (
        <g>
          <ellipse rx={round(size)} ry={round(size * 0.5)} fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth={0.8} />
          <line x1={round(-size * 0.6)} x2={round(size * 0.6)} y1={0} y2={0} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
        </g>
      )
    case 'clove':
      return (
        <g>
          <rect x={round(-size * 0.15)} y={round(-size * 0.1)} width={round(size * 0.3)} height={round(size * 1.05)} rx={round(size * 0.15)} fill={color} />
          <circle cy={round(-size * 0.32)} r={round(size * 0.34)} fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth={0.6} />
        </g>
      )
    case 'catkin':
      return (
        <g>
          <ellipse rx={round(size)} ry={round(size * 0.3)} fill={color} />
          {[-0.5, 0, 0.5].map(offset => (
            <line key={offset} x1={round(size * offset)} x2={round(size * offset)} y1={round(-size * 0.26)} y2={round(size * 0.26)} stroke="rgba(0,0,0,0.3)" strokeWidth={0.7} />
          ))}
        </g>
      )
    case 'puff':
      return (
        <g>
          <circle r={round(size)} fill={color} stroke="#D9CCB4" strokeWidth={1} />
          <circle cx={round(size * 0.25)} cy={round(size * 0.2)} r={round(size * 0.3)} fill="#C9A77A" opacity={0.55} />
        </g>
      )
    case 'ball': {
      const specks = Array.from({ length: 7 }, (_, index) => {
        const angle = next() * Math.PI * 2
        const distance = Math.sqrt(next()) * size * 0.68
        return (
          <circle
            key={index}
            cx={round(Math.cos(angle) * distance)}
            cy={round(Math.sin(angle) * distance)}
            r={round(size * (0.07 + next() * 0.05))}
            fill={index % 3 === 0 ? '#97B957' : '#E7C79A'}
          />
        )
      })
      return (
        <g>
          <circle r={round(size)} fill={color} stroke="rgba(0,0,0,0.14)" strokeWidth={1.2} />
          {specks}
          <circle cx={round(-size * 0.32)} cy={round(-size * 0.36)} r={round(size * 0.3)} fill="#FFFFFF" opacity={0.16} />
        </g>
      )
    }
  }
}

/** Every garnish of a spec, scattered within `radius` of the centre. */
function garnishLayer(spec: BowlSpec, seed: string, radius: number) {
  const next = random(seedOf(seed))
  const placed: Spot[] = []
  const nodes: ReactNode[] = []
  spec.garnish.forEach((garnish, layer) => {
    const average = (garnish.size[0] + garnish.size[1]) / 2
    const spots =
      garnish.shape === 'ball'
        ? [
            ...Array.from({ length: garnish.count - 1 }, (_, index) => {
              const angle = (Math.PI * 2 * index) / (garnish.count - 1) - Math.PI / 2 + 0.4
              return { x: Math.cos(angle) * radius * 0.56, y: Math.sin(angle) * radius * 0.56, r: average }
            }),
            { x: 0, y: 0, r: average },
          ]
        : scatter(garnish.count, radius - average, average * 0.7, next, placed)
    spots.forEach((spot, index) => {
      const size = garnish.size[0] + next() * (garnish.size[1] - garnish.size[0])
      const color = garnish.colors[index % garnish.colors.length]
      const angle = Math.round(next() * 360)
      nodes.push(
        <g key={`${layer}-${index}`} transform={`translate(${round(spot.x)} ${round(spot.y)}) rotate(${angle})`}>
          {piece(garnish.shape, size, color, next)}
        </g>
      )
    })
  })
  return nodes
}

/** A top-down plate: blue-pottery rim, a bowl of the dish, garnish on top. */
export function DishBowl({ spec, seed, label }: { spec: BowlSpec; seed: string; label?: string }) {
  const rim = Array.from({ length: 24 }, (_, index) => {
    const angle = (index * 15 * Math.PI) / 180
    const x = round(100 + Math.cos(angle) * 93.4)
    const y = round(100 + Math.sin(angle) * 93.4)
    return index % 2 === 0 ? (
      <ellipse key={index} cx={x} cy={y} rx={2.6} ry={1.3} fill={COBALT} transform={`rotate(${index * 15 + 90} ${x} ${y})`} />
    ) : (
      <circle key={index} cx={x} cy={y} r={1.15} fill={SAFFRON} />
    )
  })

  return (
    <svg viewBox="0 0 200 200" className="block h-full w-full" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <circle cx={100} cy={100} r={98} fill="#FFFFFF" stroke={COBALT} strokeWidth={2.6} />
      <circle cx={100} cy={100} r={88.6} fill="none" stroke={COBALT} strokeWidth={0.9} />
      {rim}
      <circle cx={100} cy={100} r={80} fill={spec.dry ? '#FFFFFF' : '#F7F4EC'} stroke={COBALT} strokeWidth={spec.dry ? 1.2 : 2.2} strokeDasharray={spec.dry ? '1.5 3.5' : undefined} />
      <circle cx={100} cy={100} r={spec.dry ? 76 : 72} fill={spec.base} />
      {!spec.dry && <circle cx={100} cy={100} r={72} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={5} />}
      {spec.swirl && (
        <path d="M58 104 C 74 76, 124 70, 146 98" fill="none" stroke={spec.swirl} strokeWidth={9} strokeLinecap="round" opacity={0.75} />
      )}
      <g transform="translate(100 100)">{garnishLayer(spec, seed, spec.dry ? 66 : 60)}</g>
      <ellipse cx={80} cy={70} rx={24} ry={10} fill="#FFFFFF" opacity={0.16} transform="rotate(-28 80 70)" />
    </svg>
  )
}

/** The spice inside one cup of the masala dabba. */
export function SpiceFill({ spec, seed }: { spec: BowlSpec; seed: string }) {
  return (
    <svg viewBox="0 0 100 100" className="block h-full w-full" aria-hidden>
      <circle cx={50} cy={50} r={50} fill={spec.base} />
      <g transform="translate(50 50)">{garnishLayer(spec, seed, 46)}</g>
      <circle cx={50} cy={50} r={47} fill="none" stroke="rgba(0,0,0,0.32)" strokeWidth={6} />
      <ellipse cx={36} cy={30} rx={16} ry={7} fill="#FFFFFF" opacity={0.12} transform="rotate(-30 36 30)" />
    </svg>
  )
}

/** Four-petal blue-pottery flower, for headings and card corners. */
export function Flower({ className = '', petals = COBALT, inner = SKY, heart = SAFFRON }: { className?: string; petals?: string; inner?: string; heart?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {[0, 90, 180, 270].map(angle => (
        <g key={angle} transform={`rotate(${angle} 24 24)`}>
          <ellipse cx={24} cy={12.5} rx={5.4} ry={10} fill={petals} />
          <ellipse cx={24} cy={13.5} rx={2.3} ry={5.4} fill={inner} />
        </g>
      ))}
      {[45, 135, 225, 315].map(angle => (
        <ellipse key={angle} cx={24} cy={9} rx={2.2} ry={4.6} fill={LEAF} transform={`rotate(${angle} 24 24)`} />
      ))}
      <circle cx={24} cy={24} r={4.6} fill={heart} />
    </svg>
  )
}

function tileSvg() {
  const petals = [0, 90, 180, 270]
    .map(angle => `<g transform='rotate(${angle} 22 22)'><ellipse cx='22' cy='11.5' rx='4.6' ry='8.6' fill='${COBALT}'/><ellipse cx='22' cy='12.4' rx='1.9' ry='4.6' fill='${SKY}'/></g>`)
    .join('')
  const leaves = [45, 135, 225, 315]
    .map(angle => `<ellipse cx='22' cy='8.2' rx='1.6' ry='3.6' fill='${LEAF}' transform='rotate(${angle} 22 22)'/>`)
    .join('')
  const corners = [
    [0, 0],
    [44, 0],
    [0, 44],
    [44, 44],
  ]
    .map(([x, y]) => `<circle cx='${x}' cy='${y}' r='4.2' fill='${COBALT}'/><circle cx='${x}' cy='${y}' r='1.8' fill='${SAFFRON}'/>`)
    .join('')
  return `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'><rect width='44' height='44' fill='#FBFAF6'/>${leaves}${petals}<circle cx='22' cy='22' r='3.6' fill='${SAFFRON}'/>${corners}</svg>`
}

/** CSS background for a band of blue-pottery tiles. */
export const TILE_BACKGROUND = `url("data:image/svg+xml,${encodeURIComponent(tileSvg())}")`

/** A strip of blue-pottery tiles between cobalt rules. */
export function TileBand({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`border-y-2 border-[#1D3F9A] ${className}`}
      style={{ backgroundImage: TILE_BACKGROUND, backgroundSize: '44px 44px', backgroundPosition: 'center' }}
    />
  )
}
