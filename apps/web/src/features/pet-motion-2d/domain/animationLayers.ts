import { actionCatalog, canStartAction } from './animationCatalog'
import type { PetClip } from './animation'
import type { EmotionId, Posture, SocialId } from './animationCatalog'
import type { PetState } from './petState'

type Locomotion = 'Idle' | 'Walk' | 'Run' | 'Jump' | 'Turn' | 'Stop'
type Context = SocialId | 'Eat' | 'Drink' | 'Play'
type Secondary = 'blink' | 'look'
export type AnimationLayers = Readonly<{
  posture: Posture
  locomotion?: Locomotion
  context?: Context
  emotion?: EmotionId
  secondary?: Secondary
}>

const movement: Partial<Record<PetState, Locomotion>> = {
  Idle: 'Idle', Walking: 'Walk', Running: 'Run', Jumping: 'Jump', Turning: 'Turn', Stopping: 'Stop',
}
const context: Partial<Record<PetState, Context>> = { Eating: 'Eat', Drinking: 'Drink', Playing: 'Play' }
const secondary: Partial<Record<PetState, Secondary>> = { Blinking: 'blink', Looking: 'look' }

export function animationLayers(state: PetState, posture: Posture, social?: SocialId, emotion?: EmotionId): AnimationLayers {
  return { posture, locomotion: movement[state], context: state === 'Socializing' ? social : context[state], emotion, secondary: secondary[state] }
}

export function expressionClip(state: PetState, emotion: EmotionId | undefined, elapsed: number) {
  if (!emotion || !canStartAction(emotion, state)) return
  const definition = actionCatalog[emotion]
  if (elapsed < (definition.durationMs ?? 0)) return definition.clip
}

export function composeClip(layers: AnimationLayers, base: PetClip, expression?: PetClip): PetClip {
  if (layers.context) return actionCatalog[layers.context].clip ?? base
  if (layers.secondary || (layers.locomotion && layers.locomotion !== 'Idle')) return base
  return expression ?? base
}
