# PetMotion 2D · Fase 3

En `/habitacion`, abre **Interactuar con el Golden** para saludar, acariciar, pedir atención, saltar, correr hacia un punto del suelo o elegir una emoción. Toca la pelota para que el Golden se acerque, se alinee y juegue. La habitación, el creador y la autonomía usan los mismos recursos y reglas de navegación que las fases anteriores. [Auditoría](PETMOTION_AUDIT.md) · [MVP](PETMOTION_MVP.md) · [Fase 2](PETMOTION_PHASE2.md)

## Inventario de recursos

El manifiesto del creador contiene 18 variantes, 775 fotogramas de animación y 18 retratos. Hay 22 atlas de arte WebP en ese directorio y 22 máscaras asociadas. El total de 775 excluye huecos de atlas, máscaras y retratos. La habitación usa además el atlas de 48 celdas extraído en la Fase 2. Esta fase reutilizó los archivos tal como estaban. [Manifiesto del creador](../apps/web/src/assets/pets/manifest.json) · [Manifiesto de la habitación](../apps/web/src/assets/pet-motion-2d/golden-room.json)

| Atlas del Golden | Celdas utilizadas o disponibles | Alcance |
| --- | --- | --- |
| `golden-art` y máscara | 58 fotogramas en 11 pistas de una hoja 3584 × 2816 | Marcha 6, sentado 4, sueño 3, despertar 4, comer 5, beber 5, baño 6, sacudirse 5, pelota 5, caricias 5 y celebración 10. |
| `golden-idle-art` y máscara | 9 fotogramas, 1792 × 1056 | Cola en reposo sentado, disponible en el creador. |
| `golden-run-art` y máscara | 16 fotogramas, 1792 × 1408 | Carrera lateral. |
| `golden-jump-art` y máscara | 12 fotogramas, 1792 × 1056 | Salto lateral. |
| `golden-room-art` | 48 fotogramas, 2688 × 1584 | Giro 12, posturas sentadas y parpadeo 12, cama 11, despertar y estirar 13. |
| `portraits-art` y máscara | Una celda del Golden entre los 18 retratos, 4032 × 1584 | Selección de mascota. |

Los ocho GIF originales reúnen 105 páginas. Son sentado 12, marcha 12, cola 9, carrera 16, despertar y estirar 16, salto 12, giro 16 y sueño 12. La lámina original conserva además las alternativas de reposo, carrera y salto descritas en la Fase 2. Revisé visualmente los recortes de celebración, pelota, caricias, comida, bebida y despertar antes de reutilizarlos. [GIF originales](../Imagenes/Golden_retriver/) · [Lámina original](../Imagenes/Hoja%20de%20sprites%20del%20perro%20aventurero-1.png)

## Las 24 acciones

`Complete` indica una secuencia utilizable dentro de la postura y orientación especificadas. `Partial` indica dibujos existentes seleccionados, encadenados o reutilizados para otro contexto. `Placeholder` indica un sustituto visual identificado como provisional. `Missing` reserva la acción y documenta su arte pendiente. El FPS es de referencia. Las pistas de locomoción avanzan por distancia y los valores de reposo corresponden a poses sostenidas. [Catálogo de animaciones](../apps/web/src/features/pet-motion-2d/domain/animationCatalog.ts)

| Categoría | ID | Estado | Recurso, tiempo y postura |
| --- | --- | --- | --- |
| Movimiento | Idle | Partial | Una pose de marcha, sostenida de pie. |
| Movimiento | Walk | Partial | 6 poses de marcha, referencia 857 ms a 7 FPS. De pie y ligado al recorrido. |
| Movimiento | Trot | Missing | Hace falta un ciclo de apoyos diagonales desde una postura de pie. |
| Movimiento | Run | Complete | 16 poses laterales, referencia 1600 ms a 10 FPS. De pie y ligado al recorrido. |
| Movimiento | Jump | Complete | 12 poses laterales, 1200 ms a 10 FPS. De pie, despegue, vuelo y aterrizaje en el mismo punto. |
| Movimiento | Turn | Partial | 9 poses elegidas del giro, 670 ms. Cambia de orientación con el ancla fija. |
| Movimiento | Stop | Placeholder | Las poses de la marcha o carrera siguen la desaceleración. La pose de Idle se sostiene 140 ms al parar. |
| Descanso | Sit | Complete | 9 poses, 740 ms. De pie a sentado. |
| Descanso | LieDown | Partial | 5 poses para sentarse y 11 para descender, 1120 ms. De pie a tumbado en descanso. |
| Descanso | Sleep | Complete | Pose sostenida de sueño tumbado. |
| Descanso | WakeUp | Partial | 12 poses, 1050 ms. De tumbado a sentado. |
| Descanso | Stretch | Partial | El arco de 12 poses de despertar a 1240 ms. De tumbado a sentado. |
| Necesidades | Eat | Partial | 5 poses, 1500 ms. De pie a sentado, con comedero incluido en los dibujos centrales. |
| Necesidades | Drink | Partial | 5 poses, 1500 ms. De pie a sentado, con bebedero incluido en los dibujos centrales. |
| Necesidades | Lick | Missing | Hay una pose aislada con lengua visible en comida. Faltan inicio, contacto y recuperación. |
| Interacción | Greet | Partial | 6 dibujos de celebración seleccionados para un saludo de 960 ms, sentado. |
| Interacción | Play | Partial | 5 poses, 1100 ms. De pie a tumbado, con pelota incluida en cuatro fotogramas. |
| Interacción | ReceivePetting | Complete | 5 poses, 850 ms. Permanece sentado durante el contacto. |
| Interacción | SeekAttention | Partial | 4 dibujos reutilizados de celebración, 1000 ms. Gesto sentado con patas delanteras elevadas. |
| Emociones | Happy | Complete | 4 dibujos de celebración, 820 ms. Permanece sentado. |
| Emociones | Sad | Missing | Disponible como estado de ánimo textual. Faltan poses de ojos, orejas y cola. |
| Emociones | Curious | Partial | 4 dibujos del giro, 720 ms. Mira al frente desde pie y vuelve a su orientación. |
| Emociones | Surprised | Missing | Disponible como estado de ánimo textual. Falta una reacción autónoma compatible con la pose estable. |
| Emociones | Angry | Missing | Disponible como estado de ánimo textual. Faltan poses específicas de rostro y cuerpo. |

Hay **6 completas, 12 parciales, 1 provisional y 5 sin recursos** entre las acciones prioritarias. `StandUp` es una transición técnica adicional. Sostiene la pose sentada y cambia una sola vez a la pose de pie compartida con Idle. Queda **provisional** hasta que existan dibujos consecutivos de inclinar el tronco, transferir peso sobre las patas delanteras y extender las traseras en esa misma ancla. Para la parada queda pendiente una secuencia propia que pase de los últimos apoyos de marcha y carrera a cuatro patas firmes en Idle.

## Arquitectura y comportamiento

- El registro tipado sirve de fuente para tiempos de los clips, estados compatibles, transiciones, interrupción, orientación, recursos y eventos de sincronización. `Missing` carece de un clip visual y de un inicio ejecutable. El despegue y aterrizaje del salto usan los marcadores de sincronización para delimitar la postura aérea. Los demás marcadores describen la fase del arte para inspección y ampliación.
- La instantánea separa postura, locomoción, contexto, emoción y movimiento secundario. El compositor de atlas selecciona un solo dibujo de cuerpo completo. El contexto, la locomoción y la transición física conservan prioridad visual. Una emoción permanece como estado y puede reproducir su pista al quedar en postura compatible. El parpadeo y la mirada autónomos usan pistas secundarias. La superposición simultánea de cabeza, orejas y patas queda pendiente de arte articulado.
- Caminata y carrera comparten navegación, waypoints, colisiones y frenado. El salto usa fotogramas desplazados dentro de su celda y mantiene la posición lógica fija. Saludar, acariciar y pedir atención llevan al Golden a sentado y pueden reemplazarse mediante una orden manual. Durante salto o juego se conserva la última orden física pendiente hasta una postura válida.
- Jugar exige ruta, parada y alineación. Se oculta el dibujo de escena de la pelota durante sus fotogramas incrustados y luego se vuelve a mostrar en su sitio. El Golden termina tumbado. El guardado acepta esa postura y sigue restaurando las instantáneas anteriores de la habitación. Emoción, clip activo y órdenes pendientes son temporales.
- El panel filtra las 24 acciones por categoría y conserva un grupo de clips técnicos. Al seleccionar una entrada muestra recursos, duración, FPS, posturas, orientaciones, transiciones y reglas de interrupción. Solo se previsualizan entradas con clip. Conserva las capas de geometría y la pausa de autonomía de la Fase 2.

## Archivos

| Cambio | Archivos |
| --- | --- |
| Nuevos | `domain/animationCatalog.ts`, `domain/animationLayers.ts` y esta documentación. |
| Dominio y control | `domain/animation.ts`, `domain/navigation.ts`, `domain/petState.ts`, `domain/room.ts`, `controllers/PetController.ts`. |
| Recursos y guardado | `adapters/goldenAnimations.ts` y `adapters/persistence.ts`. |
| Habitación y panel | `scene/PetRoom.tsx`, `scene/RoomStage.tsx`, `scene/RoomPet.tsx`, `scene/RoomDebug.tsx`, `scene/usePet.ts`, `scene/room-debug.css` y `apps/web/src/styles/pet-room.css`. |
| Pruebas | `tests/pet-motion-2d/pet-motion.test.ts` y `tests/e2e/pet-room.spec.ts`. |

Los archivos de dominio, control, recursos y escena están dentro de `apps/web/src/features/pet-motion-2d`.

## Verificación y Fase 4

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` y `npm run build` | TypeScript estricto y compilación Vite aprobados. |
| `npm run test:pet-motion` | 23 pruebas aprobadas. Cubren las fases anteriores, integridad del registro, archivos y rangos de atlas, compatibilidad de posturas, capas, prioridad, frenado, salto y persistencia tumbada. |
| `npm run test:e2e -- --fully-parallel --workers=4 --timeout=45000` con Chrome | 21 aprobadas y salida `0`. Incluye todas las pruebas anteriores y tres casos nuevos para catálogo, acciones sociales y físicas, y recarga en postura tumbada. En Windows se cerró manualmente el proceso de Vite de la suite después de completar los casos. |
| Vista de producción en Chrome | La habitación respondió HTTP `200`. Se comprobó el estado emocional textual, el uso de la pelota y la postura tumbada en `(720, 478)`. El panel y sus estilos quedaron excluidos de la compilación de producción. |
| `dotnet test Huellitas.slnx --no-restore` | 2 pruebas HTTP aprobadas. Se usó nivel `Critical` para el registro de eventos de Windows en el proceso de prueba. PostgreSQL quedó omitido. |

Para la Fase 4, priorizar poses propias de levantamiento, parada, trote, lamido y emociones pendientes. Separar accesorios y anclas de patas permitirá conservar la posición de la pelota y los recipientes durante los relevos de atlas, además de combinar expresiones con locomoción. Las orientaciones actuales son laterales o reflejadas y la carga de los atlas de carrera y salto se hace al usarlos.
