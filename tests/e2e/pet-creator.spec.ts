import { expect, test } from '@playwright/test'

test('abre el creador desde la portada y muestra nueve variantes por especie', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Creador' }).click()
  await expect(page).toHaveURL(/\/creador$/)
  await expect(page.getByRole('heading', { name: 'Crea tu mascota' })).toBeVisible()

  const variantGroup = page.getByRole('group', { name: 'Raza o variante' })
  await expect(variantGroup.getByRole('radio')).toHaveCount(9)
  await expect(variantGroup.getByRole('radio', { name: 'Golden retriever' })).toBeChecked()
  await page.getByRole('group', { name: 'Especie' }).getByText('Gato', { exact: true }).click()
  await expect(variantGroup.getByRole('radio')).toHaveCount(9)
  await expect(variantGroup.getByRole('radio', { name: 'Atigrado' })).toBeChecked()

  await variantGroup.getByText('Sphynx', { exact: true }).click()
  await expect(page.getByRole('img', { name: /Vista previa de Sphynx/ })).toBeVisible()
  await expect(page.getByText('Piel casi sin pelo, orejas grandes y cuerpo esbelto.')).toBeVisible()
  await expect(page.getByRole('group', { name: 'Tono de piel' })).toBeVisible()
  await expect(page.getByText('Retrato 2D', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Movimiento', { exact: true }).locator('option')).toHaveCount(14)
})

test('valida el nombre, aplica las opciones al retrato y conserva el borrador durante la revisión', async ({ page }) => {
  await page.goto('/creador')
  const review = page.getByRole('button', { name: 'Revisar mascota' })
  const name = page.getByRole('textbox', { name: 'Nombre' })

  await review.click()
  await expect(name).toBeFocused()
  await expect(page.getByRole('alert')).toHaveText('Escribe un nombre para revisar tu mascota.')

  await page.getByRole('group', { name: 'Raza o variante' }).getByText('Beagle', { exact: true }).click()
  await name.fill('  Canela  ')
  await page.getByRole('group', { name: 'Tono del pelaje' }).getByText('Suave', { exact: true }).click()
  const collarOption = page.getByRole('group', { name: 'Color del collar' }).getByText('Azul lago', { exact: true })
  await expect(collarOption.locator('.color-swatch')).toHaveCSS('background-image', 'none')
  await collarOption.click()

  const portrait = page.getByRole('img', { name: 'Vista previa de Canela, Beagle' })
  await expect(portrait.locator('.pet-sprite-art')).toHaveCSS('filter', 'saturate(0.68) brightness(1.1)')
  await expect(portrait.locator('.pet-sprite-collar')).toHaveCSS('background-color', 'rgb(61, 114, 144)')
  await expect(portrait.locator('.pet-sprite-art')).toHaveCSS('background-image', /portraits-art\.webp/)
  const movement = page.getByLabel('Movimiento', { exact: true })
  await movement.selectOption('walk')
  await expect(portrait.locator('.pet-sprite-art')).toHaveCSS('background-image', /beagle-art\.webp/)
  await expect(portrait.locator('.pet-sprite-body')).toHaveCSS('scale', '0.64')
  await movement.selectOption('idle')
  await expect(portrait.locator('.pet-sprite-art')).toHaveCSS('background-image', /portraits-art\.webp/)

  await review.click()
  const summary = page.getByRole('region', { name: 'Revisa tu mascota' })
  await expect(summary.getByRole('heading')).toBeFocused()
  await expect(summary.getByText('Canela', { exact: true })).toBeVisible()
  await expect(summary.getByText('Azul lago', { exact: true })).toBeVisible()
  await expect(summary.getByText('Suave', { exact: true })).toBeVisible()
  await summary.getByRole('button', { name: 'Volver a editar' }).click()
  await expect(name).toBeFocused()
  await expect(name).toHaveValue('Canela')
  await expect(page.getByRole('radio', { name: 'Beagle' })).toBeChecked()
})

test('respeta el movimiento reducido y permite reproducir y pausar los fotogramas', async ({ page }) => {
  await page.clock.install()
  await page.goto('/creador')
  const animation = page.getByRole('img', { name: /Vista previa de Golden retriever/ }).locator('.pet-sprite-art')
  const movement = page.getByLabel('Movimiento', { exact: true })
  await expect(movement.locator('option')).toHaveCount(14)
  await movement.selectOption({ label: 'Caminar' })
  await expect(page.getByRole('button', { name: 'Reproducir' })).toBeEnabled()
  const initialPose = await animation.evaluate((node) => getComputedStyle(node).backgroundPosition)

  await page.clock.runFor(400)
  await expect(animation).toHaveCSS('background-position', initialPose)
  await page.getByRole('button', { name: 'Reproducir' }).click()
  await page.clock.runFor(175)
  await expect(animation).not.toHaveCSS('background-position', initialPose)

  await page.getByRole('button', { name: 'Pausar' }).click()
  const pausedPose = await animation.evaluate((node) => getComputedStyle(node).backgroundPosition)
  await page.clock.runFor(400)
  await expect(animation).toHaveCSS('background-position', pausedPose)

  await page.getByRole('group', { name: 'Especie' }).getByText('Gato', { exact: true }).click()
  await expect(page.getByRole('img', { name: /Vista previa de Atigrado/ })).toBeVisible()
  await movement.selectOption({ label: 'Dormir' })
  await expect(movement).toHaveValue('sleep')
})

test('reproduce el salto del Sphynx, aterriza y permite repetirlo', async ({ page }) => {
  await page.clock.install()
  await page.goto('/creador')
  await page.getByRole('group', { name: 'Especie' }).getByText('Gato', { exact: true }).click()
  await page.getByRole('group', { name: 'Raza o variante' }).getByText('Sphynx', { exact: true }).click()
  await page.getByLabel('Movimiento', { exact: true }).selectOption('jump')
  const play = page.getByRole('button', { name: 'Reproducir' })
  const body = page.getByRole('img', { name: 'Vista previa de Sphynx' }).locator('.pet-sprite-body')
  const getHeight = () => body.evaluate((node) => {
    const matrix = getComputedStyle(node).transform
    return matrix === 'none' ? 0 : new DOMMatrix(matrix).m42
  })

  await play.click()
  await page.clock.runFor(310)
  expect(await getHeight()).toBeLessThan(-10)

  await page.clock.runFor(700)
  await expect(play).toBeEnabled()
  expect(await getHeight()).toBeCloseTo(0)

  await play.click()
  await page.clock.runFor(310)
  expect(await getHeight()).toBeLessThan(-10)
})

test('mantiene accesible la vista previa en una pantalla de 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/creador')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

  await page.getByRole('link', { name: 'Ver vista previa' }).click()
  await expect(page.getByRole('complementary', { name: 'Vista previa' })).toBeFocused()
})
