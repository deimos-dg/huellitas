# PetMotion 2D · Fase 4A

La biblioteca registra 24 acciones del Golden Retriever. El catálogo actual tiene seis completas para las vistas y usos admitidos, doce parciales, una provisional y cinco sin recursos dedicados. `StandUp` es una transición técnica provisional adicional. Las propuestas de esta fase especifican cómo completar el material en una producción posterior. La auditoría se reproduce con los recursos del repositorio y la versión de Sharp instalada.

- [Matriz JSON con las 24 acciones, StandUp y el inventario por fotograma](PETMOTION_ASSET_MATRIX.json)
- [Índice de las 32 hojas de contacto PNG](petmotion-contact-sheets/INDEX.md)
- [Script para generar y verificar la auditoría](../scripts/pets/audit-golden.mjs)

## Identidad y línea de base

La referencia de cuerpo completo es `golden-room` celda 12 de pie y celda 20 sentado. La celda 21 sirve para comparar el parpadeo. El retrato `portraits` celda 0 fija rostro, color y accesorios. El GIF de giro aporta frontal en las páginas 0 y 14, perfil derecho en la 3, trasera en la 7 y perfil izquierdo en la 10. Los índices parten de cero. [De pie y sentado](petmotion-contact-sheets/golden-room-02.png) · [Vista de pie en la primera hoja](petmotion-contact-sheets/golden-room-01.png) · [Retrato](petmotion-contact-sheets/portraits-01.png) · [Giro](petmotion-contact-sheets/gif-turn-01.png).

Cada aprobación artística coteja pelaje y sombras, collar verde, medallón, relación cabeza/cuerpo, forma del hocico, caída de las orejas, inicio y grosor de la cola y silueta de las patas. Las capas del collar y el medallón conservan su colocación y visibilidad según la vista, con oclusión cuando corresponda. Las referencias con damero impreso se usan para guiar dibujo y continuidad. Las siluetas con alfa válido se toman de los recortes WebP aprobados. El set revisado contiene originales rasterizados y derivados, sin una fuente maestra editable por piezas localizada.

## Inventario visual

Cada hoja muestra el nombre, índice, acción, vista y disponibilidad de cada recorte a escala 1:1. El verificador decodificó y comparó los **418 recortes RGBA** de **20 archivos**. El total suma 105 páginas de GIF, 73 celdas de la lámina PNG, 144 celdas de arte WebP y 96 máscaras. Son ocurrencias en los archivos y muchos derivados repiten las poses de los originales. La matriz conserva el SHA-256, el rectángulo de recorte, la posición en la hoja y la cantidad de píxeles transparentes y semitransparentes de cada celda.

### Originales

| Archivo | Dimensiones y tiempo medido | Alfa real | Vistas y posturas | Uso posible |
| --- | --- | --- | --- | --- |
| Animación de cachorro dorado sentándose.gif | 353 × 354, 12 × 180 ms | 0/12 | QD, de pie → sentado | Secuencia de sentado y referencia de párpado. El atlas de habitación tiene el recorte limpio. |
| Animación de perro dorado caminando.gif | 358 × 358, 12 × 100 ms | 0/12 | D, apoyo de marcha → apoyo de marcha | Referencia de fases. Examinar el arco y la huella de cada pata antes de reutilizar. |
| Perro dorado animado moviendo la cola.gif | 512 × 341, 9 × 110 ms | 9/9 | QD, sentado → sentado | Cola y gesto sentado. La base de la cola requiere adaptación a la postura de pie. |
| Perro dorado corriendo animado.gif | 361 × 271, 16 × 100 ms | 16/16 | D, apoyo lateral → fase de carrera | Carrera del creador y del Golden. El ciclo y los contactos se cotejan con el atlas publicado. |
| Perro dorado despierta y se estira.gif | 352 × 263, 16 × 310 ms | 0/16 | QD, tumbado dormido → sentado | Material combinado de despertar y estirarse. La habitación publica una selección de las poses. |
| Perro dorado en salto animado.gif | 362 × 362, 12 × 100 ms | 12/12 | D, de pie → de pie tras aterrizar | Impulso, vuelo y aterrizaje; reutilizable vía atlas. |
| Perro dorado girando feliz.gif | 351 × 260, 16 × 120 ms | 0/16 | F, QD, D, RD, R, RI, I, QI; de pie frontal → de pie frontal | Referencias de vista para pivote, apoyo y silueta posterior. El giro dirigido todavía necesita puentes específicos. |
| Perro dorado quedándose dormido.gif | 353 × 353, 12 × 420 ms | 0/12 | QD, sentado → tumbado dormido | Descenso al suelo y pose de reposo. El atlas de habitación incluye una selección limpia. |
| Hoja de sprites del perro aventurero-1.png | 1536 × 1024, 73 celdas, sin tiempo embebido | 0/73 | Acciones y posturas por fila en la matriz | 71 celdas declaradas en el preparador y dos variantes sentadas adicionales en fila 1, columnas 8 y 9, con índices desde cero. |

Los ocho GIF declaran alfa en sus metadatos. La inspección de píxeles encontró damero incrustado en cinco de ellos. Las 105 páginas son distintas dentro de sus respectivos GIF. `D` e `I` indican perfiles según hacia dónde mira el perro en pantalla. `QD` y `QI` indican los tres cuartos delanteros, `RD` y `RI` los traseros, `F` frontal y `R` trasera. La matriz consigna cada orientación por recorte y distingue el reflejo en ejecución de las vistas dibujadas.

### Publicados en el frontend

| Archivo de arte WebP | Resolución | Celdas del Golden | Contenido y reutilización |
| --- | --- | --- | --- |
| `golden-art.webp` | 3584 × 2816 | 58 | Marcha, sentado, sueño, despertar, necesidades, baño, sacudida, juego, caricias y expresiones. Trece celdas de Idle, Run y Jump de la lámina quedan fuera de este atlas porque hay derivados GIF específicos. |
| `golden-idle-art.webp` | 1792 × 1056 | 9 | Cola sobre cuerpo sentado, útil como referencia de movimiento secundario. |
| `golden-run-art.webp` | 1792 × 1408 | 16 | Carrera lateral. |
| `golden-jump-art.webp` | 1792 × 1056 | 12 | Salto lateral. |
| `portraits-art.webp` | 4032 × 1584 | 1 | Retrato sentado QD en la celda 0 de un atlas compartido. |
| `golden-room-art.webp` | 2688 × 1584 | 48 | Pivote multivista, poses de pie/sentado, cama y despertar/estiramiento. Incluye las referencias canónicas de Idle. |

Las celdas inventariadas tienen alfa real. Los cinco atlas bajo `assets/pets/` tienen un `*-collar.webp` homólogo del mismo tamaño y cuadrícula. Las máscaras registran cobertura para tintado del collar, especialmente relevante para el creador. El atlas de habitación ya incorpora el collar. La ilustración del jardín y la galería PNG figuran como contexto visual en la matriz.

## Matriz de producción

La columna **Poses** cuenta celdas dedicadas efectivamente usadas o poses canónicas del clip actual. Una máscara, un reflejo, un extremo prestado o una deformación en el renderizador cuentan como cero poses adicionales. Un mismo grupo sirve a más de una acción cuando así consta en la matriz. La ficha de cada acción detalla `resources.existing`, `resources.reusable` y `resources.pending`. Para las pendientes especifica poses ordenadas, intermedios nuevos, duración, anclas, continuidad y alfa por variante. `pilot` y `expanded` recogen las vistas de producción propuestas. `Complete` se refiere al nivel de cobertura del catálogo vigente.

| Acción | Estado | Poses | Postura inicial → final | Prioridad y brecha principal |
| --- | --- | --- | --- | --- |
| Idle | Partial | 1 | De pie → de pie | P0 · respiración dibujada, parpadeo por vista, cola de pie y oreja. |
| Walk | Partial | 6 | De pie → de pie | P0 · apoyos completos y empalme progresivo con Stop. |
| Trot | Missing | 0 | De pie → de pie | P0 · ciclo diagonal dedicado. |
| Run | Complete | 16 | De pie → de pie | P2 · cotejar contactos y ambos perfiles. |
| Jump | Complete | 12 | De pie → de pie | P2 · validar impulso y huella tras el aterrizaje. |
| Turn | Partial | 9 | De pie → de pie | P0 · anticipación de cabeza y pasos dirigidos. |
| Stop | Placeholder | 0 | De pie → de pie | P0 · estabilización por fase de entrada hasta Idle. |
| Sit | Complete | 9 | De pie → sentado | P2 · validar apoyo y celda final para StandUp. |
| LieDown | Partial | 16 | De pie → en reposo | P1 · puente sentado a tumbado y separación de Sleep. |
| Sleep | Complete | 1 | En reposo → en reposo | P2 · confirmar anclaje y curva de respiración de la pose. |
| WakeUp | Partial | 12 | En reposo → sentado | P1 · abrir ojos y levantarse a sentado en clip propio. |
| Stretch | Partial | 12 | En reposo → sentado | P1 · variante que empieza y acaba de pie. |
| Eat | Partial | 5 | De pie → sentado | P1 · enter/loop/exit y recipiente aparte. |
| Drink | Partial | 5 | De pie → sentado | P1 · lengua y salida dedicada, agua y recipiente aparte. |
| Lick | Missing | 0 | Sentado → sentado | P1 · extensión, contacto y retracción de lengua. |
| Greet | Partial | 6 | Sentado → sentado | P1 · gesto propio y vuelta a postura neutra. |
| Play | Partial | 5 | De pie → tumbado | P1 · reverencia, toque y seguimiento de la pelota separada. |
| ReceivePetting | Complete | 5 | Sentado → sentado | P2 · confirmar que la base del cuerpo queda estable. |
| SeekAttention | Partial | 4 | Sentado → sentado | P1 · petición diferenciada, apoyo y retorno sentado. |
| Happy | Complete | 4 | Sentado → sentado | P2 · conservar rostro, apoyos y continuidad del bucle. |
| Sad | Missing | 0 | Sentado → sentado | P1 · mirada, orejas y descenso suave del mentón. |
| Curious | Partial | 4 | De pie → de pie | P1 · inclinación de cabeza sin cambiar orientación del cuerpo. |
| Surprised | Missing | 0 | Sentado → sentado | P1 · ojos, mandíbula y recuperación breve. |
| Angry | Missing | 0 | Sentado → sentado | P1 · párpados, tensión facial moderada y relajación. |
| StandUp | Placeholder técnico | 0 | Sentado → de pie | P0 · secuencia ascendente con traslado real del peso. |

## Fichas de movimientos prioritarios

Las cantidades y duraciones siguientes son objetivos de producción. Cada cifra se aplica a una variante y vista piloto, descontando solo las referencias que se aprueben para continuidad. Las fichas restantes están en la matriz.

| Acción | Referencia exacta y poses nuevas | Cantidad y tiempo | Apoyo y continuidad |
| --- | --- | --- | --- |
| StandUp | `golden-room` 20 → 12. Dibujar inclinación hacia delante, transferencia de peso a las patas delanteras, elevación de pelvis y extensión de corvejones, ajuste de patas traseras. | 4 claves + 6 intermedios, 480–760 ms, una pasada. | Fijar las manos hasta la transferencia. Mover la cadera sobre los apoyos, luego igualar la silueta y la raíz de Idle. Se requiere esa trayectoria ascendente para reemplazar la espera y el cambio de pose actuales. |
| Stop | `golden-room` 12 como destino. Dibujar contacto final, compresión del hombro, último paso corto, colocación posterior bajo pelvis y recuperación del tórax. | 5 claves + 5 intermedios, 380–620 ms, una pasada por marcha y fase aprobada. | Tomar el contacto real de Walk, Trot o Run como entrada. Mantener cada apoyo plantado durante la frenada y converger en la misma pose de Idle. |
| Idle | `golden-room` 12 para respirar y 21 para ojos cerrados. Dibujar tórax a media inhalación, expansión y media exhalación. Para ojos, media altura, cierre y reapertura. Para cola y orejas, conservar la raíz y desplazar las puntas con retraso. | Respiración 3 + 5, 2700–3400 ms en bucle. Parpadeo 3 + 2, 120–180 ms. Cola de pie 4 + 4, 640–980 ms. Oreja 3 + 2, 180–280 ms. | Fijar suelo y cuatro huellas. La habitación ya respira por escala anclada y compone los párpados existentes. La cola disponible está dibujada sobre cuerpo sentado. |
| Trot | Usar `golden` 0–5 para silueta solamente. Dibujar contacto diagonal de delantera D y trasera I, compresión, empuje y suspensión breve. Repetir con delantera I y trasera D. | 8 + 8, 640–840 ms en bucle. | Anotar cada intervalo de apoyo y avance de raíz. Cerrar el bucle en el primer contacto sin una celda inicial duplicada. Calibrar recorrido por ciclo y comprobar estabilidad de huellas al variar velocidad. |
| Lick | `golden` 21 referencia la lengua y `golden-room` 20 fija la pose neutra. Dibujar apertura mínima, punteo, extensión a nariz, retracción y cierre. | 5 + 5, 410–660 ms, una pasada. | Mantener fijos nariz, mandíbula en su pivote y las patas. Separar lengua de hocico y conservar su oclusión al cerrar. |
| Sad | `golden-room` 20 como neutra. Dibujar mirada baja, párpados y oreja relajados, mentón bajo y cola en reposo con retorno. | 4 + 4, 780–1350 ms, una pasada. | Cadera, cuello y base de orejas controlan el gesto. Conservar tamaño de ojos, orejas caídas y cuatro apoyos de la postura sentada. |
| Surprised | `golden-room` 20 y `portraits` 0 para identidad. Dibujar ojos abiertos y retirada breve de cabeza, reacción de la base de orejas, apertura corta de mandíbula y recuperación. | 4 + 4, 350–650 ms, una pasada. | Fijar pelvis y patas. Conservar la caída de las orejas y el volumen de mandíbula al cambiar de expresión. |
| Angry | `golden-room` 20 y `portraits` 0. Dibujar mirada fija con párpados bajos, tensión del hocico, orejas bajas con pecho firme y relajación. | 4 + 4, 650–1050 ms, una pasada. | Mantener proporciones del hocico, ancla del cuello y posición del medallón. Igualar la pose neutral en la salida. |

Para el giro dirigido, anotar primero la mirada, luego la transferencia de peso, el paso delantero, el acomodo de cadera y el restablecimiento de apoyos. La propuesta por arco de 90° es 5 claves y 5 intermedios en 370–550 ms. Las vistas del GIF de giro fijan siluetas y accesorios por ángulo. Para la marcha, anotar apoyo y liberación de las cuatro patas y su relación con la distancia real de desplazamiento.

## Reutilización y separación de piezas

| Elemento | Reutilización comprobada o guía existente | Entrega para composición |
| --- | --- | --- |
| Cabeza | Las vistas de giro y las celdas `golden-room` 0–3 muestran ángulos útiles. Al comparar contornos, el cuello y el torso también cambian. | Cabeza y cuello con solape bajo el pelaje, pivotes por vista y material bajo la mandíbula. |
| Parpadeo | Las celdas 20 y 21 permiten comparar el cierre. Idle aplica recortes de párpados y el ajuste de colocación depende de la vista. | Capas de ojos por lado, página de referencia, pivotes de cabeza y secuencia de cierre limpia. |
| Cola | Las nueve páginas del GIF muestran el desfase entre base y punta en sentado. | Cola de pie con pivote en la grupa y silueta dedicada, manteniendo el largo y el grosor originales. |
| Respiración | Existe una pose neutral de pie. La escala anclada del runtime conserva el punto de apoyo general. | Tórax y pelaje por separado con apoyos estables. Verificar la continuidad con una reproducción lenta y con píxeles de suelo constantes. |
| Patas | Walk, Run y Jump aportan siluetas y contactos de otros ciclos. | Dibujar apoyos propios de Trot, StandUp y Stop. Marcar hombro, cadera, articulaciones y pies visibles y ocultos por vista. |
| Expresiones | Happy y ReceivePetting aportan variaciones de boca y ojos, y las dos celdas sentadas extra aportan referencia facial. | Párpados, orejas, hocico, mandíbula y lengua por separado con la misma paleta. Conservar el contorno de Quieto/Sentado en la entrada y salida. |

Para la fuente maestra, duplicar como guía las celdas autorizadas, alinear todas las capas al suelo y reconstruir las zonas ocultas siguiendo los contornos y volumen de la misma vista. Separar torso, cuello y cabeza, patas cercanas y lejanas, ojos, párpados, mandíbula, lengua, orejas, cola, collar y medallón. Marcar pivotes y oclusión, y cotejar cada composición de referencia con la celda aprobada. El pelaje bajo las uniones y las asimetrías de los accesorios requieren revisión del artista. Los objetos han de tener su propia capa y punto de interacción. Conviene aprobar primero la pose recompuesta y el orden de oclusión, y después interpolar. El reproductor de atlas publica celdas completas y en Idle usa composición localizada de párpados. Para una superposición general se necesitan capas reales congruentes y un compositor que las admita.

## Exportación reproducible

1. **Fuente maestra.** Conservar el documento editable por capas y un manifiesto por acción y vista con versión, `sourceSha256`, celdas de referencia, FPS nominal, lista ordenada de PNG, `durationMs` por fotograma, ancla de suelo, pivotes, apoyos, eventos, loop, fases y extremos aprobados. El formato editable se elige con el equipo de arte. El GIF se deriva para revisión.
2. **PNG.** Exportar en sRGB RGBA de 8 bits con alfa recto, tamaño de celda fijo dentro del clip y márgenes para orejas, cola y saltos. Probar 448 × 352 px como entrega a 2× del lienzo lógico de 224 × 176. Usar `(224, 298)` como guía de suelo de esa plantilla y verificar la posición frente al ancla lógica y las celdas publicadas antes de integrar. Conservar `frame_0000.png` y un orden explícito por manifiesto.
3. **Spritesheet.** Empaquetar las celdas sin recortes ajustados a la silueta, según el orden del manifiesto. Grabar dimensiones, columnas, coordenadas de cada celda, relleno y ancla. Decodificar el PNG final y comparar cada rectángulo RGBA con el PNG de origen. Exportar la máscara homóloga si el clip se admite en el creador.
4. **WebP animado.** Decodificar los PNG a RGBA y concatenar sus buffers en orden. La entrada de Sharp usa `raw: { width, height: height * frames.length, channels: 4, pageHeight: height }`. Aplicar `.webp({ lossless: true, delay: durations, loop })` y decodificar el resultado para verificar la cuenta, el alto por página, la duración, el alfa y la apariencia de las páginas. Usar `loop: 0` para repetición continua y verificar la configuración de una pasada en el consumidor.
5. **GIF de previsualización.** Usar el mismo buffer con `.gif({ delay: durations, loop, dither: 0 })`. Cuantizar los tiempos en incrementos de 10 ms ajustando sobre el total acumulado y revisar el color de la paleta y el alfa binario. Mantener bordes semitransparentes y color original en el PNG maestro.
6. **Validación.** Revisar damero y halos sobre fondo claro y oscuro, márgenes, referencia de color, ancla, huellas por contacto, secuencia fotograma a fotograma, primer/último fotograma, empalmes y cadencia a velocidad lenta y normal. Nombre sugerido `golden_retriever_<accion>_<vista>.<ext>`. Registrar hashes de los originales, celdas y manifiesto.

Las API de imagen ya instaladas se probaron en memoria con las celdas 12 y 20 del atlas de habitación a 336 × 264. Las decodificaciones devolvieron PNG RGBA, spritesheet vertical de 336 × 528, WebP animado de dos páginas con tiempos de 80 y 120 ms y GIF de dos páginas con los mismos tiempos. Ambos animados conservaron información de alfa y metadato de loop, con las restricciones de paleta y alfa del GIF. Esta prueba ejercitó el empaquetado; los entregables gráficos de 4A son las hojas de contacto.

## Orden de producción e integración

1. Firmar la hoja de identidad y las poses neutras por vista. Entregar Idle, StandUp y Stop con pruebas de continuidad entre las poses sentada y de pie y entre el último apoyo y Idle.
2. Aprobar Walk, Trot y Turn con contactos anotados. Validar puntos de inicio/final por ángulo y que la velocidad de reproducción de locomoción siga la distancia. Conservar temporización según tiempo para acciones estacionarias.
3. Completar reposo, necesidades, pelota, saludo, atención y emociones. Aprobar cada accesorio desacoplado con su punto de interacción antes de vincular la acción en la habitación. Revisar las seis acciones completas en el contexto de las nuevas vistas y en el flujo del creador.
4. En una fase de integración, asociar los archivos aprobados al adaptador por acción, fase y vista. Declarar apoyos y eventos en el catálogo y actualizar `status` cuando se hayan verificado recursos, entrada, salida y fallback. Ejecutar pruebas de colisiones, prioridad de órdenes, autonomía, reducción de movimiento, persistencia y creador antes de publicar.

## Reproducción y verificaciones

La revisión parte de [Fase 0](PETMOTION_AUDIT.md), [MVP](PETMOTION_MVP.md), [Fase 2](PETMOTION_PHASE2.md) y [Fase 3](PETMOTION_PHASE3.md), y contrasta [la corrección posterior de Idle](PETMOTION_IDLE_FIX.md) con el catálogo y los manifiestos actuales.

| Verificación | Resultado |
| --- | --- |
| `node scripts/pets/audit-golden.mjs` | Inventario y hojas generados con Sharp. |
| `node scripts/pets/audit-golden.mjs --check` | Comparación RGBA por recorte, referencias de la matriz y coincidencia del índice publicado. |
| `npm run build` | Compilación del frontend satisfactoria. |
| `npm run test:pet-motion` | 28 pruebas unitarias aprobadas. |
| `npm run test:e2e` | 23 pruebas Playwright aprobadas, incluidas la habitación, Idle, la autonomía y el creador. En Windows se cerró el servidor temporal de Playwright después de que terminaran las pruebas. El comando devolvió código 0. |
| SHA-256 antes y después | Coincidencia de 127 archivos de fuentes, imágenes y configuración revisados. |

Los archivos de esta fase son este Markdown, la matriz JSON, el índice y las hojas PNG de `docs/petmotion-contact-sheets/`, y el script aislado `scripts/pets/audit-golden.mjs`.
