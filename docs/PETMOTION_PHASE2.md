# PetMotion 2D · Fase 2

La habitación incorpora giros por fotogramas, frenado antes de cambiar de rumbo y una secuencia dibujada para acostarse. El interruptor **Comportamiento autónomo** está apagado al abrir la habitación. En desarrollo, **Depuración de la habitación** permite revisar clips y datos de navegación. La ruta y el guardado del MVP siguen usando `/habitacion` y `huellitas.petmotion2d.v1`. [Auditoría](PETMOTION_AUDIT.md) · [MVP](PETMOTION_MVP.md)

## Auditoría de recursos del Golden Retriever

Sharp confirmó dimensiones y alfa de los WebP. Revisé cuadrículas de los fotogramas originales y procesados para comprobar orientación, pose y fondo. Los conteos excluyen celdas vacías y las máscaras de collar. Las duraciones nominales del atlas detallado se calculan con el FPS del manifiesto. Los GIF se midieron con sus retrasos originales. [Manifiesto del creador](../apps/web/src/assets/pets/manifest.json) · [Fuentes](../scripts/pets/sources.mjs) · [GIF originales](../Imagenes/Golden_retriver/)

| Atlas | Dimensiones | Contenido del Golden |
| --- | --- | --- |
| `golden-art` y `golden-collar` | 3584 × 2816 | 58 fotogramas activos en 11 pistas del atlas detallado. Celdas de 448 × 352. |
| `golden-idle-art` y máscara | 1792 × 1056 | 9 fotogramas del GIF de cola. |
| `golden-run-art` y máscara | 1792 × 1408 | 16 fotogramas del GIF de carrera. |
| `golden-jump-art` y máscara | 1792 × 1056 | 12 fotogramas del GIF de salto. |
| `portraits-art` y `portraits-collar` | 4032 × 1584 | 1 retrato del Golden en la celda 0 del atlas compartido de 18 variantes. |
| `golden-room-art` | 2688 × 1584 | 48 fotogramas extraídos para la habitación. Celdas de 336 × 264 con apoyo normalizado en la línea lógica 149. |

**Completa** indica que el material contiene los dibujos necesarios para la acción indicada. **Reutilizable con ajustes** indica que requiere selección, encadenado, reflejo o alineación para el contexto de la habitación. **Provisional** marca un sustituto operativo. **Sin recursos suficientes** marca una carencia en el arte disponible.

| Pista publicada o retrato | Fotogramas · duración original o nominal | Orientación y posturas inicial → final | Clasificación |
| --- | --- | --- | --- |
| Retrato | 1 · fija | Tres cuartos derecho, sentado → sentado | Completa |
| `idle` del creador | 9 · 990 ms | Tres cuartos derecho, sentado → sentado, mueve la cola | Completa como reposo sentado |
| `walk` | 6 · 857 ms | Perfil derecho, paso → paso | Reutilizable con ajustes de fase y reflejo |
| `run` | 16 · 1600 ms | Perfil derecho, apoyo → fase de carrera | Completa como ciclo lateral |
| `sit` | 4 · 800 ms | Tres cuartos derecho, descenso → sentado | Reutilizable con ajustes para conectar con una pose de pie |
| `sleep` | 3 · 1500 ms | Tres cuartos derecho, tumbado → tumbado | Completa como reposo tumbado |
| `wake` | 4 · 800 ms | Vista oblicua variable, tumbado → sentado | Reutilizable con ajustes direccionales |
| `eat` | 5 · 1000 ms | Tres cuartos derecho, de pie → sentado | Reutilizable con ajuste por el comedero incrustado |
| `drink` | 5 · 1000 ms | Tres cuartos derecho, inicio bajo → sentado | Reutilizable con ajuste por el bebedero incrustado |
| `bath` | 6 · 1200 ms | Tres cuartos derecho, dentro de la tina → dentro de la tina | Completa para la acción con tina |
| `shake` | 5 · 714 ms | Perfil derecho con cabeza en vaivén, de pie → de pie | Completa |
| `play` | 5 · 833 ms | Tres cuartos derecho, reverencia → tumbado con pelota | Reutilizable con ajuste por el accesorio dibujado |
| `jump` | 12 · 1200 ms | Perfil derecho, de pie → de pie tras aterrizar | Completa como salto lateral |
| `pet` | 5 · 1000 ms | Tres cuartos derecho, sentado → sentado | Reutilizable con ajuste por la mano dibujada |
| `happy` | 10 · 1667 ms | Tres cuartos derecho a frontal oblicuo, sentado → celebración sentado | Completa |

La lámina detallada también trae 4 poses de reposo, 4 de carrera y 5 de salto, con duraciones nominales de 1333, 500 y 714 ms. Son alternativas reutilizables con ajustes. En el catálogo publicado las sustituyen los GIF de cola, carrera y salto. El atlas de 58 fotogramas conserva las otras once pistas. [Lámina original](../Imagenes/Hoja%20de%20sprites%20del%20perro%20aventurero-1.png)

| GIF original | Tamaño por página · fotogramas · duración | Orientación y posturas inicial → final | Clasificación |
| --- | --- | --- | --- |
| Cachorro sentándose | 353 × 354 · 12 · 2160 ms | Tres cuartos derecho, de pie → sentado con parpadeo | Completa para sentarse y parpadear en esa postura |
| Perro caminando | 358 × 358 · 12 · 1200 ms | Perfil derecho, paso → paso | Reutilizable con limpieza de fondo y prueba de apoyos |
| Cola | 512 × 341 · 9 · 990 ms | Tres cuartos derecho, sentado → sentado | Completa |
| Carrera | 361 × 271 · 16 · 1600 ms | Perfil derecho, apoyo → carrera | Completa |
| Despertar y estirarse | 352 × 263 · 16 · 4960 ms | Perfil oblicuo derecho, tumbado → sentado después de estirar | Reutilizable con limpieza y selección de páginas |
| Salto | 362 × 362 · 12 · 1200 ms | Perfil derecho, de pie → de pie | Completa |
| Giro feliz | 351 × 260 · 16 · 1920 ms | Frontal → derecho → trasera → izquierdo → frontal, de pie con pasos | Reutilizable para un giro de medio arco y una mirada hacia el frente |
| Quedándose dormido | 353 × 353 · 12 · 5040 ms | Tres cuartos derecho, sentado → tumbado dormido | Reutilizable con limpieza de fondo y selección de páginas |

## Cambios en la habitación

| Acción | Material y resultado |
| --- | --- |
| Reposo de pie o sentado | Una pose por postura, con duración abierta. De pie usa el primer fotograma de marcha. Sentado conserva la pose final del descenso. **Reutilizable con ajustes** de continuidad entre los atlas. |
| Girar | 9 dibujos del GIF de giro durante 670 ms. El arco recorre el costado, la espalda y el otro costado con apoyos dibujados. El punto del suelo permanece fijo y la orientación lógica cambia al terminar. Se refleja el arco para el sentido contrario. **Reutilizable con ajustes**. |
| Detenerse | Se conserva la fase del ciclo de 6 poses durante la desaceleración y se sostiene una pose de pie 140 ms al alcanzar velocidad cero. Una orden nueva desde marcha frena sobre el tramo libre antes de tomar el siguiente camino. El clip dedicado de parada sigue **provisional**. |
| Sentarse y levantarse | El sentado usa 9 dibujos originales en 740 ms. Para levantarse se reproducen 8 dibujos seleccionados de esa fuente en orden inverso durante 620 ms. Ambos mantienen el ancla fija. El levantamiento sigue **provisional**. |
| Cama | `Walking → Stopping → Aligning → Settling → Resting`. En el tramo de acostarse se encadenan 5 dibujos de sentado con 11 de la fuente de sueño en 1120 ms. El apoyo sigue en `(385, 536)`. La cama se estrechó para dejar visible el descanso a su derecha. **Reutilizable con ajustes**. |
| Despertar y estirarse | 12 dibujos seleccionados del arco de despertar. Parten de tumbado, estiran la parte delantera del cuerpo y terminan sentados. Duran 1050 ms al despertar tras una orden y 1240 ms al estirarse por autonomía. **Reutilizable con ajustes**. |
| Mirar alrededor y parpadear | La mirada usa 8 muestras de 4 poses originales y vuelve a la orientación de entrada en 720 ms. El parpadeo sentado dura 320 ms y usa 5 muestras de 4 poses originales. **Reutilizable con ajustes** para la mirada y **completa** para el parpadeo sentado. |
| Recursos ausentes | Si falla el atlas de la habitación, se conservan las poses de respaldo del MVP y el aviso de representación provisional. Si también falla el atlas base, se usa el icono. El controlador completa las transiciones y protege la posición. |

La marcha emplea un ciclo de 146 unidades lógicas. Durante el frenado, cada avance del ciclo corresponde al desplazamiento realmente aplicado. La comprobación de colisión cubre cada segmento. Las transiciones de postura mantienen un ancla común de suelo en los fotogramas preparados. El apoyo individual de cada pata, un clip de parada con transferencia de peso, un levantamiento dibujado hacia delante y los arcos direccionales para cualquier ángulo siguen **sin recursos suficientes**.

## Autonomía y depuración

El controlador autónomo evalúa una intención cada 6,5–11 s de reposo estable. Puede esperar, mirar, sentarse para parpadear, caminar o ir a la cama. Antes de elegir un destino verifica distancia, suelo libre y ruta. Solo un descanso iniciado por la autonomía puede terminar con un estiramiento automático, tras 11–17 s. Una orden manual reinicia el intervalo y desplaza las intenciones autónomas. Al desactivarlo se cancela el recorrido autónomo con frenado y se conserva la finalización de una postura crítica. La preferencia dura hasta cerrar o recargar la habitación.

El panel de desarrollo muestra estado, posición, destino, velocidad y aviso de transición. Superpone suelo, zonas táctiles, colisiones, puntos de interacción y waypoints. Su selector previsualiza fotogramas en la posición actual sin desplazar el personaje. Puede pausar el comportamiento autónomo. El módulo y su hoja de estilos se cargan únicamente con `import.meta.env.DEV`.

## Archivos de esta fase

| Cambio | Archivos |
| --- | --- |
| Control y geometría | `controllers/PetController.ts`, `domain/navigation.ts`, `domain/petState.ts`, `domain/animation.ts` y `domain/room.ts`. Nuevo `controllers/PetBehaviorController.ts`. |
| Recursos y renderizado | `adapters/goldenAnimations.ts`, `scene/RoomPet.tsx`, `scene/RoomStage.tsx`, `scene/PetRoom.tsx`, `scene/usePet.ts` y `styles/pet-room.css`. |
| Depuración | Nuevos `scene/RoomDebug.tsx` y `scene/room-debug.css`. |
| Atlas | Nuevos `assets/pet-motion-2d/golden-room-art.webp` y `golden-room.json`. `scripts/pets/prepare.mjs` admite `npm run prepare:pets -- --room` para reconstruirlos con Sharp. Conserva la preparación del catálogo existente. |
| Pruebas | `tests/pet-motion-2d/pet-motion.test.ts` y `tests/e2e/pet-room.spec.ts`. |

Los archivos de dominio, controladores, adaptadores y escena están bajo `apps/web/src/features/pet-motion-2d/`.

## Verificación y próximos pasos

| Comprobación | Resultado |
| --- | --- |
| `npm run build` | Compilación de TypeScript y Vite aprobada. |
| `npm run test:pet-motion` | 18 pruebas aprobadas. Cubren giro, desaceleración, fase por distancia, anclas, parada y alineación en cama, destinos válidos, autonomía, prioridad, cancelación y persistencia. |
| `npm run test:e2e -- --fully-parallel --workers=4 --timeout=45000` con Chrome | 18 aprobadas y salida `0`. Incluyen la suite anterior, recuperación si falla el atlas de habitación y controles de depuración. En Windows se detuvo el proceso local de Vite tras los casos para que Playwright emitiera el resumen. |
| Vista de producción en Chrome | HTTP `200`, sin errores de página. Se activó la mirada autónoma y se canceló al desactivar el control. Se observaron los nueve fotogramas del giro y la llegada a `(385, 536)` tras parada, alineación y descenso. La captura confirmó que el Golden quedaba junto a la cama. El panel y sus estilos quedaron fuera de producción. |
| `npm run prepare:pets -- --room` | Los SHA-256 del nuevo atlas y de su manifiesto coincidieron al regenerarlos. También coincidieron los hashes del atlas base del Golden y del manifiesto del creador antes y después. |
| `dotnet test Huellitas.slnx --no-restore` | 2 pruebas HTTP aprobadas con nivel `Critical` para el registro de eventos de Windows limitado al proceso de prueba. PostgreSQL quedó omitido. |

La carga fría de `/habitacion` puede solicitar alrededor de 4,62 MB entre el atlas base y el de habitación. Siguen pendientes la medición en teléfonos físicos, un set de apoyo por pata, poses específicas de parada y levantamiento y una revisión de proporciones entre las fuentes. Para la siguiente fase, conviene priorizar esas poses y empaquetar los atlas según el perfil de carga móvil antes de ampliar razas y acciones.
