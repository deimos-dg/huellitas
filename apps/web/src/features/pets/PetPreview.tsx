import { ChevronDown, Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getMotionSheet, motionAtlases, motionLabels, portraitAtlas } from './catalog'
import type { Coat, Collar, Motion, PetVariant } from './catalog'
import { PetSprite } from './PetSprite'
import { createTimeline, sampleMotion } from './motion'

type PetPreviewProps = {
  variant: PetVariant
  name: string
  coat: Coat
  collar: Collar
}

const reducedMotion = '(prefers-reduced-motion: reduce)'

export function PetPreview({ variant, name, coat, collar }: PetPreviewProps) {
  const atlas = motionAtlases[variant.id]
  const portrait = portraitAtlas.indices[variant.id]
  const initialFrame = atlas?.tracks.idle?.start ?? portrait
  const [motion, setMotion] = useState<Motion>('idle')
  const [playing, setPlaying] = useState(() => !window.matchMedia(reducedMotion).matches)
  const [frame, setFrame] = useState(initialFrame)
  const [atlasLoads, setAtlasLoads] = useState<Partial<Record<string, 'ready' | 'error'>>>({})
  const timeline = useMemo(() => createTimeline(motion, atlas), [motion, atlas])
  const clock = useRef({ elapsed: 0, frame: initialFrame })
  const motionBody = useRef<HTMLSpanElement>(null)
  const shadow = useRef<HTMLDivElement>(null)
  const customName = name.trim()
  const displayName = customName || variant.name
  const spriteLabel = customName ? `${customName}, ${variant.name}` : variant.name
  const needsAnimation = motion !== 'idle' || Boolean(atlas?.tracks.idle?.durations)
  const activeSheet = atlas && getMotionSheet(atlas, motion)
  const artUrl = activeSheet?.art
  const atlasStatus = artUrl ? atlasLoads[artUrl] ?? 'loading' : 'error'
  const showFrames = needsAnimation && atlasStatus === 'ready'
  const canPlay = !needsAnimation || showFrames

  useEffect(() => {
    if (!artUrl || !needsAnimation || atlasStatus !== 'loading') return
    let active = true
    const image = new Image()
    image.src = artUrl
    image.decode().then(
      () => { if (active) setAtlasLoads((current) => ({ ...current, [artUrl]: 'ready' })) },
      () => { if (active) setAtlasLoads((current) => ({ ...current, [artUrl]: 'error' })) },
    )
    return () => { active = false }
  }, [artUrl, atlasStatus, needsAnimation])

  useEffect(() => {
    const query = window.matchMedia(reducedMotion)
    function pauseForPreference(event: MediaQueryListEvent) {
      if (event.matches) setPlaying(false)
    }
    query.addEventListener('change', pauseForPreference)
    return () => query.removeEventListener('change', pauseForPreference)
  }, [])

  useEffect(() => {
    if (!timeline || !playing || !canPlay) return
    let animation = 0
    let previousTime: number | undefined

    function advance(timestamp: number) {
      if (!timeline) return
      if (previousTime !== undefined) clock.current.elapsed += Math.min(timestamp - previousTime, 64)
      previousTime = timestamp
      const pose = sampleMotion(timeline, clock.current.elapsed)

      if (needsAnimation && pose.index !== clock.current.frame) {
        clock.current.frame = pose.index
        setFrame(pose.index)
      }
      if (motionBody.current) {
        motionBody.current.style.transform = `translate3d(${pose.x}%, ${pose.y}%, 0) scaleY(${pose.scaleY})`
      }
      if (shadow.current && timeline.takeoff) {
        shadow.current.style.scale = String(1 + pose.y * .022)
        shadow.current.style.opacity = String(1 + pose.y * .029)
      }

      if (pose.done) setPlaying(false)
      else animation = window.requestAnimationFrame(advance)
    }

    animation = window.requestAnimationFrame(advance)
    return () => window.cancelAnimationFrame(animation)
  }, [canPlay, needsAnimation, playing, timeline])

  function rewind(nextMotion: Motion) {
    const start = createTimeline(nextMotion, atlas)?.frames[0].index ?? initialFrame
    clock.current = { elapsed: 0, frame: start }
    setFrame(start)
    motionBody.current?.style.removeProperty('transform')
    shadow.current?.style.removeProperty('scale')
    shadow.current?.style.removeProperty('opacity')
  }

  return (
    <aside className="pet-preview" id="vista-previa" aria-labelledby="pet-preview-title" tabIndex={-1}>
      <div className="preview-heading">
        <h2 id="pet-preview-title">Vista previa</h2>
        <span>{showFrames ? 'Animación 2D' : 'Retrato 2D'}</span>
      </div>

      <div className="pet-stage">
        <div className="pet-stage-shadow" ref={shadow} />
        <PetSprite
          atlas={showFrames && activeSheet ? activeSheet : portraitAtlas}
          frame={showFrames ? frame : portrait}
          displayScale={showFrames ? atlas?.previewScale : undefined}
          label={`Vista previa de ${spriteLabel}`}
          coat={coat}
          collar={collar}
          motionRef={motionBody}
        />
      </div>

      <div className="preview-caption">
        <span>{displayName}</span>
        {variant.description && <p>{variant.description}</p>}
      </div>

      {timeline ? (
        <div className="motion-controls">
          <div className="motion-field">
            <label htmlFor="pet-motion">Movimiento</label>
            <div className="select-shell">
              <select id="pet-motion" value={motion} onChange={(event) => {
                const selected = event.target.value as Motion
                setMotion(selected)
                rewind(selected)
              }}>
                {Object.entries(motionLabels).filter(([value]) => atlas?.tracks[value as Motion])
                  .map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </div>
          </div>
          <button className="button button-outline motion-button" type="button" disabled={!canPlay} onClick={() => {
            if (!playing && !timeline.loop && clock.current.elapsed >= timeline.duration) rewind(motion)
            setPlaying(!playing)
          }}>
            {playing ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
            {canPlay ? (playing ? 'Pausar' : 'Reproducir') : atlasStatus === 'error' ? 'Sin animación' : 'Cargando…'}
          </button>
        </div>
      ) : (
        <p className="static-preview-note">Esta variante tiene un retrato 2D.</p>
      )}
      {needsAnimation && atlasStatus === 'error' && (
        <p className="static-preview-note" role="status">No se pudo cargar la animación. Puedes seguir personalizando el retrato.</p>
      )}
    </aside>
  )
}
