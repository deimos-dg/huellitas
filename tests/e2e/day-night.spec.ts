import { expect, test } from '@playwright/test'
import { DayNightController, periodAt } from '../../apps/web/src/features/day-night/DayNightController'

test('clasifica el minuto anterior y el límite de cada periodo', () => {
  const samples = [
    [0, 'night'], [359, 'night'], [360, 'morning'], [599, 'morning'], [600, 'day'],
    [840, 'day'], [1019, 'day'], [1020, 'sunset'], [1109, 'sunset'], [1110, 'dusk'],
    [1169, 'dusk'], [1170, 'night'], [1200, 'night'], [1439, 'night'],
  ] as const
  for (const [minute, period] of samples) expect(periodAt(minute).id, `Minuto ${minute}`).toBe(period)
})

test('lee saltos del reloj local y conserva la simulación hasta que se desactiva', () => {
  let now = new Date(2026, 10, 22, 14, 0)
  const controller = new DayNightController(() => now)
  const initial = controller.getSnapshot()
  const changes: string[] = []
  const unsubscribe = controller.subscribe(() => changes.push(controller.getSnapshot().period))

  controller.refresh()
  expect(controller.getSnapshot()).toBe(initial)
  expect(initial).toMatchObject({ period: 'day', minute: 840, simulated: false })

  now = new Date(2026, 10, 22, 20, 0)
  controller.refresh()
  expect(controller.getSnapshot()).toMatchObject({ period: 'night', minute: 1200, simulated: false })
  expect(() => controller.simulate(1440)).toThrow(RangeError)
  controller.simulate(0)
  now = new Date(2026, 10, 22, 17, 10)
  controller.refresh()
  expect(controller.getSnapshot()).toMatchObject({ period: 'night', minute: 0, simulated: true })
  controller.simulate(null)
  expect(controller.getSnapshot()).toMatchObject({ period: 'sunset', minute: 1030, simulated: false })
  unsubscribe()
  now = new Date(2026, 10, 22, 9, 15)
  controller.refresh()
  expect(changes).toEqual(['night', 'night', 'sunset'])
})

test.describe('jardín con hora local de Ciudad de México', () => {
  test.use({ timezoneId: 'America/Mexico_City' })

  test('actualiza cielo y luminarias al cambiar el reloj o volver a la pestaña', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-22T20:00:00Z') })
    await page.goto('/jardin')
    const layers = page.locator('.day-night')
    const sun = layers.locator('.day-night-sun')
    const moon = layers.locator('.day-night-moon')
    const scene = page.getByRole('img', { name: /Jardín ilustrado/ })
    await expect(scene).toBeVisible()
    const imageWidth = await scene.evaluate(async (img: HTMLImageElement) => {
      await img.decode()
      return img.naturalWidth
    })
    expect(imageWidth).toBe(1672)
    await expect(layers).toHaveAttribute('data-period', 'day')
    await expect(sun).toHaveCSS('opacity', '1')
    await expect(moon).toHaveCSS('opacity', '0')
    await expect(page.locator('time')).toHaveText('14:00')

    await page.clock.pauseAt(new Date('2026-11-22T20:00:55Z'))
    await page.clock.setSystemTime(new Date('2026-11-23T02:00:00Z'))
    await page.clock.runFor(1000)
    await expect(layers).toHaveAttribute('data-period', 'night')
    await expect(sun).toHaveCSS('opacity', '0')
    await expect(moon).toHaveCSS('opacity', '1')
    await expect(moon).toHaveCSS('transition-duration', '0s')
    await expect(layers.locator('.day-night-lights')).toHaveCSS('opacity', '0.76')
    await expect(page.locator('time')).toHaveText('20:00')

    await page.clock.setSystemTime(new Date('2026-11-22T23:15:00Z'))
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
    await expect(layers).toHaveAttribute('data-period', 'sunset')

    await page.clock.setSystemTime(new Date('2026-11-23T00:45:00Z'))
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await expect(layers).toHaveAttribute('data-period', 'dusk')

    await page.clock.setSystemTime(new Date('2026-11-22T13:45:00Z'))
    await page.evaluate(() => window.dispatchEvent(new Event('pageshow')))
    await expect(layers).toHaveAttribute('data-period', 'morning')
  })

  test('simula una hora en desarrollo y restaura la hora local', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-22T20:00:00Z'))
    await page.goto('/jardin')
    await page.getByText('Simular hora', { exact: true }).click()
    const timeInput = page.getByLabel('Hora simulada', { exact: true })
    await expect(timeInput).toHaveValue('14:00')
    await timeInput.fill('20:00')
    await page.getByRole('button', { name: 'Aplicar hora' }).click()
    await expect(page.locator('.day-night')).toHaveAttribute('data-period', 'night')
    await expect(page.locator('time')).toHaveAttribute('aria-label', 'Hora simulada 20:00')
    await page.getByRole('button', { name: 'Volver a la hora local' }).click()
    await expect(page.locator('.day-night')).toHaveAttribute('data-period', 'day')
    await expect(page.locator('time')).toHaveAttribute('aria-label', 'Hora local 14:00')
    await expect(timeInput).toHaveValue('14:00')
  })
})

test('el jardín se ajusta a móvil y el Golden conserva su escena interactiva', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 })
  await page.goto('/#jardin')
  await page.getByRole('link', { name: 'Visita el jardín' }).click()
  await expect(page.getByRole('heading', { name: 'Jardín de Huellitas' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
  const layers = page.locator('.day-night')
  await expect(layers).toHaveCSS('pointer-events', 'none')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(layers.locator('.day-night-moon')).toHaveCSS('transition-duration', '0.9s')
  await page.getByRole('link', { name: 'Visita la habitación' }).click()
  await expect(page).toHaveURL(/\/habitacion$/)
  await expect(page.locator('.room-scene-base .day-night')).toHaveCount(1)
  const golden = page.getByRole('img', { name: 'Golden Retriever', exact: true })
  await expect(golden).toBeVisible()
  await expect(golden).toHaveCSS('filter', 'none')
  await page.getByRole('checkbox', { name: 'Comportamiento autónomo' }).uncheck()
  await page.getByRole('button', { name: 'Sentarse' }).click()
  await expect(page.getByTestId('room-stage')).toHaveAttribute('data-state', 'Sitting')
})
