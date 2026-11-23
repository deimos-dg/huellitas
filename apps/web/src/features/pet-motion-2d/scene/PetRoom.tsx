import { ArrowDownToLine, ArrowUpFromLine, PawPrint } from 'lucide-react'
import { lazy, Suspense, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { formatTime } from '../../day-night/DayNightController'
import { sceneLighting } from '../../day-night/sceneLighting'
import type { SceneLightingProfile } from '../../day-night/sceneLighting'
import { useDayNight } from '../../day-night/useDayNight'
import { sceneArt } from '../adapters/sceneArt'
import type { PetIntent } from '../controllers/PetController'
import { actionCatalog } from '../domain/animationCatalog'
import type { EmotionId } from '../domain/animationCatalog'
import type { PetState } from '../domain/petState'
import type { PlayableScene } from '../domain/sceneCatalog'
import { useGoldenFrame } from './RoomPet'
import { RoomStage } from './RoomStage'
import type { PreviewSelection, RoomPreview } from './transitionPreview'
import { usePet } from './usePet'

const RoomDebug = import.meta.env.DEV ? lazy(() => import('./RoomDebug')) : null

const stateLabels: Record<PetState, string> = {
  Idle: 'En reposo', Walking: 'Caminando', Turning: 'Cambiando de dirección', Stopping: 'Deteniéndose',
  SittingDown: 'Sentándose', Sitting: 'Sentado', StandingUp: 'Levantándose', Settling: 'Acomodándose para descansar',
  Aligning: 'Orientándose', Resting: 'Descansando', WakingUp: 'Despertando', Eating: 'Comiendo', Drinking: 'Bebiendo',
  Blinking: 'Parpadeando', Looking: 'Mirando alrededor', Stretching: 'Estirándose',
  Running: 'Corriendo', Jumping: 'Saltando', Playing: 'Jugando con la pelota', Lying: 'Tumbado', Socializing: 'Interactuando',
}

const canStand = new Set<PetState>(['SittingDown', 'Sitting', 'Blinking', 'Settling', 'Resting', 'WakingUp', 'Stretching', 'Lying', 'Socializing'])
const emotions: readonly EmotionId[] = ['Happy', 'Curious', 'Surprised', 'Sad', 'Angry']

export function PetRoom({ scene, picker, notice: sceneNotice }: { scene: PlayableScene; picker: ReactNode; notice?: string }) {
  const { snapshot, send: sendIntent, autonomous, behaviorPaused, toggleBehavior, pauseBehavior } = usePet(scene)
  const clock = useDayNight()
  const profile: SceneLightingProfile | undefined = scene.lighting && sceneLighting[scene.lighting]
  const [artStatus, setArtStatus] = useState<'pending' | 'ready' | 'error'>(() => {
    if (!scene.background) return 'ready'
    return sceneArt[scene.id] ? 'pending' : 'error'
  })
  const { state, notice, care } = snapshot
  const stage = useRef<HTMLDivElement>(null)
  const [debugClip, setDebugClip] = useState<PreviewSelection>('live')
  const [preview, setPreview] = useState<RoomPreview>()
  const [run, setRun] = useState(false)
  const activePreview = RoomDebug && debugClip !== 'live' && preview?.selection === debugClip ? preview : undefined
  const cue = activePreview?.animation ?? snapshot.animation
  const golden = useGoldenFrame(cue)
  const stand = canStand.has(state)
  const emotion = snapshot.layers.emotion ? actionCatalog[snapshot.layers.emotion] : undefined
  const interaction = state === 'Socializing' && snapshot.layers.context ? actionCatalog[snapshot.layers.context].name : stateLabels[state]
  const animationNote = golden.status === 'error' || golden.missing
    ? 'Recurso de animación no disponible. Representación provisional.'
    : golden.status === undefined ? 'Cargando la ilustración…'
      : golden.provisional ? 'Pose de transición provisional.' : ''

  function send(intent: PetIntent) {
    setDebugClip('live')
    if (artStatus !== 'error') sendIntent(intent)
  }

  return (
    <section className="pet-room" aria-labelledby="pet-room-heading">
      <div className="shell">
        <header className="pet-room-heading">
          <h1 id="pet-room-heading">Habitación del Golden</h1>
          {picker}
          <p>Elige un punto del suelo para caminar o toca un objeto para interactuar. {profile?.layers && (
            <span className="room-scene-clock">{clock.snapshot.label} <time dateTime={formatTime(clock.snapshot.minute)}>{formatTime(clock.snapshot.minute)}</time></span>
          )}</p>
        </header>
        {sceneNotice && <p role="alert">{sceneNotice}</p>}
        {artStatus === 'error' && <p role="alert">La ilustración de {scene.name} no está disponible.</p>}
        <RoomStage snapshot={snapshot} golden={golden} send={send} stage={stage} run={run} preview={activePreview}
          scene={scene} period={clock.snapshot.period} onArtStatus={setArtStatus} />
        <div className="room-controls">
          <div className="room-status" role="status">
            <span className="room-status-icon"><PawPrint size={21} aria-hidden="true" /></span>
            <div>
              <p className="room-status-name">{notice ?? interaction}</p>
              <p className="room-status-note">{animationNote || `Golden Retriever · ${scene.name}`}</p>
              {care && state === 'Looking' && <p className="room-status-note">{care.pendingNote}</p>}
              {emotion && <p className="room-status-note">Emoción · {emotion.name}{emotion.availability === 'Missing' && ' · sin animación disponible'}</p>}
            </div>
          </div>
          <div className="room-actions">
            {scene.objects.map(({ id, label, reservedFor }) => (
              <button key={id} className="button button-outline room-object-shortcut" type="button"
                disabled={reservedFor === 'cat'} onClick={() => send({ type: 'object', id })}>{label}</button>
            ))}
            <button className="button button-primary" type="button" onClick={() => send({ type: stand ? 'stand' : 'sit' })}>
              {stand ? <ArrowUpFromLine size={17} aria-hidden="true" /> : <ArrowDownToLine size={17} aria-hidden="true" />}
              {stand ? 'Levantarse' : 'Sentarse'}
            </button>
          </div>
        </div>
        <div className="room-options">
          <label><input type="checkbox" checked={autonomous} onChange={event => toggleBehavior(event.target.checked)} /> Comportamiento autónomo</label>
          <p id="room-keyboard-hint" className="room-keyboard-hint">Con el suelo enfocado, usa las flechas para caminar.</p>
        </div>
        <details className="room-interactions">
          <summary>Interactuar con el Golden</summary>
          <div className="room-interaction-controls">
            <button className="button button-outline" type="button" onClick={() => send({ type: 'social', action: 'Greet' })}>Saludar</button>
            <button className="button button-outline" type="button" onClick={() => send({ type: 'social', action: 'ReceivePetting' })}>Acariciar</button>
            <button className="button button-outline" type="button" onClick={() => send({ type: 'social', action: 'SeekAttention' })}>Pedir atención</button>
            <button className="button button-outline" type="button" onClick={() => send({ type: 'jump' })}>Saltar</button>
            <label><input type="checkbox" checked={run} onChange={event => setRun(event.target.checked)} /> Correr hacia el destino</label>
            <div className="room-interaction-field">
              <label htmlFor="room-emotion">Emoción</label>
              <select id="room-emotion" value={snapshot.layers.emotion ?? ''} onChange={event => send({ type: 'emotion', id: (event.target.value || undefined) as EmotionId | undefined })}>
                <option value="">Ninguna</option>
                {emotions.map(id => <option key={id} value={id}>{actionCatalog[id].name}</option>)}
              </select>
            </div>
          </div>
        </details>
        {RoomDebug && <Suspense fallback={null}><RoomDebug snapshot={snapshot} stage={stage} clip={debugClip} selectClip={setDebugClip}
          preview={activePreview} onPreview={setPreview} paused={behaviorPaused} pauseBehavior={pauseBehavior} animationNote={animationNote}
          scene={scene} artStatus={artStatus} clock={profile?.layers ? clock : undefined} /></Suspense>}
      </div>
    </section>
  )
}
