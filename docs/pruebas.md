# Pruebas de la Fase 1

## Ejecución

Completa la [instalación local](instalacion.md). La prueba de PostgreSQL requiere una conexión con permiso `CREATEDB` a una instancia de desarrollo. La prueba crea una base temporal con un nombre aleatorio y la elimina al terminar. Sin `HUELLITAS_TEST_POSTGRES` se ejecutan las otras dos pruebas de API y la prueba de persistencia aparece como omitida.

```powershell
$env:HUELLITAS_TEST_POSTGRES = $env:ConnectionStrings__Huellitas
dotnet test Huellitas.slnx
dotnet ef migrations has-pending-model-changes --project apps/api
npm run build
npx playwright install chromium
npm run test:e2e
```

Para ejecutar Playwright con una instalación local de Chrome, establece `$env:HUELLITAS_BROWSER_CHANNEL = 'chrome'` antes de `npm run test:e2e`. En ese caso puedes omitir la descarga de Chromium. La suite inicia Vite en el puerto local `5174` y finaliza el servidor al terminar.

## Resultados del 18 de noviembre de 2026

Entorno Windows con Node.js 24, .NET SDK 10, PostgreSQL 17 en Docker y Chrome local.

| Verificación | Resultado |
| --- | --- |
| `npm run build` | TypeScript y compilación de producción de Vite correctos. |
| `dotnet build Huellitas.slnx --no-restore` | Compilación correcta, con 0 errores y 0 advertencias. |
| `dotnet publish apps/api -c Release --no-restore` | Artefacto local de publicación generado correctamente. |
| `dotnet ef database update --project apps/api` | Migración `20261118072458_InitialIdentity` aplicada en PostgreSQL. El modelo coincide con la última migración. |
| `dotnet test Huellitas.slnx --no-build` | 3 aprobadas, 0 omitidas y 0 fallidas. Incluyen el contrato de la API, la separación entre vitalidad y disponibilidad, la migración en una base nueva, los roles iniciales, la persistencia y el rechazo del correo duplicado. |
| `npm run test:e2e` | 7 aprobadas. Cubren los destinos de las llamadas a la acción, teclado, FAQ, menú táctil y anchos de 320, 768, 1024 y 1440 px. |
| Arranque conjunto | Portada, comprobaciones de salud y respuesta de la API por el proxy de Vite con HTTP `200`. Se revisó visualmente la portada en escritorio y teléfono emulado. |

## Resultados de la Fase 2

| Verificación | Resultado |
| --- | --- |
| `npm run prepare:pets` | 18 retratos y 151 fotogramas preparados. Se comprobaron los canales alfa y las dimensiones de los atlas WebP y sus máscaras. |
| `npm run build` | TypeScript y compilación de producción de la portada y el creador correctos. |
| `npm run test:e2e` | 11 aprobadas en Chrome. Las 4 pruebas del creador cubren el acceso desde la portada, las variantes, el Sphynx, la validación, la personalización, la revisión, el movimiento reducido y el ancho de 320 px. |
| `dotnet test Huellitas.slnx --no-restore` | 3 aprobadas, incluidas las pruebas de integración con PostgreSQL local. |
| Previsualización de la compilación | `/creador` y sus atlas respondieron con HTTP `200`. Se revisó la pantalla en escritorio y en teléfono emulado. |

## Ampliación de las animaciones

| Verificación | Resultado |
| --- | --- |
| `npm run prepare:pets` | 18 atlas animados y 751 fotogramas. Se comprobaron las dimensiones y la transparencia de cada atlas y su máscara. |
| `npm run build` | TypeScript y compilación de producción correctos. |
| `npm run test:e2e` | 12 aprobadas en Chrome. Incluyen el movimiento reducido, la pausa y el aterrizaje y la repetición del salto del Sphynx. |
| Creador activo en `127.0.0.1:5173` | Las 18 variantes cargaron su propio atlas sin errores de JavaScript. |
