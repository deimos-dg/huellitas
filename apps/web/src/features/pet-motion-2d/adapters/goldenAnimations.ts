import { getMotionSheet, motionAtlases } from '../../pets/catalog'
import type { Atlas, Motion } from '../../pets/catalog'
import { createTimeline, sampleMotion } from '../../pets/motion'
import roomArt from '../../../assets/pet-motion-2d/golden-room-art.webp'
import roomAtlas from '../../../assets/pet-motion-2d/golden-room.json'
import type { AnimationCue, AnimationTiming, PetClip } from '../domain/animation'
import { clipDefinition } from '../domain/animationCatalog'
import { sampleIdleMotion } from '../domain/idleMotion'
import type { Facing, ObjectId } from '../domain/room'

const goldenAtlas = motionAtlases.golden
const stride = 146
const runningStride = 384
export const goldenRoomArt = roomArt
export const goldenBaseArt = goldenAtlas?.art

function getTrack(motion: Motion) {
  if (!goldenAtlas) return
  const timeline = createTimeline(motion, goldenAtlas)
  const atlas = getMotionSheet(goldenAtlas, motion)
  if (!timeline?.frames.length || !atlas.art || !(timeline.duration > 0)
    || timeline.frames.some(({ index }) => index < 0 || index >= atlas.columns * atlas.rows)) return
  return { timeline, atlas }
}

const tracks = {
  walk: getTrack('walk'), sit: getTrack('sit'), sleep: getTrack('sleep'), wake: getTrack('wake'),
  eat: getTrack('eat'), drink: getTrack('drink'),
  run: getTrack('run'), jump: getTrack('jump'), play: getTrack('play'), pet: getTrack('pet'), happy: getTrack('happy'),
}

export const goldenAnimation: AnimationTiming = {
  duration(clip) { return clipDefinition(clip)?.durationMs ?? 0 },
}

export type GoldenFrame = Readonly<{
  atlas: Atlas; frame: number; embedded?: ObjectId; facing?: Facing; breathOffset?: number; eyelidFrame?: number
}>

function trackFrame(name: keyof typeof tracks, progress: number): GoldenFrame | undefined {
  const track = tracks[name]
  if (!track) return
  const { atlas, timeline } = track
  const time = Math.min(progress * timeline.duration, timeline.duration - .001)
  return { atlas, frame: sampleMotion(timeline, time).index }
}

function standingFrame(roomAvailable: boolean) {
  return (roomAvailable ? roomFrame('posture', 0) : undefined) ?? trackFrame('eat', 0)
}

function gaitFrame(gait: 'walk' | 'run', distance: number, reduced: boolean) {
  const length = gait === 'run' ? runningStride : stride
  return trackFrame(gait, reduced ? 0 : (distance % length) / length)
}

function celebrationFrame(pages: readonly number[], progress: number): GoldenFrame | undefined {
  const { atlas, timeline } = tracks.happy ?? {}
  const frame = timeline?.frames[sequence(pages, progress)]?.index
  if (!atlas || frame === undefined) return
  return { atlas, frame }
}

const roomSheet: Atlas = { ...roomAtlas, art: roomArt, collar: '' }

export const roomCell = { width: 336, height: 264 }
// Reference lines measured on the opaque paw edges of the published neutral and walk cells.
export function groundAnchor(art?: string) {
  return art === goldenRoomArt ? 224 / roomCell.height : 300 / 352
}

function roomFrame(name: keyof typeof roomAtlas.tracks, page: number): GoldenFrame | undefined {
  const { first, start, count } = roomAtlas.tracks[name]
  const frame = start + page - first
  if (!roomArt || page < first || page >= first + count || frame >= roomSheet.columns * roomSheet.rows) return
  return { atlas: roomSheet, frame }
}

function sequence(pages: readonly number[], progress: number) {
  return pages[Math.min(pages.length - 1, Math.floor(progress * pages.length))]
}

function authoredFrame(clip: PetClip, progress: number, reduced: boolean): GoldenFrame | undefined {
  switch (clip) {
    case 'turn': return reduced ? standingFrame(true) : roomFrame('pivot', sequence([3, 4, 5, 6, 7, 8, 9, 10, 11], progress))
    case 'sit': return roomFrame('posture', reduced ? 8 : sequence([0, 1, 2, 3, 4, 5, 6, 7, 8], progress))
    case 'seated': return roomFrame('posture', 8)
    case 'stand': return !reduced && progress < .7 ? roomFrame('posture', 8) : standingFrame(true)
    case 'settle': return reduced ? roomFrame('bed', 10)
      : progress < .33 ? roomFrame('posture', sequence([0, 2, 4, 6, 8], progress / .33))
        : roomFrame('bed', sequence([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], (progress - .33) / .67))
    case 'rest': return roomFrame('bed', 10)
    case 'lying': return roomFrame('bed', 3)
    case 'wake':
    case 'stretch': return reduced ? roomFrame('posture', 8)
      : roomFrame('stretch', sequence([2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], progress))
    case 'blink': return roomFrame('posture', reduced ? 8 : sequence([8, 9, 10, 11, 8], progress))
    case 'look': return reduced ? standingFrame(true)
      : roomFrame('pivot', sequence([3, 2, 1, 0, 0, 1, 2, 3], progress))
  }
}

const roomClips = new Set<PetClip>(['turn', 'sit', 'seated', 'stand', 'settle', 'rest', 'lying', 'wake', 'stretch', 'blink', 'look'])

export function sampleGolden(cue: AnimationCue, reducedMotion: boolean, roomAvailable = true) {
  if (cue.clip === 'idle') {
    const pose = standingFrame(roomAvailable)
    const isRoomPose = pose?.atlas === roomSheet
    const { breathOffset, blinking } = sampleIdleMotion(cue.elapsed, reducedMotion || !isRoomPose)
    const eyelidFrame = isRoomPose && blinking ? roomFrame('posture', 9)?.frame : undefined
    return { frame: pose && { ...pose, breathOffset: isRoomPose && !reducedMotion ? breathOffset : undefined, eyelidFrame },
      provisional: !isRoomPose, missing: !isRoomPose }
  }
  const progress = Math.min(1, cue.elapsed / (goldenAnimation.duration(cue.clip) || 1))
  const authored = roomAvailable ? authoredFrame(cue.clip, progress, reducedMotion) : undefined
  if (authored) return { frame: authored, provisional: cue.clip === 'stand', missing: false }
  let frame: GoldenFrame | undefined
  let provisional = false

  switch (cue.clip) {
    case 'turn':
      provisional = true
      frame = standingFrame(roomAvailable)
      if (frame && !reducedMotion && progress >= .5) frame = { ...frame, facing: cue.facing === 'left' ? 'right' : 'left' }
      break
    case 'align': frame = standingFrame(roomAvailable); break
    case 'walk':
    case 'run': frame = gaitFrame(cue.clip, cue.distance, reducedMotion); break
    case 'jump': frame = reducedMotion ? standingFrame(roomAvailable) : trackFrame('jump', progress); break
    case 'stop':
      provisional = true
      frame = cue.speed <= 0 ? standingFrame(roomAvailable) : gaitFrame(cue.gait ?? 'walk', cue.distance, reducedMotion)
      break
    case 'sit': frame = trackFrame('sit', reducedMotion ? 1 : progress); break
    case 'seated':
    case 'blink': frame = trackFrame('sit', 1); break
    case 'stand':
      provisional = true
      frame = !reducedMotion && progress < .7 ? trackFrame('sit', 1) : standingFrame(roomAvailable)
      break
    case 'settle':
      provisional = true
      frame = progress < .45 && !reducedMotion ? trackFrame('sit', 1) : trackFrame('sleep', 0)
      break
    case 'lying': frame = trackFrame('wake', 0); break
    case 'rest': {
      const duration = tracks.sleep?.timeline.duration ?? 1
      frame = trackFrame('sleep', reducedMotion ? 0 : (cue.elapsed % duration) / duration)
      break
    }
    case 'wake':
    case 'stretch': frame = trackFrame('wake', reducedMotion ? 1 : progress); break
    case 'look': frame = standingFrame(roomAvailable); break
    case 'greet': frame = celebrationFrame([0, 1, 2, 3, 4, 5, 3], reducedMotion ? .75 : progress); break
    case 'attention': frame = celebrationFrame([3, 4, 5, 6, 4, 3], reducedMotion ? .5 : progress); break
    case 'happy': frame = celebrationFrame([0, 1, 2, 3], reducedMotion ? 1 : progress); break
    case 'pet': frame = trackFrame('pet', reducedMotion ? .45 : progress); break
    case 'play': {
      frame = trackFrame('play', reducedMotion ? .7 : progress)
      const first = tracks.play?.timeline.frames[0]?.index
      if (frame && first !== undefined && frame.frame > first) frame = { ...frame, embedded: 'ball' }
      break
    }
    case 'eat':
    case 'drink': {
      const name = cue.clip
      frame = trackFrame(name, reducedMotion ? .5 : progress)
      // The three middle drawings already include the container next to the muzzle.
      const first = tracks[name]?.timeline.frames[0]?.index
      if (frame && first !== undefined && frame.frame > first && frame.frame <= first + 3) {
        frame = { ...frame, embedded: name === 'eat' ? 'food' : 'water' }
      }
      break
    }
  }

  const needsRoom = roomClips.has(cue.clip) || (cue.clip === 'stop' && cue.speed <= 0 && frame?.atlas !== roomSheet)
  return { frame: frame ?? standingFrame(roomAvailable), provisional, missing: !frame || needsRoom }
}
