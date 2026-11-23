import { strict as assert } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { PetPersistenceService, storageKey } from '../../apps/web/src/features/pet-motion-2d/adapters/persistence'
import { PetController } from '../../apps/web/src/features/pet-motion-2d/controllers/PetController'
import { PetBehaviorController } from '../../apps/web/src/features/pet-motion-2d/controllers/PetBehaviorController'
import { actionCatalog, actions, canStartAction, clipDefinition, technicalClips } from '../../apps/web/src/features/pet-motion-2d/domain/animationCatalog'
import { idleDurationMs, sampleIdleMotion } from '../../apps/web/src/features/pet-motion-2d/domain/idleMotion'
import { canOccupy, canWalkSegment, planRoute, roomNavigation, vertices } from '../../apps/web/src/features/pet-motion-2d/domain/navigation'
import { canTransition } from '../../apps/web/src/features/pet-motion-2d/domain/petState'
import type { PetState } from '../../apps/web/src/features/pet-motion-2d/domain/petState'
import { objects, petId, roomId, roomObjects, spawn } from '../../apps/web/src/features/pet-motion-2d/domain/room'
import { captureTransition, previewStepMs } from '../../apps/web/src/features/pet-motion-2d/scene/transitionPreview'
import { gardenScene, kitchenScene, livingRoomScene, originalScenes, parkScene } from '../../apps/web/src/features/pet-motion-2d/domain/sceneCatalog'
import { imageToLogical, screenToLogical } from '../../apps/web/src/features/pet-motion-2d/domain/sceneCoordinates'

const timing = { duration: () => 96 }

function advanceUntil(pet: PetController, wanted: PetState, delta = 16, map = roomNavigation) {
  const seen: PetState[] = []
  for (let time = 0; time <= 10_000; time += delta) {
    const { state, position } = pet.snapshot()
    assert.ok(canOccupy(position, map), `Pet crossed an obstacle or boundary at ${JSON.stringify(position)}`)
    if (seen.at(-1) !== state) seen.push(state)
    if (state === wanted) return seen
    pet.advance(delta)
    assert.ok(canWalkSegment(position, pet.snapshot().position, map))
  }
  assert.fail(`Expected ${wanted}; saw ${seen.join(', ')}`)
}

test('el catálogo identifica siete originales y solo ofrece fondos navegables con geometría convexa válida', () => {
  assert.equal(originalScenes.length, 7)
  assert.equal(originalScenes.filter(scene => scene.status === 'pending-art').length, 3)
  for (const scene of [gardenScene, parkScene, kitchenScene, livingRoomScene]) {
    assert.ok(existsSync(`Imagenes/escenarios/${scene.background?.file}`))
    assert.ok(canOccupy(scene.spawn, scene.navigation))
    for (const shape of [scene.navigation.floor, ...scene.navigation.obstacles]) {
      const points = vertices(shape)
      const signs = points.map((a, i) => {
        const b = points[(i + 1) % points.length]
        const c = points[(i + 2) % points.length]
        return Math.sign((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x))
      }).filter(Boolean)
      assert.equal(new Set(signs).size, 1)
    }
    for (const object of scene.objects) {
      assert.ok(planRoute(scene.spawn, object.interaction, scene.navigation), `${scene.id}/${object.id}`)
    }
  }
})

test('el parque rodea los troncos y rechaza un destino bajo una valla o fuera del polígono', () => {
  const { navigation: map, spawn } = parkScene
  const ring = parkScene.objects.find(object => object.id === 'ring')!
  assert.equal(canWalkSegment(spawn, ring.interaction, map), false)
  const route = planRoute(spawn, ring.interaction, map)!
  assert.ok(route.length > 2)
  assert.ok(route.every((point, i) => canWalkSegment(route[i - 1] ?? spawn, point, map)))
  assert.equal(planRoute(spawn, { x: 580, y: 448 }, map), undefined)
  assert.equal(planRoute(spawn, { x: 330, y: 350 }, map), undefined)
})

test('el controlador reutiliza llegada, orientación y acción de objetos incrustados', () => {
  for (const [scene, id, action, final] of [
    [gardenScene, 'bed', 'Settling', 'Resting'],
    [gardenScene, 'food', 'Looking', 'Idle'],
    [parkScene, 'ring', 'Looking', 'Idle'],
    [parkScene, 'hurdle', 'Jumping', 'Idle'],
    [kitchenScene, 'food', 'Eating', 'Sitting'],
    [kitchenScene, 'water', 'Drinking', 'Sitting'],
    [livingRoomScene, 'rug', 'Settling', 'Resting'],
    [livingRoomScene, 'ball', 'Playing', 'Lying'],
    [livingRoomScene, 'rope', 'Looking', 'Idle'],
  ] as const) {
    const pet = new PetController(timing, undefined, scene)
    const object = scene.objects.find(item => item.id === id)!
    pet.request({ type: 'object', id })
    advanceUntil(pet, action, 16, scene.navigation)
    assert.deepEqual(pet.snapshot().position, object.interaction)
    assert.equal(pet.snapshot().animation.facing, object.facing)
    assert.equal(pet.snapshot().selectedObject, id)
    advanceUntil(pet, final, 16, scene.navigation)
  }
})

test('cada cama bloquea la marcha y permite entrar y salir durante sus transiciones de descanso', () => {
  const scene = livingRoomScene
  for (const bed of scene.objects.filter(object => object.restingPoint)) {
    const point = bed.restingPoint!
    const pet = new PetController(timing, undefined, scene)
    assert.equal(planRoute(scene.spawn, point, scene.navigation), undefined)
    pet.request({ type: 'move', target: point })
    assert.ok(pet.snapshot().notice)
    assert.equal(pet.snapshot().state, 'Idle')

    const crossed = scene.navigation.obstacles.filter(obstacle => !canWalkSegment(bed.interaction, point, { floor: scene.navigation.floor, obstacles: [obstacle] }))
    assert.equal(crossed.length, 1, bed.id)
    assert.equal(canOccupy(point, { ...scene.navigation, obstacles: crossed }), false)

    pet.request({ type: 'object', id: bed.id })
    advanceUntil(pet, 'Settling', 16, scene.navigation)
    assert.deepEqual(pet.snapshot().position, bed.interaction)
    pet.advance(64)
    assert.notDeepEqual(pet.snapshot().position, bed.interaction)
    assert.notDeepEqual(pet.snapshot().position, point)
    assert.deepEqual(pet.poseForStorage().position, bed.interaction)
    pet.advance(32)
    assert.equal(pet.snapshot().state, 'Resting')
    assert.deepEqual(pet.snapshot().position, point)
    assert.equal(pet.snapshot().selectedObject, bed.id)

    const records = new Map<string, string>()
    const persistence = new PetPersistenceService(() => ({ getItem: key => records.get(key) ?? null,
      setItem: (key, value) => { records.set(key, value) } }), scene)
    persistence.save({ position: point, posture: 'standing', facing: bed.facing })
    assert.equal(persistence.load(), undefined)
    persistence.save(pet.poseForStorage())
    const restored = new PetController(timing, persistence.load(), scene)
    restored.request({ type: 'object', id: bed.id })
    assert.equal(restored.snapshot().state, 'Resting')
    assert.equal(restored.snapshot().selectedObject, bed.id)
    restored.request({ type: 'stand' })
    assert.equal(restored.snapshot().state, 'WakingUp')
    restored.advance(64)
    assert.notDeepEqual(restored.snapshot().position, point)
    assert.deepEqual(restored.poseForStorage().position, point)
    restored.advance(32)
    assert.equal(restored.snapshot().state, 'StandingUp')
    assert.deepEqual(restored.snapshot().position, bed.interaction)
  }
})

test('el Golden conserva su posición si se solicita el rascador destinado a gatos', () => {
  const pet = new PetController(timing, undefined, livingRoomScene)
  pet.request({ type: 'object', id: 'scratcher' })
  assert.match(pet.snapshot().notice ?? '', /reservado para gatos/)
  pet.advance(80)
  assert.deepEqual(pet.snapshot().position, livingRoomScene.spawn)
  assert.equal(pet.snapshot().animation.clip, 'idle')
})

test('la cocina deja sitio junto a ambos recipientes y bloquea la mesa y los mostradores', () => {
  const map = kitchenScene.navigation
  const [food, water] = kitchenScene.objects
  assert.notDeepEqual(food.hitbox, water.hitbox)
  assert.equal(canOccupy({ x: 516, y: 650 }, map), false, 'Mesa')
  assert.equal(canOccupy({ x: 700, y: 548 }, map), false, 'Armario bajo')
  assert.equal(canWalkSegment(food.interaction, water.interaction, map), false, 'Los recipientes cortan el paso recto')
  const route = planRoute(food.interaction, water.interaction, map)!
  assert.ok(route.length > 1)
  assert.ok(route.every((point, index) => canWalkSegment(route[index - 1] ?? food.interaction, point, map)))
})

test('los guardados de escenas conviven y una posición bloqueada restaura el punto inicial', () => {
  const memory = new Map<string, string>()
  const access = () => ({ getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value) } })
  const garden = new PetPersistenceService(access, gardenScene)
  const park = new PetPersistenceService(access, parkScene)
  const savedGarden = { position: { x: 740, y: 590 }, facing: 'right', posture: 'sitting' } as const
  const savedPark = { position: parkScene.spawn, facing: 'left', posture: 'standing' } as const
  garden.save(savedGarden)
  park.save(savedPark)
  assert.deepEqual(garden.load(), savedGarden)
  assert.deepEqual(park.load(), savedPark)
  const key = `${storageKey}.garden`
  memory.set(key, JSON.stringify({ ...JSON.parse(memory.get(key)!), position: { x: 680, y: 408 } }))
  const restored = new PetController(timing, garden.load(), gardenScene)
  assert.deepEqual(restored.snapshot().position, gardenScene.spawn)
  assert.equal(restored.snapshot().state, 'Idle')
  assert.deepEqual(park.load(), savedPark)
})

test('proyecta píxeles naturales y descarta toques en las bandas de una vista contenida', () => {
  const image = { width: 1600, height: 900 }
  assert.deepEqual(imageToLogical({ x: 400, y: 225 }, image), { x: 320, y: 180 })
  const narrow = { x: 12, y: 25, width: 320, height: 320 }
  assert.deepEqual(screenToLogical({ x: 92, y: 140 }, narrow, image), { x: 320, y: 180 })
  assert.equal(screenToLogical({ x: 92, y: 70 }, narrow, image), undefined)
  const wide = { x: 20, y: 10, width: 400, height: 180 }
  assert.deepEqual(screenToLogical({ x: 140, y: 55 }, wide, image), { x: 320, y: 180 })
  assert.equal(screenToLogical({ x: 40, y: 55 }, wide, image), undefined)
})

test('permite levantarse desde sentado y rechaza marchar, comer o dormir desde una postura incompatible', () => {
  assert.ok(canTransition('Sitting', 'StandingUp'))
  assert.ok(canTransition('Stopping', 'Eating'))
  assert.ok(canTransition('Settling', 'Resting'))
  assert.equal(canTransition('Sitting', 'Walking'), false)
  assert.equal(canTransition('Idle', 'Eating'), false)
  assert.equal(canTransition('Walking', 'Resting'), false)
  assert.equal(canTransition('Resting', 'StandingUp'), false)
})

test('conserva la pose sentada y encadena levantarse antes de caminar', () => {
  const pet = new PetController(timing)
  pet.request({ type: 'sit' })
  assert.equal(pet.poseForStorage().posture, 'standing')
  assert.deepEqual(advanceUntil(pet, 'Sitting'), ['SittingDown', 'Sitting'])
  pet.advance(80)
  assert.equal(pet.snapshot().animation.clip, 'seated')

  pet.request({ type: 'move', target: { x: 700, y: 600 } })
  assert.equal(pet.poseForStorage().posture, 'sitting')
  assert.deepEqual(advanceUntil(pet, 'Idle'), ['StandingUp', 'Walking', 'Stopping', 'Idle'])
  assert.deepEqual(pet.poseForStorage().position, { x: 700, y: 600 })
})

test('planea una ruta determinista alrededor de la cama y rechaza sus interiores y el exterior', () => {
  const from = { x: 78, y: 508 }
  const to = { x: 450, y: 508 }
  assert.equal(canWalkSegment(from, to), false)
  const route = planRoute(from, to)
  assert.ok(route && route.length > 1)
  assert.deepEqual(route, planRoute(from, to))
  assert.deepEqual(route.at(-1), to)
  for (const [index, point] of route.entries()) assert.ok(canWalkSegment(route[index - 1] ?? from, point))
  assert.equal(planRoute(from, { x: 160, y: 508 }), undefined)
  assert.equal(planRoute(from, { x: 40, y: 508 }), undefined)
  assert.equal(planRoute(from, { x: Number.NaN, y: 520 }), undefined)
})

test('detecta una separación completa del suelo aunque ambos extremos sean transitables', () => {
  const map = { floor: { x: 0, y: 0, width: 80, height: 80 }, obstacles: [{ x: 30, y: 0, width: 20, height: 80 }] }
  assert.equal(planRoute({ x: 2, y: 30 }, { x: 70, y: 30 }, map), undefined)
})

test('respeta colisiones y llega al mismo punto con intervalos distintos o una pausa larga', () => {
  const start = { x: 78, y: 508 }
  const target = { x: 450, y: 508 }
  for (const delta of [8, 16, 32]) {
    const pet = new PetController(timing, { position: start, posture: 'standing', facing: 'left' })
    pet.request({ type: 'move', target })
    assert.equal(pet.snapshot().state, 'Turning')
    pet.advance(5000)
    assert.deepEqual(pet.snapshot().position, start)
    const states = advanceUntil(pet, 'Idle', delta)
    assert.ok(states.includes('Walking') && states.includes('Stopping'))
    assert.deepEqual(pet.snapshot().position, target)
    assert.equal(pet.snapshot().destination, undefined)
  }
})

const interactions = [
  { id: 'bed', action: 'Settling', final: 'Resting' },
  { id: 'food', action: 'Eating', final: 'Sitting' },
  { id: 'water', action: 'Drinking', final: 'Sitting' },
] as const

for (const { id, action, final } of interactions) {
  test(`se aproxima a ${id}, se orienta y completa la postura de ${action}`, () => {
    const pet = new PetController(timing)
    pet.request({ type: 'object', id })
    const states = advanceUntil(pet, action)
    assert.ok(states.includes('Walking') && states.includes('Stopping'))
    assert.deepEqual(pet.snapshot().position, roomObjects[id].interaction)
    assert.equal(pet.snapshot().animation.facing, roomObjects[id].facing)
    advanceUntil(pet, final)
  })
}

test('la última orden sustituye la aproximación previa y espera una pose estable durante una acción', () => {
  const pet = new PetController(timing)
  pet.request({ type: 'object', id: 'food' })
  pet.advance(64)
  pet.request({ type: 'object', id: 'water' })
  assert.ok(!advanceUntil(pet, 'Drinking').includes('Eating'))
  assert.equal(pet.poseForStorage().posture, 'standing')

  pet.request({ type: 'sit' })
  const target = { x: 600, y: 617 }
  pet.request({ type: 'move', target })
  assert.equal(pet.snapshot().state, 'Drinking')
  assert.ok(advanceUntil(pet, 'Idle').includes('StandingUp'))
  assert.deepEqual(pet.snapshot().position, target)
})

test('una orden inválida conserva la ruta actual y levantarse desde la cama pasa por despertar', () => {
  const pet = new PetController(timing)
  pet.request({ type: 'object', id: 'bed' })
  pet.request({ type: 'move', target: { x: -1, y: 520 } })
  assert.equal(pet.snapshot().destination, roomObjects.bed.interaction)
  assert.ok(pet.snapshot().notice)
  advanceUntil(pet, 'Resting')
  pet.request({ type: 'stand' })
  assert.deepEqual(advanceUntil(pet, 'Idle'), ['WakingUp', 'StandingUp', 'Idle'])
})

test('valida versión, identidad, postura y espacio transitable al guardar y cargar', () => {
  const memory = new Map<string, string>()
  const persistence = new PetPersistenceService(() => ({
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => { memory.set(key, value) },
  }))
  const pose = { position: spawn, posture: 'sitting', facing: 'left' } as const
  persistence.save(pose)
  assert.deepEqual(persistence.load(), pose)
  const invalid = [
    { version: 3 }, { petId: 'other' }, { roomId: 'other' }, { posture: 'Turning' }, { facing: 'up' },
    { position: { x: 0, y: 500 } }, { position: roomObjects.bed.collision }, { position: { x: '574', y: 590 } },
  ]
  for (const fields of invalid) {
    memory.set(storageKey, JSON.stringify({ version: 1, petId, roomId, ...pose, ...fields }))
    assert.equal(persistence.load(), undefined)
  }
  memory.set(storageKey, '{')
  assert.equal(persistence.load(), undefined)
  assert.equal(new PetController(timing, persistence.load()).snapshot().position, spawn)

  const blocked = new PetPersistenceService(() => { throw new Error('Access denied') })
  assert.equal(blocked.load(), undefined)
  assert.doesNotThrow(() => blocked.save(pose))
  persistence.save({ ...pose, position: { x: -1, y: 500 } })
  assert.equal(memory.get(storageKey), '{')
})

test('los puntos de interacción son transitables y están fuera de las colisiones', () => {
  for (const object of objects) {
    assert.ok(canOccupy(object.interaction))
    assert.ok(planRoute(spawn, object.interaction))
  }
})

test('un giro mantiene el ancla fija y compromete la orientación al completar los pasos', () => {
  const pet = new PetController(timing)
  pet.request({ type: 'move', target: { x: 460, y: 622 } })
  assert.equal(pet.snapshot().state, 'Turning')
  pet.advance(80)
  assert.equal(pet.snapshot().animation.facing, 'right')
  assert.equal(pet.snapshot().position, spawn)
  pet.advance(16)
  assert.equal(pet.snapshot().state, 'Walking')
  assert.equal(pet.snapshot().animation.facing, 'left')
  assert.equal(pet.snapshot().position, spawn)
})

test('al invertir la marcha primero frena sobre el tramo libre y conserva la fase de pisada', () => {
  const pet = new PetController(timing)
  pet.request({ type: 'move', target: { x: 1000, y: 590 } })
  for (let frame = 0; frame < 30; frame++) pet.advance(16)
  const before = pet.snapshot()
  pet.request({ type: 'move', target: { x: 436, y: 590 } })
  assert.equal(pet.snapshot().state, 'Stopping')
  assert.equal(pet.snapshot().animation.speed, before.animation.speed)
  assert.equal(pet.snapshot().position, before.position)

  let previous = pet.snapshot()
  while (previous.animation.speed > 0) {
    pet.advance(16)
    const current = pet.snapshot()
    assert.ok(current.position.x >= previous.position.x)
    assert.ok(current.animation.speed < previous.animation.speed)
    assert.ok(canWalkSegment(previous.position, current.position))
    assert.equal(current.animation.facing, 'right')
    const phaseAdvance = current.animation.distance - previous.animation.distance
    assert.ok(Math.abs(phaseAdvance - (current.position.x - previous.position.x)) < .001)
    previous = current
  }
  assert.ok(advanceUntil(pet, 'Idle').includes('Turning'))
  assert.deepEqual(pet.snapshot().position, { x: 436, y: 590 })
})

test('permanecen fijos el apoyo al levantarse y el de la cama durante parada, alineación y descenso', () => {
  const bed = roomObjects.bed
  const pet = new PetController(timing, { position: bed.interaction, posture: 'standing', facing: 'right' })
  pet.request({ type: 'object', id: 'bed' })
  assert.deepEqual(advanceUntil(pet, 'Resting'), ['Walking', 'Stopping', 'Aligning', 'Settling', 'Resting'])
  assert.equal(pet.snapshot().position, bed.interaction)
  assert.equal(pet.snapshot().animation.facing, bed.facing)
  pet.request({ type: 'stand' })
  assert.deepEqual(advanceUntil(pet, 'Idle'), ['WakingUp', 'StandingUp', 'Idle'])
  assert.equal(pet.snapshot().position, bed.interaction)
})

test('el comportamiento espera su intervalo y busca rutas válidas cuando la primera opción choca', () => {
  const values = [0, .7, .1, .4, .7, .85]
  const behavior = new PetBehaviorController(() => values.shift() ?? 0, [300, 300])
  const pet = new PetController(timing)
  assert.equal(behavior.advance(299, pet.snapshot()), undefined)
  const intent = behavior.advance(1, pet.snapshot())
  assert.ok(intent?.type === 'move')
  assert.ok(canOccupy(intent.target))
  assert.ok(intent.target.x > 800)
  pet.requestAutonomous(intent)
  assert.equal(behavior.advance(2000, pet.snapshot()), undefined)
})

test('la autonomía distingue reposo, mirada, parpadeo y descanso voluntario', () => {
  const behavior = new PetBehaviorController(() => .4, [100, 100], [300, 300])
  const pet = new PetController(timing)
  assert.deepEqual(behavior.advance(100, pet.snapshot()), { type: 'look' })
  pet.request({ type: 'sit' })
  advanceUntil(pet, 'Sitting')
  assert.deepEqual(behavior.advance(100, pet.snapshot()), { type: 'blink' })
  pet.requestAutonomous({ type: 'object', id: 'bed' })
  advanceUntil(pet, 'Resting')
  assert.equal(behavior.advance(299, pet.snapshot()), undefined)
  assert.deepEqual(behavior.advance(1, pet.snapshot()), { type: 'stretch' })
  pet.request({ type: 'object', id: 'bed' })
  assert.equal(behavior.advance(5000, pet.snapshot()), undefined)
  pet.requestAutonomous({ type: 'stretch' })
  assert.equal(pet.snapshot().state, 'Resting')
})

test('cancelar autonomía descarta su ruta y preserva una orden manual durante una acción crítica', () => {
  const pet = new PetController(timing)
  pet.requestAutonomous({ type: 'object', id: 'bed' })
  advanceUntil(pet, 'Walking')
  pet.advance(80)
  pet.cancelAutonomous()
  assert.deepEqual(advanceUntil(pet, 'Idle'), ['Stopping', 'Idle'])

  pet.request({ type: 'object', id: 'food' })
  advanceUntil(pet, 'Eating')
  pet.requestAutonomous({ type: 'look' })
  assert.equal(pet.snapshot().state, 'Eating')
  const target = { x: 636, y: 620 }
  pet.request({ type: 'move', target })
  pet.cancelAutonomous()
  assert.equal(pet.snapshot().state, 'Eating')
  assert.ok(advanceUntil(pet, 'Idle').includes('StandingUp'))
  assert.deepEqual(pet.snapshot().position, target)
})

test('registra 24 IDs únicos y separa acciones pendientes de clips y transiciones habilitadas', () => {
  assert.equal(actions.length, 24)
  assert.equal(new Set(actions.map(action => action.id)).size, 24)
  assert.deepEqual(Object.fromEntries(['movement', 'rest', 'needs', 'interaction', 'emotion'].map(category =>
    [category, actions.filter(action => action.category === category).length])), {
    movement: 7, rest: 5, needs: 3, interaction: 4, emotion: 5,
  })
  const implemented = actions.filter(action => action.clip)
  assert.equal(new Set(implemented.map(action => action.clip)).size, implemented.length)
  for (const action of actions) {
    assert.ok(action.events.every(event => event.at >= 0 && event.at <= 1))
    if (action.availability === 'Missing') {
      assert.equal(action.clip, undefined)
      assert.equal(action.durationMs, null)
      assert.equal(action.transitions.start, null)
      assert.deepEqual(action.resources, [])
      continue
    }
    assert.ok(action.clip && action.resources.length && action.orientations.length && action.transitions.start)
    assert.ok(action.transitions.from.every(from => from === action.transitions.start || canTransition(from, action.transitions.start!)))
    assert.ok(action.transitions.end.every(end => end === action.transitions.start || canTransition(action.transitions.start!, end)))
    assert.equal(clipDefinition(action.clip)?.durationMs, action.durationMs)
  }
  assert.equal(actionCatalog.Stop.availability, 'Placeholder')
  assert.equal(technicalClips.stand.availability, 'Placeholder')
  assert.equal(canStartAction('Trot', 'Idle'), false)
  assert.equal(canStartAction('Greet', 'Idle'), false)
  assert.equal(canStartAction('Greet', 'Sitting'), true)
})

test('los recursos declarados existen y sus selecciones caben en las pistas y hojas', () => {
  const assetDirectory = 'apps/web/src/assets'
  const creator = JSON.parse(readFileSync(`${assetDirectory}/pets/manifest.json`, 'utf8')).animated.golden
  const room = JSON.parse(readFileSync(`${assetDirectory}/pet-motion-2d/golden-room.json`, 'utf8'))
  for (const action of [...actions, ...Object.values(technicalClips)]) {
    for (const resource of action.resources) {
      const directory = resource.atlas === 'golden-room' ? 'pet-motion-2d' : 'pets'
      const source = resource.atlas === 'golden-room' ? room : creator
      const track = source.tracks[resource.track]
      const sheet = track?.sheet ?? source
      assert.ok(track, resource.track)
      assert.ok(resource.frames > 0 && resource.frames <= track.count, resource.track)
      assert.ok(track.start + track.count <= sheet.rows * sheet.columns, resource.track)
      assert.ok(existsSync(`${assetDirectory}/${directory}/${resource.atlas}-art.webp`), resource.atlas)
    }
  }
})

test('el contexto social desplaza el clip emocional conservando el ánimo y admite reemplazo y movimiento manual', () => {
  const pet = new PetController(timing)
  pet.request({ type: 'social', action: 'Greet' })
  assert.equal(pet.snapshot().state, 'SittingDown')
  advanceUntil(pet, 'Socializing')
  assert.equal(pet.snapshot().animation.clip, 'greet')
  pet.request({ type: 'emotion', id: 'Happy' })
  assert.deepEqual(pet.snapshot().layers, { posture: 'sitting', locomotion: undefined, context: 'Greet', emotion: 'Happy', secondary: undefined })
  assert.equal(pet.snapshot().animation.clip, 'greet')
  pet.requestAutonomous({ type: 'look' })
  assert.equal(pet.snapshot().animation.clip, 'greet')
  pet.request({ type: 'social', action: 'ReceivePetting' })
  assert.equal(pet.snapshot().animation.clip, 'pet')
  advanceUntil(pet, 'Sitting')
  assert.equal(pet.snapshot().animation.clip, 'happy')
  pet.request({ type: 'emotion', id: 'Sad' })
  assert.equal(pet.snapshot().layers.emotion, 'Sad')
  assert.equal(pet.snapshot().animation.clip, 'seated')
  const target = { x: 800, y: 620 }
  pet.request({ type: 'move', target })
  assert.deepEqual(advanceUntil(pet, 'Idle'), ['StandingUp', 'Walking', 'Stopping', 'Idle'])
  assert.deepEqual(pet.snapshot().position, target)
})

test('la carrera frena para cambiar de orden y el salto protege el apoyo hasta aterrizar', () => {
  const pet = new PetController(timing)
  pet.request({ type: 'move', gait: 'run', target: { x: 1090, y: 590 } })
  assert.equal(pet.snapshot().state, 'Running')
  for (let frame = 0; frame < 46; frame++) pet.advance(16)
  assert.ok(pet.snapshot().animation.speed > 240)
  pet.request({ type: 'jump' })
  assert.equal(pet.snapshot().state, 'Stopping')
  assert.equal(pet.snapshot().animation.gait, 'run')
  advanceUntil(pet, 'Jumping')
  const anchor = pet.snapshot().position
  pet.advance(32)
  assert.equal(pet.snapshot().layers.posture, 'airborne')
  assert.deepEqual(pet.poseForStorage().position, anchor)
  assert.equal(pet.poseForStorage().posture, 'standing')
  pet.request({ type: 'move', target: { x: 1100, y: 620 } })
  assert.equal(pet.snapshot().state, 'Jumping')
  assert.deepEqual(pet.snapshot().position, anchor)
  advanceUntil(pet, 'Idle')
  assert.deepEqual(pet.snapshot().position, { x: 1100, y: 620 })
})

test('la pelota exige aproximación y alineación, y guarda la postura final tumbada', () => {
  const pet = new PetController(timing)
  pet.request({ type: 'object', id: 'ball' })
  const entered = advanceUntil(pet, 'Playing')
  assert.ok(entered.includes('Stopping') && entered.includes('Aligning'))
  assert.deepEqual(pet.snapshot().position, roomObjects.ball.interaction)
  assert.equal(pet.snapshot().layers.context, 'Play')
  assert.equal(pet.poseForStorage().posture, 'standing')
  advanceUntil(pet, 'Lying')
  let saved = ''
  const persistence = new PetPersistenceService(() => ({ getItem: () => saved, setItem: (_, value) => { saved = value } }))
  persistence.save(pet.poseForStorage())
  const restored = new PetController(timing, persistence.load())
  assert.equal(restored.snapshot().state, 'Lying')
  assert.deepEqual(restored.snapshot().position, roomObjects.ball.interaction)
  restored.request({ type: 'stand' })
  assert.deepEqual(advanceUntil(restored, 'Idle'), ['WakingUp', 'StandingUp', 'Idle'])
})

test('Idle respira y parpadea por tiempo con velocidad y distancia cero', () => {
  const pet = new PetController(timing)
  const initial = pet.snapshot()
  for (let frame = 0; frame < 36; frame++) pet.advance(80)
  const idle = pet.snapshot()
  assert.equal(idle.animation.clip, 'idle')
  assert.equal(idle.animation.speed, 0)
  assert.equal(idle.animation.distance, 0)
  assert.equal(idle.animation.elapsed, 2880)
  assert.equal(idle.position, initial.position)
  assert.ok(sampleIdleMotion(idle.animation.elapsed, false).breathOffset > 0)
  assert.equal(sampleIdleMotion(idle.animation.elapsed, false).blinking, true)
  assert.equal(sampleIdleMotion(idle.animation.elapsed + idleDurationMs, false).blinking, true)
  assert.deepEqual(sampleIdleMotion(idle.animation.elapsed, true), { breathOffset: 0, blinking: false })
  assert.deepEqual(sampleIdleMotion(0, false), sampleIdleMotion(idleDurationMs, false))
})

test('las repeticiones de marcha y carrera conservan posición y orientación en el relevo Stop → Idle', () => {
  for (const [choice, moving, facing, topSpeed] of [
    ['walk-stop-idle', 'Walking', 'right', 240], ['run-stop-idle', 'Running', 'left', 355],
  ] as const) {
    const frames = captureTransition(choice, facing)
    assert.deepEqual([...new Set(frames.map(frame => frame.state))], [moving, 'Stopping', 'Idle'])
    for (let i = 1; i < frames.length; i++) {
      const previous = frames[i - 1].position
      const current = frames[i].position
      assert.ok(canWalkSegment(previous, current))
      assert.ok(Math.hypot(current.x - previous.x, current.y - previous.y) <= topSpeed * previewStepMs / 1000 + .001)
      assert.equal(frames[i].animation.facing, facing)
    }
    const stopped = frames.find(frame => frame.state === 'Stopping')!
    const idle = frames.at(-1)!
    assert.deepEqual(idle.position, stopped.position)
    assert.equal(idle.animation.speed, 0)
    assert.equal(idle.animation.distance, stopped.animation.distance)
  }
})

test('la repetición Sit → StandUp → Idle mantiene el ancla y conserva la postura final', () => {
  const frames = captureTransition('sit-stand-idle', 'left')
  assert.deepEqual([...new Set(frames.map(frame => frame.state))], ['SittingDown', 'Sitting', 'StandingUp', 'Idle'])
  for (const frame of frames) {
    assert.deepEqual(frame.position, spawn)
    assert.equal(frame.animation.facing, 'left')
    assert.equal(frame.animation.distance, 0)
  }
  assert.equal(frames.at(-1)?.animation.clip, 'idle')
})

test('la marcha pasa por Stop y el reloj de Idle continúa sin arrastrar la distancia', () => {
  const pet = new PetController(timing)
  const anchor = { x: 800, y: 620 }
  pet.request({ type: 'move', target: anchor })
  assert.deepEqual(advanceUntil(pet, 'Idle'), ['Walking', 'Stopping', 'Idle'])
  const arrival = pet.snapshot().animation
  pet.advance(80)
  const idle = pet.snapshot()
  assert.equal(idle.animation.clip, 'idle')
  assert.equal(idle.animation.elapsed, arrival.elapsed + 80)
  assert.equal(idle.animation.speed, 0)
  assert.equal(idle.animation.distance, arrival.distance)
  assert.deepEqual(idle.position, anchor)
})

test('la preferencia inicial de autonomía es activa y el apagado se conserva', () => {
  const values = new Map<string, string>()
  const storage = () => ({ getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } })
  const persistence = new PetPersistenceService(storage)
  assert.equal(persistence.loadAutonomy(), true)
  persistence.saveAutonomy(false)
  assert.equal(new PetPersistenceService(storage).loadAutonomy(), false)
  persistence.saveAutonomy(true)
  assert.equal(persistence.loadAutonomy(), true)
})

test('una ruta manual releva el desplazamiento autónomo y reinicia el intervalo de inactividad', () => {
  const pet = new PetController(timing)
  const behavior = new PetBehaviorController(() => .4, [800, 800])
  pet.requestAutonomous({ type: 'move', target: { x: 1000, y: 610 } })
  pet.advance(80)
  const manual = { x: 510, y: 635 }
  behavior.reset()
  pet.request({ type: 'move', target: manual })
  assert.equal(pet.snapshot().state, 'Stopping')
  assert.equal(behavior.advance(800, pet.snapshot()), undefined)
  assert.ok(advanceUntil(pet, 'Idle').includes('Turning'))
  assert.deepEqual(pet.snapshot().position, manual)
  assert.equal(behavior.advance(799, pet.snapshot()), undefined)
  assert.deepEqual(behavior.advance(1, pet.snapshot()), { type: 'look' })
})

test('el descanso autónomo puede terminar despertando y el reposo voluntario permanece protegido', () => {
  const pet = new PetController(timing)
  const behavior = new PetBehaviorController(() => .85, [100, 100], [100, 100])
  pet.requestAutonomous({ type: 'object', id: 'bed' })
  advanceUntil(pet, 'Resting')
  const intent = behavior.advance(100, pet.snapshot())
  assert.deepEqual(intent, { type: 'stand' })
  pet.requestAutonomous(intent!)
  assert.deepEqual(advanceUntil(pet, 'Idle'), ['WakingUp', 'StandingUp', 'Idle'])

  pet.request({ type: 'object', id: 'bed' })
  advanceUntil(pet, 'Resting')
  assert.equal(behavior.advance(40_000, pet.snapshot()), undefined)
})
