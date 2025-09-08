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
    return terrain.current.shipTypes[this.letter]
  }
  color () {
    return terrain.current.shipColors[this.letter]
  }
  sunkDescription () {
    return terrain.current.sunkDescription(this.letter)
  }
  letterColors () {
    return terrain.current.shipLetterColors[this.letter]
  }
  description () {
    return terrain.current.shipDescription[this.letter]
  }
}

class Terrain {
  constructor (
    baseShapes,
    shipSunkDescriptions,
    shipLetterColors,
    shipDescription,
    shipTypes,
    shipColors
  ) {
    this.baseShapes = baseShapes
    this.shipSunkDescriptions = shipSunkDescriptions
    this.shipLetterColors = shipLetterColors
    this.shipDescription = shipDescription
    this.shipTypes = shipTypes
    this.shipColors = shipColors
    this.shipDescription = shipDescription
    this.shapesByLetter = Object.fromEntries(
      baseShapes.map(base => [base.letter, base])
    )
  }

  sunkDescription (letter, middle = ' ') {
    return (
      this.shipDescription[letter] +
      middle +
      this.shipSunkDescriptions[this.shipTypes[letter]]
    )
  }
}
export const seaAndLand = new Terrain(
  [
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
    new Shape('R', 'H', [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
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
    new Shape('J', 'H', [
      [1, 0],
      [1, 1],
      [2, 0],
      [2, 1],
      [2, 2]
    ]),
    new Shape('H', 'N', [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 1]
    ]),
    new Shape('P', 'H', [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, 2]
    ]),
    new Shape('T', 'L', [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5]
    ]),
    new Shape('B', 'L', [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4]
    ]),
    new Shape('O', 'N', [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1]
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
    ]),
    new Shape('S', 'L', [
      [0, 0],
      [0, 1]
    ])
  ],
  {
    A: 'Shot Down',
    G: 'Destroyed',
    S: 'Sunk'
  },
  {
    A: '#ff6666',
    T: '#ffccff',
    B: '#66ccff',
    C: '#66ff66',
    O: '#33cc99',
    D: '#ffcc66',
    H: '#ff6699',
    J: '#ff884d',
    P: '#cc99ff',
    G: '#ff99cc',
    R: '#6699ff',
    U: '#ffff66',
    M: '#ffd166'
  },
  {
    A: 'Aircraft Carrier',
    T: 'Tanker',
    B: 'Battleship',
    C: 'Cruiser',
    O: 'Oil Rig',
    D: 'Destroyer',
    S: 'Submarine',
    H: 'Helicopter',
    J: 'Fighter Jet',
    P: 'Airplane',
    G: 'Anti-Aircraft Gun',
    R: 'Radar Station',
    U: 'Underground Bunker'
  },
  {
    A: 'S',
    T: 'S',
    B: 'S',
    C: 'S',
    O: 'S',
    D: 'S',
    S: 'S',
    H: 'A',
    J: 'A',
    P: 'A',
    G: 'G',
    R: 'G',
    U: 'G'
  },
  {
    A: 'rgba(255,102,102,0.3)',
    B: 'rgba(102,204,255,0.3)',
    C: 'rgba(102,255,102,0.3)',
    D: 'rgba(255,204,102,0.3)',
    P: 'rgba(204,153,255,0.3)',
    G: 'rgba(255,153,204,0.3)',
    U: 'rgba(255,255,102,0.3)',
    T: 'rgba(255,204,255,0.3)',
    O: 'rgba(51,204,153,0.3)',
    H: 'rgba(255,102,153,0.3)',
    J: 'rgba(255,136,77,0.3)',
    R: 'rgba(102,153,255,0.3)'
  }
)

export const terrain = { current: seaAndLand }
