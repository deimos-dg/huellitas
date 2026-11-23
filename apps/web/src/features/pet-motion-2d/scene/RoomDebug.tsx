import { useEffect, useMemo, useState } from 'react'
import type { RefObject } from 'react'
import { createPortal } from 'react-dom'
import { SceneTimeSimulation } from '../../day-night/SceneTimeSimulation'
import type { DayNightController, DayNightSnapshot } from '../../day-night/DayNightController'
import { PetSprite } from '../../pets/PetSprite'
import { goldenRoomArt, groundAnchor, roomCell, sampleGolden } from '../adapters/goldenAnimations'
import type { PetController } from '../controllers/PetController'
import type { AnimationCue, PetClip } from '../domain/animation'
import { actions, categories, clipDefinition, technicalClips } from '../domain/animationCatalog'
import type { AnimationCategory } from '../domain/animationCatalog'
import { vertices } from '../domain/navigation'
import { roomSize } from '../domain/room'
import type { Facing, Point } from '../domain/room'
import type { PlayableScene } from '../domain/sceneCatalog'
import { captureTransition, isTransitionChoice, previewStepMs, transitionChoices } from './transitionPreview'
import type { PreviewSelection, RoomPreview } from './transitionPreview'
import './room-debug.css'

type Snapshot = ReturnType<PetController['snapshot']>
type Props = {
  snapshot: Snapshot
  stage: RefObject<HTMLDivElement | null>
  clip: PreviewSelection
  selectClip: (clip: PreviewSelection) => void
  preview?: RoomPreview
  onPreview: (cue: RoomPreview | undefined) => void
  paused: boolean
  pauseBehavior: (paused: boolean) => void
  animationNote: string
  scene: PlayableScene
  artStatus: 'pending' | 'ready' | 'error'
  clock?: { controller: DayNightController; snapshot: DayNightSnapshot }
}

function positionLabel(point?: Point) {
  return point ? `${point.x.toFixed(1)}, ${point.y.toFixed(1)}` : '—'
}

const polygonPoints = (points: readonly Point[]) => points.map(({ x, y }) => `${x},${y}`).join(' ')

const neutralAnchors: Record<number, readonly { x: number; y: number; label: string }[]> = {
  12: [
    { x: 102, y: 219, label: 'Trasera cercana' }, { x: 136, y: 214, label: 'Trasera lejana' },
    { x: 181, y: 223, label: 'Delantera cercana' }, { x: 216, y: 219, label: 'Delantera lejana' },
  ],
  20: [
    { x: 151, y: 220, label: 'Apoyo sentado' }, { x: 193, y: 223, label: 'Delantera cercana' },
    { x: 216, y: 218, label: 'Delantera lejana' },
  ],
}

function PoseSample({ title, cue, anchors }: { title: string; cue: AnimationCue; anchors: boolean }) {
  const { frame } = sampleGolden(cue, false)
  if (!frame) return <figure><figcaption>{title} · Sin recurso</figcaption></figure>

  const fromRoom = frame.atlas.art === goldenRoomArt
  const points = fromRoom ? neutralAnchors[frame.frame] ?? [] : []
  return (
    <figure className="room-debug-pose" data-cel={frame.frame}>
      <div className="room-debug-pose-art" data-facing={cue.facing}>
        <PetSprite atlas={frame.atlas} frame={frame.frame} />
        {anchors && <>
          <span className="room-debug-pose-ground" style={{ top: `${groundAnchor(frame.atlas.art) * 100}%` }} />
          {points.map(point => <span key={point.label} className="room-debug-pose-contact" title={point.label}
            style={{ left: `${point.x / roomCell.width * 100}%`, top: `${point.y / roomCell.height * 100}%` }} />)}
        </>}
      </div>
      <figcaption>{title} · celda {frame.frame}</figcaption>
    </figure>
  )
}

export default function RoomDebug({ snapshot, stage, clip, selectClip, preview, onPreview, paused, pauseBehavior, animationNote, scene, artStatus, clock }: Props) {
  const [showGeometry, setShowGeometry] = useState(false)
  const [showAnchors, setShowAnchors] = useState(false)
  const [showMasks, setShowMasks] = useState(false)
  const [category, setCategory] = useState<AnimationCategory | ''>('')
  const [replay, setReplay] = useState(0)
  const [facing, setFacing] = useState<Facing>('right')
  const sequence = useMemo(() => isTransitionChoice(clip) ? captureTransition(clip, facing, scene) : undefined, [clip, facing, scene])
  const definition = clip === 'live' ? clipDefinition(snapshot.animation.clip)
    : sequence ? clipDefinition(preview?.animation.clip ?? sequence[0].animation.clip)
      : actions.find(action => (action.clip ?? action.id) === clip) ?? clipDefinition(clip as PetClip)
  const previewClip = clip === 'live' || sequence ? undefined : definition?.clip
  const previewDuration = definition?.durationMs || 1200

  useEffect(() => {
    if (!sequence) return
    let request = 0
    let start: number | undefined
    let previous = -1
    function draw(now: number) {
      if (!sequence) return
      start ??= now
      const index = Math.min(sequence.length - 1, Math.floor((now - start) / previewStepMs))
      if (index !== previous) {
        previous = index
        onPreview({ selection: clip, ...sequence[index] })
      }
      if (index < sequence.length - 1) request = requestAnimationFrame(draw)
    }
    request = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(request)
  }, [clip, onPreview, replay, sequence])

  useEffect(() => {
    if (!previewClip) {
      if (clip === 'live') onPreview(undefined)
      return
    }
    const speed = previewClip === 'run' ? 355 : previewClip === 'walk' ? 240 : 0
    let request = 0
    let start: number | undefined
    function draw(now: number) {
      if (!previewClip) return
      start ??= now
      const elapsed = previewClip === 'idle' ? now - start : Math.min(previewDuration, (now - start) % (previewDuration + 400))
      onPreview({ selection: clip, animation: { clip: previewClip, elapsed, speed, distance: elapsed * speed / 1000, facing } })
      request = requestAnimationFrame(draw)
    }
    request = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(request)
  }, [clip, previewClip, previewDuration, facing, onPreview, replay])

  const route = [snapshot.position, ...snapshot.waypoints]
  const anchor = preview?.position ?? snapshot.position
  const idleCue = { clip: 'idle', elapsed: 0, speed: 0, distance: 0, facing } as const
  const compare = Boolean(sequence) || previewClip === 'idle' || previewClip === 'stop' || previewClip === 'stand'
  const startCue: AnimationCue = sequence?.[0].animation ?? { ...idleCue, clip: previewClip === 'stand' ? 'seated' : 'idle' }
  const lastGait = sequence && [...sequence].reverse().find(({ animation }) => animation.speed > 0)?.animation
  const reviewed = sequence && clipDefinition(clip === 'sit-stand-idle' ? 'stand' : 'stop')
  return (
    <details className="room-debug" onToggle={event => {
      if (!event.currentTarget.open) {
        selectClip('live')
        setShowGeometry(false)
        setShowAnchors(false)
        setShowMasks(false)
      }
    }}>
      <summary>Depuración de la habitación</summary>
      <div className="room-debug-controls">
        <div className="room-debug-field">
          <label htmlFor="room-debug-category">Categoría</label>
          <select id="room-debug-category" value={category} onChange={event => {
            setCategory(event.target.value as AnimationCategory | '')
            selectClip('live')
          }}>
            <option value="">Todas</option>
            {Object.entries(categories).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </div>
        <div className="room-debug-field">
          <label htmlFor="room-debug-clip">Animación de prueba</label>
          <select id="room-debug-clip" value={clip} onChange={event => selectClip(event.target.value as PreviewSelection)}>
            <option value="live">Estado actual</option>
            <optgroup label="Acciones">
              {actions.filter(action => !category || action.category === category).map(action => (
                <option key={action.id} value={action.clip ?? action.id}>{action.id} · {action.name}</option>
              ))}
            </optgroup>
            {(!category || category === 'rest') && <optgroup label="Clips técnicos">
              {Object.entries(technicalClips).map(([id, item]) => <option key={id} value={id}>{item.name}</option>)}
            </optgroup>}
            <optgroup label="Transiciones completas">
              {Object.entries(transitionChoices).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </optgroup>
          </select>
        </div>
        <button type="button" disabled={!previewClip && !sequence} onClick={() => setReplay(value => value + 1)}>Reproducir</button>
        <label>Orientación de prueba <select value={facing} onChange={event => setFacing(event.target.value as Facing)}>
          <option value="right">Derecha</option><option value="left">Izquierda</option>
        </select></label>
        <label><input type="checkbox" checked={showAnchors} onChange={event => setShowAnchors(event.target.checked)} /> Mostrar anclajes</label>
        <label><input type="checkbox" checked={showGeometry} onChange={event => setShowGeometry(event.target.checked)} /> Mostrar geometría y ruta</label>
        {scene.masks.length > 0 && <label><input type="checkbox" checked={showMasks} onChange={event => setShowMasks(event.target.checked)} /> Mostrar máscaras de oclusión</label>}
        <label><input type="checkbox" checked={paused} onChange={event => pauseBehavior(event.target.checked)} /> Pausar autonomía</label>
      </div>
      <dl className="room-debug-values">
        <div><dt>Escenario</dt><dd>{scene.name}</dd></div>
        <div><dt>Fondo</dt><dd>{scene.background ? `${scene.background.file} · ${artStatus === 'ready' ? 'Cargado' : artStatus === 'error' ? 'Ausente' : 'Cargando'}` : 'Recursos CSS de práctica'}</dd></div>
        <div><dt>Máscaras</dt><dd>{scene.masks.map(mask => mask.id).join(', ') || 'Sin máscaras publicadas'}</dd></div>
        <div><dt>Estado</dt><dd>{snapshot.state}</dd></div>
        {snapshot.care && <div><dt>Interacción de cuidado</dt><dd>{snapshot.care.phase} · {snapshot.care.sequence.join(' → ')} · Arte pendiente</dd></div>}
        {sequence && <div><dt>Fase de la transición</dt><dd data-testid="room-debug-transition-phase">{preview?.state ?? 'Preparando'}</dd></div>}
        {reviewed && <div><dt>Recursos pendientes en {reviewed.name}</dt><dd>{reviewed.availability} · {reviewed.notes}</dd></div>}
        <div><dt>Posición</dt><dd>{positionLabel(snapshot.position)}</dd></div>
        <div><dt>Destino</dt><dd>{positionLabel(snapshot.destination)}</dd></div>
        <div><dt>Velocidad</dt><dd>{snapshot.animation.speed.toFixed(1)} u/s</dd></div>
        <div><dt>Animación</dt><dd>{definition?.availability === 'Missing' ? 'Acción sin animación visual' : animationNote || 'Fotogramas disponibles'}</dd></div>
        {definition && <>
          <div><dt>Disponibilidad</dt><dd>{definition.availability}</dd></div>
          <div><dt>Duración y FPS</dt><dd>{definition.durationMs === null ? '—' : definition.durationMs === 0 ? 'Pose sostenida' : `${definition.durationMs} ms`} · {definition.referenceFps ?? '—'} FPS</dd></div>
          <div><dt>Postura</dt><dd>{definition.posture.join(' → ')}</dd></div>
          <div><dt>Orientaciones</dt><dd>{definition.orientations.join(', ') || '—'}</dd></div>
          <div><dt>Reproducción</dt><dd>{definition.playback}</dd></div>
          <div><dt>Transiciones</dt><dd>{definition.transitions.from.join(', ')} → {definition.transitions.start ?? 'Pendiente'} → {definition.transitions.end.join(', ') || '—'}</dd></div>
          <div><dt>Interrupción</dt><dd>{definition.interruption}</dd></div>
          <div><dt>Recursos</dt><dd>{definition.resources.map(resource => `${resource.atlas}/${resource.track} (${resource.frames})`).join(', ') || 'Sin atlas'}</dd></div>
          {definition.events.length > 0 && <div><dt>Eventos</dt><dd>{definition.events.map(event => `${event.name} ${Math.round(event.at * 100)} %`).join(', ')}</dd></div>}
          {definition.notes && <div><dt>Observaciones</dt><dd>{definition.notes}</dd></div>}
        </>}
      </dl>
      {compare && <div className="room-debug-comparison" data-testid="room-debug-comparison">
        <PoseSample title="Postura inicial" cue={startCue} anchors={showAnchors} />
        {clip === 'sit-stand-idle' && <PoseSample title="Apoyo antes de StandUp" cue={{ ...idleCue, clip: 'seated' }} anchors={showAnchors} />}
        {lastGait && <PoseSample title="Última pose en movimiento" cue={lastGait} anchors={showAnchors} />}
        <PoseSample title="Postura final" cue={idleCue} anchors={showAnchors} />
        <p>{sequence ? 'La repetición usa una instancia separada del controlador.' : previewClip === 'stop'
          ? 'Stop aislado muestra el apoyo final. El frenado se revisa con Walk → Stop → Idle o Run → Stop → Idle.'
          : 'Comparación de las celdas de referencia.'} Los puntos señalan apoyos visibles en las poses de referencia.</p>
      </div>}
      {clock && <SceneTimeSimulation {...clock} />}
      {showGeometry && (
        <p className="room-debug-legend">Verde · suelo. Azul · zona táctil. Rojo · colisión. Amarillo · interacción. Blanco · ruta y waypoints.</p>
      )}
      {(showGeometry || showAnchors || showMasks) && stage.current && createPortal(
        <svg className="room-debug-overlay" viewBox={`0 0 ${roomSize.width} ${roomSize.height}`} preserveAspectRatio="none" aria-hidden="true" data-testid="room-debug-overlay">
          {showGeometry && <>
          <polygon points={polygonPoints(vertices(scene.navigation.floor))} fill="#62a65322" stroke="#c0f884" />
          {scene.navigation.obstacles.map((obstacle, index) => (
            <polygon key={index} data-obstacle={index} points={polygonPoints(vertices(obstacle))} fill="#cc152130" stroke="#ff7373" />
          ))}
          {scene.objects.map(({ id, hitbox, interaction, restingPoint }) => (
            <g key={id}>
              <rect {...hitbox} fill="#1258ff30" stroke="#84d5ff" />
              <circle cx={interaction.x} cy={interaction.y} r={7} fill="#ffda46" />
              {restingPoint && <>
                <line x1={interaction.x} y1={interaction.y} x2={restingPoint.x} y2={restingPoint.y} stroke="#ffc1df" strokeDasharray="5 4" />
                <circle cx={restingPoint.x} cy={restingPoint.y} r={6} fill="#ffc1df" />
              </>}
            </g>
          ))}
          <polyline points={route.map(({ x, y }) => `${x},${y}`).join(' ')} fill="none" stroke="white" strokeDasharray="8 5" />
          {snapshot.waypoints.map(({ x, y }) => <circle key={`${x},${y}`} cx={x} cy={y} r={5} fill="white" />)}
          {snapshot.destination && <circle cx={snapshot.destination.x} cy={snapshot.destination.y} r={13} stroke="white" fill="none" />}
          <circle cx={snapshot.position.x} cy={snapshot.position.y} r={7} fill="#193a28" stroke="white" />
          </>}
          {showMasks && scene.masks.map(mask => <polygon key={mask.id} data-debug-mask={mask.id}
            points={polygonPoints(mask.polygon)} fill="#ab6af24d" stroke="#e7a9ff" />)}
          {showAnchors && <g transform={`translate(${anchor.x} ${anchor.y})`} data-testid="room-debug-root-anchor">
            <circle r={12} fill="#193a28" stroke="#ffe69d" />
            <path d="M -17 0 H 17 M 0 -17 V 17" stroke="#ffe69d" />
          </g>}
        </svg>, stage.current,
      )}
    </details>
  )
}
