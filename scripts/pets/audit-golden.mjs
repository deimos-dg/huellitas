import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { sheets } from './sources.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const matrixPath = join(root, 'docs/PETMOTION_ASSET_MATRIX.json')
const outputDirectory = join(root, 'docs/petmotion-contact-sheets')
const readJson = async path => JSON.parse(await readFile(join(root, path), 'utf8'))
const matrix = await readJson('docs/PETMOTION_ASSET_MATRIX.json')
const creatorManifest = await readJson('apps/web/src/assets/pets/manifest.json')
const roomManifest = await readJson('apps/web/src/assets/pet-motion-2d/golden-room.json')
const golden = creatorManifest.animated.golden
const check = process.argv.includes('--check')
const hash = data => createHash('sha256').update(data).digest('hex')

const views = {
  D: 'Perfil derecho',
  QD: 'Tres cuartos derecho',
  I: 'Perfil izquierdo',
  QI: 'Tres cuartos izquierdo',
  F: 'Frontal',
  R: 'Trasera',
  RD: 'Trasera tres cuartos derecho',
  RI: 'Trasera tres cuartos izquierdo',
}

const turnViews = ['F', 'QD', 'QD', 'D', 'D', 'RD', 'RD', 'R', 'R', 'RI', 'I', 'QI', 'QI', 'QI', 'F', 'F']

// Availability here describes each source occurrence. The action's delivery status lives in the matrix.
const stock = {
  idle: ['Idle sentado', 'QD', 'Sentado', 'Sentado', 'Creador · cola sentado'],
  walk: ['Walk', 'D', 'Apoyo de marcha', 'Fase de marcha', 'Reutilizable · validar apoyos'],
  run: ['Run', 'D', 'Apoyo lateral', 'Fase de carrera', 'Completo lateral · validar cierre'],
  sit: ['Sit', 'QD', 'Sentado alto', 'Sentado', 'Reutilizable · respaldo'],
  sleep: ['Sleep', 'QD', 'Tumbado dormido', 'Tumbado dormido', 'Pose existente'],
  wake: ['WakeUp / Stretch', ['QD', 'QI', 'I', 'QD'], 'Tumbado', 'Sentado', 'Reutilizable · cambios de vista'],
  eat: ['Eat', 'QD', 'De pie', 'Sentado', 'Parcial · recipiente incrustado'],
  drink: ['Drink', 'QD', 'De pie, inclinado', 'Sentado', 'Parcial · recipiente incrustado'],
  bath: ['Baño', 'QD', 'En tina', 'En tina', 'Existente · creador'],
  shake: ['Sacudirse', 'D', 'De pie', 'De pie', 'Existente · creador'],
  play: ['Play', 'QD', 'Reverencia', 'Tumbado con pelota', 'Parcial · pelota incrustada'],
  jump: ['Jump', 'D', 'De pie', 'De pie tras aterrizar', 'Completo lateral · validar contactos'],
  pet: ['ReceivePetting', 'QD', 'Sentado', 'Sentado', 'Completo · mano incrustada'],
  happy: ['Happy / Greet / SeekAttention', 'QD', 'Sentado', 'Patas delanteras elevadas', 'Existente · reuso parcial por acción'],
}

function trackData(selection) {
  const [action, orientation, startPosture, endPosture, availability] = selection
  return { action, orientation, startPosture, endPosture, availability }
}

function frameData(track, index, relative, selection, region, durationMs) {
  const { action, orientation, startPosture, endPosture, availability } = trackData(selection)
  const view = Array.isArray(orientation) ? orientation[relative] : orientation
  assert.ok(views[view], `Vista sin registrar en ${track}/${index}`)
  return { index, track, action, view, availability, startPosture, endPosture, region, durationMs }
}

const gifTracks = [
  ['gif-sit', 'Animación de cachorro dorado sentándose.gif', 'sit', ['Sit / parpadeo', 'QD', 'De pie', 'Sentado', 'Reutilizable · damero incrustado']],
  ['gif-walk', 'Animación de perro dorado caminando.gif', 'walk', ['Walk', 'D', 'Apoyo de marcha', 'Apoyo de marcha', 'Referencia · damero incrustado']],
  ['gif-idle', 'Perro dorado animado moviendo la cola.gif', 'idle', stock.idle],
  ['gif-run', 'Perro dorado corriendo animado.gif', 'run', stock.run],
  ['gif-wake', 'Perro dorado despierta y se estira.gif', 'wake', ['WakeUp / Stretch', 'QD', 'Tumbado dormido', 'Sentado', 'Reutilizable · damero incrustado']],
  ['gif-jump', 'Perro dorado en salto animado.gif', 'jump', stock.jump],
  ['gif-turn', 'Perro dorado girando feliz.gif', 'pivot', ['Turn / Curious', turnViews, 'De pie, frontal', 'De pie, frontal', 'Reutilizable · damero incrustado']],
  ['gif-sleep', 'Perro dorado quedándose dormido.gif', 'bed', ['LieDown / Sleep', 'QD', 'Sentado', 'Tumbado dormido', 'Reutilizable · damero incrustado']],
]

const resources = []
for (const [id, name, track, selection] of gifTracks) {
  const path = `Imagenes/Golden_retriver/${name}`
  const metadata = await sharp(join(root, path), { animated: true }).metadata()
  const frames = metadata.delay.map((duration, page) => frameData(
    track, page, page, selection, { left: 0, top: page * metadata.pageHeight, width: metadata.width, height: metadata.pageHeight }, duration,
  ))
  resources.push({ id, path, role: 'original-gif', metadata, frames })
}

const original = sheets.golden
const originalPath = `Imagenes/${original.file}`
const originalFrames = []
const sourceTracks = [
  ...Object.entries(original.tracks),
  ['sitAlternate', [1, 8, 2]],
]
const alternate = ['Sit / expresión sentada', 'QD', 'Sentado, ojos cerrados', 'Sentado, ojos abiertos', 'Referencia · celda fuera del catálogo']
for (const [row, [top, bottom, cuts]] of original.rows.entries()) {
  for (let column = 0; column < cuts.length - 1; column++) {
    const match = sourceTracks.find(([, [trackRow, first, count]]) => trackRow === row && column >= first && column < first + count)
    assert.ok(match, `Celda fuente sin clasificación: fila ${row}, columna ${column}`)
    const [track, [, first, , , fps]] = match
    const selection = track === 'sitAlternate' ? alternate : stock[track]
    originalFrames.push(frameData(track, originalFrames.length, column - first, selection,
      { left: cuts[column], top, width: cuts[column + 1] - cuts[column], height: bottom - top },
      fps ? Math.round(1000 / fps) : null))
  }
}
resources.push({ id: 'png-golden', path: originalPath, role: 'original-png', metadata: await sharp(join(root, originalPath)).metadata(), frames: originalFrames })

const roomTracks = {
  pivot: ['Turn / Curious', turnViews, 'De pie, frontal', 'De pie, tres cuartos izquierdo', 'Reutilizable · arco parcial'],
  posture: ['Sit / Idle / StandUp / parpadeo', 'QD', 'De pie', 'Sentado', 'Existente · posture y párpado'],
  bed: ['LieDown / Sleep', 'QD', 'Sentado', 'Tumbado dormido', 'Existente · contacto al suelo'],
  stretch: ['WakeUp / Stretch', 'QD', 'Tumbado', 'Sentado', 'Reutilizable · despertar combinado'],
}

async function atlas(id, path, shape, sheetTracks, role) {
  const metadata = await sharp(join(root, path)).metadata()
  const width = metadata.width / shape.columns
  const height = metadata.height / shape.rows
  assert.ok(Number.isInteger(width) && Number.isInteger(height), `Cuadrícula inválida en ${path}`)
  const frames = sheetTracks.flatMap(([track, config, selection]) => Array.from({ length: config.count }, (_, offset) => {
    const index = config.start + offset
    const region = { left: index % shape.columns * width, top: Math.floor(index / shape.columns) * height, width, height }
    const duration = config.durations?.[offset] ?? (config.fps ? Math.round(1000 / config.fps) : null)
    const pose = frameData(track, index, offset + (config.first ?? 0), selection, region, duration)
    if (role === 'mascara') pose.availability = 'Existente · máscara auxiliar'
    if (id === 'golden-room' && track === 'stretch' && config.first + offset === 3) pose.availability = 'Referencia · alerta tumbado'
    return pose
  }))
  assert.equal(new Set(frames.map(frame => frame.index)).size, frames.length, `Celdas superpuestas en ${path}`)
  resources.push({ id, path, role, metadata, frames })
}

for (const id of ['golden', 'golden-idle', 'golden-run', 'golden-jump', 'portraits']) {
  const tracks = Object.entries(golden.tracks)
    .filter(([, track]) => (track.sheet?.id ?? 'golden') === id)
    .map(([name, config]) => [name, config, stock[name]])
  const shape = id === 'portraits' ? creatorManifest.portraits : (tracks[0][1].sheet ?? golden)
  if (id === 'portraits') tracks.push(['portrait', { start: shape.indices.golden, count: 1 }, ['Retrato', 'QD', 'Sentado', 'Sentado', 'Existente · retrato']])
  for (const [layer, role] of [['art', 'atlas'], ['collar', 'mascara']]) {
    await atlas(layer === 'art' ? id : `${id}-collar`, `apps/web/src/assets/pets/${id}-${layer}.webp`, shape, tracks, role)
  }
}
await atlas('golden-room', 'apps/web/src/assets/pet-motion-2d/golden-room-art.webp', roomManifest,
  Object.entries(roomManifest.tracks).map(([name, config]) => [name, config, roomTracks[name]]), 'atlas')

const inputs = new Map(resources.map(resource => [resource.id, resource]))
assert.equal(new Set(matrix.actions.map(action => action.id)).size, 24, 'La matriz debe tener 24 ID distintos')
function assertReference(ref, owner) {
  const resource = inputs.get(ref.asset)
  assert.ok(resource, `Recurso no encontrado en ${owner}: ${ref.asset}`)
  const available = new Set(resource.frames.map(frame => frame.index))
  assert.ok(ref.frames.every(index => available.has(index)), `Recorte no encontrado en ${owner}: ${ref.asset}`)
}

for (const [name, value] of Object.entries(matrix.identity)) {
  if (value && typeof value === 'object' && 'asset' in value) assertReference(value, name)
}
for (const action of [...matrix.actions, ...matrix.technicalClips]) {
  for (const ref of [...action.resources.existing, ...action.resources.reusable]) assertReference(ref, action.id)
}

function crop(buffer, stride, { left, top, width, height }) {
  const data = Buffer.allocUnsafe(width * height * 4)
  for (let y = 0; y < height; y++) {
    const start = ((top + y) * stride + left) * 4
    buffer.copy(data, y * width * 4, start, start + width * 4)
  }
  return data
}

function alphaSummary(data) {
  let transparent = 0
  let partial = 0
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] === 0) transparent++
    else if (data[index] < 255) partial++
  }
  return { transparent, partial }
}

const esc = value => String(value).replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char])
const cellsPerSheet = 16

async function contactSheet(resource, frames, sheetNumber, sheetCount, referenceRaw) {
  const columns = Math.min(4, frames.length)
  const rows = Math.ceil(frames.length / columns)
  const cellWidth = Math.max(355, ...resource.frames.map(frame => frame.region.width + 24))
  const imageHeight = Math.max(...resource.frames.map(frame => frame.region.height)) + 16
  const cellHeight = imageHeight + 91
  const width = columns * cellWidth
  const height = 88 + rows * cellHeight
  const filename = `${resource.id}-${String(sheetNumber).padStart(2, '0')}.png`
  const items = frames.map((frame, i) => {
    const x = i % columns * cellWidth
    const y = 88 + Math.floor(i / columns) * cellHeight
    const rect = { left: x + Math.floor((cellWidth - frame.region.width) / 2), top: y + 8,
      width: frame.region.width, height: frame.region.height }
    frame.contact = { file: filename, ...rect }
    const stamp = `#${String(frame.index).padStart(2, '0')} · ${frame.track} · ${frame.region.width} × ${frame.region.height} px`
    return { frame, rect, x, y, stamp }
  })
  const path = join(outputDirectory, filename)
  if (!check) {
    const labels = items.map(({ frame, x, y, stamp }) => {
      const yy = y + imageHeight
      return `<rect x="${x + 4}" y="${y + 2}" width="${cellWidth - 8}" height="${cellHeight - 6}" fill="#f7f4e9" stroke="#cec8b9"/>
        <text x="${x + 15}" y="${yy + 16}" font-weight="700">${esc(stamp)}</text>
        <text x="${x + 15}" y="${yy + 34}">${esc(basename(resource.path))}</text>
        <text x="${x + 15}" y="${yy + 52}">${esc(frame.action)} · ${esc(views[frame.view])}</text>
        <text x="${x + 15}" y="${yy + 70}">${esc(frame.availability)}</text>`
    }).join('')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#ebe5d6"/>
      <text x="18" y="32" font-family="Arial,sans-serif" font-size="22" font-weight="700" fill="#273327">Golden Retriever · ${esc(basename(resource.path))}</text>
      <text x="18" y="58" font-family="Arial,sans-serif" font-size="14" fill="#445443">Hoja ${sheetNumber}/${sheetCount} · escala 1:1 · índices desde 0</text>
      <g fill="#273327" font-family="Arial,sans-serif" font-size="13">${labels}</g>
    </svg>`
    const canvas = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer()
    for (const { frame, rect } of items) {
      const data = referenceRaw.get(frame.index)
      for (let y = 0; y < rect.height; y++) {
        data.copy(canvas, ((rect.top + y) * width + rect.left) * 4, y * rect.width * 4, (y + 1) * rect.width * 4)
      }
    }
    await sharp(canvas, { raw: { width, height, channels: 4 } }).png().toFile(path)
  }
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  assert.equal(info.width, width, filename)
  assert.equal(info.height, height, filename)
  for (const { frame, rect } of items) {
    assert.ok(crop(data, width, rect).equals(referenceRaw.get(frame.index)), `Píxeles diferentes en ${filename} #${frame.index}`)
  }
  return { file: filename, frames: frames.length, width, height }
}

if (!check) await mkdir(outputDirectory, { recursive: true })
const inventory = []
for (const resource of resources) {
  const { data, info } = await sharp(join(root, resource.path), { animated: resource.role === 'original-gif' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const references = new Map()
  for (const frame of resource.frames) {
    const { left, top, width, height } = frame.region
    assert.ok(left >= 0 && top >= 0 && left + width <= info.width && top + height <= info.height, `Recorte inválido en ${resource.path}`)
    const pixels = crop(data, info.width, frame.region)
    references.set(frame.index, pixels)
    frame.alpha = alphaSummary(pixels)
    frame.pixelSha256 = hash(pixels)
  }
  const { metadata, ...asset } = resource
  const contacts = []
  const pages = Math.ceil(asset.frames.length / cellsPerSheet)
  for (let index = 0; index < pages; index++) {
    contacts.push(await contactSheet(asset, asset.frames.slice(index * cellsPerSheet, (index + 1) * cellsPerSheet), index + 1, pages, references))
  }
  inventory.push({ ...asset, filename: basename(asset.path), format: metadata.format, width: metadata.width,
    height: metadata.pageHeight ?? metadata.height, alphaDeclared: metadata.hasAlpha,
    framesWithTransparency: asset.frames.filter(frame => frame.alpha.transparent || frame.alpha.partial).length,
    uniquePixelFrames: new Set(asset.frames.map(frame => frame.pixelSha256)).size,
    sourceSha256: hash(await readFile(join(root, asset.path))), contacts,
    tracks: [...new Set(asset.frames.map(frame => frame.track))].map(track => {
      const frames = asset.frames.filter(frame => frame.track === track)
      return { id: track, frames: frames.length, startPosture: frames[0].startPosture, endPosture: frames.at(-1).endPosture,
        views: [...new Set(frames.map(frame => frame.view))] }
    }),
  })
}

const index = [
  '# Hojas de contacto · Golden Retriever',
  '',
  'Los recortes conservan sus píxeles RGBA a escala 1:1. La numeración empieza en 0 y corresponde a la página del GIF, la celda física del atlas o el orden de recortes de la lámina. Los índices y coordenadas están en la [matriz](../PETMOTION_ASSET_MATRIX.json).',
  '',
  '| Archivo | Función | Fotogramas | Hojas PNG |',
  '| --- | --- | --- | --- |',
  ...inventory.map(item => `| ${item.filename} | ${item.role} | ${item.frames.length} | ${item.contacts.map((contact, i) => `[${i + 1}](${contact.file})`).join(' · ')} |`),
  '',
  'Las máscaras guardan cobertura alfa para el collar. El damero impreso en algunos GIF forma parte de sus píxeles.',
  '',
].join('\n')

if (check) {
  assert.deepEqual(matrix.inventory, inventory, 'El inventario publicado difiere de los recursos')
  const publishedIndex = await readFile(join(outputDirectory, 'INDEX.md'), 'utf8')
  assert.equal(publishedIndex.replaceAll('\r\n', '\n'), index)
} else {
  await writeFile(matrixPath, `${JSON.stringify({ ...matrix, inventory }, null, 2)}\n`)
  await writeFile(join(outputDirectory, 'INDEX.md'), index)
}
console.log(`${inventory.length} recursos · ${inventory.reduce((total, item) => total + item.frames.length, 0)} regiones RGBA verificadas · ${inventory.reduce((total, item) => total + item.contacts.length, 0)} hojas PNG`)
