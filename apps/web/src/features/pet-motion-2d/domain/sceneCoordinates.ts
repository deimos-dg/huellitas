import { roomSize } from './room'
import type { Point, Rectangle } from './room'

export type Size = { width: number; height: number }

export function imageToLogical(point: Point, image: Size): Point {
  return { x: point.x / image.width * roomSize.width, y: point.y / image.height * roomSize.height }
}

export function screenToLogical(point: Point, bounds: Rectangle, image: Size): Point | undefined {
  if (bounds.width <= 0 || bounds.height <= 0) return
  const scale = Math.min(bounds.width / image.width, bounds.height / image.height)
  const x = (point.x - bounds.x - (bounds.width - image.width * scale) / 2) / scale
  const y = (point.y - bounds.y - (bounds.height - image.height * scale) / 2) / scale
  if (x < -1e-6 || x > image.width + 1e-6 || y < -1e-6 || y > image.height + 1e-6) return
  return imageToLogical({ x, y }, image)
}
