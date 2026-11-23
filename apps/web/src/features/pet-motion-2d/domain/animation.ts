import type { Facing } from './room'

export type PetClip = 'idle' | 'walk' | 'turn' | 'stop' | 'sit' | 'seated' | 'stand'
  | 'align' | 'settle' | 'rest' | 'wake' | 'eat' | 'drink' | 'blink' | 'look' | 'stretch'
  | 'run' | 'jump' | 'greet' | 'play' | 'pet' | 'attention' | 'happy' | 'lying'

export type AnimationCue = Readonly<{
  clip: PetClip
  elapsed: number
  distance: number
  speed: number
  facing: Facing
  gait?: 'walk' | 'run'
}>

export interface AnimationTiming {
  duration(clip: PetClip): number
}
