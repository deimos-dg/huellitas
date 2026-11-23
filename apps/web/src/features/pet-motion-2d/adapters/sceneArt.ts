import garden from '../../../../../../Imagenes/escenarios/01_Jardin.png?url'
import bathroom from '../../../../../../Imagenes/escenarios/02_Bano.png?url'
import kitchen from '../../../../../../Imagenes/escenarios/03_Cocina.png?url'
import livingRoom from '../../../../../../Imagenes/escenarios/04_Sala_de_descanso.png?url'
import park from '../../../../../../Imagenes/escenarios/05_Parque.png?url'
import infirmary from '../../../../../../Imagenes/escenarios/06_Enfermeria.png?url'
import type { PlayableScene } from '../domain/sceneCatalog'

export const sceneArt: Partial<Record<PlayableScene['id'], string>> = { garden, park, kitchen, 'living-room': livingRoom, bathroom, infirmary }
