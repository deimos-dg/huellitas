import type { CSSProperties, Ref } from 'react'
import { coats, collars, portraitAtlas, spriteDimensions } from './catalog'
import type { Atlas, Coat, Collar, PetId } from './catalog'

type PetSpriteProps = {
  atlas: Atlas
  frame: number
  label?: string
  coat?: Coat
  collar?: Collar
  motionRef?: Ref<HTMLSpanElement>
}

export function PetSprite({ atlas, frame, label, coat = 'natural', collar = 'original', motionRef }: PetSpriteProps) {
  const column = frame % atlas.columns
  const row = Math.floor(frame / atlas.columns)
  const offsetX = atlas.columns === 1 ? 0 : column / (atlas.columns - 1) * 100
  const offsetY = atlas.rows === 1 ? 0 : row / (atlas.rows - 1) * 100
  const layerSize = `${atlas.columns * 100}% ${atlas.rows * 100}%`
  const layerPosition = `${offsetX}% ${offsetY}%`
  const collarColor = collars[collar].color
  const artStyle: CSSProperties = {
    backgroundImage: `url(${atlas.art})`,
    backgroundSize: layerSize,
    backgroundPosition: layerPosition,
    filter: coats[coat].filter,
  }

  return (
    <span
      className="pet-sprite"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ aspectRatio: `${spriteDimensions.width} / ${spriteDimensions.height}` }}
    >
      <span className="pet-sprite-body" ref={motionRef}>
        <span className="pet-sprite-art" style={artStyle} />
        {collarColor && (
          <span
            className="pet-sprite-collar"
            style={{
              backgroundColor: collarColor,
              maskImage: `url(${atlas.collar})`,
              maskSize: layerSize,
              maskPosition: layerPosition,
            }}
          />
        )}
      </span>
    </span>
  )
}

export function PetPortrait({ id }: { id: PetId }) {
  return <PetSprite atlas={portraitAtlas} frame={portraitAtlas.indices[id]} />
}
