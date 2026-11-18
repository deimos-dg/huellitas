const dogFile = 'Guía de animaciones de nueve perros-1.png'
const catFile = 'Atlas de Animaciones de Gatos Variados-2.png'

const dogColumns = [
  [209, 266, 323, 379, 436, 496],
  [719, 777, 834, 892, 949, 1008],
  [1233, 1290, 1347, 1404, 1461, 1518],
]
const dogRows = [
  [44, 73, 94, 115, 143, 160, 181, 201, 241, 262, 278, 302, 342],
  [377, 411, 432, 454, 484, 501, 521, 539, 579, 599, 618, 641, 678],
  [709, 738, 758, 782, 807, 825, 846, 865, 903, 925, 942, 965, 1009],
]
const dogPanels = {
  beagle: { column: 1, tier: 0, scale: 3.1, collar: 'red', eat: [0, 1, 2], drink: [3, 4] },
  'perro-mestizo': { column: 2, tier: 0, scale: 3.2, collar: 'olive', drink: [0, 1, 2, 3, 4] },
  labrador: { column: 0, tier: 1, scale: 3.5, collar: 'olive', eat: [0, 1, 4], drink: [2, 3] },
  husky: { column: 1, tier: 1, scale: 3.5, collar: 'blue', drink: [0, 1, 2, 3, 4] },
  corgi: { column: 2, tier: 1, scale: 2.9, collar: 'red', eat: [0, 1, 2, 3, 4] },
  pug: { column: 0, tier: 2, scale: 2.9, collar: 'olive', drink: [0, 1, 2, 3, 4] },
  poodle: { column: 1, tier: 2, scale: 3.25, collar: 'red', eat: [0, 1, 2, 3], drink: [4] },
  dalmata: { column: 2, tier: 2, scale: 3.4, collar: 'red', drink: [0, 1, 2, 3, 4] },
}

// The bowl row combines two actions. The bottom row combines petting and sparks.
const dogTracks = [
  ['idle', 0, [.55, .38, .94, .76]],
  ['walk', 1, [.55, .34, .94, .77]],
  ['run', 2, [.56, .27, .94, .78]],
  ['sit', 3, [.4, .31, .91, .64]],
  ['sleep', 4],
  ['wake', 5, [.45, .30, .94, .68]],
  ['eat', 6],
  ['drink', 6],
  ['bath', 7, [.52, .22, .91, .53]],
  ['shake', 8, [.51, .35, .84, .74]],
  ['play', 9, [.52, .34, .82, .85]],
  ['jump', 10, [.48, .26, .91, .62]],
  ['pet', 11, [.54, .41, .94, .72]],
]

const catRows = [
  [24, 113, 109], [141, 234, 229], [257, 354, 347], [374, 465, 458],
  [480, 575, 567], [584, 682, 674], [689, 787, 780], [799, 898, 886], [910, 1011, 1000],
]
const catPanels = {
  'gato-naranja': { row: 0, collar: 'olive' },
  'gato-negro': { row: 1, collar: 'wood' },
  'gato-blanco': { row: 2, collar: 'olive' },
  'gato-gris': { row: 3, collar: 'olive' },
  'gato-tricolor': { row: 5, collar: 'olive' },
  'gato-siames': { row: 6, collar: 'olive' },
  sphynx: { row: 7, collar: 'teal' },
  'gato-mestizo': { row: 8, collar: 'wood' },
}

// Collar windows use absolute x coordinates and y offsets from the row's ground line.
const catClips = [
  ['idle', 6, 109, [55, -47, 93, -27]],
  ['walk', 117, 236, [175, -51, 222, -26]],
  ['walk', 245, 366, [307, -44, 352, -14]],
  ['run', 372, 506, [438, -44, 491, -15]],
  ['sit', 511, 577, [529, -52, 568, -29]],
  ['sleep', 577, 649],
  ['wake', 647, 728, [679, -27, 720, -5]],
  ['eat', 725, 805],
  ['drink', 806, 894],
  ['bath', 897, 984, [927, -48, 972, -27]],
  ['shake', 987, 1094, [1031, -52, 1078, -29]],
  ['play', 1096, 1205, [1132, -41, 1171, -15]],
  ['jump', 1208, 1307, [1248, -69, 1296, -44]],
  ['pet', 1313, 1458, [1354, -53, 1391, -30]],
  ['happy', 1435, 1531, [1468, -51, 1503, -28]],
]

export function* compactAnimationSources() {
  for (const [id, panel] of Object.entries(dogPanels)) {
    const cutsX = dogColumns[panel.column]
    const cutsY = dogRows[panel.tier]
    const tracks = {}
    for (const [action, row, collarWindow] of dogTracks) {
      const columns = row === 6 ? panel[action] : [0, 1, 2, 3, 4]
      if (!columns) continue
      tracks[action] = columns.map((column) => ({
        file: dogFile,
        bounds: [cutsX[column], cutsY[row], cutsX[column + 1], cutsY[row + 1]],
        color: panel.collar,
        collarWindow,
        scale: panel.scale,
      }))
    }
    yield { id, type: 'compact', tracks }
  }

  for (const [id, panel] of Object.entries(catPanels)) {
    const [top, bottom, ground] = catRows[panel.row]
    const tracks = {}
    for (const [action, left, right, band] of catClips) {
      const cropBottom = action === 'jump' ? ground - 9 : bottom
      const frame = {
        file: catFile,
        bounds: [left, top, right, cropBottom],
        band: band && [band[0], ground + band[1], band[2], ground + band[3]],
        color: panel.collar,
        scale: 1.45,
      }
      const poses = tracks[action] ??= []
      poses.push(frame)
    }
    yield { id, type: 'compact', tracks }
  }
}
