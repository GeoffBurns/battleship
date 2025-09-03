export const gameHost = {
  containerWidth: 520
}
export let gameMaps = {}

// variant helpers
function rotate (cells) {
  return cells.map(([r, c]) => [c, -r])
}
function flipV (cells) {
  return cells.map(([r, c]) => [-r, c])
}
 

function asymmetricVariantsOf (cells) {
  let fliped = flipV(cells)
  return [cells, rotate(cells), fliped, rotate(fliped)]
}
function symmetricVariantsOf (cells) {
  let variants = [cells]
  for (let i = 0; i < 3; i++) {
    variants.push(rotate(variants[variants.length - 1]))
  }
  return variants
}
function straightVariantsOf (cells) {
  return [cells, rotate(cells)]
}

export class Shape {
  constructor (letter, symmetry, cells) {
    this.letter = letter
    this.symmetry = symmetry
    this.cells = cells
  }

  variants () {
    switch (this.symmetry) {
      case 'A':
        return asymmetricVariantsOf(this.cells)
      case 'S':
        return [this.cells]
      case 'H':
        return symmetricVariantsOf(this.cells)
      case 'L':
        return straightVariantsOf(this.cells)
      default:
        throw new Error(
          'Unknown symmetry type for ' + JSON.stringify(this, null, 2)
        ) // The 'null, 2' adds indentation for readability);
    }
  }
  type () {
    return gameMaps.shipTypes[this.letter]
  }
  noOf () {
    return gameMaps.current.shipNum[this.letter]
  }
  color () {
    return gameMaps.shipColors[this.letter]
  }
  sunkDescription () {
    return gameMaps.sunkDescription(this.letter)
  }
  letterColors () {
    return gameMaps.shipLetterColors[this.letter]
  }
  description () {
    return gameMaps.shipDescription[this.letter]
  }
}
// geometry helper
const inRange = (r, c) => element =>
  element[0] == r && element[1] <= c && element[2] >= c

// gameMapTypes
const seaAndLand = {
  list: [
    {
      title: 'Jaggered Coast SS',
      rows: 7,
      cols: 18,
      shipNum: { A: 1, B: 1, C: 1, D: 1, P: 2, G: 1, U: 1, M: 3 },
      landArea: [
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
    },
    {
      title: 'Jaggered Coast S',
      rows: 7,
      cols: 19,
      shipNum: { A: 1, B: 1, C: 1, D: 2, P: 2, G: 1, U: 1, M: 3 },
      landArea: [
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
    },
    {
      title: 'Jaggered Coast MS',
      rows: 8,
      cols: 18,
      shipNum: { A: 1, B: 1, C: 1, D: 2, P: 2, G: 1, U: 1, M: 3 },
      landArea: [
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
    },
    {
      title: 'Jaggered Coast M',
      rows: 9,
      cols: 17,
      shipNum: { A: 1, B: 1, C: 1, D: 1, P: 2, G: 2, U: 1, M: 3 },
      landArea: [
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
    },
    {
      title: 'Jaggered Coast ML',
      rows: 9,
      cols: 18,
      shipNum: { A: 1, B: 1, C: 1, D: 2, P: 2, G: 2, U: 1, M: 3 },
      landArea: [
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
    },
    {
      title: 'Jaggered Coast L',
      rows: 10,
      cols: 18,
      shipNum: { A: 1, B: 1, C: 2, D: 2, P: 2, G: 2, U: 1, M: 3 },
      landArea: [
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
    },
    {
      title: 'Narrow Coast S',
      rows: 11,
      cols: 17,
      shipNum: { A: 1, B: 1, C: 2, D: 2, P: 3, G: 1, U: 1, M: 3 },
      landArea: [
        [7, 13, 16],
        [7, 1, 5],
        [8, 13, 16],
        [8, 0, 10],
        [9, 0, 16],
        [10, 0, 16]
      ]
    },
    {
      title: 'Jaggered Coast LL',
      rows: 10,
      cols: 20,
      shipNum: { A: 1, B: 1, C: 2, D: 2, P: 3, G: 2, U: 1, M: 3 },
      landArea: [
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
    },
    {
      title: 'Narrow Coast M',
      rows: 12,
      cols: 17,
      shipNum: { A: 1, B: 1, C: 2, D: 3, P: 4, G: 1, U: 1, M: 3 },
      landArea: [
        [8, 13, 16],
        [8, 1, 5],
        [9, 13, 16],
        [9, 0, 10],
        [10, 0, 16],
        [11, 0, 16]
      ]
    },
    {
      title: 'Jaggered Coast VL',
      rows: 10,
      cols: 21,
      shipNum: { A: 1, B: 1, C: 2, D: 2, P: 4, G: 2, U: 1, M: 3 },
      landArea: [
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
    },

    {
      title: 'Jaggered Coast XL',
      rows: 10,
      cols: 22,
      shipNum: { A: 1, B: 1, C: 2, D: 3, P: 4, G: 2, U: 1, M: 3 },
      landArea: [
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
    }
  ],
  current: {
    title: 'Jaggered Coast SS',
    rows: 7,
    cols: 18,
    shipNum: { A: 1, B: 1, C: 1, D: 1, P: 2, G: 1, U: 1, M: 3 },
    landArea: [
      [1, 16, 17],
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
  },
  baseShapes: [
    new Shape('U', 'H', [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
      [1, 4],
      [0, 4]
    ]),
    new Shape('G', 'S', [
      [0, 0],
      [1, 1],
      [0, 2],
      [2, 0],
      [2, 2]
    ]),
    new Shape('A', 'A', [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 1],
      [1, 2],
      [1, 3],
      [1, 4]
    ]),
    new Shape('P', 'H', [
      [0, 0],
      [1, 0],
      [2, 0],
      [1, 1]
    ]),
    new Shape('B', 'L', [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4]
    ]),
    new Shape('C', 'L', [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3]
    ]),
    new Shape('D', 'L', [
      [0, 0],
      [0, 1],
      [0, 2]
    ])
  ],
  shapesByLetter: {},
  setTo: function (index) {
    this.current = this.list[index]
  },
  shipSunkDescriptions: {
    A: 'Shot Down',
    G: 'Destroyed',
    S: 'Sunk'
  },
  shipLetterColors: {
    A: '#ff6666',
    B: '#66ccff',
    C: '#66ff66',
    D: '#ffcc66',
    P: '#cc99ff',
    G: '#ff99cc',
    U: '#ffff66',
    M: '#ffd166'
  },
  shipDescription: {
    A: 'Aircraft Carrier',
    B: 'Battleship',
    C: 'Cruiser',
    D: 'Destroyer',
    P: 'Airplane',
    G: 'Anti-Aircraft Gun',
    U: 'Underground Bunker'
  },
  shipTypes: {
    A: 'S',
    B: 'S',
    C: 'S',
    D: 'S',
    P: 'A',
    G: 'G',
    U: 'G'
  },
  maxBombs: 3,
  shipColors: {
    A: 'rgba(255,102,102,0.3)',
    B: 'rgba(102,204,255,0.3)',
    C: 'rgba(102,255,102,0.3)',
    D: 'rgba(255,204,102,0.3)',
    P: 'rgba(204,153,255,0.3)',
    G: 'rgba(255,153,204,0.3)',
    U: 'rgba(255,255,102,0.3)'
  },
  sunkDescription: function (letter) {
    return (
      this.shipDescription[letter] +
      ' ' +
      this.shipSunkDescriptions[gameMaps.shipTypes[letter]]
    )
  },
  inBounds: function (r, c) {
    return r >= 0 && r < this.current.rows && c >= 0 && c < this.current.cols
  },
  inAllBounds: function (r, c, height, width) {
    return (
      r >= 0 &&
      r + height < this.current.rows &&
      c + width >= 0 &&
      c < this.current.cols
    )
  },
  isLand: function (r, c) {
    return this.current.landArea.some(inRange(r, c))
  }
}
seaAndLand.shapesByLetter = Object.fromEntries(
  seaAndLand.baseShapes.map(base => [base.letter, base])
)

gameMaps = seaAndLand
