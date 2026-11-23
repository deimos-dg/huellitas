import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { compactAnimationSources } from './compact-sheets.mjs'
import { goldenGifs, portraits, sheets } from './sources.mjs'

const sourceDirectory = fileURLToPath(new URL('../../Imagenes/', import.meta.url))
const outputDirectory = fileURLToPath(new URL('../../apps/web/src/assets/pets/', import.meta.url))
const width = 224
const height = 176
const groundLine = 149
const portraitDensity = 3
const animationDensity = 2
const decodedSheets = new Map()

const colorMatches = {
  olive: (r, g, b) => g >= r - 3 && g >= b + 10 && g >= 39 && g < 156 && r < 151,
  blue: (r, g, b) => g >= r + 11 && b >= r + 7 && g >= 40 && g < 169,
  teal: (r, g, b) => g >= r + 14 && b >= r + 7 && g >= b + 1 && g >= 40 && g < 169,
  red: (r, g, b) => r >= 89 && r >= g + 33 && g < r * .71 && b < r * .78,
  wood: (r, g, b) => r >= 80 && r < 223 && r >= g + 24 && g >= b + 15 && g < r * .83,
}

function visitNeighbors(index, clipWidth, length, enqueue) {
  if (index >= clipWidth) enqueue(index - clipWidth)
  if (index + clipWidth < length) enqueue(index + clipWidth)
  if (index % clipWidth !== 0) enqueue(index - 1)
  if (index % clipWidth !== clipWidth - 1) enqueue(index + 1)
}

function removeBackdrop(pixels, clipWidth, clipHeight, type) {
  const length = clipWidth * clipHeight
  const candidate = new Uint8Array(length)
  const queue = new Int32Array(length)
  let read = 0
  let written = 0

  for (let index = 0; index < length; index++) {
    const offset = index * 4
    const r = pixels[offset]
    const g = pixels[offset + 1]
    const b = pixels[offset + 2]
    const nearGray = Math.min(r, g, b) >= 225 && Math.max(r, g, b) - Math.min(r, g, b) <= 14
    const nearCream = r >= 235 && g >= 222 && b >= 199 && r - g <= 23 && g - b <= 33
    candidate[index] = type === 'checker' ? Number(nearGray) : Number(nearCream)
  }

  function enqueue(index) {
    if (!candidate[index]) return
    candidate[index] = 0
    queue[written++] = index
  }

  for (let x = 0; x < clipWidth; x++) {
    enqueue(x)
    enqueue((clipHeight - 1) * clipWidth + x)
  }
  for (let y = 0; y < clipHeight; y++) {
    enqueue(y * clipWidth)
    enqueue(y * clipWidth + clipWidth - 1)
  }
  while (read < written) {
    const index = queue[read++]
    pixels[index * 4 + 3] = 0
    visitNeighbors(index, clipWidth, length, enqueue)
  }

  // Remove checkerboard enclosed by a tail or between paws.
  if (type === 'checker') {
    for (let index = 0; index < length; index++) {
      if (candidate[index]) pixels[index * 4 + 3] = 0
    }
  }
}

function removePortraitFoliage(pixels, clipWidth, clipHeight, [left, top], band) {
  for (let y = Math.floor(clipHeight * .43); y < clipHeight; y++) {
    for (let x = 0; x < clipWidth; x++) {
      const withinBand = x + left >= band[0] && x + left < band[2] && y + top >= band[1] && y + top < band[3]
      if (withinBand) continue
      const offset = (y * clipWidth + x) * 4
      const r = pixels[offset]
      const g = pixels[offset + 1]
      const b = pixels[offset + 2]
      if (g >= r - 12 && g >= b + 34 && g > 80) pixels[offset + 3] = 0
    }
  }
}

function retainSubject(pixels, clipWidth, keepLargest, compact) {
  const length = pixels.length / 4
  const group = new Int32Array(length)
  const queue = new Int32Array(length)
  const areas = [0]
  const touchesBoundary = [false]
  const detailArea = compact ? 4 : 10
  let largest = 0

  for (let start = 0; start < length; start++) {
    if (group[start] || pixels[start * 4 + 3] < 24) continue
    const currentGroup = areas.length
    let read = 0
    let written = 0

    function enqueue(index) {
      if (group[index] || pixels[index * 4 + 3] < 24) return
      group[index] = currentGroup
      queue[written++] = index
    }

    enqueue(start)
    let onBoundary = false
    while (read < written) {
      const index = queue[read++]
      const x = index % clipWidth
      if (x === 0 || x === clipWidth - 1 || (compact && (index < clipWidth * 2 || index >= length - clipWidth * 2))) {
        onBoundary = true
      }
      visitNeighbors(index, clipWidth, length, enqueue)
    }
    areas.push(written)
    touchesBoundary.push(onBoundary)
    if (written > areas[largest]) largest = currentGroup
  }

  for (let index = 0; index < length; index++) {
    const currentGroup = group[index]
    const retained = currentGroup === largest || (!keepLargest && areas[currentGroup] >= detailArea && !touchesBoundary[currentGroup])
    if (!retained) pixels[index * 4 + 3] = 0
  }
}

function getVisibleBounds(pixels, clipWidth, clipHeight) {
  let left = clipWidth
  let top = clipHeight
  let right = -1
  let bottom = -1
  for (let y = 0; y < clipHeight; y++) {
    for (let x = 0; x < clipWidth; x++) {
      if (!pixels[(y * clipWidth + x) * 4 + 3]) continue
      left = Math.min(left, x)
      top = Math.min(top, y)
      right = Math.max(right, x)
      bottom = Math.max(bottom, y)
    }
  }
  if (right < left) throw new Error('El recorte no contiene un personaje.')
  return { left, top, width: right - left + 1, height: bottom - top + 1 }
}

function insideContour(x, y, contour) {
  let inside = false
  for (let index = 0, previous = contour.length - 1; index < contour.length; previous = index++) {
    const [x1, y1] = contour[index]
    const [x2, y2] = contour[previous]
    if ((y1 > y) !== (y2 > y) && x < (x2 - x1) * (y - y1) / (y2 - y1) + x1) inside = !inside
  }
  return inside
}

function createCollarMask(pixels, clipWidth, [left, top], band, color, contour) {
  const mask = Buffer.alloc(pixels.length)
  if (!band) return mask
  const matches = colorMatches[color]
  for (let index = 0; index < pixels.length / 4; index++) {
    const x = left + index % clipWidth
    const y = top + Math.floor(index / clipWidth)
    if (x < band[0] || x >= band[2] || y < band[1] || y >= band[3]) continue
    if (contour && !insideContour(x, y, contour)) continue
    const offset = index * 4
    const r = pixels[offset]
    const g = pixels[offset + 1]
    const b = pixels[offset + 2]
    const opacity = pixels[offset + 3]
    if (!opacity || !matches(r, g, b)) continue
    mask[offset + 3] = Math.min(opacity, 237, 120 + Math.round(Math.max(r, g, b) * .82))
  }
  return mask
}

async function readClip({ file, bounds, page }) {
  const key = page === undefined ? file : `${file}#${page}`
  if (!decodedSheets.has(key)) {
    const decoded = sharp(join(sourceDirectory, file), { page }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    decodedSheets.set(key, decoded)
  }
  const { data, info } = await decodedSheets.get(key)
  if (!bounds) return { pixels: Buffer.from(data), width: info.width, height: info.height }

  const [left, top, right, bottom] = bounds
  const clipWidth = right - left
  const clipHeight = bottom - top
  const stride = clipWidth * 4
  const pixels = Buffer.allocUnsafe(stride * clipHeight)
  for (let row = 0; row < clipHeight; row++) {
    const offset = ((top + row) * info.width + left) * 4
    data.copy(pixels, row * stride, offset, offset + stride)
  }
  return { pixels, width: clipWidth, height: clipHeight }
}

function getBodyAxis(pixels, clipWidth, bounds) {
  const middleTop = bounds.top + Math.floor(bounds.height * .43)
  const middleBottom = bounds.top + Math.ceil(bounds.height * .76)
  let sum = 0
  let count = 0

  for (let y = middleTop; y < middleBottom; y++) {
    for (let x = bounds.left; x < bounds.left + bounds.width; x++) {
      if (pixels[(y * clipWidth + x) * 4 + 3] < 80) continue
      sum += x
      count++
    }
  }

  const center = bounds.left + bounds.width / 2
  return count ? .35 * center + .65 * (sum / count) : center
}

function getCollarBand(source, origin, bounds) {
  if (!source.collarWindow) return source.band
  const [left, top, right, bottom] = source.collarWindow
  const subjectLeft = origin[0] + bounds.left
  const subjectTop = origin[1] + bounds.top
  return [
    subjectLeft + left * bounds.width, subjectTop + top * bounds.height,
    subjectLeft + right * bounds.width, subjectTop + bottom * bounds.height,
  ]
}

async function prepareFrame(source, density = 1) {
  const clip = await readClip(source)
  const { pixels } = clip
  const origin = source.bounds ?? [0, 0]
  const isPortrait = source.kind === 'portrait'
  if (!source.transparent) {
    removeBackdrop(pixels, clip.width, clip.height, source.backdrop ?? source.kind)
    if (isPortrait && !source.backdrop) removePortraitFoliage(pixels, clip.width, clip.height, origin, source.band)
  }
  retainSubject(pixels, clip.width, isPortrait || source.keepLargest, source.scale > 1)
  const bounds = getVisibleBounds(pixels, clip.width, clip.height)
  const band = getCollarBand(source, origin, bounds)
  const mask = createCollarMask(pixels, clip.width, origin, band, source.color, source.contour)

  const maxHeight = isPortrait ? 126 : height - 12
  const scale = Math.min((width - 12) / bounds.width, maxHeight / bounds.height, isPortrait ? Infinity : source.scale ?? 1)
  const encodedSize = { width: Math.round(bounds.width * scale * density), height: Math.round(bounds.height * scale * density) }
  const ground = source.ground ?? origin[1] + bounds.top + bounds.height - 1
  const axis = isPortrait ? bounds.left + bounds.width / 2 : source.center ?? getBodyAxis(pixels, clip.width, bounds)
  const bodyAxis = axis - bounds.left
  const top = isPortrait
    ? (groundLine + 1) * density - encodedSize.height
    : Math.max(0, Math.min(height * density - encodedSize.height, Math.round((groundLine - (ground - origin[1] - bounds.top) * scale) * density)))
  const left = Math.max(0, Math.min(width * density - encodedSize.width, Math.round((width / 2 - bodyAxis * scale) * density)))

  function extract(data) {
    return sharp(data, { raw: { width: clip.width, height: clip.height, channels: 4 } })
      .extract(bounds)
      .resize({ ...encodedSize, fit: 'fill', kernel: sharp.kernel.lanczos3 })
      .raw()
      .toBuffer()
  }

  const [art, collar] = await Promise.all([extract(pixels), extract(mask)])
  return {
    art,
    collar,
    raw: { ...encodedSize, channels: 4 },
    left,
    top,
  }
}

async function createAtlas(name, frames, columns, density = 1, directory = outputDirectory, layers = ['art', 'collar']) {
  const rows = Math.ceil(frames.length / columns)
  const cellWidth = width * density
  const cellHeight = height * density
  const create = { width: cellWidth * columns, height: cellHeight * rows, channels: 4, background: '#00000000' }
  await Promise.all(layers.map((layer) => {
    const placements = frames.map((frame, index) => ({
      input: frame[layer], raw: frame.raw,
      left: index % columns * cellWidth + frame.left,
      top: Math.floor(index / columns) * cellHeight + frame.top,
    }))
    return sharp({ create })
      .composite(placements)
      .webp({ lossless: true, effort: 3 })
      .toFile(join(directory, `${name}-${layer}.webp`))
  }))
  return { columns, rows, density }
}

async function prepareRoomAtlas() {
  const directory = fileURLToPath(new URL('../../apps/web/src/assets/pet-motion-2d/', import.meta.url))
  const sources = {
    pivot: ['Perro dorado girando feliz.gif', .49, 0, 11],
    posture: ['Animación de cachorro dorado sentándose.gif', .47, 0, 11],
    bed: ['Perro dorado quedándose dormido.gif', .45, 0, 10],
    stretch: ['Perro dorado despierta y se estira.gif', .43, 2, 14],
  }
  const frames = []
  const tracks = {}
  for (const [id, [name, scale, first, last]] of Object.entries(sources)) {
    const file = `Golden_retriver/${name}`
    const info = await sharp(join(sourceDirectory, file), { animated: true }).metadata()
    if (last >= info.pages) throw new Error(`Faltan fotogramas en ${file}`)
    tracks[id] = { start: frames.length, first, count: last - first + 1 }
    for (let page = first; page <= last; page++) {
      frames.push(await prepareFrame({ file, page, scale, center: info.width / 2, backdrop: 'checker', keepLargest: true }, 1.5))
    }
  }
  await mkdir(directory, { recursive: true })
  const atlas = await createAtlas('golden-room', frames, 8, 1.5, directory, ['art'])
  await writeFile(join(directory, 'golden-room.json'), `${JSON.stringify({ ...atlas, tracks }, null, 2)}\n`)
  console.log(`Preparados ${frames.length} fotogramas originales del Golden para la habitación.`)
}

if (process.argv.includes('--room')) {
  await prepareRoomAtlas()
} else {
  await prepareCatalog()
}

async function prepareCatalog() {
  await mkdir(outputDirectory, { recursive: true })
  const animated = {}
  const posterFrames = new Map()

  async function readGifTracks() {
    const tracks = {}
    for (const [action, source] of Object.entries(goldenGifs)) {
      const { width: clipWidth, pages, delay } = await sharp(join(sourceDirectory, source.file), { animated: true }).metadata()
      if (!pages || delay?.length !== pages || delay.some((duration) => duration <= 0)) {
        throw new Error(`El GIF de ${action} requiere una duración por fotograma.`)
      }
      const poses = delay.map((_, page) => ({
        ...source,
        page,
        center: clipWidth / 2,
        band: [0, 0, clipWidth, source.ground],
        color: 'olive',
      }))
      tracks[action] = { poses, durations: delay }
    }
    return tracks
  }

  const authoredGoldenTracks = await readGifTracks()

  function* detailedAnimationSources() {
    for (const [id, sheet] of Object.entries(sheets)) {
      const tracks = {}
      for (const [action, [rowIndex, first, count, ground, fps, propDepth = 0]] of Object.entries(sheet.tracks)) {
        const [top, bottom, cuts] = sheet.rows[rowIndex]
        const poses = []
        for (let pose = first; pose < first + count; pose++) {
          const [left, right] = sheet.horizontalOverrides?.[rowIndex]?.[pose] ?? [cuts[pose], cuts[pose + 1]]
          poses.push({
            file: sheet.file,
            bounds: [left, top, right, bottom],
            band: [left, top, right, ground - propDepth + 1],
            color: sheet.collar,
            ground,
          })
        }
        tracks[action] = { poses, fps }
      }
      yield { id, type: 'detailed', previewScale: 1, tracks: id === 'golden' ? { ...tracks, ...authoredGoldenTracks } : tracks }
    }
  }

  for (const { id, type, previewScale, tracks: sourceTracks } of [...detailedAnimationSources(), ...compactAnimationSources()]) {
    const frames = []
    const tracks = {}
    const density = previewScale < .75 ? 1.5 : animationDensity
    for (const [action, track] of Object.entries(sourceTracks)) {
      const { poses, fps, durations } = Array.isArray(track) ? { poses: track } : track
      const target = durations ? [] : frames
      const start = target.length
      for (const [index, pose] of poses.entries()) {
        const source = { ...pose, kind: 'checker' }
        try {
          target.push(await prepareFrame(source, density))
          if (action === 'idle' && index === 0 && portraits[id].sheet) {
            posterFrames.set(id, await prepareFrame(source, portraitDensity))
          }
        } catch (error) {
          throw new Error(`No se pudo preparar ${id}/${action}/${index + 1} de ${source.file}`, { cause: error })
        }
      }
      const sheetId = `${id}-${action}`
      const sheet = durations ? { id: sheetId, ...await createAtlas(sheetId, target, 4, density) } : undefined
      tracks[action] = { start, count: poses.length, fps, durations, sheet }
    }
    animated[id] = { ...await createAtlas(id, frames, frames.length > 24 ? 8 : 5, density), type, previewScale, tracks }
  }

  const catalog = []
  const indices = {}
  for (const [id, source] of Object.entries(portraits)) {
    indices[id] = catalog.length
    catalog.push(source.sheet
      ? posterFrames.get(source.sheet)
      : await prepareFrame({ ...source, kind: 'portrait' }, portraitDensity))
  }

  const manifest = {
    frameWidth: width,
    frameHeight: height,
    portraits: { ...await createAtlas('portraits', catalog, 6, portraitDensity), indices },
    animated,
  }
  await writeFile(join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`Preparados ${catalog.length} retratos y ${Object.keys(animated).length} atlas animados.`)
}
