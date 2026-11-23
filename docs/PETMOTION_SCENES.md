# PetMotion 2D · Escenarios originales

`/habitacion` abre el **Jardín principal**. El selector permite cambiar a la **Sala de descanso**, la **Cocina**, el **Parque de juegos**, el **Baño**, la **Enfermería** y la **Habitación de práctica**. El baño y la enfermería también admiten enlaces directos con `?escena=bathroom` y `?escena=infirmary`. `/jardin` sigue siendo la vista ambiental de la portada y enlaza al jardín interactivo. El vestidor figura en el grupo de arte pendiente del selector.

## Auditoría de ilustraciones

La integración parte del [MVP](PETMOTION_MVP.md), la [biblioteca de animaciones](PETMOTION_PHASE3.md), la [auditoría de arte](PETMOTION_PHASE4A.md), la [calibración de apoyo](PETMOTION_PHASE4B1.md) y el [ciclo día/noche](DAY_NIGHT_SYSTEM.md). Los archivos se inspeccionaron con Sharp y en una hoja de contacto. Los seis originales de escenarios y la maqueta de adopciones son PNG opacos de una capa. Las dimensiones de abajo son nativas.

| Original | Dimensiones | Elementos y área aprovechable | Estado |
| --- | --- | --- | --- |
| `01_Jardin.png` | 1672 × 941 | Césped y piedras planas entre el árbol, la casita, el banco y los bordes vegetales. La casita lleva un cojín y el recipiente morado contiene croquetas. Cielo, faroles y sombras están pintados. | Jugable. Descanso y observación en el césped. Máscara de la roca del primer plano y ciclo ambiental de prototipo. |
| `04_Sala_de_descanso.png` | 1672 × 941 | La ilustración de Fase 5C muestra las camas verde y rosa vacías, sofá, alfombra, mesa, estantería, rascador y juguetes. | Jugable. Descanso en las dos camas y en la alfombra, juego con la pelota, observación de la cuerda y luces cálidas parciales. |
| `03_Cocina.png` | 1671 × 941 | La versión corregida tiene el comedero y el bebedero sobre una esterilla en el suelo, delante de los armarios. La mesa está en el primer plano izquierdo. | Jugable desde la Fase 5B. Incluye Eat, Drink, oclusión de mesa y recipientes y luz ambiental parcial. |
| `05_Parque.png` | 1671 × 941 | Césped central entre rampa, valla, aro, eslalon, troncos y túnel. Tiene un banco y una plataforma elevada de comida y agua. | Jugable en el césped delimitado. Observación del aro y salto en el sitio frente a la valla. Las rutas se mantienen fuera del túnel y de la plataforma. |
| `02_Bano.png` | 1671 × 941 | Azulejos y alfombra delante de la bañera. Ducha, espuma, cuenco, farol, estantería y cestas pintados. | Jugable. Observación desde el suelo, máscara del frente de la bañera y luz ambiental parcial. |
| `06_Enfermeria.png` | 1670 × 941 | Azulejos y alfombra frente a la mesa, el taburete, el carrito y los gabinetes. | Jugable. Observación desde el suelo, máscaras de mesa y carrito y luz ambiental parcial. |
| Vestidor y accesorios | Pendiente | Falta ilustración original. | Pendiente. Se necesita base, vestimenta y accesorios con anclajes, reglas de equipamiento y máscaras para espejos o mobiliario. |

`07_Galeria_de_adopciones.png` mide 1672 × 941 y representa una interfaz, por lo que se conserva fuera del catálogo transitable. Los fondos que el juego carga proceden de [los originales](../Imagenes/escenarios/).

### Recurso de la sala de descanso

La revisión de Fase 5C confirmó visualmente que las dos camas están vacías en el PNG actualizado. Vite sirve el mismo archivo de la ilustración, con su composición y luz natural. Las máscaras trazadas usan sus propios píxeles de primer plano, sin crear otro fondo. [Ilustración de la sala](../Imagenes/escenarios/04_Sala_de_descanso.png)

## Mapa de juego y capas

`sceneCatalog.ts` contiene el inventario tipado y los mapas que se usan en ejecución. Una escena jugable declara fondo, medidas, navegación, objetos, puntos de aproximación, máscara, iluminación, punto inicial, orientación y tamaño por profundidad. Un plano pendiente conserva su recurso y la condición artística que falta. `sceneArt.ts` enlaza únicamente los fondos jugables en Vite.

Las medidas de autoría se tomaron sobre referencias de **1024 × 576** y se normalizan al espacio **1280 × 720**. Al mostrar un PNG se emplean sus dimensiones nativas y se conserva su proporción. `sceneCoordinates.ts` convierte imagen, lógica y pantalla. La conversión de pantalla calcula la región contenida y descarta coordenadas en las bandas. El fondo, la máscara, la posición del sprite, el SVG de depuración y las hitboxes usan esa misma proyección. La muestra de la mascota conserva sus proporciones y escala según profundidad, con el origen en su apoyo.

| Escenario | Suelo y exclusiones | Zonas de interacción y coordenada lógica de llegada |
| --- | --- | --- |
| Jardín | Ocho vértices limitan césped y camino. Seis polígonos bloquean casita y flores, tronco y raíz, banco, comedero, roca y macizo derecho. Inicio `(631.25, 557.5)`. | Casita `(692.5, 447.5)`, mirada a la izquierda y descanso en el césped. Banco `(1008.75, 442.5)`, observación. Comedero `(1085, 455)`, exploración. |
| Parque | Ocho vértices delimitan el césped central. Ocho polígonos excluyen rampa, valla, eslalon, aro, túnel, troncos, plataforma de recipientes y banco con vegetación. Inicio `(546.25, 585)`. | Aro `(833.75, 410)`, observación desde el suelo. Valla `(580, 540)`, salto en el sitio frente al obstáculo. |
| Cocina | Ocho vértices acotan el suelo visible. Seis polígonos cubren los muebles de la izquierda, la encimera y la estufa, el refrigerador con su cesta, la mesa y cada recipiente. Inicio `(893.75, 653.75)`. | Comedero `(560, 567.5)` mirando a la derecha y bebedero `(768.75, 567.5)` mirando a la izquierda. Ambos puntos quedan en el suelo fuera de las colisiones. |
| Sala de descanso | Nueve vértices acotan el suelo. Nueve polígonos bloquean la estantería y su hueco estrecho, el sofá, la mesa, el rascador, la cesta, las dos camas, la cuerda y la pelota. Inicio `(726.25, 642.5)`. | Dos entradas de cama, una zona de descanso en la alfombra, pelota y cuerda. El rascador queda reservado para gatos. |
| Baño | Siete vértices acotan los azulejos y la alfombra. Seis polígonos excluyen estantería, hojas del primer plano, cuenco, maceta, bañera y cesta con el lateral derecho. Inicio `(403.75, 662.5)`. | Bañera `(812.5, 650)`, observación mirando a la izquierda desde la alfombra. |
| Enfermería | Ocho vértices acotan la zona de suelo. Ocho polígonos excluyen estantería, gabinetes del lavamanos, gabinetes del fondo y vitrina, taburete, mesa de revisión, carrito y ambos muebles con maceta en primer plano. Inicio `(417.5, 668.75)`. | Mesa `(790, 655)`, observación mirando a la izquierda desde la alfombra a ras de suelo. |
| Práctica | Rectángulos y tolerancias de las fases anteriores. | Se conservan la cama, el comedero, el bebedero y la pelota. |

La navegación comparte aceleración, frenado, waypoints, prioridades y máquina de estados. El grafo de visibilidad usa los vértices de los obstáculos con separación de seguridad y prueba continuamente el segmento contra los semiplanos de los polígonos convexos. Las exclusiones se dibujaron alrededor del apoyo de cada elemento con margen para las patas. Los obstáculos irregulares pueden componerse con varias piezas convexas. Con los dos extremos dentro de un suelo convexo, el segmento queda dentro de sus límites. La autonomía muestrea candidatos dentro de los límites del escenario y comprueba su ruta con el mismo mapa.

Los originales conservan arquitectura, decoración y suelo en el fondo opaco. PetMotion compone la iluminación de fondo, los objetos dinámicos y la mascota, las oclusiones y la interfaz. La máscara `roca-jardin` usa un contorno poligonal trazado sobre el PNG y recorta la propia ilustración por encima del Golden. Una copia de la iluminación con las mismas coordenadas mantiene la continuidad entre la roca y su fondo. El parque limita las rutas a una región que puede representarse con la ilustración plana. Para acceder detrás de la rampa, a través del túnel o a la plataforma harían falta capas frontales y acciones propias.

Las celdas de consumo reutilizadas incluyen sus propios cuencos. En la cocina, tres máscaras recortan la propia ilustración para componer la mesa y los bordes delanteros del comedero y bebedero. Las dos zonas táctiles ejecutan las animaciones existentes `Eat` y `Drink`. Se ocultan los cuencos del sprite durante las celdas `18–20` y `23–25` de `golden-art.webp`; la ilustración y el atlas se sirven tal como están en disco. Los recortes se aplican solo al sprite en la cocina y mantienen fijo su origen de suelo. Los bordes pintados pueden pasar delante del hocico sin cubrir toda la parte superior de los recipientes. Las acciones terminan en sentado en el punto de aproximación.

El comedero del jardín mantiene la aproximación y observación. La habitación de práctica sigue usando sus propios cuencos y los fotogramas completos.

### Interacciones y oclusión de la sala

| Objeto | Punto en el suelo | Acción y apoyo final |
| --- | --- | --- |
| Cama verde | `(247.5, 633.75)` | `LieDown` entra al cojín. `Sleep` queda en `(193.75, 557.5)`, mirando a la derecha. `WakeUp` devuelve al apoyo de entrada. |
| Cama rosa | `(417.5, 555)` | `LieDown` entra al cojín. `Sleep` queda en `(361.25, 485)`, mirando a la izquierda. `WakeUp` devuelve al apoyo de entrada. |
| Alfombra | `(652.5, 642.5)` | Descanso sobre el suelo. El resto de la alfombra libre admite desplazamiento. |
| Pelota | `(1060, 632.5)` | La acción `Play` se ejecuta junto a la pelota pintada. El atlas muestra el movimiento del Golden y oculta su pelota incrustada en las celdas `39–42`, para que quede visible la del fondo. |
| Cuerda | `(926.25, 652.5)` | Aproximación y observación. Su pista de juego queda pendiente de poses específicas para cuerda. |
| Rascador | `(1028.75, 533.75)` | La zona queda identificada y deshabilitada para el Golden. |

Las rutas de `Walk`, `Stop` y `Turn` terminan en el suelo junto a la cama. El controlador interpola el punto de apoyo durante `LieDown` y la salida al despertar. Solo ese tramo cruza el contorno de la cama que se está usando. Las máscaras de los dos bordes delanteros, el tablero y la pelota usan las coordenadas del fondo original. El panel de depuración muestra en rosa el tramo protegido y el apoyo del cojín.

El desplazamiento al cojín se compone con los dibujos disponibles. Los estados de disponibilidad de `Idle`, `Walk`, `Turn`, `Stop`, `LieDown`, `Sleep`, `WakeUp` y `Play` conservan la clasificación del catálogo de animaciones. La pelota de la ilustración queda en su posición y el Golden realiza la acción junto a ella.

### Fase 5D · Baño y enfermería

**Funcionalidades implementadas.** Los dos PNG originales se sirven con su proporción nativa. Las zonas táctiles se trazan sobre el cuerpo de la bañera y sobre la superficie de la mesa. La navegación evita su huella y mantiene el apoyo del Golden sobre azulejos o alfombra. Las máscaras `frente-banera`, `tablero-revision` y `caja-carrito` recortan píxeles de los propios fondos y usan una profundidad fija por elemento. Cada escenario recupera su posición y postura estable con una clave independiente. El farol del baño y la lámpara de la enfermería reciben un brillo cálido local por la noche. Durante el día se ve la iluminación pintada de las ventanas.

**Interacciones parciales.** El catálogo prepara `Approach → Ready → Bathing → Finish → Exit` para el baño y `Approach → Ready → Examination → Finish → Exit` para la enfermería. Actualmente `Approach` recorre y frena sobre el suelo. `Ready` alinea al Golden y reproduce la mirada existente con el apoyo fijo. Después vuelve a `Idle` en ese punto. El usuario puede alejarse con cualquier ruta válida. El panel de desarrollo muestra la fase activa y la secuencia prevista. Los botones se llaman «Observar la bañera» y «Observar la mesa de revisión» y el estado indica el arte pendiente durante la observación.

**Recursos pendientes.** La pista `bath` del creador usa las seis celdas `27–32` de `golden-art.webp` a 5 FPS. Cada celda trae su propio recipiente con espuma y ninguna representa entrada o salida de la bañera de obra. Se necesita un clip de entrada con puntos de apoyo, cuerpo y espuma en capas, una secuencia de baño calibrada al borde de la bañera y las poses para terminar y volver al suelo. En enfermería faltan poses de revisión de pie desde el suelo y un cierre con apoyo estable. Si se diseña una revisión elevada, hará falta una rampa o un medio de subida, sus oclusiones y poses continuas de subida y bajada. Una variante nocturna para ambos interiores requiere máscaras de ventana, separación del reflejo diurno y capas de emisión y rebote de cada luminaria. La ilustración conserva mientras tanto sus ventanas y reflejos pintados.

## Cambio de escenario, horario y depuración

El selector actualiza `?escena=` y permite volver con el historial del navegador. Cambiar de plano guarda la posición válida y la última postura estable, desmonta el controlador anterior y crea el siguiente con su propio mapa. Cada original usa `huellitas.petmotion2d.v1.<id>`. La sala guarda las posiciones sobre los cojines únicamente como posturas estables de descanso. Si se cambia de escena durante la entrada o salida, se conserva el apoyo estable anterior. La habitación de práctica conserva la clave histórica, y la preferencia de autonomía se comparte. Una posición inválida recupera el punto inicial del plano. Las rutas y velocidades son temporales. El enlace anterior `?escena=lounge` resuelve a la sala habilitada. Los enlaces a escenarios pendientes muestran un aviso e identifican el Jardín principal como destino alternativo.

En el jardín, `DayNightController` usa el reloj y zona del dispositivo para aplicar los cinco periodos. A las 14:00 se ven el ambiente diurno y el sol. A las 20:00 se ven luz nocturna, luna y faroles. Las capas quedan debajo del Golden y el perfil admite imágenes y máscaras por periodo. Este perfil ambiental conserva el carácter de prototipo descrito en el [sistema día/noche](DAY_NIGHT_SYSTEM.md). La cocina y la sala usan el mismo reloj para modular el brillo de sus lámparas. La sala conserva durante el día la luz de la ventana y durante la noche realza el colgante y el farol de la estantería con luz cálida. La ventana y los reflejos diurnos forman parte del PNG. Las máscaras de cristal, las variantes de exterior y el rebote nocturno siguen pendientes para ambos interiores. El arte del parque conserva su iluminación diurna hasta disponer de variantes y máscaras de luces adecuadas.

En desarrollo, **Depuración de la habitación** muestra fondo, estado de carga, suelo, polígonos, posiciones, puntos de aproximación, rutas, anclajes y máscaras. **Simular hora** aparece en el jardín, la cocina, la sala, el baño y la enfermería. Las previsualizaciones de animación usan el mapa seleccionado en una instancia independiente.

## Cambios y verificación de Fase 5

- Dominio y gráficos en `sceneCatalog.ts`, `sceneCoordinates.ts`, `sceneArt.ts`, `navigation.ts` y `RoomStage.tsx`.
- Reutilización de mapa y acciones en los controladores, guardados por escenario en `persistence.ts` y selección en `PetRoomPage.tsx`.
- Proyección, profundidad y capas en `RoomPet.tsx`, `RoomStage.tsx` y `pet-room.css`. Simulación compartida y perfiles en `features/day-night/`.
- Pruebas unitarias en `tests/pet-motion-2d/pet-motion.test.ts` y pruebas de navegador en `tests/e2e/pet-scenes.spec.ts`. Las comprobaciones de la geometría y objetos CSS de las fases anteriores se ejecutan sobre la habitación de práctica.

| Verificación | Resultado |
| --- | --- |
| `npm run build` | TypeScript y Vite aprobados. Los dos PNG publicados coinciden byte a byte con los originales. Las herramientas de depuración y simulación quedan fuera del JavaScript de producción. |
| `npm run test:pet-motion` | 35 pruebas aprobadas. Cubren polígonos convexos, desvíos, interacciones, guardado independiente y conversión con bandas. |
| `npm run test:e2e -- --fully-parallel --workers=4 --timeout=45000` y `--last-failed` | Los 35 casos quedaron verificados en Microsoft Edge. La suite registró 31 aprobados y cuatro interrumpidos por una pausa del entorno. La repetición de esos cuatro terminó con todos aprobados y código 0. Se verificaron los flujos de práctica y creador, las escenas originales, el selector y el historial, el escalado móvil, las dos horas y la oclusión por comparación de píxeles. |
| Muestreo de rutas | Se encontraron rutas desde cada punto inicial hacia 678 destinos libres del jardín y 338 del parque en una cuadrícula de 20 unidades lógicas. |
| Auditor de arte | 20 recursos del Golden, 418 recortes RGBA y 32 hojas de contacto verificados con `node scripts/pets/audit-golden.mjs --check`. |

## Verificación de Fase 5B

- El catálogo y `sceneArt.ts` incorporan la cocina corregida. `RoomStage.tsx`, `RoomPet.tsx` y el adaptador de utilería componen los recortes de cuenco y el sprite. El perfil de `sceneLighting.ts` reutiliza el brillo de luces sin oscurecer todo el fondo interior.
- La suite unitaria valida ambas llegadas, las seis colisiones, las acciones, la compatibilidad de posturas y el desvío entre recipientes.
- Playwright cubre carga desde el selector, clics bloqueados sobre mesa y mostradores, las dos animaciones, guardado y recarga, vista móvil y sincronización de la lámpara. La prueba de selección de la sala confirma su estado pendiente y el aviso al abrir su enlace directo.
- Se revisaron en Microsoft Edge las seis celdas de consumo que traen un cuenco en el atlas. La mesa y los bordes de los cuencos proceden de la ilustración corregida. El PNG incluido en la compilación coincide byte a byte con el archivo del repositorio.

| Verificación | Resultado |
| --- | --- |
| `npm run build` | TypeScript y Vite aprobados. El control de simulación y la depuración quedan fuera del JavaScript de producción. |
| `npm run test:pet-motion` | 36 pruebas aprobadas. |
| `npm run test:e2e -- --fully-parallel --workers=4 --timeout=45000` | 37 pruebas aprobadas en Microsoft Edge, incluidas las interacciones de descanso en los escenarios disponibles y las del creador. Playwright devolvió código 0 tras cerrar su servidor temporal en Windows. |
| `node scripts/pets/audit-golden.mjs --check` | 20 recursos, 418 recortes RGBA y 32 hojas verificados. |

## Verificación de Fase 5C

- `sceneCatalog.ts` y `sceneArt.ts` incorporan `living-room`. `PetController.ts` controla la entrada y salida de las camas y `persistence.ts` valida el apoyo guardado. `paintedPropArtwork.ts` reutiliza el recorte por celda de la cocina para la pelota de la sala. El reloj y el selector usan las piezas de las demás escenas.
- En el navegador se comprobaron el mapa y las máscaras sobre el PNG, la postura de sueño dentro de cada cama y el apoyo junto a la pelota. Las pruebas recorren las escenas del selector, comprueban el escalado móvil y validan las dos entradas, `WakeUp`, la restauración de postura, el juego, la alfombra y el rascador reservado.

| Verificación | Resultado |
| --- | --- |
| `npm run build` | TypeScript y Vite aprobados. El PNG publicado coincide byte a byte con el original del repositorio. |
| `npm run test:pet-motion` | 38 pruebas aprobadas. Para cada cama se comprobó que la entrada cruza únicamente su propio polígono. |
| `npm run test:e2e -- --fully-parallel --workers=4 --timeout=45000` y `--last-failed` | 40 casos verificados en Microsoft Edge, incluido el creador. La suite aprobó 39 y la prueba móvil pasó al repetirse con una espera que cubre el despertar y la ruta a la alfombra. La repetición devolvió código 0. |
| Muestreo de rutas | 325 apoyos libres de una cuadrícula de 20 unidades lógicas, todos alcanzables desde el punto inicial. |
| `node scripts/pets/audit-golden.mjs --check` | 20 recursos, 418 recortes RGBA y 32 hojas verificados. |

## Verificación de Fase 5D

- `sceneCatalog.ts` y `sceneArt.ts` habilitan los PNG de baño y enfermería. `room.ts` y `PetController.ts` reutilizan la llegada, la orientación y la observación con un protocolo de cuidado. `PetRoom.tsx`, `RoomDebug.tsx` y `pet-room.css` presentan el estado y colocan las etiquetas sobre los objetos. `sceneLighting.ts` añade la luz localizada de ambos interiores.
- En Edge se revisaron los mapas y máscaras sobre cada original y el punto de apoyo del Golden en la alfombra. Las pruebas de navegador validan carga y proporción nativa, clics sobre mobiliario bloqueado, interacción, luz de las 20:00, persistencia al alternar escenarios y recarga, y vista de 360 px en enfermería. Las pruebas unitarias recorren la aproximación, la parada, el alineamiento y el retorno a `Idle` y comprueban la prioridad de la orden del usuario.

| Verificación | Resultado |
| --- | --- |
| `npm run build` | TypeScript y Vite aprobados. Ambos PNG publicados coinciden byte a byte con sus archivos maestros. Las herramientas de depuración quedan fuera del JavaScript de producción. |
| `npm run test:pet-motion` | 40 pruebas aprobadas. Los 197 puntos muestreados del baño y los 195 de la enfermería son alcanzables desde sus respectivos inicios. Se verificaron desvíos y segmentos de ruta. |
| `npm run test:e2e -- --fully-parallel --workers=4 --timeout=45000` y `--last-failed` | 42 casos verificados en Edge, incluido el creador. La suite aprobó 41. La prueba de cambio de cama pasó en la repetición después de ajustar la espera para comprobar el apoyo al llegar al segundo cojín. |
| `dotnet test Huellitas.slnx --no-restore` | Dos aprobadas al ejecutar fuera del sandbox con acceso al registro de eventos de Windows. La prueba de migración de PostgreSQL se omitió porque requiere una conexión de pruebas configurada. |
| `node scripts/pets/audit-golden.mjs --check` | 20 recursos, 418 recortes RGBA y 32 hojas verificados. |
