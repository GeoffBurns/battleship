import { Map } from './map.js'
import { seaAndLand } from './Shape.js'
export const gameHost = {
  containerWidth: 574
}

const jaggedXS = new Map(
  'Jaggered Coast XS',
  6,
  18,
  { A: 0, B: 1, C: 1, D: 1, P: 2, G: 1, U: 1, M: 3 },
  [
    [1, 16, 17],
    [1, 0, 2],
    [1, 16, 17],
    [2, 0, 3],
    [2, 15, 17],
    [3, 15, 17],
    [4, 15, 17],
    [5, 15, 17],
    [3, 0, 7],
    [4, 0, 8],
    [5, 0, 8]
  ]
)

const jaggedVS = new Map(
  'Jaggered Coast VS',
  7,
  16,
  { A: 1, B: 1, C: 1, D: 1, P: 1, G: 1, U: 1, M: 3 },
  [
    [2, 14, 15],
    [2, 0, 2],
    [2, 14, 15],
    [3, 0, 3],
    [3, 13, 15],
    [4, 13, 15],
    [5, 13, 15],
    [6, 13, 15],
    [4, 0, 7],
    [5, 0, 8],
    [6, 0, 8]
  ]
)

const jaggedSS = new Map(
  'Jaggered Coast SS',
  7,
  18,
  { A: 1, B: 1, C: 1, D: 1, P: 2, G: 1, U: 1, M: 3 },
  [
    [2, 16, 17],
    [2, 0, 2],
    [2, 16, 17],
    [3, 0, 3],
    [3, 15, 17],
    [4, 15, 17],
    [5, 15, 17],
    [6, 15, 17],
    [4, 0, 7],
    [5, 0, 8],
    [6, 0, 8]
  ]
)

const defaultMap = jaggedSS

const jaggedS = new Map(
  'Jaggered Coast S',
  7,
  19,
  { A: 1, B: 1, C: 1, D: 2, P: 2, G: 1, U: 1, M: 3 },
  [
    [1, 16, 18],
    [2, 0, 2],
    [2, 16, 18],
    [3, 0, 3],
    [3, 15, 18],
    [4, 15, 18],
    [5, 15, 18],
    [6, 15, 18],
    [4, 0, 7],
    [5, 0, 8],
    [6, 0, 8]
  ]
)

const jaggedMS = new Map(
  'Jaggered Coast MS',
  8,
  18,
  { A: 1, B: 1, C: 1, D: 2, P: 2, G: 1, U: 1, M: 3 },
  [
    [2, 14, 16],
    [3, 0, 2],
    [3, 14, 17],
    [4, 0, 3],
    [4, 14, 17],
    [5, 14, 17],
    [6, 14, 17],
    [7, 14, 17],
    [5, 0, 8],
    [6, 0, 10],
    [7, 0, 10]
  ]
)

const jaggedM = new Map(
  'Jaggered Coast M',
  9,
  17,
  { A: 1, B: 1, C: 1, D: 1, P: 2, G: 2, U: 1, M: 3 },
  [
    [3, 13, 15],
    [4, 0, 2],
    [4, 13, 16],
    [5, 0, 3],
    [5, 13, 16],
    [6, 0, 9],
    [6, 13, 16],
    [7, 0, 16],
    [8, 0, 16]
  ]
)

const jaggedML = new Map(
  'Jaggered Coast ML',
  9,
  18,
  { A: 1, B: 1, C: 1, D: 2, P: 2, G: 2, U: 1, M: 3 },
  [
    [3, 14, 16],
    [4, 0, 2],
    [4, 14, 17],
    [5, 0, 3],
    [5, 14, 17],
    [6, 0, 10],
    [6, 14, 17],
    [7, 0, 17],
    [8, 0, 17]
  ]
)
// gameMapTypes
class SeaAndLandMaps {
  constructor () {
    this.list = [
      jaggedXS,
      jaggedVS,
      defaultMap,
      jaggedS,
      jaggedMS,
      jaggedM,
      jaggedML,
      new Map(
        'Jaggered Coast L',
        10,
        18,
        { A: 1, B: 1, C: 2, D: 2, P: 2, G: 2, U: 1, M: 3 },
        [
          [4, 14, 16],
          [5, 0, 2],
          [5, 14, 17],
          [6, 0, 3],
          [6, 14, 17],
          [7, 0, 10],
          [7, 14, 17],
          [8, 0, 17],
          [9, 0, 17]
        ]
      ),
      new Map(
        'Narrow Coast S',
        11,
        17,
        { A: 1, B: 1, C: 2, D: 2, P: 3, G: 1, U: 1, M: 3 },
        [
          [7, 13, 16],
          [7, 1, 5],
          [8, 13, 16],
          [8, 0, 10],
          [9, 0, 16],
          [10, 0, 16]
        ]
      ),
      new Map(
        'Jaggered Coast LL',
        10,
        20,
        { A: 1, B: 1, C: 2, D: 2, P: 3, G: 2, U: 1, M: 3 },
        [
          [4, 16, 18],
          [5, 1, 4],
          [5, 16, 19],
          [6, 1, 6],
          [6, 16, 19],
          [7, 0, 13],
          [7, 16, 19],
          [8, 0, 19],
          [9, 0, 19]
        ]
      ),
      new Map(
        'Narrow Coast M',
        12,
        17,
        { A: 1, B: 1, C: 2, D: 3, P: 4, G: 1, U: 1, M: 3 },
        [
          [8, 13, 16],
          [8, 1, 5],
          [9, 13, 16],
          [9, 0, 10],
          [10, 0, 16],
          [11, 0, 16]
        ]
      ),
      new Map(
        'Jaggered Coast VL',
        10,
        21,
        { A: 1, B: 1, C: 2, D: 2, P: 4, G: 2, U: 1, M: 3 },
        [
          [4, 16, 18],
          [5, 1, 4],
          [5, 16, 19],
          [6, 1, 6],
          [6, 16, 19],
          [7, 0, 13],
          [7, 16, 19],
          [8, 0, 20],
          [9, 0, 20]
        ]
      ),
      new Map(
        'Jaggered Coast XL',
        10,
        22,
        { A: 1, B: 1, C: 2, D: 3, P: 4, G: 2, U: 1, M: 3 },
        [
          [4, 16, 18],
          [5, 1, 4],
          [5, 16, 19],
          [6, 1, 6],
          [6, 16, 19],
          [7, 0, 13],
          [7, 16, 19],
          [8, 0, 21],
          [9, 0, 21]
        ]
      )
    ]
    this.maxBombs = 3
    this.current = defaultMap
    this.baseShapes = seaAndLand.baseShapes
    this.shipSunkDescriptions = seaAndLand.shipSunkDescriptions
    this.shipLetterColors = seaAndLand.shipLetterColors
    this.shipDescription = seaAndLand.shipDescription
    this.shipTypes = seaAndLand.shipTypes
    this.shipColors = seaAndLand.shipColors
    this.shipDescription = seaAndLand.shipDescription
    this.shapesByLetter = seaAndLand.shapesByLetter
  }

  setTo (index) {
    this.current = this.list[index]
    return this.current.title
  }

  inBounds (r, c) {
    return this.current.inBounds(r, c)
  }

  inAllBounds (r, c, height, width) {
    return this.current.inAllBounds(r, c, height, width)
  }

  isLand (r, c) {
    return this.current.isLand(r, c)
  }
}

const seaAndLandMaps = new SeaAndLandMaps()

export const gameMaps = seaAndLandMaps
