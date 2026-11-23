# PetMotion 2D · MVP de Huellitas de Luz 2.0

## Uso

Ejecuta `npm run dev` y abre `/habitacion`, o entra desde **Visita la habitación** en la sección del jardín de la portada. Pulsa un punto libre del suelo para que el Golden camine hacia él. Con el suelo enfocado, las flechas desplazan el destino en los ejes X e Y. Tocar la cama, el comedero o el bebedero inicia la aproximación y la acción correspondiente. En pantallas estrechas aparecen también botones para los tres objetos. El control **Sentarse** cambia a **Levantarse** cuando corresponde.

La habitación carga bajo demanda en el mismo sitio y usa su cabecera, pie, paleta, tipografías y botones. La escena de demostración se dibuja con CSS sobre un plano de 1280 × 720. Fondo, suelo, muebles, personaje y controles ocupan capas independientes. La escala conserva 16:9 y la posición de los objetos y del personaje usa coordenadas lógicas. El personaje y los objetos comparten el orden de profundidad según su apoyo en el suelo. [Auditoría](PETMOTION_AUDIT.md)

## Arquitectura

| Componente | Responsabilidad |
| --- | --- |
| `domain/room.ts` | Dimensiones, punto inicial, límites del suelo, arte, hitboxes, colisiones, puntos de interacción y orientación de cada objeto. |
| `domain/navigation.ts` | Prueba de paso continuo contra los rectángulos de colisión ampliados. Usa un grafo de visibilidad con las esquinas libres de los obstáculos y elige un camino por distancia. Aplica aceleración y frenado antes de cada waypoint. |
| `domain/petState.ts` | Define estados, transiciones válidas, posturas persistibles y clips. Una mascota sentada se levanta antes de caminar. El descanso junto a la cama pasa por despertar y sentado. |
| `controllers/PetController.ts` | Coordina la última orden del usuario, el reloj, los waypoints, las transiciones y las acciones de los objetos. Durante una transición protegida conserva la orden más reciente hasta llegar a una pose estable. En una aproximación, una orden nueva reemplaza el destino anterior. |
| `domain/animation.ts` y `adapters/goldenAnimations.ts` | Separan el contrato de reproducción del controlador. El adaptador usa `catalog.ts` y `motion.ts` para muestrear el atlas. Ajusta la marcha a la distancia recorrida y mantiene su propia temporización para las demás acciones. |
| `scene/usePet.ts` y `scene/RoomPet.tsx` | Conectan el reloj del navegador, el estado de React, la carga del atlas y `PetSprite`. El reloj omite el tiempo con la pestaña oculta y subdivide el tiempo recibido. El modo de movimiento reducido conserva la interacción y usa una pose fija para la marcha y el descanso. |
| `adapters/persistence.ts` | Usa `localStorage` bajo `huellitas.petmotion2d.v1`. Guarda versión, mascota, escenario, posición, postura estable y orientación. Valida la posición contra límites y obstáculos al restaurar. |

Se guarda al alcanzar una postura estable y al ocultar o cerrar la página. Si la sesión se cierra en marcha o durante un giro, la restauración conserva una posición transitable y abre en una postura estable. Si el guardado falta, es inválido o el navegador impide leerlo, la habitación abre con el Golden en el punto inicial y se puede seguir jugando. El backend y el almacenamiento por cuenta quedan fuera de esta demostración local.

La cama lleva al punto libre a su derecha, donde el Golden se acomoda y descansa. Cada recipiente usa su propio punto para orientar al personaje antes de consumir. Comer y beber terminan en sentado porque esa es la postura final de los dibujos. Al ordenar otro desplazamiento, comienza el levantamiento antes de mover la posición.

## Animaciones y recursos

Se revisaron los fotogramas, las dimensiones, la transparencia y la orientación de las pistas con Sharp y una vista en cuadrícula. El MVP usa el atlas `golden-art.webp` de **3584 × 2816 px** con alfa. Cada celda mide 448 × 352 px y representa 224 × 176 unidades de sprite. El ancla de representación se sitúa alrededor de la línea 149 del sprite lógico. Las secuencias son compatibles para el prototipo, con variaciones de silueta y apoyo entre pistas. [Manifiesto](../apps/web/src/assets/pets/manifest.json) · [Catálogo](../apps/web/src/features/pets/catalog.ts) · [Sprite](../apps/web/src/features/pets/PetSprite.tsx)

| Acción | Recurso y representación |
| --- | --- |
| `Idle` | Pose de pie del primer fotograma de marcha. El GIF de reposo del creador muestra al Golden sentado y se conserva para su uso en el creador. |
| `Walking` | 6 fotogramas existentes en perfil derecho, reflejados al caminar hacia la izquierda. El avance de los fotogramas sigue la distancia recorrida. |
| `SittingDown` y `Sitting` | 4 fotogramas existentes con leve vista de tres cuartos. Se conserva la pose final al sentarse. |
| `Resting` y `WakingUp` | 3 poses existentes de descanso y 4 de despertar con variaciones de ángulo. Despertar termina sentado. |
| `Eating` y `Drinking` | 5 fotogramas existentes por acción. Los tres fotogramas centrales incluyen el recipiente dibujado. En esos fotogramas se oculta el dibujo del objeto correspondiente y se conservan su hitbox y su colisión. |
| `Turning`, `Stopping`, `StandingUp` y `Settling` | Transiciones **provisionales**, identificadas en la pantalla. El giro mantiene una pose fija y cambia el reflejo horizontal, la parada sostiene una pose de pie, el levantamiento reutiliza el sentado en sentido inverso y el acomodo pasa de sentado a la primera pose de descanso. |
| Atlas o pista no disponible | Se muestra un aviso. Una pista faltante usa una pose disponible o un icono provisional si falla el atlas. La secuencia lógica termina y la habitación sigue aceptando órdenes. |

Las capas de la habitación son dibujos CSS. Los PNG de referencia y los GIF adicionales del directorio `Imagenes` se mantienen como material de producción. El prototipo usa sprites rasterizados y presenta una orientación lateral por reflejo. Faltan vistas frontal, trasera e intermedias validadas, rig articulado y fotogramas propios para las cuatro transiciones provisionales. La marcha acompasa los fotogramas con la traslación. La fijación por pata y la continuidad anatómica del giro siguen pendientes.

## Archivos entregados

| Cambio | Archivos |
| --- | --- |
| Módulo nuevo | `domain/animation.ts`, `domain/navigation.ts`, `domain/petState.ts`, `domain/room.ts`, `controllers/PetController.ts`, `adapters/goldenAnimations.ts`, `adapters/persistence.ts`, `scene/PetRoom.tsx`, `scene/RoomPet.tsx`, `scene/RoomStage.tsx` y `scene/usePet.ts` dentro de `apps/web/src/features/pet-motion-2d/`. |
| Entrada y estilos nuevos | `apps/web/src/pages/PetRoomPage.tsx` y `apps/web/src/styles/pet-room.css`. |
| Pruebas nuevas | `tests/pet-motion-2d/pet-motion.test.ts`, `tests/pet-motion-2d/tsconfig.json` y `tests/e2e/pet-room.spec.ts`. |
| Integración modificada | `apps/web/src/main.tsx` reconoce la ruta, `apps/web/src/layouts/SiteLayout.tsx` conserva un destino válido en el pie, `apps/web/src/pages/HomePage.tsx` añade el acceso y `package.json` registra `test:pet-motion`. |

Se reutilizan las dependencias instaladas. El creador y sus pruebas conservan sus archivos originales al inicio de esta fase. Las pruebas unitarias compilan con TypeScript y usan `node:test`.

## Verificación

| Comando o comprobación | Resultado |
| --- | --- |
| `npm run build` | TypeScript estricto y producción Vite aprobados después de cada incremento. |
| `npm run test:pet-motion` | 12 pruebas aprobadas. Cubren transiciones, límites, rutas, colisiones, intervalos de simulación, los tres objetos, cancelación y datos inválidos o inaccesibles. |
| `npm run test:e2e -- --fully-parallel --workers=4` con Chrome | 16 pruebas aprobadas y salida `0`. Son los 12 casos existentes y 4 nuevos para navegación, tacto, teclado, objetos, recarga, atlas ausente y acceso al creador. En este entorno Windows, el cierre automático de Vite quedó esperando tras los casos. Al detener el proceso local de Vite, Playwright emitió el resumen final. |
| Vista de producción en Chrome | La ruta directa respondió HTTP `200`, con proporción 16:9 y el control de postura visible a 1280 × 720 y 320 × 740. Se revisó el uso del recipiente dibujado al comer. El atlas transfiere aproximadamente 2,80 MB en una carga fría local. |
| `dotnet test Huellitas.slnx --no-restore` | Un caso pasó y otro encontró acceso denegado al registro de eventos de aplicación de Windows, igual que en la auditoría. Con el nivel `Critical` para ese proveedor y solo para el proceso de prueba, los 2 casos HTTP pasaron. La prueba de PostgreSQL quedó omitida. |

Para ejecutar con Chrome local en PowerShell, usa `$env:HUELLITAS_BROWSER_CHANNEL = 'chrome'` antes del comando de Playwright. El alcance de las comprobaciones visuales se limita a Chrome en el entorno local. Quedan por verificar el rendimiento en dispositivos reales y la distribución del tiempo de fotograma en móvil.

## Próximos pasos

Validar un set direccional del Golden, producir clips específicos para giro, parada, levantamiento y acomodo, y separar el arte de los recipientes de las poses de consumo. Eso permitiría alinear las patas y mantener fijos los recipientes durante toda la acción. Para ampliar la habitación, el siguiente incremento puede incluir pelota, caricias y comportamiento autónomo pausable sobre el mismo sistema de intenciones.
