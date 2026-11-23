import { distanceBetween, planRoute, shapeBounds } from '../domain/navigation'
import type { PetState } from '../domain/petState'
import { practiceScene } from '../domain/sceneCatalog'
import type { PlayableScene } from '../domain/sceneCatalog'
import type { Point } from '../domain/room'
import type { PetIntent } from './PetController'

type BehaviorContext = { state: PetState; position: Point; autonomousRest: boolean }
type Interval = readonly [min: number, max: number]

export class PetBehaviorController {
  private remaining?: number

  constructor(
    private readonly random = Math.random,
    private readonly activityInterval: Interval = [6500, 11_000],
    private readonly restInterval: Interval = [11_000, 17_000],
    private readonly scene: PlayableScene = practiceScene,
  ) {}

  reset() { this.remaining = undefined }

  advance(delta: number, { state, position, autonomousRest }: BehaviorContext): PetIntent | undefined {
    if (!Number.isFinite(delta) || delta <= 0) return
    if (state !== 'Idle' && state !== 'Sitting' && state !== 'Lying' && !(state === 'Resting' && autonomousRest)) return
    const [min, max] = state === 'Resting' ? this.restInterval : this.activityInterval
    this.remaining ??= min + (max - min) * this.random()
    this.remaining -= delta
    if (this.remaining > 0) return
    this.reset()

    if (state === 'Lying') return { type: 'stand' }
    if (state === 'Resting') return this.random() < .8 ? { type: 'stretch' } : { type: 'stand' }
    const choice = this.random()
    if (choice < .18) return // Keep the current posture for another interval.
    if (choice < .60) return { type: state === 'Idle' ? 'look' : 'blink' }
    const bed = this.scene.objects.find(object => object.action === 'rest')
    if (choice >= .90 && bed) return { type: 'object', id: bed.id }
    if (choice >= .82 && state === 'Idle') return { type: 'sit' }

    const floor = shapeBounds(this.scene.navigation.floor)
    for (let attempt = 0; attempt < 10; attempt++) {
      const target = { x: floor.x + floor.width * this.random(), y: floor.y + floor.height * this.random() }
      if (distanceBetween(position, target) >= 100 && planRoute(position, target, this.scene.navigation)) return { type: 'move', target }
    }
  }
}
