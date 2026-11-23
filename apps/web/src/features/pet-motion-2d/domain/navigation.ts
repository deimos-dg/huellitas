import { objects, walkableFloor } from './room'
import type { Facing, Point, Rectangle } from './room'

export type Polygon = readonly Point[]
export type Shape = Rectangle | Polygon
export type NavigationMap = Readonly<{ floor: Shape; obstacles: readonly Shape[] }>

const footprint = 15
const waypointClearance = 1
const deceleration = 650

export const roomNavigation: NavigationMap = {
  floor: walkableFloor,
  obstacles: objects.map(({ collision }) => ({
    x: collision.x - footprint,
    y: collision.y - footprint,
    width: collision.width + footprint * 2,
    height: collision.height + footprint * 2,
  })),
}

export function vertices(shape: Shape): Polygon {
  if (!('x' in shape)) return shape
  const { x, y, width, height } = shape
  return [{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }]
}

export function shapeBounds(shape: Shape): Rectangle {
  if ('x' in shape) return shape
  const xs = shape.map(point => point.x)
  const ys = shape.map(point => point.y)
  const x = Math.min(...xs), y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

function winding(points: Polygon) {
  const area = points.reduce((sum, a, i) => {
    const b = points[(i + 1) % points.length]
    return sum + a.x * b.y - a.y * b.x
  }, 0)
  return area < 0 ? -1 : 1
}

function side(a: Point, b: Point, point: Point) {
  return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)
}

// Scene floors and each obstacle piece are authored as convex polygons.
function contains(shape: Shape, point: Point) {
  if ('x' in shape) {
    const { x, y, width, height } = shape
    return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height
  }
  const sign = winding(shape)
  return shape.every((a, i) => side(a, shape[(i + 1) % shape.length], point) * sign >= 0)
}

export function canOccupy(point: Point, map = roomNavigation) {
  return Number.isFinite(point.x) && Number.isFinite(point.y) && contains(map.floor, point)
    && !map.obstacles.some(obstacle => contains(obstacle, point))
}

export function distanceBetween(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function intersects(from: Point, to: Point, shape: Shape) {
  const points = vertices(shape)
  const sign = winding(points)
  let entry = 0
  let exit = 1
  for (const [i, start] of points.entries()) {
    const end = points[(i + 1) % points.length]
    const a = side(start, end, from) * sign
    const b = side(start, end, to) * sign
    if (a < 0 && b < 0) return false
    if (a < 0) entry = Math.max(entry, a / (a - b))
    if (b < 0) exit = Math.min(exit, a / (a - b))
    if (entry > exit) return false
  }
  return true
}

export function canWalkSegment(from: Point, to: Point, map = roomNavigation) {
  return contains(map.floor, from) && contains(map.floor, to)
    && !map.obstacles.some(obstacle => intersects(from, to, obstacle))
}

function corners(shape: Shape): Point[] {
  const points = vertices(shape)
  const sign = winding(points)
  function normal(a: Point, b: Point) {
    const length = distanceBetween(a, b)
    return { x: (b.y - a.y) * sign / length, y: (a.x - b.x) * sign / length }
  }
  return points.map((p, i) => {
    const before = normal(points[(i + points.length - 1) % points.length], p)
    const after = normal(p, points[(i + 1) % points.length])
    const offset = waypointClearance / (1 + before.x * after.x + before.y * after.y)
    return { x: p.x + (before.x + after.x) * offset, y: p.y + (before.y + after.y) * offset }
  })
}

export function planRoute(start: Point, target: Point, map = roomNavigation): Point[] | undefined {
  if (!canOccupy(start, map) || !canOccupy(target, map)) return
  if (canWalkSegment(start, target, map)) return [target]

  const nodes = [start, target, ...map.obstacles.flatMap(corners).filter(point => canOccupy(point, map))]
  const distances = Array<number>(nodes.length).fill(Infinity)
  const previous = Array<number>(nodes.length).fill(-1)
  const pending = new Set(nodes.keys())
  distances[0] = 0

  // A small visibility graph stays inexpensive and gives stable paths for the same inputs.
  while (pending.size) {
    let closest = -1
    let cost = Infinity
    for (const node of pending) {
      if (distances[node] < cost) {
        closest = node
        cost = distances[node]
      }
    }
    if (closest < 0) return
    if (closest === 1) {
      const route: Point[] = []
      for (let node = closest; node !== 0; node = previous[node]) route.unshift(nodes[node])
      return route
    }
    pending.delete(closest)
    for (const next of pending) {
      if (!canWalkSegment(nodes[closest], nodes[next], map)) continue
      const total = cost + distanceBetween(nodes[closest], nodes[next])
      if (total >= distances[next]) continue
      distances[next] = total
      previous[next] = closest
    }
  }
}

export function facingToward(origin: Point, target: Point, current: Facing): Facing {
  const dx = target.x - origin.x
  if (Math.abs(dx) < 8) return current
  return dx < 0 ? 'left' : 'right'
}

export function stepNavigation(position: Point, speed: number, target: Point, seconds: number, map = roomNavigation, maximumSpeed = 240) {
  const remaining = distanceBetween(position, target)
  const targetSpeed = Math.min(maximumSpeed, Math.sqrt(2 * deceleration * remaining))
  const nextSpeed = Math.max(speed - deceleration * seconds, Math.min(speed + 540 * seconds, targetSpeed))
  return moveToward(position, target, (speed + nextSpeed) / 2 * seconds, nextSpeed, map)
}

export function brakeNavigation(position: Point, speed: number, target: Point, seconds: number, map = roomNavigation) {
  const movingSeconds = Math.min(seconds, speed / deceleration)
  const nextSpeed = Math.max(0, speed - deceleration * seconds)
  return moveToward(position, target, (speed + nextSpeed) / 2 * movingSeconds, nextSpeed, map)
}

function moveToward(position: Point, target: Point, step: number, speed: number, map: NavigationMap) {
  const remaining = distanceBetween(position, target)
  const distance = Math.min(remaining, step)
  const arrived = distance >= remaining
  const next = arrived ? target : {
    x: position.x + (target.x - position.x) * distance / remaining,
    y: position.y + (target.y - position.y) * distance / remaining,
  }

  if (!canWalkSegment(position, next, map)) return { position, speed: 0, distance: 0, arrived: false, blocked: true }
  return { position: next, speed: arrived ? 0 : speed, distance, arrived, blocked: false }
}
