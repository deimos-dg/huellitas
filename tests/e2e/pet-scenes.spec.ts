import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import sharp from 'sharp'

const storageKey = 'huellitas.petmotion2d.v1'

async function coordinate(page: Page, x: number, y: number) {
  const stage = page.getByTestId('room-stage')
  const box = await stage.boundingBox()
  if (!box) throw new Error('El escenario debe ser visible')
  await stage.getByRole('button', { name: 'Desplazar al Golden por el suelo' }).click({
    position: { x: x / 1280 * box.width, y: y / 720 * box.height },
  })
}

async function expectPosition(page: Page, x: number, y: number, tolerance = 0) {
  const pet = page.getByTestId('room-pet')
  await expect.poll(async () => {
    const [actualX, actualY] = await Promise.all([pet.getAttribute('data-x'), pet.getAttribute('data-y')])
    return Math.hypot(Number(actualX) - x, Number(actualY) - y)
  }).toBeLessThanOrEqual(tolerance)
}

test('carga el jardín original y activa los objetos pintados sin añadir copias del mobiliario', async ({ page }) => {
  await page.goto('/habitacion')
  const stage = page.getByTestId('room-stage')
  await expect(stage).toHaveAttribute('data-scene', 'garden')
  await expect(stage.locator('.room-scene-base img')).toHaveAttribute('src', /01_Jardin/)
  await expect(stage.locator('.room-wall, .room-object')).toHaveCount(0)
  await page.getByRole('checkbox', { name: 'Comportamiento autónomo' }).uncheck()
  await coordinate(page, 997, 411) // Pata del banco, debajo de la zona táctil.
  await expect(page.getByRole('status')).toContainText('Elige un punto libre del suelo')
  await expectPosition(page, 631.25, 557.5)

  await stage.getByRole('button', { name: 'Descansar junto a la casita' }).click()
  await expect(stage).toHaveAttribute('data-state', 'Resting', { timeout: 10_000 })
  await expectPosition(page, 692.5, 447.5)
  await expect(page.getByTestId('room-pet')).toHaveAttribute('data-facing', 'left')

  await stage.getByRole('button', { name: 'Explorar el comedero' }).click()
  await expect(stage).toHaveAttribute('data-state', 'Looking', { timeout: 10_000 })
  await expectPosition(page, 1085, 455)
  await expect(stage).toHaveAttribute('data-state', 'Idle')
})

test('el parque rodea obstáculos, cancela la ruta al salir y restaura cada posición', async ({ page }) => {
  await page.goto('/habitacion')
  await page.getByRole('checkbox', { name: 'Comportamiento autónomo' }).uncheck()
  await coordinate(page, 796, 596)
  await expectPosition(page, 796, 596, 5)
  const picker = page.getByLabel('Escenario')
  await expect(picker.locator('option[value="dressingRoom"]')).toBeDisabled()
  await picker.selectOption('park')
  await expect(page).toHaveURL(/escena=park$/)
  await expect(picker).toBeFocused()
  const stage = page.getByTestId('room-stage')
  await expect(stage.locator('.room-scene-base img')).toHaveAttribute('src', /05_Parque/)
  await stage.getByRole('button', { name: 'Observar el aro' }).click()
  await expect(stage).toHaveAttribute('data-state', 'Walking')
  await picker.selectOption('garden')
  await expectPosition(page, 796, 596, 5)
  const parkPosition = await page.evaluate(key => JSON.parse(localStorage.getItem(`${key}.park`)!).position, storageKey)

  await page.goBack()
  await expect(stage).toHaveAttribute('data-scene', 'park')
  await expect(stage).toHaveAttribute('data-state', 'Idle')
  await expectPosition(page, parkPosition.x, parkPosition.y)
  await stage.getByRole('button', { name: 'Observar el aro' }).click()
  await expect(stage).toHaveAttribute('data-state', 'Looking', { timeout: 12_000 })
  await expectPosition(page, 833.75, 410)
  await expect(stage).toHaveAttribute('data-state', 'Idle')
  await page.reload()
  await expectPosition(page, 833.75, 410)
  await page.goto('/habitacion?escena=dressingRoom')
  await expect(page.getByRole('alert')).toContainText('Vestidor y accesorios está pendiente')
  await expect(stage).toHaveAttribute('data-scene', 'garden')
})

test('en móvil el mapa y los puntos de interacción coinciden con la proporción original', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/habitacion?escena=park')
  await page.getByRole('checkbox', { name: 'Comportamiento autónomo' }).uncheck()
  const stage = page.getByTestId('room-stage')
  const art = stage.locator('.room-scene-base img')
  const { naturalWidth, naturalHeight, ratio } = await art.evaluate(async (img: HTMLImageElement) => {
    await img.decode()
    const { width, height } = img.getBoundingClientRect()
    return { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, ratio: width / height }
  })
  expect([naturalWidth, naturalHeight]).toEqual([1671, 941])
  expect(ratio).toBeCloseTo(naturalWidth / naturalHeight, 3)
  await page.getByText('Depuración de la habitación', { exact: true }).click()
  await page.getByRole('checkbox', { name: 'Mostrar geometría y ruta' }).check()
  const overlay = page.getByTestId('room-debug-overlay')
  await expect(overlay.locator('polygon[data-obstacle]')).toHaveCount(8)
  const [box, debugBox] = await Promise.all([stage.boundingBox(), overlay.boundingBox()])
  expect(debugBox).toEqual(box)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360)
  await stage.getByRole('button', { name: 'Saltar frente a la valla' }).click()
  await expect(stage).toHaveAttribute('data-state', 'Jumping', { timeout: 8000 })
  await expectPosition(page, 580, 540)
})

test('el jardín simula las 14:00 y las 20:00 y dibuja la misma iluminación en su máscara', async ({ page }) => {
  await page.goto('/habitacion')
  await page.getByText('Depuración de la habitación', { exact: true }).click()
  await page.getByText('Simular hora', { exact: true }).click()
  const input = page.getByLabel('Hora simulada')
  const stage = page.getByTestId('room-stage')
  const profiles = stage.locator('.day-night')
  for (const [hour, period] of [['14:00', 'day'], ['20:00', 'night']] as const) {
    await input.fill(hour)
    await page.getByRole('button', { name: 'Aplicar hora' }).click()
    await expect(profiles).toHaveCount(2)
    await expect(profiles.nth(0)).toHaveAttribute('data-period', period)
    await expect(profiles.nth(1)).toHaveAttribute('data-period', period)
    await expect(stage.locator('.room-pet-drawing .pet-sprite-art')).toHaveCSS('filter', 'none')
  }
  await page.getByRole('checkbox', { name: 'Mostrar máscaras de oclusión' }).check()
  await expect(page.getByTestId('room-debug-overlay').locator('[data-debug-mask="roca-jardin"]')).toBeVisible()
})

test('la roca de primer plano tapa píxeles del Golden sin cambiar las huellas ni el fondo', async ({ page }) => {
  await page.setViewportSize({ width: 1250, height: 940 })
  await page.clock.setFixedTime(new Date(2026, 10, 22, 14, 0))
  await page.goto('/habitacion')
  await page.getByRole('checkbox', { name: 'Comportamiento autónomo' }).uncheck()
  const stage = page.getByTestId('room-stage')
  const mask = stage.locator('[data-mask="roca-jardin"]')
  await mask.locator('img').evaluate((img: HTMLImageElement) => img.decode())
  const background = await stage.screenshot()
  await coordinate(page, 263, 652)
  await expectPosition(page, 263, 652, 5)
  await expect(stage).toHaveAttribute('data-state', 'Idle')
  const masked = await stage.screenshot()
  await mask.evaluate(node => { (node as HTMLElement).style.visibility = 'hidden' })
  const exposed = await stage.screenshot()
  const [original, front, pet] = await Promise.all([background, masked, exposed].map(bytes =>
    sharp(bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true })))
  const { width, height } = front.info
  let covered = 0
  for (let y = Math.floor(height * .875); y < height * .947; y++) {
    for (let x = Math.floor(width * .126); x < width * .233; x++) {
      const offset = (y * width + x) * 3
      const pixel = front.data.subarray(offset, offset + 3)
      if (pixel.equals(original.data.subarray(offset, offset + 3)) && !pixel.equals(pet.data.subarray(offset, offset + 3))) covered++
    }
  }
  expect(covered).toBeGreaterThan(15)
  await expectPosition(page, 263, 652, 5)
})

test('la cocina original bloquea los muebles y usa Eat y Drink con recipientes independientes', async ({ page }) => {
  await page.goto('/habitacion')
  await page.getByRole('checkbox', { name: 'Comportamiento autónomo' }).uncheck()
  const picker = page.getByLabel('Escenario')
  await picker.selectOption('kitchen')
  await expect(page).toHaveURL(/escena=kitchen$/)
  const stage = page.getByTestId('room-stage')
  await expect(stage).toHaveAttribute('data-scene', 'kitchen')
  const art = stage.locator('.room-scene-base img')
  await expect(art).toHaveAttribute('src', /03_Cocina/)
  expect(await art.evaluate(async (img: HTMLImageElement) => {
    await img.decode()
    return [img.naturalWidth, img.naturalHeight]
  })).toEqual([1671, 941])

  for (const [x, y] of [[516, 650], [845, 545]]) {
    await coordinate(page, x, y)
    await expect(page.getByRole('status')).toContainText('Elige un punto libre del suelo')
    await expectPosition(page, 893.75, 653.75)
  }

  const pet = page.getByTestId('room-pet')
  const drawing = pet.locator('.room-pet-drawing')
  const body = drawing.locator('.room-pet-artwork')
  for (const [label, action, point, facing, cell] of [
    ['Comedero', 'Eating', 560, 'right', /^(18|19|20)$/],
    ['Bebedero', 'Drinking', 768.75, 'left', /^(23|24|25)$/],
  ] as const) {
    await stage.getByRole('button', { name: label, exact: true }).click()
    await expect(stage).toHaveAttribute('data-state', action, { timeout: 10_000 })
    await expectPosition(page, point, 567.5)
    await expect(pet).toHaveAttribute('data-facing', facing)
    await expect(drawing).toHaveAttribute('data-frame', cell)
    await expect(body).toHaveCSS('clip-path', /^polygon\(/)
    await expect(stage).toHaveAttribute('data-state', 'Sitting')
    await expect(body).toHaveCSS('clip-path', 'none')
  }
  await expect(stage.locator('.room-object-food, .room-object-water')).toHaveCount(0)
  await picker.selectOption('garden')
  await expectPosition(page, 631.25, 557.5)
  await picker.selectOption('kitchen')
  await expectPosition(page, 768.75, 567.5)
  await expect(stage).toHaveAttribute('data-state', 'Sitting')
  await page.reload()
  await expectPosition(page, 768.75, 567.5)
})

test('la cocina ajusta el apoyo en móvil y sincroniza la lámpara con la hora local', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.clock.setFixedTime(new Date(2026, 10, 23, 20, 0))
  await page.goto('/habitacion?escena=kitchen')
  await page.getByRole('checkbox', { name: 'Comportamiento autónomo' }).uncheck()
  const stage = page.getByTestId('room-stage')
  const base = stage.locator('.room-scene-base .day-night')
  await expect(base).toHaveAttribute('data-period', 'night')
  await expect(base.locator('.day-night-lights')).toHaveCSS('opacity', '0.76')
  await expect(base.locator('.day-night-wash, .day-night-moon')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360)

  await stage.getByRole('button', { name: 'Bebedero' }).click()
  await expect(stage).toHaveAttribute('data-state', 'Drinking', { timeout: 10_000 })
  await expectPosition(page, 768.75, 567.5)
  const alignment = await page.getByTestId('room-pet').evaluate(pet => {
    const drawing = pet.querySelector('.room-pet-drawing')!
    const rect = drawing.getBoundingClientRect()
    const ground = parseFloat(getComputedStyle(drawing).getPropertyValue('--room-art-ground')) / 100
    return Math.abs(rect.top + rect.height * ground - pet.getBoundingClientRect().top)
  })
  expect(alignment).toBeLessThan(1)
  await expect(stage.locator('[data-mask="mesa-cocina"]')).toHaveCSS('clip-path', /^polygon\(/)
})

test('el selector abre el arte de la sala después de visitar jardín, parque y cocina', async ({ page }) => {
  await page.goto('/habitacion')
  const stage = page.getByTestId('room-stage')
  await expect(stage).toHaveAttribute('data-scene', 'garden')
  const picker = page.getByLabel('Escenario')
  for (const scene of ['park', 'kitchen', 'living-room']) {
    await picker.selectOption(scene)
    await expect(stage).toHaveAttribute('data-scene', scene)
  }
  await expect(page).toHaveURL(/escena=living-room$/)
  const art = stage.locator('.room-scene-base img')
  await expect(art).toHaveAttribute('src', /04_Sala_de_descanso/)
  expect(await art.evaluate(async (img: HTMLImageElement) => {
    await img.decode()
    return [img.naturalWidth, img.naturalHeight]
  })).toEqual([1672, 941])
  await expect(stage.locator('.room-wall, .room-object')).toHaveCount(0)
  await page.goto('/habitacion?escena=lounge')
  await expect(stage).toHaveAttribute('data-scene', 'living-room')
})

test('las dos camas y el despertar usan apoyos propios que sobreviven al cambio de escena', async ({ page }) => {
  await page.goto('/habitacion?escena=living-room')
  await page.getByRole('checkbox', { name: 'Comportamiento autónomo' }).uncheck()
  const stage = page.getByTestId('room-stage')
  for (const [x, y] of [[650, 500], [287.5, 620]]) { // Mesa y borde de la cama fuera de su botón.
    await coordinate(page, x, y)
    await expect(page.getByRole('status')).toContainText('Elige un punto libre del suelo')
    await expectPosition(page, 726.25, 642.5)
  }

  const drawing = page.getByTestId('room-pet').locator('.room-pet-drawing')
  await stage.getByRole('button', { name: 'Cama verde' }).click()
  await expect(stage).toHaveAttribute('data-state', 'Settling', { timeout: 10_000 })
  await expect(stage).toHaveAttribute('data-state', 'Resting')
  await expectPosition(page, 193.75, 557.5)
  await expect(drawing).toHaveAttribute('data-frame', '34')

  const picker = page.getByLabel('Escenario')
  await picker.selectOption('kitchen')
  await expect(stage).toHaveAttribute('data-scene', 'kitchen')
  await picker.selectOption('living-room')
  await expect(stage).toHaveAttribute('data-state', 'Resting')
  await expectPosition(page, 193.75, 557.5)

  await stage.getByRole('button', { name: 'Cama rosa' }).click()
  await expect(stage).toHaveAttribute('data-state', 'WakingUp')
  await expect(stage).toHaveAttribute('data-state', 'Resting', { timeout: 12_000 })
  await expectPosition(page, 361.25, 485, .01)
  await page.reload()
  await expectPosition(page, 361.25, 485, .01)
  await expect(stage).toHaveAttribute('data-state', 'Resting')
  await page.getByRole('button', { name: 'Levantarse' }).click()
  await expect(stage).toHaveAttribute('data-state', 'WakingUp')
  await expect(stage).toHaveAttribute('data-state', 'Idle')
  await expectPosition(page, 417.5, 555, .01)
})

test('la sala se adapta al móvil y permite jugar y descansar sin usar el rascador felino', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.clock.setFixedTime(new Date(2026, 10, 23, 20, 0))
  await page.goto('/habitacion?escena=living-room')
  await page.getByRole('checkbox', { name: 'Comportamiento autónomo' }).uncheck()
  const stage = page.getByTestId('room-stage')
  const ratio = await stage.evaluate(node => {
    const { width, height } = node.getBoundingClientRect()
    return width / height
  })
  expect(ratio).toBeCloseTo(1672 / 941, 3)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360)
  await expect(stage.getByRole('button', { name: /Rascador/ })).toBeDisabled()
  const lights = stage.locator('.room-scene-base .day-night')
  await expect(lights).toHaveAttribute('data-period', 'night')
  await expect(lights.locator('.day-night-lights')).toHaveCSS('opacity', '0.76')
  await expect(lights.locator('.day-night-wash')).toHaveCount(0)

  await stage.getByRole('button', { name: 'Jugar con la pelota' }).click()
  await expect(stage).toHaveAttribute('data-state', 'Playing', { timeout: 10_000 })
  await expectPosition(page, 1060, 632.5)
  await expect(stage.locator('.room-pet-artwork')).toHaveCSS('clip-path', /^polygon\(/)
  await expect(stage.locator('[data-mask="pelota-sala"]')).toBeVisible()
  await expect(stage).toHaveAttribute('data-state', 'Lying')
  await stage.getByRole('button', { name: 'Descansar en la alfombra' }).click()
  await expect(stage).toHaveAttribute('data-state', 'Resting', { timeout: 12_000 })
  await expectPosition(page, 652.5, 642.5)
})

for (const { id, name, file, naturalWidth, mask, blocked, spawn, target, observation, pending, other, otherSpawn, mobile } of [
  { id: 'bathroom', name: 'baño', file: '02_Bano', naturalWidth: 1671, mask: 'frente-banera',
    blocked: [[880, 597.5], [186.25, 621.25]], spawn: [403.75, 662.5], target: [812.5, 650],
    observation: 'Observar la bañera', pending: 'Baño pendiente de recursos de animación.', other: 'infirmary', otherSpawn: [417.5, 668.75], mobile: false },
  { id: 'infirmary', name: 'enfermería', file: '06_Enfermeria', naturalWidth: 1670, mask: 'caja-carrito',
    blocked: [[600, 605], [1045, 616.25]], spawn: [417.5, 668.75], target: [790, 655],
    observation: 'Observar la mesa de revisión', pending: 'Revisión pendiente de recursos de animación.', other: 'bathroom', otherSpawn: [403.75, 662.5], mobile: true },
] as const) {
  test(`${name} muestra el original, bloquea muebles y guarda la aproximación de observación`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 360, height: 800 })
    await page.clock.setFixedTime(new Date(2026, 10, 23, 20, 0))
    await page.goto('/habitacion')
    await page.getByRole('checkbox', { name: 'Comportamiento autónomo' }).uncheck()
    const picker = page.getByLabel('Escenario')
    await picker.selectOption(id)
    const stage = page.getByTestId('room-stage')
    await expect(stage).toHaveAttribute('data-scene', id)
    const art = stage.locator('.room-scene-base img')
    await expect(art).toHaveAttribute('src', new RegExp(file))
    expect(await art.evaluate(async (img: HTMLImageElement) => {
      await img.decode()
      return [img.naturalWidth, img.naturalHeight]
    })).toEqual([naturalWidth, 941])
    const box = await stage.boundingBox()
    expect(box!.width / box!.height).toBeCloseTo(naturalWidth / 941, 3)
    if (mobile) expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360)

    const light = stage.locator('.room-scene-base .day-night')
    await expect(light).toHaveAttribute('data-period', 'night')
    await expect(light.locator('.day-night-lights')).toHaveCSS('opacity', '0.76')
    await expect(light.locator('.day-night-wash, .day-night-moon')).toHaveCount(0)
    const foreground = stage.locator(`[data-mask="${mask}"]`)
    await expect(foreground).toHaveCSS('clip-path', /^polygon\(/)
    await expect(foreground.locator('.day-night')).toHaveAttribute('data-period', 'night')

    for (const [x, y] of blocked) {
      await coordinate(page, x, y)
      await expect(page.getByRole('status')).toContainText('Elige un punto libre del suelo')
      await expectPosition(page, ...spawn, .01)
    }

    await stage.getByRole('button', { name: observation }).click()
    await expect(stage).toHaveAttribute('data-state', 'Looking', { timeout: 10_000 })
    await expectPosition(page, ...target, .01)
    await expect(page.getByTestId('room-pet')).toHaveAttribute('data-facing', 'left')
    await expect(page.getByRole('status')).toContainText(pending)
    await expect(stage).toHaveAttribute('data-state', 'Idle')
    await picker.selectOption(other)
    await expectPosition(page, ...otherSpawn, .01)
    await picker.selectOption(id)
    await expectPosition(page, ...target, .01)
    await page.reload()
    await expect(stage).toHaveAttribute('data-state', 'Idle')
    await expectPosition(page, ...target, .01)
  })
}
