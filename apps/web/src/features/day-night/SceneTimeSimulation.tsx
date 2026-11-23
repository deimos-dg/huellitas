import { useId, useState } from 'react'
import type { DayNightController, DayNightSnapshot } from './DayNightController'
import { formatTime } from './DayNightController'

export function SceneTimeSimulation({ controller, snapshot }: { controller: DayNightController; snapshot: DayNightSnapshot }) {
  const id = useId()
  const [draft, setDraft] = useState<string>()
  const time = formatTime(snapshot.minute)

  return (
    <details className="scene-time-simulation">
      <summary>Simular hora</summary>
      <form onSubmit={event => {
        event.preventDefault()
        const [hours, minutes] = (draft ?? time).split(':').map(Number)
        controller.simulate(hours * 60 + minutes)
      }}>
        <label htmlFor={id}>Hora simulada</label>
        <input id={id} type="time" required value={draft ?? time} onChange={event => setDraft(event.currentTarget.value)} />
        <button type="submit" className="button button-primary">Aplicar hora</button>
        <button type="button" className="button button-outline" disabled={!snapshot.simulated} onClick={() => {
          setDraft(undefined)
          controller.simulate(null)
        }}>Volver a la hora local</button>
      </form>
    </details>
  )
}
