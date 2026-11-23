import { PetController } from '../controllers/PetController'
import type { AnimationCue, PetClip } from '../domain/animation'
import { clipDefinition } from '../domain/animationCatalog'
import type { ActionId } from '../domain/animationCatalog'
import type { PetState } from '../domain/petState'
import { practiceScene } from '../domain/sceneCatalog'
import type { PlayableScene } from '../domain/sceneCatalog'
import { planRoute } from '../domain/navigation'
import type { Facing, Point } from '../domain/room'

export const transitionChoices = {
  'walk-stop-idle': 'Walk → Stop → Idle',
  'run-stop-idle': 'Run → Stop → Idle',
  'sit-stand-idle': 'Sit → StandUp → Idle',
} as const

export type TransitionChoice = keyof typeof transitionChoices
export type PreviewSelection = PetClip | ActionId | TransitionChoice | 'live'
export type PreviewFrame = Readonly<{ animation: AnimationCue; position?: Point; state?: PetState }>
export type RoomPreview = PreviewFrame & { selection: PreviewSelection }

export const previewStepMs = 16
const seatedHoldMs = 320
const timing = { duration: (clip: PetClip) => clipDefinition(clip)?.durationMs ?? 0 }

export function isTransitionChoice(value: PreviewSelection): value is TransitionChoice {
  return Object.hasOwn(transitionChoices, value)
}

export function captureTransition(choice: TransitionChoice, facing: Facing, scene: PlayableScene = practiceScene): Required<PreviewFrame>[] {
  const { spawn } = scene
  const controller = new PetController(timing, { position: spawn, posture: 'standing', facing }, scene)
  if (choice === 'sit-stand-idle') controller.request({ type: 'sit' })
  else {
    const sign = facing === 'right' ? 1 : -1
    const target = [250, 160, 80].map(distance => ({ x: spawn.x + sign * distance, y: spawn.y }))
      .find(point => planRoute(spawn, point, scene.navigation))
    if (target) controller.request({ type: 'move', gait: choice === 'run-stop-idle' ? 'run' : 'walk', target })
  }

  // Use the same navigation and clip hand-offs as the room, in a separate controller.
  const frames: Required<PreviewFrame>[] = []
  for (let ms = 0; ms < 8000; ms += previewStepMs) {
    const { position, animation, state } = controller.snapshot()
    if (state === 'Sitting' && animation.elapsed >= seatedHoldMs) controller.request({ type: 'stand' })
    frames.push({ position, animation, state })
    if (state === 'Idle') break
    controller.advance(previewStepMs)
  }
  return frames
}
