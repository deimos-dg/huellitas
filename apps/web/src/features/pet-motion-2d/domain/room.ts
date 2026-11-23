export type Point = Readonly<{ x: number; y: number }>
export type Rectangle = Point & Readonly<{ width: number; height: number }>
export type Facing = 'left' | 'right'
export type ObjectId = 'bed' | 'green-bed' | 'pink-bed' | 'rug' | 'scratcher' | 'food' | 'water' | 'ball' | 'rope' | 'bench' | 'ring' | 'hurdle'
  | 'bathtub' | 'exam-table'
export type ObjectAction = 'rest' | 'eat' | 'drink' | 'play' | 'look' | 'jump'

type CareInteraction = Readonly<{
  sequence: readonly ['Approach', 'Ready', 'Bathing' | 'Examination', 'Finish', 'Exit']
  art: 'pending'
  pendingNote: string
}>

export type RoomObject = Readonly<{
  id: ObjectId
  label: string
  art?: Rectangle & { depth?: number }
  paintedProp?: boolean
  reservedFor?: 'cat'
  hitbox: Rectangle
  interaction: Point
  restingPoint?: Point
  facing: Facing
}> & ({ action: 'look'; care?: CareInteraction } | { action: Exclude<ObjectAction, 'look'>; care?: never })

export function restingBedAt(objects: readonly RoomObject[], position: Point) {
  return objects.find(object => object.action === 'rest' && object.restingPoint?.x === position.x && object.restingPoint.y === position.y)
}

export const roomSize = { width: 1280, height: 720 }
export const roomId = 'golden-room'
export const petId = 'golden'
export const spawn: Point = { x: 574, y: 590 }

// The bounds already include room for the pet's footprint at the floor edges.
export const walkableFloor: Rectangle = { x: 64, y: 394, width: 1152, height: 278 }

export const roomObjects = {
  bed: {
    id: 'bed', label: 'Cama', facing: 'left', action: 'rest',
    art: { x: 104, y: 420, width: 211, height: 142 },
    hitbox: { x: 96, y: 410, width: 231, height: 158 },
    collision: { x: 117, y: 464, width: 187, height: 92 },
    interaction: { x: 385, y: 536 },
  },
  food: {
    id: 'food', label: 'Comedero', facing: 'right', action: 'eat',
    art: { x: 925, y: 452, width: 95, height: 57 },
    hitbox: { x: 903, y: 433, width: 135, height: 80 },
    collision: { x: 945, y: 481, width: 54, height: 23 },
    interaction: { x: 926, y: 507 },
  },
  water: {
    id: 'water', label: 'Bebedero', facing: 'right', action: 'drink',
    art: { x: 1082, y: 452, width: 95, height: 57 },
    hitbox: { x: 1060, y: 433, width: 137, height: 80 },
    collision: { x: 1102, y: 481, width: 54, height: 23 },
    interaction: { x: 1083, y: 507 },
  },
  ball: {
    id: 'ball', label: 'Pelota', facing: 'right', action: 'play',
    art: { x: 756, y: 434, width: 36, height: 36 },
    hitbox: { x: 732, y: 412, width: 80, height: 70 },
    collision: { x: 763, y: 452, width: 22, height: 14 },
    interaction: { x: 720, y: 478 },
  },
} as const satisfies Record<'bed' | 'food' | 'water' | 'ball', RoomObject & { collision: Rectangle }>

export const objects = Object.values(roomObjects)
