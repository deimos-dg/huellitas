# Ciclo día/noche de Huellitas de Luz

La primera etapa se puede recorrer desde **Visita el jardín** en la portada o en `/jardin`. El prototipo usa `01_Jardin.png` a su proporción original de 1672 × 941. Muestra la hora local y cambia las capas de ambiente sobre la ilustración. Los otros seis escenarios tienen un perfil reservado y un inventario para producción artística.

## Auditoría de las ilustraciones

Los seis escenarios existentes se inspeccionaron visualmente en `Imagenes/escenarios/`. Los PNG son composiciones opacas de una sola capa. La portada usa un WebP diferente con animales incrustados y luz cálida fija. `/habitacion` usa un escenario CSS propio para las interacciones del Golden. La referencia `07_Galeria_de_adopciones.png` muestra una maqueta de interfaz y queda fuera del ciclo ambiental.

| Escenario y recurso | Elementos integrados | Recursos para completar la transición |
| --- | --- | --- |
| Jardín · `01_Jardin.png` (1672 × 941) | Cielo azul con nubes y sin disco solar, árboles que recortan la abertura, farol colgante, guirnalda y ventana con color integrado. El suelo, follaje y casita tienen luz y sombras diurnas pintadas. | Máscara del cielo y oclusión de las copas, base sin brillo de lámparas, capa emisiva del farol, guirnalda y ventana, y rebote local sobre objetos. El prototipo usa los puntos visibles y un halo suave sin sustituir la imagen. |
| Parque · `05_Parque.png` (1671 × 941) | Cielo azul y nubes entre copas, farolas encendidas en el arte y sombras en el césped y los juegos. | Cielo/aberturas recortables, máscara de follaje y equipo de juego, farolas sin y con emisión y capa de sombras o luz rasante. |
| Sala · `04_Sala_de_descanso.png` (1672 × 941) | Exterior diurno integrado en la ventana arqueada, colgante brillante y parches de luz sobre pared y suelo. Incluye animales durmiendo en sus camas. | Vidrio/exterior independiente, anulación de parches de sol, lámpara y rebote separados. Base limpia sin animales si se añaden mascotas interactivas. |
| Cocina · `03_Cocina.png` (1672 × 941) | Ventana diurna, colgante encendido y reflejos cálidos en encimera y suelo. | Vista detrás de la ventana, luz de ventana, máscara emisiva del colgante y reflejos independientes. |
| Baño · `02_Bano.png` (1671 × 941) | Exterior brillante por el ventanal, farol de pared encendido y brillos sobre madera, tina y azulejos. | Máscara del cristal y exterior, variante del farol sin emisión, resplandor de pared y luz diurna separada. |
| Enfermería · `06_Enfermeria.png` (1670 × 941) | Ventana arqueada con cielo y nubes, lámpara de techo ya encendida y brillo en mesa, muebles y suelo. | Vista y derrame de ventana por separado, luminaria con emisión independiente e iluminación de trabajo legible tanto de día como de noche. |
| Vestidor · recurso pendiente | Todavía no hay ilustración de referencia. | Base cartoon del proyecto y capas separadas de las luces, reflejos del espejo y ventana si el diseño la incluye. |

El jardín deja ver un cambio de ambiente con el arte disponible. El tratamiento de cielo se desvanece sobre la abertura existente y su borde. El dibujo conserva nubes, vegetación, sombras diurnas y focos impresos. El halo aumenta su presencia por la noche. Encender y apagar cada foco de forma convincente y cambiar la dirección de sus sombras requieren los recursos enumerados.

## Horario local

Los límites elegidos para el prototipo se aplican en el dispositivo. El inicio de cada tramo está incluido. Los tramos son fijos durante el año, independientemente de la salida y la puesta de sol astronómicas.

| Periodo | Hora local | Apariencia del jardín |
| --- | --- | --- |
| Mañana | 06:00–09:59 | Luz cálida suave y sol. |
| Día | 10:00–16:59 | Paleta original y sol. Incluye las 14:00. |
| Atardecer | 17:00–18:29 | Luz ámbar, sol atenuado y comienzo del brillo artificial. |
| Anochecer | 18:30–19:29 | Luz violeta, luna tenue y brillo de faroles. |
| Noche | 19:30–05:59 | Sombra fría, luna y luces cálidas. Incluye las 20:00. |

## Diseño e integración

- `DayNightController.ts` obtiene hora y minuto mediante `Date.getHours()` y `Date.getMinutes()`. Publica un snapshot estable cuando cambia el minuto o el modo de simulación. Admite un reloj inyectable para pruebas y es independiente de React, PetMotion y la escena seleccionada.
- `useDayNight.ts` conecta el reloj con `useSyncExternalStore`. Lee el reloj del dispositivo cada segundo y lo vuelve a consultar en `focus`, `pageshow` y al hacerse visible la pestaña. La suscripción y el intervalo se liberan al desmontar el escenario.
- `sceneLighting.ts` declara los perfiles de los siete escenarios. Las coordenadas y los radios de luz se expresan como porcentajes del lienzo original. Solo el perfil del jardín tiene capas configuradas para esta etapa.
- `DayNightLayers.tsx` y `day-night.css` componen luz general, cielo, sol/luna y brillo de fuentes artificiales. Se colocan encima del arte y debajo de futuras mascotas, objetos interactivos y controles. Las capas son decorativas y dejan pasar eventos de puntero. La opacidad y el color interpolan durante 900 ms y se aplican de inmediato con `prefers-reduced-motion`.
- `GardenPage.tsx` monta el prototipo y enlaza a `/habitacion`. La portada conserva su sección `/#jardin` y añade acceso al escenario. Vite carga la página y la ilustración de forma diferida al entrar en `/jardin`.

Para incorporar otro escenario, aprobar primero la base y las capas que pide su ficha. Montar la ilustración original dentro de un contenedor relativo aislado y calibrar las luces respecto a su escala. Para un interior, limitar el cielo o la vista exterior al cristal. Dibujar después los objetos y mascotas encima de las capas de iluminación para conservar el color de los sprites y sus zonas activas. Probar las cinco horas a escala móvil y de escritorio antes de habilitar el perfil.

## Control de desarrollo

En `npm run dev`, abrir `/jardin`, desplegar **Simular hora**, elegir una hora y pulsar **Aplicar hora**. **Volver a la hora local** vuelve a leer el reloj al instante. La simulación dura mientras la página está montada. Vite excluye el control mediante `import.meta.env.DEV`.

## Verificación

- `npm run build` compila y verifica los tipos. El PNG emitido coincide byte a byte con `Imagenes/escenarios/01_Jardin.png`. Se comprobó la ausencia del formulario de simulación en el JavaScript de producción.
- `npm run test:pet-motion` conserva las 28 pruebas unitarias del Golden.
- `npm run test:e2e -- --fully-parallel --workers=4` aprobó las 28 pruebas en Microsoft Edge, incluidas las cinco nuevas. Cubren límites de periodo, cambios de reloj, zona horaria, regreso a la pestaña, simulación, movimiento reducido y compatibilidad con PetMotion. Los flujos de portada y creador también pasaron. Tras completar las pruebas se cerró el servidor temporal en Windows y Playwright devolvió código 0.
