import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Dog } from 'lucide-react'
import { PetSprite } from '../../pets/PetSprite'
import type { Atlas } from '../../pets/catalog'
import type { AnimationCue } from '../domain/animation'
import { goldenBaseArt, goldenRoomArt, groundAnchor, roomCell, sampleGolden } from '../adapters/goldenAnimations'
import { roomSize } from '../domain/room'
import type { Point, Rectangle } from '../domain/room'

type ImageStatus = 'ready' | 'error'
const preloadedAtlases = [goldenBaseArt, goldenRoomArt].filter((url): url is string => typeof url === 'string' && url !== '')

function decodeAtlas(url: string, report: (status: ImageStatus) => void) {
  let active = true
  const image = new Image()
  image.src = url
  void image.decode().then(
    () => { if (active) report('ready') },
    () => { if (active) report('error') },
  )
  return () => { active = false }
}

export function useGoldenFrame(cue: AnimationCue) {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [images, setImages] = useState<Record<string, ImageStatus>>({})
  const roomStatus = images[goldenRoomArt]
  const preferred = sampleGolden(cue, reducedMotion)
  const usesRoom = preferred.frame?.atlas.art === goldenRoomArt
  const fallback = usesRoom && roomStatus !== 'ready'
  const { frame, missing, provisional } = fallback ? sampleGolden(cue, reducedMotion, false) : preferred
  const url = frame?.atlas.art
  const status = url ? images[url] : 'error'
  const waitingForRoom = usesRoom && !roomStatus

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!url || status || preloadedAtlases.includes(url)) return
    return decodeAtlas(url, result => setImages(current => ({ ...current, [url]: result })))
  }, [url, status])

  useEffect(() => {
    const cancel = preloadedAtlases.map(url => decodeAtlas(url, result => setImages(current => ({ ...current, [url]: result }))))
    return () => cancel.forEach(stop => stop())
  }, [])

  const idle = sampleGolden({ ...cue, clip: 'idle', elapsed: 0 }, true, roomStatus === 'ready').frame
  const backup = idle && images[idle.atlas.art] === 'ready' ? idle : undefined
  return {
    frame: status === 'ready' ? frame : backup,
    status: waitingForRoom ? undefined : status,
    missing: !waitingForRoom && missing,
    provisional,
  }
}

type RoomPetProps = {
  frame: ReturnType<typeof useGoldenFrame>['frame']; position: Point; facing: AnimationCue['facing']
  floor: Rectangle; sizeRange: readonly [number, number]
  artworkClip?: string
}

function roomCrop(atlas: Atlas, frame: number, region: { x: number; y: number; width: number; height: number }): CSSProperties {
  const atlasWidth = atlas.columns * roomCell.width
  const atlasHeight = atlas.rows * roomCell.height
  const sourceX = frame % atlas.columns * roomCell.width + region.x
  const sourceY = Math.floor(frame / atlas.columns) * roomCell.height + region.y
  return {
    backgroundImage: `url(${atlas.art})`,
    backgroundSize: `${atlasWidth / region.width * 100}% ${atlasHeight / region.height * 100}%`,
    backgroundPosition: `${sourceX / (atlasWidth - region.width) * 100}% ${sourceY / (atlasHeight - region.height) * 100}%`,
  }
}

function Eyelids({ atlas, frame }: { atlas: Atlas; frame: number }) {
  // Cell 21 contains both closed eyes, each matched to its own eye on cell 12.
  const eyes = [
    { x: 216, y: 36, width: 26, height: 23, source: { x: 169, y: 28, width: 26, height: 23 } },
    { x: 249, y: 36, width: 11, height: 14, source: { x: 205, y: 27, width: 10, height: 7 } },
  ]
  return eyes.map(({ x, y, width, height, source }) => <span key={x} className="room-pet-eyelid" aria-hidden="true" style={{
    left: `${x / roomCell.width * 100}%`, top: `${y / roomCell.height * 100}%`,
    width: `${width / roomCell.width * 100}%`, height: `${height / roomCell.height * 100}%`,
    ...roomCrop(atlas, frame, source),
  }} />)
}

export function RoomPet({ position, facing, frame, floor, sizeRange, artworkClip }: RoomPetProps) {
  const depth = (position.y - floor.y) / floor.height
  const width = 224 * (sizeRange[0] + depth * (sizeRange[1] - sizeRange[0]))

  return (
    <div className="room-pet" data-testid="room-pet" data-x={position.x} data-y={position.y} data-facing={facing} style={{
      left: `${position.x / roomSize.width * 100}%`, top: `${position.y / roomSize.height * 100}%`,
      width: `${width / roomSize.width * 100}%`, zIndex: Math.round(position.y) + 1,
    }}>
      <div className="room-pet-shadow" aria-hidden="true" />
      <div className="room-pet-drawing" data-facing={frame?.facing ?? facing} data-frame={frame?.frame}
        style={{ '--room-art-ground': `${groundAnchor(frame?.atlas.art) * 100}%` } as CSSProperties}>
        {frame ? <div className="room-pet-artwork" style={artworkClip ? { clipPath: artworkClip } : undefined}>
          <PetSprite atlas={frame.atlas} frame={frame.frame} label="Golden Retriever" />
          {frame.breathOffset !== undefined && <span className="room-pet-breath" aria-hidden="true">
            <span style={{ ...roomCrop(frame.atlas, frame.frame, { x: 0, y: 0, ...roomCell }), translate: `0 ${-frame.breathOffset * 100}%` }} />
          </span>}
          {frame.eyelidFrame !== undefined && <Eyelids atlas={frame.atlas} frame={frame.eyelidFrame} />}
        </div>
          : <span className="room-pet-placeholder" role="img" aria-label="Golden Retriever, representación provisional"><Dog aria-hidden="true" /></span>}
      </div>
    </div>
  )
}
