import { devices, expect, test } from '@playwright/test'

test('presenta el proyecto y navega a sus tres áreas', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Huellitas de Luz/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Pequeñas huellas.*grandes cambios/)
  const hero = page.getByRole('img', { name: /golden retriever y un gato naranja/ })
  await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)

  await page.getByRole('link', { name: 'Apoya a un refugio', exact: true }).click()
  await expect(page).toHaveURL(/#refugios$/)
  await expect(page.getByRole('article', { name: 'Apoya a un refugio' })).toBeFocused()

  await page.getByRole('link', { name: 'Conoce a los animales' }).click()
  await expect(page).toHaveURL(/#adopciones$/)
  await expect(page.getByRole('article', { name: 'Encuentra un compañero' })).toBeFocused()

  await page.getByRole('link', { name: 'Explora tu jardín' }).click()
  await expect(page).toHaveURL(/#jardin$/)
  await expect(page.getByRole('article', { name: 'Haz crecer tu jardín' })).toBeFocused()
})

test('permite saltar al contenido y abrir las preguntas con teclado', async ({ page }) => {
  await page.goto('/')
  const skipLink = page.getByRole('link', { name: 'Saltar al contenido' })
  await page.keyboard.press('Tab')
  await expect(skipLink).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()

  const question = page.locator('summary').filter({ hasText: '¿Ya puedo hacer una donación?' })
  await question.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Las donaciones aún no están habilitadas.', { exact: false })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Las donaciones aún no están habilitadas.', { exact: false })).toBeHidden()
})

for (const width of [320, 768, 1024, 1440]) {
  test(`ajusta la portada al ancho de ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(horizontalOverflow).toBe(false)
  })
}

test.describe('teléfono', () => {
  const { viewport, deviceScaleFactor, isMobile, hasTouch, userAgent } = devices['Pixel 7']
  test.use({ viewport, deviceScaleFactor, isMobile, hasTouch, userAgent })

  test('conmuta el menú por toque, devuelve el foco con Escape y navega', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByRole('button', { name: /menú/ })
    const navigation = page.getByRole('navigation', { name: 'Navegación principal' })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(navigation).toBeHidden()

    await toggle.tap()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await navigation.getByRole('link', { name: 'Inicio' }).focus()
    await page.keyboard.press('Escape')
    await expect(toggle).toBeFocused()
    await expect(navigation).toBeHidden()

    await toggle.tap()
    await navigation.getByRole('link', { name: 'Adopciones' }).tap()
    await expect(page).toHaveURL(/#adopciones$/)
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(navigation).toBeHidden()
  })
})
