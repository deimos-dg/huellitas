import manifest from '../../assets/pets/manifest.json'
import portraitArt from '../../assets/pets/portraits-art.webp'
import portraitCollar from '../../assets/pets/portraits-collar.webp'

export type Species = 'dog' | 'cat'
export type PetId = keyof typeof manifest.portraits.indices
export type Motion = keyof typeof manifest.animated.golden.tracks

export type PetVariant = {
  id: PetId
  name: string
  description?: string
}

export const variants: Record<Species, readonly PetVariant[]> = {
  dog: [
    { id: 'golden', name: 'Golden retriever' },
    { id: 'beagle', name: 'Beagle' },
    { id: 'perro-mestizo', name: 'Mestizo' },
    { id: 'labrador', name: 'Labrador' },
    { id: 'husky', name: 'Husky' },
    { id: 'corgi', name: 'Corgi' },
    { id: 'pug', name: 'Pug' },
    { id: 'poodle', name: 'Poodle' },
    { id: 'dalmata', name: 'Dálmata' },
  ],
  cat: [
    { id: 'gato-atigrado', name: 'Atigrado' },
    { id: 'gato-naranja', name: 'Naranja' },
    { id: 'gato-negro', name: 'Negro' },
    { id: 'gato-blanco', name: 'Blanco' },
    { id: 'gato-gris', name: 'Gris' },
    { id: 'gato-tricolor', name: 'Tricolor' },
    { id: 'gato-siames', name: 'Siamés' },
    { id: 'sphynx', name: 'Sphynx', description: 'Piel casi sin pelo, orejas grandes y cuerpo esbelto.' },
    { id: 'gato-mestizo', name: 'Mestizo' },
  ],
}

export const coats = {
  natural: { name: 'Natural', filter: 'none' },
  warm: { name: 'Cálido', filter: 'saturate(1.1) sepia(.2)' },
  soft: { name: 'Suave', filter: 'saturate(.68) brightness(1.1)' },
}

export const collars = {
  original: { name: 'Original', color: null },
  forest: { name: 'Verde bosque', color: '#315c35' },
  terracotta: { name: 'Terracota', color: '#b84f35' },
  lake: { name: 'Azul lago', color: '#3d7290' },
  wood: { name: 'Nogal', color: '#795943' },
  honey: { name: 'Miel', color: '#c88e3d' },
}

export type Coat = keyof typeof coats
export type Collar = keyof typeof collars

export const motionLabels: Record<Motion, string> = {
  idle: 'En reposo',
  walk: 'Caminar',
  run: 'Correr',
  sit: 'Sentarse',
  sleep: 'Dormir',
  wake: 'Despertar',
  eat: 'Comer',
  drink: 'Beber',
  bath: 'Bañarse',
  shake: 'Sacudirse',
  play: 'Jugar',
  jump: 'Saltar',
  pet: 'Recibir caricias',
  happy: 'Celebrar',
}

export type Atlas = { art: string; collar: string; columns: number; rows: number }
type AtlasSheet = { id: string; columns: number; rows: number }
export type Track = { start: number; count: number; fps?: number; durations?: number[]; sheet?: AtlasSheet }
export type MotionAtlas = Atlas & { type: 'detailed' | 'compact'; previewScale: number; tracks: Partial<Record<Motion, Track>> }

export const spriteDimensions = { width: manifest.frameWidth, height: manifest.frameHeight }
export const portraitAtlas = { ...manifest.portraits, art: portraitArt, collar: portraitCollar }

const spriteUrls = import.meta.glob<string>(['../../assets/pets/*.webp', '!../../assets/pets/portraits-*.webp'], {
  eager: true,
  query: '?url&no-inline',
  import: 'default',
})

function sheetUrls(id: string) {
  return {
    art: spriteUrls[`../../assets/pets/${id}-art.webp`],
    collar: spriteUrls[`../../assets/pets/${id}-collar.webp`],
  }
}

export const motionAtlases = Object.fromEntries(Object.entries(manifest.animated).map(([id, atlas]) => [
  id,
  { ...atlas, ...sheetUrls(id) },
])) as Partial<Record<PetId, MotionAtlas>>

export function getMotionSheet(atlas: MotionAtlas, motion: Motion): Atlas {
  const sheet = atlas.tracks[motion]?.sheet
  return sheet ? { ...sheet, ...sheetUrls(sheet.id) } : atlas
}
