# Recursos gráficos

## Portada

La ilustración [Compañeros del jardín](../apps/web/src/assets/companeros-del-jardin.webp) se creó con ImageGen integrado y se codificó en WebP para la web. Los iconos de la interfaz proceden de Lucide. Manrope y Fraunces se sirven con la aplicación mediante Fontsource.

Se usaron como referencias de estilo las láminas en `Imagenes/`. El retriever y el gato naranja orientaron el diseño de los protagonistas de la portada.

### Instrucción final de generación

> Use case: illustration-story. Edit image 1, the existing full-bleed hero illustration of a golden retriever and an orange tabby in a garden. Images 2 and 3 are style references for the golden retriever and orange tabby ONLY. Keep the premium garden composition of image 1, both full bodies near center, dog on left and cat on right, wooden fence, foliage and daisies, dusk-gold ivory light. Redraw the two animals in a defined, hand-painted 2D cartoon direction inspired by the faces, clean tapered outlines, legible markings and collar shapes in the reference sheets. Use stylized but balanced anatomy and warm, friendly expressions with moderately sized eyes. Keep the dog clearly a golden retriever with floppy ears, forest green collar or bandana; give the orange tabby a muted olive collar and clear stripe pattern. The animals should feel deliberately drawn, with clean contours and restrained gouache shading, while the scene retains a little paper grain and depth. Use muted sage, olive, forest green, cream, natural wood and restrained terracotta. Original single landscape artwork, 6:5 near-square composition, characters stay within center 70%, full-bleed garden. No reference sheet layout, no repetitive grid, no lettering, no labels, no UI, no logo, no watermark. Do not include other breeds or portraits.

## Creador de mascotas

| Recurso | Uso |
| --- | --- |
| `Hoja de sprites del perro aventurero-1.png` | 71 fotogramas del golden retriever. |
| `Hoja de sprites_ animaciones de gato atigrado-2.png` | 80 fotogramas del gato atigrado. |
| `Guía de animaciones de nueve perros-1.png` | 480 fotogramas adicionales para ocho variantes de perro. |
| `Atlas de Animaciones de Gatos Variados-2.png` | 120 poses adicionales para ocho variantes de gato, incluido el Sphynx. |
| Láminas de perros y gatos | Retratos recortados por variante para el selector. |
| `Imagenes/Sphynx_retrato.png` | Retrato transparente del Sphynx, creado con ImageGen integrado. |
| `apps/web/src/assets/pets/` | Atlas WebP de retratos, secuencias, máscaras del collar y manifiesto JSON. |

Los gatos y el golden retriever cuentan con 14 movimientos. Los otros perros disponen de 12 o 13 según las poses distinguibles de su panel. La lámina compacta de perros reúne comida y agua en una misma fila y combina las caricias con el gesto de celebración. El selector ofrece las secuencias que se pueden distinguir en cada variante. La mayoría de los movimientos de los gatos de la lámina compacta tienen una sola pose dibujada. La vista previa completa el gesto con desplazamientos continuos, cambios suaves de postura o poses compatibles de la misma variante. La nitidez de los fotogramas pequeños sigue dependiendo de la resolución de la lámina.

Para regenerar los atlas, instala las dependencias con `npm ci` y ejecuta `npm run prepare:pets` desde la raíz. `scripts/pets/sources.mjs` registra los recortes y la línea de apoyo de las hojas detalladas. `scripts/pets/compact-sheets.mjs` define los recortes y las opciones de cada panel en las láminas compactas. El proceso limpia el fondo, alinea el torso con los fotogramas vecinos y genera las máscaras de color. Las celdas lógicas miden 224 por 176 píxeles y los retratos se codifican al doble de resolución. [Documentación de Sharp](https://sharp.pixelplumbing.com/api-output/)

### Instrucción de generación del Sphynx

> Use case: illustration-story. Create one isolated game character still for the Huellitas de Luz pet creator, a recognizable adult Sphynx cat, almost entirely hairless warm muted peach-beige skin, slender torso and limbs, very large upright ears, fine skin folds on forehead and shoulder, slim curved tail, natural rounded paws, friendly attentive eyes of restrained size. Seated at a three-quarter angle facing right with all paws and the full tail visible. Wear one plain forest-green collar with a small round wooden tag. Use warm 2D hand-painted cartoon game sprite style, clearly defined tapered dark brown outlines, subtle warm shading, clean forms, balanced proportions, consistent with classic illustrated golden retriever and domestic tabby character art on a cream and forest-green animal welfare game. Center the cat with a simple silhouette and 12% padding on all sides. TRUE isolated transparent background, no ground or cast shadow, no plants, no floor, no extra animals, no text, no chart, no logo, no Egyptian ornaments or symbols.
