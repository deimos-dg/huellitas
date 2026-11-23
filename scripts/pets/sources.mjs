// Each row gives the upper and lower crop edge and the horizontal cuts between poses.
const dogRows = [
  [13, 145, [14, 146, 255, 365, 485, 688, 850, 1012, 1174, 1342, 1523]],
  [150, 290, [30, 218, 401, 585, 768, 922, 1048, 1170, 1287, 1403, 1514]],
  [295, 420, [9, 154, 292, 418, 546, 666, 805, 919, 1047, 1180, 1296, 1398, 1520]],
  [422, 570, [10, 156, 296, 429, 545, 684, 822, 958, 1114, 1250, 1372, 1520]],
  [574, 704, [8, 152, 301, 427, 548, 709, 840, 1003, 1165, 1330, 1518]],
  [705, 852, [27, 178, 320, 454, 604, 750, 923, 1069, 1213, 1361, 1515]],
  [853, 1015, [13, 155, 305, 446, 608, 754, 897, 1042, 1189, 1355, 1520]],
]

const catRows = [
  [4, 141, [13, 174, 346, 522, 704, 883, 1047, 1219, 1388, 1536]],
  [147, 264, [14, 190, 375, 572, 772, 963, 1165, 1364, 1536]],
  [269, 380, [14, 184, 389, 591, 800, 984, 1174, 1369, 1536]],
  [383, 494, [14, 162, 312, 446, 581, 705, 846, 992, 1137, 1267, 1400, 1536]],
  [495, 612, [14, 138, 261, 379, 480, 581, 706, 839, 1001, 1151, 1288, 1409, 1536]],
  [613, 742, [14, 159, 326, 483, 646, 826, 976, 1115, 1248, 1384, 1536]],
  [744, 868, [13, 145, 272, 388, 493, 665, 803, 933, 1072, 1232, 1370, 1536]],
  [874, 1012, [3, 105, 209, 313, 422, 513, 596, 691, 776, 861, 961, 1047, 1161, 1266, 1391, 1536]],
]

// A track specifies its row, first pose, count, ground line, FPS and any prop exclusion depth.
export const sheets = {
  golden: {
    file: 'Hoja de sprites del perro aventurero-1.png',
    rows: dogRows,
    collar: 'olive',
    tracks: {
      idle: [0, 0, 4, 134, 3], walk: [0, 4, 6, 134, 7], run: [1, 0, 4, 278, 8],
      sit: [1, 4, 4, 278, 5], sleep: [2, 0, 3, 404, 2], wake: [2, 3, 4, 409, 5],
      eat: [2, 7, 5, 408, 5, 32], drink: [3, 0, 5, 548, 5], bath: [3, 5, 6, 562, 5],
      shake: [4, 0, 5, 695, 7], play: [4, 5, 5, 690, 6, 17], jump: [5, 0, 5, 844, 7],
      pet: [5, 5, 5, 845, 5], happy: [6, 0, 10, 1008, 6],
    },
  },
  'gato-atigrado': {
    file: 'Hoja de sprites_ animaciones de gato atigrado-2.png',
    rows: catRows,
    collar: 'teal',
    horizontalOverrides: { 7: { 6: [595, 695], 7: [685, 782], 8: [774, 871], 9: [858, 982] } },
    tracks: {
      idle: [0, 0, 9, 132, 4], walk: [1, 0, 8, 257, 8], run: [2, 0, 6, 372, 8],
      sit: [3, 0, 6, 490, 5], sleep: [3, 6, 5, 473, 2], wake: [4, 0, 7, 603, 5],
      eat: [4, 7, 5, 602, 5], drink: [5, 0, 4, 727, 5, 29], bath: [5, 4, 4, 736, 5],
      shake: [6, 0, 4, 856, 6], play: [6, 4, 7, 855, 6], jump: [7, 0, 6, 1003, 7],
      pet: [7, 6, 4, 1003, 5], happy: [7, 10, 5, 1003, 6],
    },
  },
}

const dogs = 'Galería de perros adorables en estilo cartoon.png'
const cats = 'Nueve gatos adorables en cuadrícula.png'

export const goldenGifs = {
  idle: { file: 'Golden_retriver/Perro dorado animado moviendo la cola.gif', scale: .43, ground: 325, transparent: true },
  run: { file: 'Golden_retriver/Perro dorado corriendo animado.gif', scale: .55, ground: 256, transparent: true },
  jump: { file: 'Golden_retriver/Perro dorado en salto animado.gif', scale: .43, ground: 325 },
}

// The two boxes are the portrait and its collar window in the original image.
export const portraits = {
  golden: { sheet: 'golden' },
  beagle: { file: dogs, bounds: [542, 20, 815, 329], band: [717, 148, 784, 197], color: 'red' },
  'perro-mestizo': { file: dogs, bounds: [1006, 7, 1254, 328], band: [1141, 143, 1216, 189], color: 'olive' },
  labrador: { file: dogs, bounds: [27, 333, 306, 664], band: [175, 449, 278, 502], color: 'olive' },
  husky: { file: dogs, bounds: [520, 329, 806, 664], band: [684, 468, 761, 526], color: 'blue' },
  corgi: {
    file: dogs,
    bounds: [1018, 338, 1294, 656],
    band: [1165, 513, 1272, 559],
    contour: [[1165, 514], [1182, 522], [1207, 537], [1233, 544], [1248, 542], [1269, 526], [1269, 540], [1254, 553], [1236, 558], [1209, 552], [1183, 538]],
    color: 'red',
  },
  pug: { file: dogs, bounds: [78, 685, 341, 978], band: [220, 802, 320, 854], color: 'wood' },
  poodle: { file: dogs, bounds: [554, 662, 813, 986], band: [684, 798, 761, 837], color: 'red' },
  dalmata: { file: dogs, bounds: [989, 659, 1268, 978], band: [1138, 763, 1222, 824], color: 'red' },
  'gato-naranja': { file: cats, bounds: [84, 8, 346, 344], band: [222, 170, 308, 212], color: 'olive' },
  'gato-negro': { file: cats, bounds: [552, 4, 818, 347], band: [676, 170, 785, 206], color: 'wood' },
  'gato-blanco': { file: cats, bounds: [1026, 3, 1281, 347], band: [1148, 165, 1245, 207], color: 'blue' },
  'gato-gris': { file: cats, bounds: [82, 350, 341, 690], band: [218, 510, 313, 556], color: 'blue' },
  'gato-atigrado': { sheet: 'gato-atigrado' },
  'gato-tricolor': { file: cats, bounds: [1036, 347, 1288, 690], band: [1176, 515, 1267, 558], color: 'olive' },
  'gato-siames': { file: cats, bounds: [105, 692, 353, 1003], band: [231, 833, 333, 885], color: 'olive' },
  sphynx: {
    file: 'Atlas de Animaciones de Gatos Variados-2.png',
    bounds: [6, 799, 109, 898],
    band: [55, 839, 93, 859],
    color: 'teal',
    backdrop: 'checker',
  },
  'gato-mestizo': { file: cats, bounds: [1044, 689, 1292, 1003], band: [1144, 835, 1261, 884], color: 'olive' },
}
