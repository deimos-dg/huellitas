# Corrección de Idle y autonomía · Huellitas de Luz 2.0

## Causa raíz

La habitación seleccionaba el primer fotograma de `Walk` para `Idle`, incluso después de completar `Stop`. El controlador salía de la actualización antes de avanzar el tiempo de las posturas estables y React detenía el ciclo de actualización cuando la autonomía estaba apagada. Con la configuración anterior, que empezaba apagada, el Golden se quedaba sobre esa pose inicial de marcha indefinidamente. Activar la autonomía por sí sola habría intercalado acciones visibles sin dar vida a `Idle` entre ellas.

## Solución

- `Idle`, `Stop` con velocidad cero y el final de `StandUp` comparten una pose de pie del atlas de la habitación. Los cuatro apoyos están dibujados en la pose original. El desplazamiento sigue la secuencia marcha o carrera → frenado → `Stop` → `Idle`.
- El reloj de locomoción usa distancia recorrida. El reloj de `Idle` y de las acciones estacionarias usa `deltaTime`. `Idle` avanza con velocidad cero y autonomía apagada. El navegador limita los repintados de reposo y suspende el reloj mientras la pestaña está oculta.
- La respiración tiene un período aproximado de 3,1 s y una variación vertical máxima del 1,9 % con el origen en el apoyo. El parpadeo aparece en ventanas breves de un ciclo de 15,5 s sobre la misma pose de pie. La preferencia de movimiento reducido muestra esa pose sin respiración ni parpadeo visual.
- La autonomía empieza activa. El control **Comportamiento autónomo** guarda la elección localmente. El controlador existente evalúa nuevas intenciones tras 6,5–11 s de inactividad y valida la ruta antes de caminar. El descanso iniciado por la autonomía puede terminar despertando o estirándose tras 11–17 s.
- Una orden manual reinicia el intervalo. Si toma el control durante una marcha autónoma, primero aplica frenado sobre el tramo válido. Si llega durante un salto, aterrizaje u otra transición protegida, espera hasta una postura estable. Los desplazamientos terminan en `Idle`. Comer, beber, jugar y acostarse conservan sus posturas finales. Un descanso elegido tocando la cama dura hasta que el usuario dé otra orden.

## Recursos y limitaciones visuales

El dibujo base es la página 0 de la pista `posture` del atlas `golden-room-art.webp`, que corresponde al fotograma 12. El párpado se recorta de la página 9 de esa misma pista, fotograma 21. Ambas poses proceden del GIF original del Golden sentándose. La respiración transforma la pose de pie alrededor del apoyo y el parpadeo aplica el recorte dibujado al tamaño de cada ojo en la vista de tres cuartos. Los atlas conservan los dibujos originales. [Manifiesto de la habitación](../apps/web/src/assets/pet-motion-2d/golden-room.json)

El GIF de cola del creador está dibujado sentado. El atlas actual carece de un ciclo de cola, orejas y respiración articulada compatible con la postura de pie. El trote sigue pendiente de un ciclo propio. La mirada usa el arco ya validado del giro, elegido por la autonomía. Si falta el atlas de la habitación, se usa una pose de pie del atlas base con respiración y un aviso. El parpadeo necesita el recorte del atlas de habitación. Si fallan ambos, aparece el indicador provisional.

## Archivos modificados

| Área | Archivos |
| --- | --- |
| Tiempo y catálogo | Nuevo `domain/idleMotion.ts`. Actualizado `domain/animationCatalog.ts`. |
| Control | `controllers/PetController.ts`, `controllers/PetBehaviorController.ts` y `scene/usePet.ts`. |
| Renderizado y guardado | `adapters/goldenAnimations.ts`, `adapters/persistence.ts`, `scene/RoomPet.tsx` y `apps/web/src/styles/pet-room.css`. |
| Pruebas | `tests/pet-motion-2d/pet-motion.test.ts` y `tests/e2e/pet-room.spec.ts`. |

Los archivos de dominio, control, escena y adaptadores están en `apps/web/src/features/pet-motion-2d`.

## Resultados

| Verificación | Resultado |
| --- | --- |
| `npm run build` | TypeScript y compilación de producción aprobados. |
| `npm run test:pet-motion` | 28 aprobadas. Incluyen tiempo de Idle sin desplazamiento, transición desde marcha, preferencia de autonomía, prioridad y descanso protegido. |
| `npm run test:e2e -- --fully-parallel --workers=4 --timeout=45000` con Chrome | 23 aprobadas, incluida la suite anterior. Se comprobó el parpadeo de ambos ojos sin autonomía, el regreso a Idle después de caminar y el relevo y reanudación de la autonomía. Playwright terminó con código `0` después del cierre manual de su Vite en Windows. |
| Vista de producción en Chrome | La ruta respondió HTTP `200`. Con la autonomía apagada se observó la escala de respiración y los dos párpados mientras el ancla permanecía en `(574, 590)`. |
| `dotnet test Huellitas.slnx --no-restore` | 2 pruebas HTTP aprobadas con el proveedor de registro de Windows en nivel `Critical` solo para ese proceso. La prueba de PostgreSQL quedó omitida. |
