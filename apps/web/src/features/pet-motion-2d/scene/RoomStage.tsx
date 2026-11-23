import { PawPrint } from 'lucide-react'
import type { KeyboardEvent, MouseEvent, RefObject } from 'react'
import type { PetController, PetIntent } from '../controllers/PetController'
import { DayNightLayers } from '../../day-night/DayNightLayers'
import type { DayPeriod } from '../../day-night/DayNightController'
import type { SceneLightingProfile } from '../../day-night/sceneLighting'
import { sceneLighting } from '../../day-night/sceneLighting'
import { sceneArt } from '../adapters/sceneArt'
import { paintedPropArtworkClip } from '../adapters/paintedPropArtwork'
import { shapeBounds } from '../domain/navigation'
import type { Polygon } from '../domain/navigation'
import type { Point, Rectangle } from '../domain/room'
import { roomSize } from '../domain/room'
import type { PlayableScene } from '../domain/sceneCatalog'
import { screenToLogical } from '../domain/sceneCoordinates'
import { RoomPet } from './RoomPet'
import type { useGoldenFrame } from './RoomPet'
import type { PreviewFrame } from './transitionPreview'

function placement({ x, y, width, height }: Rectangle) {
  return { ...anchor({ x, y }), width: `${width / roomSize.width * 100}%`, height: `${height / roomSize.height * 100}%` }
}

function anchor({ x, y }: Point) {
  return { left: `${x / roomSize.width * 100}%`, top: `${y / roomSize.height * 100}%` }
}

function clipPolygon(points: Polygon) {
  return `polygon(${points.map(({ x, y }) => `${x / roomSize.width * 100}% ${y / roomSize.height * 100}%`).join(', ')})`
}

const arrowSteps: Partial<Record<string, Point>> = {
  ArrowLeft: { x: -104, y: 0 }, ArrowRight: { x: 104, y: 0 },
  ArrowUp: { x: 0, y: -78 }, ArrowDown: { x: 0, y: 78 },
}

type RoomStageProps = {
  snapshot: ReturnType<PetController['snapshot']>
  golden: ReturnType<typeof useGoldenFrame>
  send: (intent: PetIntent) => void
  stage: RefObject<HTMLDivElement | null>
  run: boolean
  preview?: PreviewFrame
  scene: PlayableScene
  period: DayPeriod
  onArtStatus: (status: 'ready' | 'error') => void
}

export function RoomStage({ snapshot, golden, send, stage, run, preview, scene, period, onArtStatus }: RoomStageProps) {
  const { position, destination, animation, selectedObject, state } = snapshot
  const source = sceneArt[scene.id]
  const background = scene.background
  const size = background?.size ?? roomSize
  const floor = shapeBounds(scene.navigation.floor)
  const lighting: SceneLightingProfile | undefined = scene.lighting && sceneLighting[scene.lighting]
  const embeddedObject = golden.frame?.embedded
  const artworkClip = !preview && golden.frame && embeddedObject && scene.objects.some(object => object.id === embeddedObject && object.paintedProp)
    ? paintedPropArtworkClip(golden.frame.frame) : undefined

  function selectPoint(event: MouseEvent<HTMLButtonElement>) {
    if (!stage.current || !event.detail) return
    const { left, top, width, height } = stage.current.getBoundingClientRect()
    const target = screenToLogical({ x: event.clientX, y: event.clientY }, { x: left, y: top, width, height }, size)
    if (target) send({ type: 'move', gait: run ? 'run' : 'walk', target })
  }

  function adjustWithArrow(event: KeyboardEvent<HTMLButtonElement>) {
    const step = arrowSteps[event.key]
    if (!step) return
    event.preventDefault()
    const { x, y, width, height } = floor
    send({ type: 'move', gait: run ? 'run' : 'walk', target: {
      x: Math.max(x, Math.min(x + width, position.x + step.x)),
      y: Math.max(y, Math.min(y + height, position.y + step.y)),
    } })
  }

  return (
    <div className="room-stage" ref={stage} data-testid="room-stage" data-state={state} data-scene={scene.id} data-original={Boolean(background)}
      style={{ aspectRatio: `${size.width} / ${size.height}` }}>
      {source && background ? (
        <div className="room-scene-base">
          <img src={source} alt={background.alt} width={size.width} height={size.height} draggable={false}
            onLoad={() => onArtStatus('ready')} onError={() => onArtStatus('error')} />
          {lighting && <DayNightLayers profile={lighting} period={period} />}
        </div>
      ) : !background && <>
      <div className="room-wall" aria-hidden="true">
        <div className="room-window"><span /></div>
        <div className="room-picture"><PawPrint /></div>
        <div className="room-shelf" />
      </div>
      <div className="room-floor" aria-hidden="true">
        <div className="room-window-light" />
        <div className="room-rug" />
      </div>
      <div className="room-plant" aria-hidden="true"><span /><span /><span /></div>
      </>}
      <button className="room-floor-target" type="button" aria-label="Desplazar al Golden por el suelo"
        aria-describedby="room-keyboard-hint" onClick={selectPoint} onKeyDown={adjustWithArrow} />
      {scene.objects.map(({ id, label, art, hitbox, interaction, reservedFor }) => {
        const embedded = !!art && !preview && golden.frame?.embedded === id
        return (
          <div key={id}>
            {art && <div className={`room-object room-object-${id}`} style={{ ...placement(art), zIndex: art.depth ?? Math.round(interaction.y) }} aria-hidden="true" hidden={embedded}>
              <span /><i />
            </div>}
            <button className="room-hotspot" type="button" data-object={id} data-active={selectedObject === id} data-embedded={embedded}
              style={placement(hitbox)} aria-label={label} disabled={reservedFor === 'cat'} onClick={() => send({ type: 'object', id })}>
              <span aria-hidden="true">{label}</span>
            </button>
          </div>
        )
      })}
      {destination && <span className="room-destination" style={anchor(destination)} aria-hidden="true" />}
      <RoomPet frame={golden.frame} position={preview?.position ?? position} facing={preview?.animation.facing ?? animation.facing}
        floor={floor} sizeRange={scene.sizeRange} artworkClip={artworkClip} />
      {source && scene.masks.map(mask => <div key={mask.id} className="room-scene-mask" data-mask={mask.id} aria-hidden="true"
        style={{ clipPath: clipPolygon(mask.polygon), zIndex: Math.round(mask.depth) }}>
        <img src={source} alt="" draggable={false} />
        {lighting && <DayNightLayers profile={lighting} period={period} />}
      </div>)}
    </div>
  )
}
