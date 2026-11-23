import type { CSSProperties } from 'react'
import type { DayPeriod } from './DayNightController'
import type { SceneLightingProfile } from './sceneLighting'
import './day-night.css'

export function DayNightLayers({ profile, period }: { profile: SceneLightingProfile; period: DayPeriod }) {
  if (!profile.layers) return null

  const { sky, sun, moon, lights, artwork, ambientWash = true } = profile.layers
  const glow = lights?.map(({ x, y, radiusX, radiusY }) => (
    `radial-gradient(ellipse ${radiusX}% ${radiusY}% at ${x}% ${y}%, #ffe3a3 0%, #ffb24d50 35%, transparent 75%)`
  )).join(', ')

  return (
    <div className="day-night" data-period={period} aria-hidden="true">
      {ambientWash && <div className="day-night-wash" />}
      {sky && <div className="day-night-sky" style={{ '--sky-x': `${sky.x}%`, '--sky-y': `${sky.y}%` } as CSSProperties} />}
      {sun && <span className="day-night-sun" style={{ left: `${sun.x}%`, top: `${sun.y}%` }} />}
      {moon && <span className="day-night-moon" style={{ left: `${moon.x}%`, top: `${moon.y}%` }} />}
      {glow && <div className="day-night-lights" style={{ backgroundImage: glow }} />}
      {artwork?.map(({ src, periods, mask }) => <img key={src} className="day-night-artwork" src={src} alt=""
        style={{ opacity: periods.includes(period) ? 1 : 0, maskImage: mask ? `url(${mask})` : undefined }} />)}
    </div>
  )
}
