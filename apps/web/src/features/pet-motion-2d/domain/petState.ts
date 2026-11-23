import type { PetClip } from './animation'

export type PetState = 'Idle' | 'Walking' | 'Turning' | 'Stopping' | 'SittingDown' | 'Sitting' | 'StandingUp'
  | 'Aligning' | 'Settling' | 'Resting' | 'WakingUp' | 'Eating' | 'Drinking' | 'Blinking' | 'Looking' | 'Stretching'
  | 'Running' | 'Jumping' | 'Playing' | 'Lying' | 'Socializing'
export type StablePosture = 'standing' | 'sitting' | 'resting' | 'lying'

const transitions: Record<PetState, readonly PetState[]> = {
  Idle: ['Walking', 'Running', 'Jumping', 'Turning', 'Stopping', 'SittingDown', 'Looking'],
  Walking: ['Turning', 'Stopping'],
  Running: ['Turning', 'Stopping'],
  Jumping: ['Idle'],
  Turning: ['Walking', 'Running', 'Stopping'],
  Stopping: ['Idle', 'Aligning', 'Eating', 'Drinking', 'Looking', 'Jumping'],
  Aligning: ['Idle', 'Settling', 'Eating', 'Drinking', 'Playing', 'Looking', 'Jumping'],
  SittingDown: ['Sitting'],
  Sitting: ['StandingUp', 'Blinking', 'Socializing'],
  StandingUp: ['Idle'],
  Settling: ['Resting'],
  Resting: ['WakingUp', 'Stretching'],
  WakingUp: ['Sitting'],
  Eating: ['Sitting'],
  Drinking: ['Sitting'],
  Blinking: ['Sitting'],
  Looking: ['Idle'],
  Stretching: ['Sitting'],
  Playing: ['Lying'],
  Lying: ['WakingUp'],
  Socializing: ['Sitting'],
}

export function canTransition(from: PetState, to: PetState) {
  return transitions[from].includes(to)
}

export const clips: Record<PetState, PetClip> = {
  Idle: 'idle', Walking: 'walk', Turning: 'turn', Stopping: 'stop', SittingDown: 'sit', Sitting: 'seated',
  StandingUp: 'stand', Aligning: 'align', Settling: 'settle', Resting: 'rest', WakingUp: 'wake', Eating: 'eat', Drinking: 'drink',
  Blinking: 'blink', Looking: 'look', Stretching: 'stretch',
  Running: 'run', Jumping: 'jump', Playing: 'play', Lying: 'lying', Socializing: 'seated',
}

export const stableStates: Record<StablePosture, PetState> = {
  standing: 'Idle', sitting: 'Sitting', resting: 'Resting', lying: 'Lying',
}

export const stablePostures: Partial<Record<PetState, StablePosture>> = {
  Idle: 'standing', Sitting: 'sitting', Resting: 'resting', Lying: 'lying',
}

export const postTransition: Partial<Record<PetState, PetState>> = {
  SittingDown: 'Sitting', StandingUp: 'Idle', Settling: 'Resting', WakingUp: 'Sitting', Eating: 'Sitting', Drinking: 'Sitting',
  Blinking: 'Sitting', Looking: 'Idle', Stretching: 'Sitting',
  Jumping: 'Idle', Playing: 'Lying', Socializing: 'Sitting',
}
