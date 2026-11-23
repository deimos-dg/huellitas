import type { NavigationMap, Polygon } from './navigation'
import { roomNavigation } from './navigation'
import { objects, roomId, spawn } from './room'
import type { Facing, Point, RoomObject } from './room'
import { imageToLogical } from './sceneCoordinates'
import type { Size } from './sceneCoordinates'

type SceneId = 'garden' | 'park' | 'living-room' | 'kitchen' | 'bathroom' | 'infirmary' | 'dressingRoom'
type SceneImage = { file: string; size: Size; alt: string }
type ForegroundMask = { id: string; polygon: Polygon; depth: number }

export type PlayableScene = Readonly<{
  id: Exclude<SceneId, 'dressingRoom'> | typeof roomId
  name: string
  status: 'playable' | 'practice'
  background?: SceneImage
  lighting?: SceneId
  navigation: NavigationMap
  objects: readonly RoomObject[]
  masks: readonly ForegroundMask[]
  spawn: Point
  orientations: readonly [Facing, ...Facing[]]
  sizeRange: readonly [number, number]
}>

type PendingScene = Readonly<{ id: SceneId; name: string; status: 'pending-art'; background?: SceneImage; lighting: SceneId; note: string }>

const directions = ['right', 'left'] as const
// Measurements made on 1024 × 576 references of the original illustrations.
const reference = { width: 1024, height: 576 }
const at = (x: number, y: number) => imageToLogical({ x, y }, reference)
const polygon = (...points: readonly [number, number][]): Polygon => points.map(([x, y]) => at(x, y))
const area = (x: number, y: number, width: number, height: number) => ({ ...at(x, y), width: at(width, height).x, height: at(width, height).y })
const image = (file: string, width: number, alt: string): SceneImage => ({ file, size: { width, height: 941 }, alt })

export const practiceScene: PlayableScene = {
  id: roomId, name: 'Habitación de práctica', status: 'practice', navigation: roomNavigation, masks: [], spawn,
  objects: objects.map(object => ({ ...object, art: { ...object.art, depth: object.collision.y + object.collision.height } })),
  orientations: directions, sizeRange: [.83, 1],
}

export const gardenScene: PlayableScene = {
  id: 'garden', name: 'Jardín principal', status: 'playable', lighting: 'garden',
  background: image('01_Jardin.png', 1672, 'Jardín ilustrado con una casita, un camino de piedra y un banco bajo faroles.'),
  navigation: {
    floor: polygon([141, 308], [921, 308], [969, 385], [954, 479], [866, 535], [321, 556], [118, 524], [93, 441]),
    obstacles: [
      polygon([316, 295], [605, 291], [668, 307], [663, 328], [587, 339], [377, 339], [311, 326]), // Casita y flores
      polygon([123, 302], [171, 310], [184, 347], [153, 381], [101, 386], [81, 347]), // Tronco y raíz
      polygon([724, 285], [897, 285], [922, 309], [921, 333], [861, 346], [731, 333]), // Banco
      polygon([905, 315], [952, 315], [971, 339], [960, 356], [902, 355], [888, 335]), // Comedero
      polygon([119, 543], [154, 524], [218, 526], [240, 548], [216, 567], [132, 571]), // Roca del primer plano
      polygon([940, 414], [989, 411], [1023, 448], [1012, 511], [939, 523], [912, 477]), // Flores del borde derecho
    ],
  },
  objects: [
    { id: 'bed', label: 'Descansar junto a la casita', action: 'rest', hitbox: area(409, 182, 186, 145), interaction: at(554, 358), facing: 'left' },
    { id: 'bench', label: 'Mirar desde el banco', action: 'look', hitbox: area(726, 218, 172, 95), interaction: at(807, 354), facing: 'right' },
    { id: 'food', label: 'Explorar el comedero', action: 'look', hitbox: area(898, 314, 63, 35), interaction: at(868, 364), facing: 'right' },
  ],
  masks: [{ id: 'roca-jardin', depth: at(0, 564).y, polygon: polygon([118, 548], [131, 533], [149, 518], [170, 508],
    [191, 505], [210, 512], [223, 523], [237, 546], [222, 556], [203, 559], [179, 571], [146, 568], [123, 561]) }],
  spawn: at(505, 446), orientations: directions, sizeRange: [.61, .81],
}

export const parkScene: PlayableScene = {
  id: 'park', name: 'Parque de juegos', status: 'playable', lighting: 'park',
  background: image('05_Parque.png', 1671, 'Parque ilustrado con rampas, una valla, un aro y un túnel de agilidad.'),
  navigation: {
    floor: polygon([317, 265], [904, 265], [953, 352], [917, 462], [762, 515], [384, 532], [254, 462], [251, 358]),
    obstacles: [
      polygon([345, 263], [481, 254], [528, 304], [500, 327], [327, 327], [307, 312]), // Rampa
      polygon([393, 342], [407, 319], [543, 313], [564, 361], [548, 388], [414, 408], [389, 388]), // Valla
      polygon([526, 239], [619, 239], [631, 264], [608, 283], [523, 286]), // Postes de eslalon
      polygon([612, 270], [715, 267], [727, 300], [709, 312], [603, 310]), // Aro
      polygon([720, 317], [777, 286], [918, 269], [940, 303], [937, 340], [804, 382], [735, 371]), // Túnel
      polygon([524, 400], [624, 346], [669, 345], [684, 363], [682, 397], [584, 434], [524, 439]), // Troncos
      polygon([690, 426], [934, 394], [1022, 431], [1014, 503], [913, 506], [674, 478]), // Plataforma de recipientes
      polygon([185, 348], [268, 338], [309, 363], [296, 411], [249, 431], [200, 403]), // Banco y plantas
    ],
  },
  objects: [
    { id: 'ring', label: 'Observar el aro', action: 'look', hitbox: area(612, 187, 106, 111), interaction: at(667, 328), facing: 'right' },
    { id: 'hurdle', label: 'Saltar frente a la valla', action: 'jump', hitbox: area(403, 293, 144, 97), interaction: at(464, 432), facing: 'left' },
  ],
  masks: [], spawn: at(437, 468), orientations: directions, sizeRange: [.59, .78],
}

export const kitchenScene: PlayableScene = {
  id: 'kitchen', name: 'Cocina', status: 'playable', lighting: 'kitchen',
  background: image('03_Cocina.png', 1671, 'Cocina ilustrada con mesa al frente y recipientes de comida y agua sobre el suelo.'),
  navigation: {
    floor: polygon([239, 452], [440, 419], [882, 419], [991, 476], [999, 539], [956, 565], [340, 565], [233, 516]),
    obstacles: [
      polygon([167, 317], [493, 311], [504, 430], [196, 483], [167, 483]), // Muebles de la izquierda
      polygon([485, 307], [918, 307], [931, 450], [488, 445]), // Encimera, estufa y armarios
      polygon([879, 399], [1023, 395], [1023, 472], [894, 475]), // Refrigerador y cesta
      polygon([0, 483], [237, 482], [364, 490], [471, 510], [472, 540], [452, 576], [0, 576]), // Mesa del primer plano
      polygon([464, 428], [524, 429], [536, 443], [532, 456], [454, 456], [453, 443]), // Comida
      polygon([536, 429], [591, 429], [607, 440], [609, 456], [531, 460], [526, 445]), // Agua
    ],
  },
  objects: [
    { id: 'food', label: 'Comedero', action: 'eat', hitbox: area(458, 408, 73, 44), interaction: at(448, 454), facing: 'right', paintedProp: true },
    { id: 'water', label: 'Bebedero', action: 'drink', hitbox: area(531, 415, 72, 41), interaction: at(615, 454), facing: 'left', paintedProp: true },
  ],
  masks: [
    { id: 'mesa-cocina', depth: at(0, 573).y, polygon: polygon([0, 536], [71, 528], [90, 506], [131, 494], [184, 489],
      [234, 490], [291, 491], [359, 496], [422, 504], [457, 512], [464, 518], [464, 533], [445, 541], [445, 576], [0, 576]) },
    { id: 'comedero-cocina', depth: at(0, 456).y, polygon: polygon([460, 444], [464, 429], [470, 426], [478, 430],
      [496, 432], [515, 430], [525, 426], [532, 444], [527, 447], [510, 451], [489, 451], [470, 448]) },
    { id: 'bebedero-cocina', depth: at(0, 460).y, polygon: polygon([528, 448], [533, 432], [539, 427], [549, 430], [567, 431],
      [585, 431], [598, 426], [604, 449], [598, 453], [577, 457], [555, 456], [536, 453]) },
  ],
  spawn: at(715, 523), orientations: directions, sizeRange: [.72, .90],
}

export const livingRoomScene: PlayableScene = {
  id: 'living-room', name: 'Sala de descanso', status: 'playable', lighting: 'living-room',
  background: image('04_Sala_de_descanso.png', 1672, 'Sala con dos camas vacías, sofá verde, alfombra, mesa y rascador.'),
  navigation: {
    floor: polygon([55, 412], [187, 370], [401, 365], [820, 359], [955, 414], [1005, 502], [968, 552], [142, 557], [49, 500]),
    obstacles: [
      polygon([0, 300], [177, 302], [188, 421], [167, 443], [0, 453]), // Estantería, macetas y hueco estrecho
      polygon([386, 269], [771, 262], [817, 312], [815, 388], [786, 413], [404, 413]), // Sofá
      polygon([404, 373], [653, 362], [687, 378], [688, 419], [666, 456], [413, 455], [398, 413]), // Mesa
      polygon([804, 290], [1000, 285], [1023, 401], [974, 417], [813, 407]), // Rascador
      polygon([877, 405], [967, 379], [1015, 403], [1022, 459], [1000, 504], [874, 497], [861, 450]), // Cesta de juguetes
      polygon([59, 404], [87, 383], [220, 382], [267, 408], [276, 467], [260, 490], [217, 501], [77, 502], [48, 477]), // Cama verde
      polygon([181, 367], [199, 340], [279, 329], [351, 337], [386, 362], [394, 406], [376, 429], [337, 438], [190, 432]), // Cama rosa
      polygon([674, 461], [738, 461], [783, 479], [789, 500], [761, 511], [671, 502], [659, 480]), // Cuerda
      polygon([874, 478], [899, 471], [913, 487], [910, 507], [881, 510], [870, 496]), // Pelota
    ],
  },
  objects: [
    { id: 'green-bed', label: 'Cama verde', action: 'rest', hitbox: area(57, 389, 205, 101), interaction: at(198, 507), restingPoint: at(155, 446), facing: 'right' },
    { id: 'pink-bed', label: 'Cama rosa', action: 'rest', hitbox: area(188, 337, 195, 93), interaction: at(334, 444), restingPoint: at(289, 388), facing: 'left' },
    { id: 'rug', label: 'Descansar en la alfombra', action: 'rest', hitbox: area(471, 460, 101, 40), interaction: at(522, 514), facing: 'right' },
    { id: 'ball', label: 'Jugar con la pelota', action: 'play', hitbox: area(870, 471, 46, 38), interaction: at(848, 506), facing: 'right', paintedProp: true },
    { id: 'rope', label: 'Observar la cuerda', action: 'look', hitbox: area(664, 462, 121, 48), interaction: at(741, 522), facing: 'left' },
    { id: 'scratcher', label: 'Rascador · reservado para gatos', action: 'look', hitbox: area(819, 191, 184, 201),
      interaction: at(823, 427), facing: 'right', reservedFor: 'cat' },
  ],
  masks: [
    { id: 'borde-cama-verde', depth: at(0, 494).y, polygon: polygon([55, 466], [62, 424], [72, 410], [83, 416], [103, 431],
      [121, 442], [147, 447], [177, 447], [206, 443], [231, 434], [245, 420], [254, 410], [263, 433], [267, 469],
      [259, 483], [241, 491], [207, 494], [156, 497], [100, 495], [71, 489], [56, 479]) },
    { id: 'borde-cama-rosa', depth: at(0, 431).y, polygon: polygon([201, 404], [192, 377], [200, 355], [214, 360],
      [231, 370], [252, 382], [274, 389], [298, 390], [327, 387], [351, 378], [366, 363], [373, 369], [379, 388],
      [381, 405], [373, 417], [352, 425], [320, 430], [271, 430], [227, 427]) },
    { id: 'tablero-sala', depth: at(0, 443).y, polygon: polygon([414, 381], [466, 367], [631, 367], [674, 374],
      [676, 381], [676, 390], [644, 401], [416, 395], [412, 390]) },
    { id: 'pelota-sala', depth: at(0, 507).y, polygon: polygon([875, 491], [877, 482], [884, 475], [894, 471],
      [903, 474], [909, 481], [911, 489], [908, 498], [900, 504], [888, 506], [879, 501]) },
  ],
  spawn: at(581, 514), orientations: directions, sizeRange: [.66, .85],
}

export const bathroomScene: PlayableScene = {
  id: 'bathroom', name: 'Baño', status: 'playable', lighting: 'bathroom',
  background: image('02_Bano.png', 1671, 'Baño ilustrado con bañera, estantería, alfombra y cestas.'),
  navigation: {
    floor: polygon([176, 478], [362, 445], [793, 445], [920, 503], [858, 552], [170, 552], [102, 522]),
    obstacles: [
      polygon([0, 289], [193, 289], [194, 503], [141, 522], [0, 530]), // Estantería
      polygon([0, 482], [57, 476], [96, 492], [126, 521], [133, 576], [0, 576]), // Hojas del primer plano
      polygon([194, 444], [207, 424], [292, 420], [313, 442], [318, 481], [295, 496], [208, 497], [190, 482]), // Cuenco
      polygon([338, 378], [431, 377], [440, 403], [428, 455], [406, 468], [350, 469], [335, 447]), // Maceta
      polygon([412, 333], [467, 315], [786, 316], [829, 337], [822, 445], [789, 480], [752, 494], [473, 484], [422, 438]), // Bañera
      polygon([817, 404], [971, 405], [1009, 453], [981, 495], [897, 502], [823, 485]), // Cesta y esquina derecha
    ],
  },
  objects: [{ id: 'bathtub', label: 'Observar la bañera', action: 'look', hitbox: area(423, 334, 399, 136), interaction: at(650, 520), facing: 'left',
    care: { sequence: ['Approach', 'Ready', 'Bathing', 'Finish', 'Exit'], art: 'pending', pendingNote: 'Baño pendiente de recursos de animación.' } }],
  masks: [
    { id: 'frente-banera', depth: at(0, 483).y, polygon: polygon([423, 349], [450, 357], [506, 365], [613, 368], [719, 363],
      [798, 355], [821, 349], [820, 361], [813, 370], [800, 423], [786, 449], [771, 459], [750, 465], [748, 479],
      [729, 485], [715, 471], [503, 469], [487, 475], [471, 471], [468, 462], [474, 451], [449, 431], [433, 378], [423, 369]) },
  ],
  spawn: at(323, 530), orientations: directions, sizeRange: [.64, .80],
}

export const infirmaryScene: PlayableScene = {
  id: 'infirmary', name: 'Enfermería', status: 'playable', lighting: 'infirmary',
  background: image('06_Enfermeria.png', 1670, 'Enfermería ilustrada con mesa de revisión, taburete, carrito y gabinetes.'),
  navigation: {
    floor: polygon([152, 460], [349, 419], [700, 417], [959, 446], [970, 517], [916, 552], [147, 552], [104, 511]),
    obstacles: [
      polygon([0, 292], [144, 292], [151, 470], [128, 496], [0, 503]), // Estantería izquierda
      polygon([132, 301], [468, 294], [477, 418], [142, 486]), // Gabinetes del lavamanos
      polygon([461, 290], [1023, 288], [1023, 458], [474, 416]), // Gabinetes del fondo y vitrina
      polygon([204, 374], [301, 374], [322, 479], [320, 500], [272, 514], [237, 514], [191, 499], [190, 478]), // Taburete
      polygon([347, 308], [702, 306], [702, 409], [647, 470], [432, 505], [396, 478], [347, 389]), // Mesa de revisión
      polygon([734, 316], [936, 316], [947, 513], [904, 543], [749, 531], [728, 517]), // Carrito
      polygon([966, 347], [1023, 337], [1023, 576], [927, 576], [927, 508]), // Planta y mueble del frente derecho
      polygon([0, 447], [38, 449], [64, 471], [117, 553], [117, 576], [0, 576]), // Planta y mueble del frente izquierdo
    ],
  },
  objects: [{ id: 'exam-table', label: 'Observar la mesa de revisión', action: 'look', hitbox: area(363, 318, 327, 145), interaction: at(632, 524), facing: 'left',
    care: { sequence: ['Approach', 'Ready', 'Examination', 'Finish', 'Exit'], art: 'pending', pendingNote: 'Revisión pendiente de recursos de animación.' } }],
  masks: [
    { id: 'tablero-revision', depth: at(0, 489).y, polygon: polygon([365, 332], [393, 324], [501, 315], [573, 312],
      [621, 313], [651, 319], [683, 318], [690, 325], [688, 338], [662, 343], [662, 400], [653, 406], [599, 415],
      [593, 380], [541, 385], [499, 378], [368, 369], [366, 354], [362, 345]) },
    { id: 'caja-carrito', depth: at(0, 533).y, polygon: polygon([755, 449], [769, 447], [778, 436], [815, 444], [874, 441],
      [895, 431], [916, 427], [908, 493], [895, 505], [869, 516], [754, 501], [743, 508], [743, 488], [756, 481]) },
  ],
  spawn: at(334, 535), orientations: directions, sizeRange: [.62, .80],
}

export const originalScenes: readonly (PlayableScene | PendingScene)[] = [gardenScene, parkScene, kitchenScene, livingRoomScene, bathroomScene, infirmaryScene,
  { id: 'dressingRoom', name: 'Vestidor y accesorios', status: 'pending-art', lighting: 'dressingRoom', note: 'Ilustración original y recursos de equipamiento.' },
]

export const playableScenes = [gardenScene, parkScene, kitchenScene, livingRoomScene, bathroomScene, infirmaryScene, practiceScene] as const
