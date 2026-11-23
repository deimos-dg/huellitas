export const dayPeriods = [
  { id: 'night', label: 'Noche', startsAt: 19 * 60 + 30 },
  { id: 'dusk', label: 'Anochecer', startsAt: 18 * 60 + 30 },
  { id: 'sunset', label: 'Atardecer', startsAt: 17 * 60 },
  { id: 'day', label: 'Día', startsAt: 10 * 60 },
  { id: 'morning', label: 'Mañana', startsAt: 6 * 60 },
] as const

export type DayPeriod = (typeof dayPeriods)[number]['id']

export function periodAt(minute: number) {
  return dayPeriods.find(period => minute >= period.startsAt) ?? dayPeriods[0]
}

export function formatTime(minute: number) {
  const hours = Math.floor(minute / 60).toString().padStart(2, '0')
  return `${hours}:${(minute % 60).toString().padStart(2, '0')}`
}

export type DayNightSnapshot = {
  minute: number
  period: DayPeriod
  label: string
  simulated: boolean
}

export class DayNightController {
  private listeners = new Set<() => void>()
  private simulatedMinute: number | null = null
  private snapshot: DayNightSnapshot

  constructor(private readonly now: () => Date = () => new Date()) {
    this.snapshot = this.readTime()
  }

  getSnapshot = () => this.snapshot

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  refresh = () => {
    const next = this.readTime()
    if (next.minute === this.snapshot.minute && next.simulated === this.snapshot.simulated) return

    this.snapshot = next
    for (const listener of this.listeners) listener()
  }

  simulate(minute: number | null) {
    if (minute !== null && (!Number.isInteger(minute) || minute < 0 || minute >= 24 * 60)) {
      throw new RangeError('La hora simulada debe estar entre 00:00 y 23:59.')
    }
    this.simulatedMinute = minute
    this.refresh()
  }

  private readTime(): DayNightSnapshot {
    const local = this.now()
    const minute = this.simulatedMinute ?? (local.getHours() * 60 + local.getMinutes())
    const { id, label } = periodAt(minute)
    return { minute, period: id, label, simulated: this.simulatedMinute !== null }
  }
}
