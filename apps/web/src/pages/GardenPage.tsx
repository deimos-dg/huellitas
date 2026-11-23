import { ArrowRight } from 'lucide-react'
import gardenArt from '../../../../Imagenes/escenarios/01_Jardin.png?url'
import { formatTime } from '../features/day-night/DayNightController'
import { DayNightLayers } from '../features/day-night/DayNightLayers'
import { SceneTimeSimulation } from '../features/day-night/SceneTimeSimulation'
import { sceneLighting } from '../features/day-night/sceneLighting'
import { useDayNight } from '../features/day-night/useDayNight'
import '../styles/garden.css'

export default function GardenPage() {
  const { controller, snapshot } = useDayNight()
  const time = formatTime(snapshot.minute)

  return (
    <section className="garden-page" aria-labelledby="garden-heading">
      <div className="shell">
        <header className="garden-heading">
          <h1 id="garden-heading">Jardín de Huellitas</h1>
          <p className="garden-time" data-period={snapshot.period}>
            <span className="garden-time-dot" aria-hidden="true" />
            {snapshot.label} <time dateTime={time} aria-label={`${snapshot.simulated ? 'Hora simulada' : 'Hora local'} ${time}`}>{time}</time>
          </p>
        </header>
        <div className="garden-stage">
          <img src={gardenArt} width={1672} height={941}
            alt="Jardín ilustrado con una casita para mascotas, un camino de piedra y un banco bajo una guirnalda de luces." />
          <DayNightLayers profile={sceneLighting.garden} period={snapshot.period} />
        </div>
        <div className="garden-actions">
          <a className="button button-outline" href="/habitacion">Visita la habitación <ArrowRight size={18} aria-hidden="true" /></a>
          {import.meta.env.DEV && <SceneTimeSimulation controller={controller} snapshot={snapshot} />}
        </div>
      </div>
    </section>
  )
}
