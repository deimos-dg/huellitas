import type { PetClip } from './animation'
import type { PetState, StablePosture } from './petState'
import type { Facing } from './room'
import { idleDurationMs } from './idleMotion'

export const categories = {
  movement: 'Movimiento', rest: 'Descanso', needs: 'Necesidades', interaction: 'Interacción', emotion: 'Emociones',
} as const
export type AnimationCategory = keyof typeof categories
export type Availability = 'Complete' | 'Partial' | 'Placeholder' | 'Missing'
export type Playback = 'hold' | 'distance' | 'once' | 'loop'
export type Posture = StablePosture | 'airborne'
type Resource = Readonly<{ atlas: 'golden' | 'golden-room' | 'golden-run' | 'golden-jump'; track: string; frames: number }>
type SyncEvent = Readonly<{ at: number; name: 'takeoff' | 'land' | 'intake' | 'contact' | 'settled' | 'stop' | 'facing' }>

type Definition = Readonly<{
  name: string
  category: AnimationCategory
  durationMs: number | null
  referenceFps: number | null
  playback: Playback
  posture: readonly [start: Posture, end: Posture]
  orientations: readonly Facing[]
  events: readonly SyncEvent[]
  interruption: 'replace' | 'brake' | 'queue'
  transitions: Readonly<{ from: readonly PetState[]; start: PetState | null; end: readonly PetState[] }>
  resources: readonly Resource[]
  availability: Availability
  clip?: PetClip
  notes?: string
}>

const asset = (atlas: Resource['atlas'], track: string, frames: number): Resource => ({ atlas, track, frames })
const event = (name: SyncEvent['name'], at: number): SyncEvent => ({ name, at })
const timing = (durationMs: number, referenceFps: number | null, playback: Playback = 'once') => ({ durationMs, referenceFps, playback })
const standing = ['standing', 'standing'] as const
const seated = ['sitting', 'sitting'] as const
const postureToSit = ['standing', 'sitting'] as const
const waking = ['resting', 'sitting'] as const

function define(value: Omit<Definition, 'orientations' | 'events'> & { events?: readonly SyncEvent[] }): Definition {
  return { orientations: value.resources.length ? ['right', 'left'] : [], events: [], ...value }
}

function missing(name: string, category: AnimationCategory, posture: Definition['posture'], from: readonly PetState[], notes: string) {
  return define({ name, category, posture, durationMs: null, referenceFps: null, playback: 'once', interruption: 'replace',
    transitions: { from, start: null, end: [] }, resources: [], availability: 'Missing', notes })
}

const locomotion = { from: ['Idle', 'Turning'] as const, end: ['Stopping', 'Turning'] as const }
const social = { from: ['Sitting'] as const, start: 'Socializing', end: ['Sitting'] } as const
const atObject = ['Stopping', 'Aligning'] as const
const staySeated = { from: ['Sitting'], start: 'Sitting', end: ['Sitting'] } as const

export const actionCatalog = {
  Idle: define({ name: 'Reposo de pie', category: 'movement', clip: 'idle', ...timing(idleDurationMs, null, 'loop'), posture: standing,
    transitions: { from: ['Idle', 'Stopping', 'StandingUp', 'Jumping'], start: 'Idle', end: ['Idle'] }, interruption: 'replace',
    resources: [asset('golden-room', 'posture', 2)], availability: 'Partial',
    notes: 'Pose de pie y dos párpados dibujados. La respiración se limita al tórax. Faltan respiración dibujada y cola de pie.' }),
  Walk: define({ name: 'Caminar', category: 'movement', clip: 'walk', ...timing(857, 7, 'distance'), posture: standing,
    transitions: { ...locomotion, start: 'Walking' }, interruption: 'brake', resources: [asset('golden', 'walk', 6)],
    availability: 'Partial', notes: 'Perfil derecho reflejado hacia la izquierda. Faltan anclas individuales de patas.' }),
  Trot: missing('Trotar', 'movement', standing, ['Idle'], 'Hace falta un ciclo específico de trote con apoyos diagonales.'),
  Run: define({ name: 'Correr', category: 'movement', clip: 'run', ...timing(1600, 10, 'distance'), posture: standing,
    transitions: { ...locomotion, start: 'Running' }, interruption: 'brake', resources: [asset('golden-run', 'run', 16)], availability: 'Complete' }),
  Jump: define({ name: 'Saltar', category: 'movement', clip: 'jump', ...timing(1200, 10), posture: standing,
    transitions: { from: ['Idle', 'Stopping', 'Aligning'], start: 'Jumping', end: ['Idle'] }, interruption: 'queue',
    events: [event('takeoff', .25), event('land', .83)], resources: [asset('golden-jump', 'jump', 12)], availability: 'Complete' }),
  Turn: define({ name: 'Girar', category: 'movement', clip: 'turn', ...timing(670, 13), posture: standing,
    transitions: { from: ['Idle', 'Walking', 'Running'], start: 'Turning', end: ['Walking', 'Running'] },
    interruption: 'replace', events: [event('facing', 1)], resources: [asset('golden-room', 'pivot', 9)], availability: 'Partial',
    notes: 'Medio arco lateral reflejado para el sentido contrario. También se usa al alinear con un objeto.' }),
  Stop: define({ name: 'Detenerse', category: 'movement', clip: 'stop', ...timing(140, null), posture: standing,
    transitions: { from: ['Walking', 'Running', 'Turning'], start: 'Stopping', end: ['Idle', 'Aligning', 'Eating', 'Drinking', 'Looking', 'Jumping'] },
    interruption: 'queue', events: [event('stop', 0)], resources: [asset('golden', 'walk', 6), asset('golden-run', 'run', 16), asset('golden-room', 'posture', 1)], availability: 'Placeholder',
    notes: 'Frenado físico por distancia y el mismo apoyo final que Idle. Faltan dibujos de estabilización para cada marcha.' }),
  Sit: define({ name: 'Sentarse', category: 'rest', clip: 'sit', ...timing(740, 12), posture: postureToSit,
    transitions: { from: ['Idle'], start: 'SittingDown', end: ['Sitting'] }, interruption: 'queue',
    events: [event('settled', 1)], resources: [asset('golden-room', 'posture', 9)], availability: 'Complete' }),
  LieDown: define({ name: 'Acostarse', category: 'rest', clip: 'settle', ...timing(1120, 14), posture: ['standing', 'resting'],
    transitions: { from: ['Aligning'], start: 'Settling', end: ['Resting'] }, interruption: 'queue',
    events: [event('settled', 1)], resources: [asset('golden-room', 'posture', 5), asset('golden-room', 'bed', 11)], availability: 'Partial',
    notes: 'Dos secuencias de la misma pose de apoyo, encadenadas junto a la cama.' }),
  Sleep: define({ name: 'Dormir', category: 'rest', clip: 'rest', ...timing(0, null, 'hold'), posture: ['resting', 'resting'],
    transitions: { from: ['Settling', 'Resting'], start: 'Resting', end: ['WakingUp', 'Stretching'] }, interruption: 'replace',
    resources: [asset('golden-room', 'bed', 1)], availability: 'Complete' }),
  WakeUp: define({ name: 'Despertar', category: 'rest', clip: 'wake', ...timing(1050, 11), posture: waking,
    transitions: { from: ['Resting', 'Lying'], start: 'WakingUp', end: ['Sitting'] }, interruption: 'queue',
    resources: [asset('golden-room', 'stretch', 12)], availability: 'Partial', notes: 'El arco tumbado → sentado se usa también al incorporarse tras el juego.' }),
  Stretch: define({ name: 'Estirarse', category: 'rest', clip: 'stretch', ...timing(1240, 10), posture: waking,
    transitions: { from: ['Resting'], start: 'Stretching', end: ['Sitting'] }, interruption: 'queue',
    resources: [asset('golden-room', 'stretch', 12)], availability: 'Partial', notes: 'Arco desde tumbado. Falta un estiramiento desde pie.' }),
  Eat: define({ name: 'Comer', category: 'needs', clip: 'eat', ...timing(1500, 5), posture: postureToSit,
    transitions: { from: atObject, start: 'Eating', end: ['Sitting'] }, interruption: 'queue', events: [event('intake', .25)],
    resources: [asset('golden', 'eat', 5)], availability: 'Partial', notes: 'El recipiente forma parte de los dibujos centrales.' }),
  Drink: define({ name: 'Beber', category: 'needs', clip: 'drink', ...timing(1500, 5), posture: postureToSit,
    transitions: { from: atObject, start: 'Drinking', end: ['Sitting'] }, interruption: 'queue', events: [event('intake', .25)],
    resources: [asset('golden', 'drink', 5)], availability: 'Partial', notes: 'El recipiente forma parte de los dibujos centrales.' }),
  Lick: missing('Lamerse', 'needs', seated, ['Sitting'], 'La pose con lengua visible está aislada. Faltan inicio, contacto y recuperación.'),
  Greet: define({ name: 'Saludar', category: 'interaction', clip: 'greet', ...timing(960, 6), posture: seated,
    transitions: social, interruption: 'replace', events: [event('contact', .55)], resources: [asset('golden', 'happy', 6)],
    availability: 'Partial', notes: 'Gesto de saludo reutilizado de la celebración sentada.' }),
  Play: define({ name: 'Jugar con la pelota', category: 'interaction', clip: 'play', ...timing(1100, 6), posture: ['standing', 'lying'],
    transitions: { from: ['Aligning'], start: 'Playing', end: ['Lying'] }, interruption: 'queue', events: [event('contact', .4)],
    resources: [asset('golden', 'play', 5)], availability: 'Partial', notes: 'Juego en el sitio, con pelota dibujada. Termina tumbado.' }),
  ReceivePetting: define({ name: 'Recibir caricias', category: 'interaction', clip: 'pet', ...timing(850, 5), posture: seated,
    transitions: social, interruption: 'replace', events: [event('contact', .25)], resources: [asset('golden', 'pet', 5)], availability: 'Complete' }),
  SeekAttention: define({ name: 'Pedir atención', category: 'interaction', clip: 'attention', ...timing(1000, 6), posture: seated,
    transitions: social, interruption: 'replace', resources: [asset('golden', 'happy', 4)], availability: 'Partial',
    notes: 'Reutiliza las poses dibujadas con patas delanteras elevadas.' }),
  Happy: define({ name: 'Feliz', category: 'emotion', clip: 'happy', ...timing(820, 6), posture: seated,
    transitions: staySeated, interruption: 'replace', resources: [asset('golden', 'happy', 4)], availability: 'Complete' }),
  Sad: missing('Triste', 'emotion', seated, ['Sitting'], 'Faltan poses expresivas de ojos, orejas y cola.'),
  Curious: define({ name: 'Curioso', category: 'emotion', clip: 'look', ...timing(720, 11), posture: standing,
    transitions: { from: ['Idle', 'Stopping', 'Aligning'], start: 'Looking', end: ['Idle'] }, interruption: 'replace',
    resources: [asset('golden-room', 'pivot', 4)], availability: 'Partial', notes: 'Mirada hacia el frente a partir del arco del giro.' }),
  Surprised: missing('Sorprendido', 'emotion', seated, ['Sitting'], 'Falta una reacción expresiva autónoma compatible con esta postura.'),
  Angry: missing('Enojado', 'emotion', seated, ['Sitting'], 'Faltan poses dedicadas de rostro y cuerpo.'),
} satisfies Record<string, Definition>

export type ActionId = keyof typeof actionCatalog
export type EmotionId = 'Happy' | 'Sad' | 'Curious' | 'Surprised' | 'Angry'
export type SocialId = 'Greet' | 'ReceivePetting' | 'SeekAttention'

export const actions = (Object.keys(actionCatalog) as ActionId[]).map(id => ({ ...actionCatalog[id], id }))
export const technicalClips = {
  stand: define({ name: 'Levantarse', category: 'rest', clip: 'stand', ...timing(280, null), posture: ['sitting', 'standing'],
    transitions: { from: ['Sitting'], start: 'StandingUp', end: ['Idle'] }, interruption: 'queue',
    resources: [asset('golden-room', 'posture', 2)], availability: 'Placeholder',
    notes: 'Sostiene la pose sentada y muestra la pose estable de pie. Faltan transferencia de peso y extensión hacia delante.' }),
  seated: define({ ...actionCatalog.Sit, name: 'Mantener sentado', clip: 'seated', ...timing(0, null, 'hold'), posture: seated,
    transitions: staySeated, interruption: 'replace', events: [], resources: [asset('golden-room', 'posture', 1)] }),
  align: define({ ...actionCatalog.Idle, name: 'Alineación estable', clip: 'align', ...timing(150, null),
    interruption: 'queue', resources: [asset('golden-room', 'posture', 1)], notes: 'Sostiene la pose estable durante la alineación.',
    transitions: { from: ['Stopping'], start: 'Aligning', end: ['Settling', 'Playing', 'Eating', 'Drinking', 'Looking', 'Jumping'] } }),
  blink: define({ ...actionCatalog.Sit, name: 'Parpadear', clip: 'blink', ...timing(320, 12), posture: seated, events: [],
    interruption: 'replace', resources: [asset('golden-room', 'posture', 4)], transitions: { from: ['Sitting'], start: 'Blinking', end: ['Sitting'] } }),
  lying: define({ ...actionCatalog.Sleep, name: 'Mantener tumbado', clip: 'lying', posture: ['lying', 'lying'],
    transitions: { from: ['Playing'], start: 'Lying', end: ['WakingUp'] } }),
}

const byClip = new Map([...actions, ...Object.values(technicalClips)].flatMap(definition => definition.clip ? [[definition.clip, definition] as const] : []))

export function clipDefinition(clip: PetClip) { return byClip.get(clip) }

export function canStartAction(id: ActionId, state: PetState) {
  const definition = actionCatalog[id]
  return Boolean(definition.clip && definition.transitions.from.includes(state))
}
