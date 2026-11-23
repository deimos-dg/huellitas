# PetMotion 2D · Fase 4B.1

Se integraron mejoras de reposo y apoyo de las poses existentes, además de herramientas para revisar las transiciones en `/habitacion`. El catálogo conserva `Idle` como **Partial** y `StandUp` y `Stop` como **Placeholder**. La evidencia de esta fase permite revisar lo que sí reproduce el Golden y preparar las poses pendientes.

## Recursos verificados

La revisión partió de la [auditoría de Fase 4A](PETMOTION_PHASE4A.md), la [matriz de recursos](PETMOTION_ASSET_MATRIX.json), el [índice de hojas de contacto](petmotion-contact-sheets/INDEX.md) y la [Fase 3](PETMOTION_PHASE3.md). Los índices de celda parten de cero.

| Recurso WebP | Celdas | Uso verificado |
| --- | --- | --- |
| `golden-room-art.webp` · 2688 × 1584 | 12, 20 y 21 | Pose de pie con cuatro apoyos, pose sentada y dos párpados cerrados dibujados. La pista 12–20 muestra el descenso al sentarse. La pista de despertar llega hasta sentado. |
| `golden-art.webp` · 3584 × 2816 | 0–5 y 17 | Marcha por distancia. La celda 17 de pie permite recuperar una pose estable si falla el atlas de habitación. |
| `golden-run-art.webp` · 1792 × 1408 | 0–15 | Carrera por distancia. Incluye fases en el aire que sirven para revisar la elección del apoyo de salida. |
| `golden-idle-art.webp` · 1792 × 1056 | 0–8 | Referencia de cola sobre cuerpo sentado. Su apoyo y su unión a la grupa corresponden a esa postura. |

El verificador de Fase 4A volvió a comprobar los 418 recortes y el inventario. Los atlas consumidos son los WebP publicados con alfa verificado. Se cotejaron sus SHA-256 con la matriz. Las capturas de esta fase sirven para revisión y quedan fuera de los assets del juego.

## Resultado por animación

| Clip | Estado actual | Resultado del runtime |
| --- | --- | --- |
| Idle | Parcial | La celda 12 conserva silueta, collar, medallón y apoyos. El reloj avanza por tiempo incluso con autonomía desactivada y sin desplazamiento. El tórax muestra un movimiento sutil al trasladar un recorte del mismo arte con máscara suave y ciclo de 3,1 s. Cada ojo toma su propio recorte de la celda 21. La composición vuelve al mismo punto cada 15,5 s. En movimiento reducido y cuando solo está disponible el recurso de respaldo, la pose es estática. |
| StandUp | Provisional | Conserva la posición y la orientación. Con movimiento normal, mantiene la celda 20 hasta el 70 % de los 280 ms y adopta después la celda 12. En movimiento reducido se muestra la pose final desde el inicio del clip. Las dos poses tienen el mismo origen de suelo. La transferencia de peso todavía exige dibujos intermedios hacia delante. |
| Stop | Provisional | Marcha, carrera y frenado activo consultan el mismo muestreo por distancia de su marcha. Al llegar a velocidad cero, Stop sostiene la celda 12 durante 140 ms y entrega esa misma celda a Idle. Se calibró el origen del atlas de habitación en `224/264` y el de marcha y carrera en `300/352`, para superponer sus líneas de suelo en la coordenada de la mascota. El cambio de perfil a tres cuartos sigue visible en la silueta. |

Quedaron terminados el reloj estacionario, la composición de dos párpados dibujados, la calibración del suelo y el relevo técnico de Stop y StandUp hacia Idle. La calificación de los tres clips se conserva hasta aprobar los dibujos definitivos.

## Poses pendientes y entrega de arte

| Prioridad | Dibujos y continuidad requerida | Primera entrega propuesta |
| --- | --- | --- |
| Idle | Dibujar tórax en media inhalación, inhalación y media exhalación sobre las cuatro huellas de la celda 12. Preparar el párpado intermedio y el cierre propios de la postura de pie. Separar raíz y punta de la cola con la grupa fija. Una reacción de oreja debe conservar su forma y caída. | Respiración 3 claves y 5 intermedios, bucle de 2700–3400 ms. Parpadeo 3 + 2 en 120–180 ms. Cola 4 + 4 en 640–980 ms. Oreja 3 + 2 en 180–280 ms. Revisar QD y QI. |
| StandUp | Partir de la celda 20. Inclinar cabeza y tronco hacia delante con las patas delanteras plantadas. Trasladar el peso al frente, elevar pelvis extendiendo corvejones, ajustar las patas posteriores bajo cadera y terminar exactamente en la pose de la celda 12. La cadera, la línea de suelo y el contacto delantero deben quedar anotados. | 4 claves y 6 intermedios nuevos por vista, una pasada de 480–760 ms. Aprobar QD y QI antes de extender a perfiles, frontal y trasera. |
| Stop | Partir de un contacto aprobado de la marcha real. Dibujar última carga, compresión de hombro, paso corto de la pata libre, ajuste posterior bajo la cadera y recuperación del tórax. El perfil debe girar al tres cuartos neutro dentro de ese arco, con cuatro huellas fijas al terminar en la celda 12 de la orientación correspondiente. Para carrera, cerrar primero las fases de vuelo con un contacto real. | 5 claves y 5 intermedios por marcha y fase de contacto, una pasada de 380–620 ms. Aprobar ambos apoyos de Walk y Run. Trot se incorpora después de aprobar su ciclo propio. |

Conservar la plantilla y los anclajes de la [Fase 4A](PETMOTION_PHASE4A.md#exportación-reproducible). Producir en un máster editable, exportar PNG sRGB RGBA por celda y registrar vista, duración, origen y eventos de apoyo en el manifiesto. Validar cada celda y su alfa sobre fondos claros y oscuros antes del empaquetado WebP. La pose inicial y la final se cotejan píxel a píxel con las referencias aprobadas de la misma vista. El auditor se puede volver a ejecutar con `node scripts/pets/audit-golden.mjs --check`.

## Panel y evidencia visual

En desarrollo, abre **Depuración de la habitación**. En **Animación de prueba** se pueden elegir `Idle`, `Stop`, `Levantarse` y las secuencias `Walk → Stop → Idle`, `Run → Stop → Idle` y `Sit → StandUp → Idle`. **Reproducir** reinicia la selección. Las secuencias usan el controlador de PetMotion en una instancia aislada. El ancla en el suelo, el espejo izquierda/derecha y las comparaciones se pueden inspeccionar sin cambiar la posición ni la persistencia de la mascota real. La línea discontinua marca la referencia del suelo y los puntos señalan contactos visibles en las poses neutras. El aviso de arte pendiente de StandUp y Stop permanece visible al finalizar la secuencia de prueba.

Las capturas se tomaron en el navegador. Para Idle se avanzó el reloj de la vista previa a dos instantes con la misma celda 12 y el mismo encuadre. Los 3344 píxeles RGB que cambiaron entre los dos recortes se concentran en los ojos y el parche del tórax. La silueta, el collar y los apoyos coincidieron en ambas capturas. En la prueba de marcha a la derecha, la última pose móvil corresponde a la celda 4 del atlas base.

- [Idle con ojos abiertos y cerrados en dos lecturas del reloj](petmotion-phase4b1/idle.png)
- [Walk → Stop → Idle con pose de entrada, última celda móvil y apoyo final](petmotion-phase4b1/stop.png)
- [Sit → StandUp → Idle con apoyo sentado y pose estable final](petmotion-phase4b1/standup.png)
- [Celdas 12–15](petmotion-contact-sheets/golden-room-01.png) y [celdas 16–21](petmotion-contact-sheets/golden-room-02.png) en las hojas de contacto originales.

## Archivos y verificación

| Área | Archivos |
| --- | --- |
| Muestreo y recursos | `domain/idleMotion.ts`, `domain/animationCatalog.ts`, `adapters/goldenAnimations.ts` |
| Habitación | `scene/RoomPet.tsx`, `scene/RoomStage.tsx`, `scene/PetRoom.tsx`, `apps/web/src/styles/pet-room.css` |
| Panel de desarrollo | `scene/RoomDebug.tsx`, `scene/room-debug.css`, `scene/transitionPreview.ts` |
| Pruebas y evidencia | `tests/pet-motion-2d/pet-motion.test.ts`, `tests/e2e/pet-room.spec.ts`, `docs/petmotion-phase4b1/` y este informe |

Los directorios `domain/`, `adapters/` y `scene/` están dentro de `apps/web/src/features/pet-motion-2d/`.

| Comprobación | Resultado |
| --- | --- |
| `npm run build` | Compilación TypeScript y Vite aprobada. |
| `npm run test:pet-motion` | 30 pruebas aprobadas. Incluyen continuidad de orientación, posición y distancia para las dos marchas y apoyo fijo durante StandUp. |
| `npm run test:e2e -- --fully-parallel --workers=4 --timeout=45000` | 30 pruebas aprobadas en Microsoft Edge, incluidas habitación, creador, jardín, dos modos de autonomía y panel. Playwright devolvió código 0 tras cerrar su servidor temporal en Windows. |
| `node scripts/pets/audit-golden.mjs --check` | 20 recursos, 418 recortes RGBA y 32 hojas de contacto verificados. |
| Inspección del JavaScript de producción | Las herramientas, textos y secuencias de depuración quedan fuera de la compilación. |
