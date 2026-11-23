import type { AnimationCue, AnimationTiming } from '../domain/animation'
import { actionCatalog, canStartAction, clipDefinition } from '../domain/animationCatalog'
import type { EmotionId, SocialId } from '../domain/animationCatalog'
import { animationLayers, composeClip, expressionClip } from '../domain/animationLayers'
import { brakeNavigation, canOccupy, distanceBetween, facingToward, planRoute, stepNavigation } from '../domain/navigation'
import { canTransition, clips, postTransition, stablePostures, stableStates } from '../domain/petState'
import type { PetState, StablePosture } from '../domain/petState'
import type { Facing, ObjectAction, ObjectId, Point, RoomObject } from '../domain/room'
import { restingBedAt } from '../domain/room'
import { practiceScene } from '../domain/sceneCatalog'
import type { PlayableScene } from '../domain/sceneCatalog'

type Gait = 'walk' | 'run'
type PhysicalIntent = { type: 'move'; target: Point; gait?: Gait } | { type: 'object'; id: ObjectId }
  | { type: 'social'; action: SocialId } | { type: 'sit' | 'stand' | 'blink' | 'look' | 'stretch' | 'jump' }
export type PetIntent = PhysicalIntent | { type: 'emotion'; id?: EmotionId }
export type PetPose = Readonly<{ position: Point; posture: StablePosture; facing: Facing }>

type Origin = 'user' | 'autonomous'
type Command = { intent: PhysicalIntent; origin: Origin }
type Trip = { target: Point; waypoints: Point[]; object?: RoomObject; origin: Origin }

const interactionState: Record<ObjectAction, PetState> = { rest: 'Settling', eat: 'Eating', drink: 'Drinking', play: 'Playing', look: 'Looking', jump: 'Jumping' }
const travelStates = new Set<PetState>(['Walking', 'Running'])
const jumpEvents = actionCatalog.Jump.events

export class PetController {
  private position: Point
  private facing: Facing
  private state: PetState
  private posture: StablePosture
  private elapsed = 0
  private speed = 0
  private distance = 0
  private gait: Gait = 'walk'
  private trip?: Trip
  private actionObject?: RoomObject
  private bed?: RoomObject
  private turn?: Facing
  private brakeTarget?: Point
  private pending?: Command
  private autonomousRest = false
  private social?: SocialId
  private emotion?: EmotionId
  private expressionElapsed = 0
  private notice?: string

  constructor(private readonly animation: AnimationTiming, pose?: PetPose, private readonly scene: PlayableScene = practiceScene) {
    pose ??= { position: scene.spawn, posture: 'standing', facing: scene.orientations[0] }
    this.position = pose.position
    this.facing = pose.facing
    this.state = stableStates[pose.posture]
    this.posture = pose.posture
    if (pose.posture === 'resting') this.bed = restingBedAt(scene.objects, pose.position)
  }

  snapshot() {
    const expression = expressionClip(this.state, this.emotion, this.expressionElapsed)
    const elapsed = expression ? this.expressionElapsed : this.elapsed
    const progress = this.elapsed / (this.animation.duration('jump') || 1)
    const airborne = this.state === 'Jumping' && progress >= jumpEvents[0].at && progress < jumpEvents[1].at
    const layers = animationLayers(this.state, airborne ? 'airborne' : this.posture, this.social, this.emotion)
    const animation: AnimationCue = { clip: composeClip(layers, this.stateClip(), expression), elapsed, distance: this.distance, speed: this.speed, facing: this.facing, gait: this.gait }
    const interaction = this.trip?.object ?? this.actionObject
    const care = interaction?.care && {
      ...interaction.care,
      phase: this.state === 'Aligning' || this.state === 'Looking' ? 'Ready' as const : 'Approach' as const,
    }
    return {
      position: this.position, state: this.state, animation, layers, expressionActive: Boolean(expression), destination: this.trip?.target,
      waypoints: this.trip?.waypoints ?? [], autonomousRest: this.state === 'Resting' && this.autonomousRest,
      selectedObject: interaction?.id ?? this.bed?.id, care, notice: this.notice,
    }
  }

  poseForStorage(): PetPose {
    const bedPosition = this.bed && (this.posture === 'resting' ? this.bed.restingPoint : this.bed.interaction)
    return { position: bedPosition ?? this.position, posture: this.posture, facing: this.facing }
  }

  request(intent: PetIntent) {
    if (intent.type === 'emotion') {
      this.emotion = intent.id
      this.expressionElapsed = 0
      if (intent.id === 'Happy' && this.state === 'Idle') this.apply({ intent: { type: 'sit' }, origin: 'user' })
      if (intent.id === 'Curious' && this.state === 'Sitting') this.apply({ intent: { type: 'stand' }, origin: 'user' })
      return
    }
    this.apply({ intent, origin: 'user' })
  }

  requestAutonomous(intent: PetIntent) {
    if (this.pending || expressionClip(this.state, this.emotion, this.expressionElapsed) || !stablePostures[this.state] || intent.type === 'emotion') return
    if (this.state === 'Resting' && (!this.autonomousRest || (intent.type !== 'stretch' && intent.type !== 'stand'))) return
    this.apply({ intent, origin: 'autonomous' })
  }

  cancelAutonomous() {
    if (this.pending?.origin === 'autonomous') this.pending = undefined
    if (this.state === 'Looking' && !this.actionObject) this.enter('Idle')
    if (this.state === 'Blinking') this.enter('Sitting')
    if (this.trip?.origin !== 'autonomous') return
    if (travelStates.has(this.state) || this.state === 'Turning') this.startBraking()
    else this.trip = undefined
  }

  private apply(command: Command) {
    const { intent, origin } = command
    const object = intent.type === 'object' ? this.scene.objects.find(item => item.id === intent.id) : undefined
    if (intent.type === 'object' && !object) return
    if (object?.reservedFor === 'cat') {
      this.notice = 'El rascador está reservado para gatos.'
      return
    }
    if (intent.type === 'move' && !canOccupy(intent.target, this.scene.navigation)) {
      this.notice = 'Elige un punto libre del suelo.'
      return
    }
    this.notice = undefined

    if (clipDefinition(clips[this.state])?.interruption === 'queue') {
      const sameObject = object && object.id === (this.actionObject?.id ?? this.trip?.object?.id)
      if (sameObject && this.trip) this.trip.origin = origin
      if (sameObject && this.state === 'Settling' && origin === 'user') this.autonomousRest = false
      this.pending = sameObject ? undefined : command
      return
    }

    if (this.state === 'Looking') this.enter('Idle')
    if (this.state === 'Blinking') this.enter('Sitting')
    if (this.state === 'Socializing') this.enter('Sitting')

    if (intent.type === 'blink' || intent.type === 'look' || intent.type === 'stretch') {
      const next = { blink: 'Blinking', look: 'Looking', stretch: 'Stretching' } as const
      if (canTransition(this.state, next[intent.type])) this.enter(next[intent.type])
      return
    }

    if (this.state === 'Resting' || this.state === 'Lying') {
      if (this.state === 'Resting' && object?.action === 'rest' && (object.id === this.bed?.id || distanceBetween(this.position, object.interaction) < 1)) {
        if (origin === 'user') this.autonomousRest = false
        return
      }
      this.pending = command
      this.enter('WakingUp')
      return
    }

    if (intent.type === 'social') {
      if (canStartAction(intent.action, this.state)) {
        this.social = intent.action
        this.enter('Socializing')
      } else if (this.state === 'Idle') {
        this.pending = command
        this.enter('SittingDown')
      } else this.startBraking(command)
      return
    }

    if (intent.type === 'stand') {
      if (this.state === 'Sitting') this.enter('StandingUp')
      return
    }

    if (this.state === 'Sitting') {
      if (intent.type === 'sit') return
      this.pending = command
      this.enter('StandingUp')
      return
    }

    if (intent.type === 'sit') {
      if (this.state === 'Idle') this.enter('SittingDown')
      else this.startBraking(command)
      return
    }

    if (intent.type === 'jump') {
      if (canStartAction('Jump', this.state)) this.enter('Jumping')
      else this.startBraking(command)
      return
    }

    if (this.trip && object && this.trip.object?.id === object.id) {
      this.trip.origin = origin
      return
    }
    const nextGait = intent.type === 'move' ? intent.gait ?? 'walk' : 'walk'
    if (travelStates.has(this.state) && (this.speed > 0 || nextGait !== this.gait)) {
      this.startBraking(command)
      return
    }
    if (intent.type === 'move') {
      this.startTrip(intent.target, origin, undefined, nextGait)
    } else if (object) {
      this.startTrip(object.interaction, origin, object)
    }
  }

  advance(deltaMs: number) {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return
    let budget = Math.min(deltaMs, 80)
    while (budget > 0) {
      const ms = Math.min(16, budget)
      this.step(ms)
      budget -= ms
    }
  }

  private enter(next: PetState) {
    if (next === this.state) return
    if (!canTransition(this.state, next)) throw new Error(`Invalid pet transition ${this.state} → ${next}`)
    this.state = next
    this.actionObject = undefined
    if (next !== 'Socializing') this.social = undefined
    this.posture = stablePostures[next] ?? this.posture
    this.elapsed = 0
  }

  private startTrip(target: Point, origin: Origin, object?: RoomObject, gait: Gait = 'walk') {
    const waypoints = planRoute(this.position, target, this.scene.navigation)
    if (!waypoints) {
      this.notice = 'No hay un camino libre hasta ese punto.'
      return
    }
    this.trip = { target, waypoints, object, origin }
    this.gait = gait
    this.orientForWalking(waypoints[0])
  }

  private orientForWalking(target: Point) {
    const requested = facingToward(this.position, target, this.facing)
    const facing = this.scene.orientations.includes(requested) ? requested : this.facing
    if (facing === this.facing) {
      this.turn = undefined
      this.enter(this.gait === 'run' ? 'Running' : 'Walking')
      return
    }
    this.turn = facing
    this.enter('Turning')
  }

  private startBraking(command?: Command) {
    this.brakeTarget = this.speed > 0 ? this.trip?.waypoints[0] : undefined
    this.trip = undefined
    this.turn = undefined
    this.pending = command
    this.enter('Stopping')
  }

  private step(ms: number) {
    if (expressionClip(this.state, this.emotion, this.expressionElapsed)) this.expressionElapsed += ms
    this.elapsed += ms
    if (stablePostures[this.state]) return

    if (travelStates.has(this.state)) {
      this.walk(ms)
      return
    }

    if (this.state === 'Stopping' && this.brakeTarget) {
      const result = brakeNavigation(this.position, this.speed, this.brakeTarget, ms / 1000, this.scene.navigation)
      this.applyMovement(result)
      if (!this.speed) {
        this.brakeTarget = undefined
        this.elapsed = 0
      }
      return
    }
    const clip = this.stateClip()
    const duration = this.animation.duration(clip)
    this.advanceBedTransfer(duration)
    if (this.elapsed < duration) return

    if (this.state === 'Turning') {
      this.facing = this.turn ?? this.facing
      this.turn = undefined
      this.enter(this.gait === 'run' ? 'Running' : 'Walking')
      return
    }
    if (this.state === 'Stopping' || this.state === 'Aligning') {
      this.completeArrival()
      return
    }
    const next = postTransition[this.state]
    if (next) {
      if (this.state === 'WakingUp' || this.state === 'Stretching') this.bed = undefined
      this.enter(next)
      this.resumePending()
    }
  }

  private completeArrival() {
    const object = this.trip?.object
    if (this.state === 'Stopping' && object && !this.pending) {
      const facing = object.facing
      if (object.care || object.action === 'rest' || object.action === 'play' || facing !== this.facing) {
        this.turn = facing !== this.facing ? facing : undefined
        this.enter('Aligning')
        return
      }
    }
    this.facing = this.turn ?? this.facing
    this.turn = undefined
    const interaction = this.pending ? undefined : object
    if (interaction?.action === 'rest') {
      this.autonomousRest = this.trip?.origin === 'autonomous'
      this.bed = interaction.restingPoint ? interaction : undefined
    }
    this.trip = undefined
    this.enter(interaction ? interactionState[interaction.action] : 'Idle')
    this.actionObject = interaction
    this.resumePending()
  }

  private walk(ms: number) {
    const trip = this.trip!
    const result = stepNavigation(this.position, this.speed, trip.waypoints[0], ms / 1000, this.scene.navigation, this.gait === 'run' ? 355 : 240)
    this.applyMovement(result)

    if (result.blocked) {
      this.trip = undefined
      this.notice = 'El camino quedó bloqueado.'
      this.enter('Stopping')
      return
    }
    if (!result.arrived) return

    trip.waypoints = trip.waypoints.slice(1)
    if (trip.waypoints.length) {
      this.orientForWalking(trip.waypoints[0])
    } else {
      this.enter('Stopping')
    }
  }

  private resumePending() {
    const command = this.pending
    this.pending = undefined
    if (command) this.apply(command)
  }

  private applyMovement({ position, speed, distance }: ReturnType<typeof stepNavigation>) {
    this.position = position
    this.speed = speed
    this.distance += distance
  }

  private advanceBedTransfer(duration: number) {
    const bed = this.bed
    if (!bed?.restingPoint) return
    const entering = this.state === 'Settling'
    if (!entering && this.state !== 'WakingUp' && this.state !== 'Stretching') return

    const [from, to] = entering ? [bed.interaction, bed.restingPoint] : [bed.restingPoint, bed.interaction]
    // Walkable routes end on the floor. The protected pose transition is the only passage across the bed rim.
    const start = entering ? .33 : .40
    const t = Math.max(0, Math.min(1, (this.elapsed / (duration || 1) - start) / (1 - start)))
    const progress = t * t * (3 - 2 * t)
    this.position = t === 1 ? to : { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress }
  }

  private stateClip() {
    if (this.state === 'Aligning' && this.turn) return 'turn'
    if (this.state === 'Socializing' && this.social) return actionCatalog[this.social].clip ?? clips[this.state]
    return clips[this.state]
  }
}
