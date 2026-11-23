import type { Motion, MotionAtlas, Track } from './catalog'

type MotionTiming = { step: number; loop: boolean; settle?: number }
const timings: Record<Motion, MotionTiming> = {
  idle: { step: 135, loop: true },
  walk: { step: 105, loop: true },
  run: { step: 78, loop: true },
  sit: { step: 120, loop: false, settle: 370 },
  sleep: { step: 260, loop: true },
  wake: { step: 110, loop: false, settle: 280 },
  eat: { step: 155, loop: true },
  drink: { step: 155, loop: true },
  bath: { step: 155, loop: true },
  shake: { step: 90, loop: false, settle: 230 },
  play: { step: 135, loop: true },
  jump: { step: 98, loop: false, settle: 175 },
  pet: { step: 145, loop: false, settle: 280 },
  happy: { step: 125, loop: false, settle: 280 },
}

export type MotionTimeline = {
  action: Motion
  frames: { index: number; end: number }[]
  duration: number
  loop: boolean
  compact: boolean
  authored: boolean
  takeoff?: { start: number; duration: number }
}

function frameDuration(action: Motion, track: Track, index: number) {
  if (track.durations) return track.durations[index]
  const { step, loop, settle = 0 } = timings[action]
  if (action === 'idle') return index === 0 ? 530 : step
  if (action === 'walk' && track.count === 2) return 145
  if (action === 'run' && track.count === 1) return 420
  if (track.count === 1) return loop ? Math.max(720, step * 4) : Math.max(520, settle + step)
  if (index === track.count - 1 && settle > step) return settle
  return track.fps ? Math.min(1000 / track.fps, step) : step
}

export function createTimeline(action: Motion, atlas?: MotionAtlas): MotionTimeline | undefined {
  const track = atlas?.tracks[action]
  if (!atlas || !track) return

  const compact = atlas.type === 'compact'
  const idle = atlas.tracks.idle
  const phases = Array.from({ length: track.count }, (_, index) => ({
    index: track.start + index,
    duration: frameDuration(action, track, index),
  }))

  let takeoff: MotionTimeline['takeoff']
  if (compact && idle && action === 'jump') {
    const preparation = 100
    const airtime = track.count === 1 ? 420 : 465
    for (const phase of phases) phase.duration = airtime / phases.length
    phases.unshift({ index: idle.start, duration: preparation })
    phases.push({ index: idle.start, duration: 180 })
    takeoff = { start: preparation, duration: airtime }
  }

  if (compact && action === 'sit' && idle) phases.unshift({ index: idle.start, duration: 120 })
  const sleep = atlas.tracks.sleep
  if (compact && action === 'wake' && sleep && idle) {
    if (track.count === 1) phases[0].duration = 245
    phases.unshift({ index: sleep.start, duration: 160 })
    phases.push({ index: idle.start, duration: 210 })
  }

  if (compact && track.count === 1) {
    const walk = atlas.tracks.walk
    const sit = atlas.tracks.sit
    if (action === 'run' && walk && walk.count > 1) {
      phases[0].duration = 110
      phases.unshift({ index: walk.start + walk.count - 1, duration: 95 })
    }
    if ((action === 'pet' || action === 'happy') && sit) {
      phases.unshift({ index: sit.start, duration: 135 })
    }
  }

  let duration = 0
  const frames = phases.map((phase) => {
    duration += phase.duration
    return { index: phase.index, end: duration }
  })
  return { action, frames, duration, loop: timings[action].loop, compact, authored: Boolean(track.durations), takeoff }
}

const turn = Math.PI * 2

export function sampleMotion(timeline: MotionTimeline, elapsed: number) {
  const { duration, loop, frames, action, compact, takeoff } = timeline
  const done = !loop && elapsed >= duration
  const time = loop ? elapsed % duration : Math.min(elapsed, duration)
  const index = (frames.find((frame) => time < frame.end) ?? frames[frames.length - 1]).index
  const phase = time / duration * turn
  if (timeline.authored) return { index, done, x: 0, y: 0, scaleY: 1 }
  let x = 0
  let y = 0
  let scaleY = 1

  if (takeoff) {
    const arc = Math.min(1, Math.max(0, (time - takeoff.start) / takeoff.duration))
    y = -63 * arc * (1 - arc)
    x = 3 * Math.sin(Math.PI * arc)
  } else if (action === 'walk' || action === 'run') {
    const stride = action === 'run' ? 2.35 : 1.25
    x = Math.sin(phase) * .75
    y = -(Math.sin(phase) ** 2) * stride * (compact ? 1.2 : .65)
  } else if (action === 'idle' || action === 'sleep') {
    const breathing = (1 - Math.cos(elapsed / (action === 'sleep' ? 2600 : 2100) * turn)) / 2
    scaleY += breathing * .026
  } else if (compact && (action === 'shake' || action === 'pet' || action === 'happy')) {
    const envelope = Math.sin(phase / 2) ** 2
    x = Math.sin(phase * 3) * envelope * (action === 'shake' ? 1.65 : .42)
    scaleY += envelope * .027
  } else if (compact && loop) {
    scaleY += Math.sin(phase / 2) ** 2 * .022
  }

  return { index, done, x, y, scaleY }
}
