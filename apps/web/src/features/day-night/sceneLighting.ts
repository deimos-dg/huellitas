import type { DayPeriod } from './DayNightController'

type Position = { x: number; y: number }
type Light = Position & { radiusX: number; radiusY: number }

export type SceneLightingProfile = {
  setting: 'outdoor' | 'indoor'
  status: 'prototype' | 'awaiting-art'
  layers?: {
    ambientWash?: boolean
    sky?: Position
    sun?: Position
    moon?: Position
    lights?: readonly Light[]
    artwork?: readonly { src: string; periods: readonly DayPeriod[]; mask?: string }[]
  }
}

type SceneId = 'garden' | 'park' | 'living-room' | 'kitchen' | 'bathroom' | 'infirmary' | 'dressingRoom'

// Coordinates and radii are percentages of the original illustration.
export const sceneLighting = {
  garden: {
    setting: 'outdoor',
    status: 'prototype',
    layers: {
      sky: { x: 62, y: 0 },
      sun: { x: 68, y: 5.1 },
      moon: { x: 68, y: 5.1 },
      lights: [
        { x: 15.4, y: 30.7, radiusX: 6.8, radiusY: 15 },
        { x: 61.6, y: 29.2, radiusX: 2.8, radiusY: 5.5 },
        { x: 65.6, y: 31.2, radiusX: 2.8, radiusY: 5.5 },
        { x: 69.9, y: 31.8, radiusX: 2.8, radiusY: 5.5 },
        { x: 75, y: 30.6, radiusX: 2.8, radiusY: 5.5 },
        { x: 79.5, y: 28.7, radiusX: 2.8, radiusY: 5.5 },
        { x: 83.8, y: 25.7, radiusX: 2.8, radiusY: 5.5 },
        { x: 87, y: 23.3, radiusX: 2.8, radiusY: 5.5 },
        { x: 95.4, y: 32.6, radiusX: 5.6, radiusY: 16 },
      ],
    },
  },
  park: { setting: 'outdoor', status: 'awaiting-art' },
  'living-room': { setting: 'indoor', status: 'awaiting-art', layers: { ambientWash: false,
    lights: [{ x: 56.6, y: 15, radiusX: 12, radiusY: 16 }, { x: 7.5, y: 66.3, radiusX: 7, radiusY: 12 }] } },
  kitchen: { setting: 'indoor', status: 'awaiting-art', layers: { ambientWash: false,
    lights: [{ x: 57, y: 15, radiusX: 10, radiusY: 14 }] } },
  bathroom: { setting: 'indoor', status: 'awaiting-art', layers: { ambientWash: false,
    lights: [{ x: 87.3, y: 19, radiusX: 9, radiusY: 14 }] } },
  infirmary: { setting: 'indoor', status: 'awaiting-art', layers: { ambientWash: false,
    lights: [{ x: 52.3, y: 10.4, radiusX: 12, radiusY: 16 }] } },
  dressingRoom: { setting: 'indoor', status: 'awaiting-art' },
} as const satisfies Record<SceneId, SceneLightingProfile>
