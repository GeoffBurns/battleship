/* ----- ./src/map.js ----- */

// geometry helper
export const inRange = (r, c) => element =>
  element[0] == r && element[1] <= c && element[2] >= c

export class Map {
  constructor (title, rows, cols, shipNum, landArea) {
    this.title = title
    this.rows = rows
    this.cols = cols
    this.shipNum = shipNum
    this.landArea = landArea
  }
  inBounds (r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols
  }
  inAllBounds (r, c, height, width) {
    return r >= 0 && r + height < this.rows && c + width >= 0 && c < this.cols
  }
  isLand (r, c) {
    return this.landArea.some(inRange(r, c))
  }
}

/* ----- ./src/Shape.js ----- */

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

const terrain = { current: seaAndLand }

/* ----- ./src/maps.js ----- */
const gameHost = {
  containerWidth: 574
}

const jaggedXS = new Map(
  'Jagged Coast XS',
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
  'Jagged Coast VS',
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
  'Jagged Coast SS',
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
  'Jagged Coast S',
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
  'Jagged Coast MS',
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
  'Jagged Coast M',
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
  'Jagged Coast ML',
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
        'Jagged Coast L',
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
        'Jagged Coast LL',
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
        'Jagged Coast VL',
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
        'Jagged Coast XL',
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

/* ----- ./src/chooseUI.js ----- */

import { gameMaps } from './maps.js'

export class ChooseUI {
  constructor (list, tagetId) {
    this.list = list
    this.choose = document.getElementById(tagetId)
    this.containerWidth = 520
  }

  setup (callback, defaultIndex = 2) {
    let id = 0
    this.list.forEach(choice => {
      let option = document.createElement('option')
      option.value = id
      option.textContent = choice
      this.choose.appendChild(option)
      if (id === defaultIndex) {
        option.selected = 'selected'
      }
      id++
    })
    this.onChange(callback)
  }

  onChange (callback) {
    this.choose.addEventListener('change', function () {
      const index = this.value
      callback(index)
    })
  }
}

export const mapUI = new ChooseUI(
  gameMaps.list.map(m => m.title),
  'chooseMap'
)
export const huntUI = new ChooseUI(['hide', 'seek'], 'chooseHunt')

/* ----- ./src/utils.js ----- */

import { gameMaps } from './maps.js'

function shuffleArray (array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1))
    let temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}
export function randomPlaceShape (ship, shipCellGrid) {
  const letter = ship.letter
  const shape = ship.shape()
  if (!shape) throw new Error('No shape for letter ' + letter)
  let variants0 = shape.variants()
  const variants = shuffleArray(variants0)

  // try random placements
  const maxAttempts = 20000
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (const variant of variants) {
      // compute bounds for random origin so variant fits
      const maxR = Math.max(...variant.map(s => s[0]))
      const maxC = Math.max(...variant.map(s => s[1]))
      const r0 = Math.floor(Math.random() * (gameMaps.current.rows - maxR))
      const c0 = Math.floor(Math.random() * (gameMaps.current.cols - maxC))
      if (ship.canPlace(variant, r0, c0, shipCellGrid)) {
        ship.placeVariant(variant, r0, c0)
        ship.addToGrid(shipCellGrid)
        return ship.cells
      }
    }
  }
  return null
}

export function throttle (func, delay) {
  let inThrottle
  let lastFn
  let lastTime

  return function () {
    const context = this
    const args = arguments

    if (!inThrottle) {
      func.apply(context, args)
      lastTime = Date.now()
      inThrottle = true
    } else {
      clearTimeout(lastFn)
      lastFn = setTimeout(function () {
        if (Date.now() - lastTime >= delay) {
          func.apply(context, args)
          lastTime = Date.now()
        }
      }, Math.max(delay - (Date.now() - lastTime), 0))
    }
  }
}

/* ----- ./src/StatusUI.js ----- */

import { gameMaps } from './maps.js'

export class StatusUI {
  constructor () {
    this.mode = document.getElementById('modeStatus')
    this.game = document.getElementById('gameStatus')
    this.line = document.getElementById('statusLine')
    this.line2 = document.getElementById('statusLine2')
  }
  clear () {
    this.display('', '')
  }
  display (mode, game) {
    this.mode.textContent = mode
    if (game) {
      this.info(game)
    }
  }
  bombStatus (carpetBombsUsed) {
    return `Bomb Mode (${gameMaps.maxBombs - carpetBombsUsed} left)`
  }
  displayBombStatus (carpetBombsUsed, game) {
    return this.display(this.bombStatus(carpetBombsUsed), game)
  }
  info (game) {
    this.game.textContent = game
  }
}

/* ----- ./src/ScoreUI.js ----- */

import { gameMaps } from './maps.js'

export class ScoreUI {
  constructor (playerPrefix) {
    // Initialization logic
    //
    this.shots = document.getElementById(playerPrefix + '-shots')
    this.hits = document.getElementById(playerPrefix + '-hits')
    this.sunk = document.getElementById(playerPrefix + '-sunk')
    this.placed = document.getElementById(playerPrefix + '-placed')

    this.shotsLabel = document.getElementById(playerPrefix + '-shots-label')
    this.hitsLabel = document.getElementById(playerPrefix + '-hits-label')
    this.sunkLabel = document.getElementById(playerPrefix + '-sunk-label')
    this.placedLabel = document.getElementById(playerPrefix + '-placed-label')
    this.tallyBox = document.getElementById(playerPrefix + '-tallyBox')
  }
  display (ships, shots) {
    this.shots.textContent = shots.toString()
    const hits = ships.reduce((sum, s) => sum + s.hits.size, 0)
    this.hits.textContent = hits.toString()
    const sunkCount = ships.filter(s => s.sunk).length
    this.sunk.textContent = `${sunkCount} / ${ships.length}`
  }
  resetTallyBox () {
    this.tallyBox.innerHTML = ''
  }
  buildShipBox (ship) {
    const box = document.createElement('div')
    const letter = ship.letter
    box.className = 'tally-box'
    if (ship.sunk) {
      box.textContent = 'X'
      box.style.background = '#ff8080'
      box.style.color = '#400'
    } else {
      box.textContent = letter
      box.style.background = gameMaps.shipColors[letter] || '#333'
      box.style.color = gameMaps.shipLetterColors[letter] || '#fff'
    }
    return box
  }
  buildTallyRow (ships, letter, rowList, boxer) {
    boxer = boxer || this.buildShipBox
    const row = document.createElement('div')
    row.className = 'tally-row'
    const matching = ships.filter(s => s.letter === letter)

    matching.forEach(s => {
      const box = boxer(s)
      row.appendChild(box)
    })
    rowList.appendChild(row)
  }
  buildBombRow (rowList, carpetBombsUsed) {
    const row = document.createElement('div')
    row.className = 'tally-row'

    for (let i = 0; i < gameMaps.maxBombs; i++) {
      const box = document.createElement('div')
      box.className = 'tally-box'

      if (i < carpetBombsUsed) {
        box.textContent = 'X'
        box.style.background = '#999'
      } else {
        box.textContent = 'M'
        box.style.background = gameMaps.shipLetterColors['M']
      }
      row.appendChild(box)
    }
    rowList.appendChild(row)
  }
  buildShipTally (ships, boxer) {
    this.resetTallyBox()

    const column = document.createElement('div')
    column.className = 'tally-col'
    this.buildTallyRow(ships, 'P', column, boxer)
    const surfaceContainer = document.createElement('div')
    surfaceContainer.setAttribute('style', 'display:flex;gap:40px;')

    const seaColumn = document.createElement('div')
    seaColumn.className = 'tally-col'
    const landColumn = document.createElement('div')
    landColumn.className = 'tally-col'
    const sea = ['A', 'B', 'C', 'D']
    const land = ['G', 'U']
    for (const letter of sea) {
      this.buildTallyRow(ships, letter, seaColumn, boxer)
    }
    for (const letter of land) {
      this.buildTallyRow(ships, letter, landColumn, boxer)
    }
    surfaceContainer.appendChild(seaColumn)
    surfaceContainer.appendChild(landColumn)

    column.appendChild(surfaceContainer)
    this.tallyBox.appendChild(column)
  }
  buildTally (ships, carpetBombsUsed) {
    this.buildShipTally(ships)
    // bombs row
    this.buildBombRow(this.tallyBox, carpetBombsUsed)
  }

  altBuildTally (ships, carpetBombsUsed, boxer) {
    this.resetTallyBox()
    const surfaceContainer = document.createElement('div')
    surfaceContainer.setAttribute('style', 'display:flex;gap:40px;')

    const seaColumn = document.createElement('div')
    seaColumn.className = 'tally-col'
    const landColumn = document.createElement('div')
    landColumn.className = 'tally-col'
    const sea = ['A', 'B', 'C', 'D']
    const land = ['G', 'U']
    for (const letter of sea) {
      this.buildTallyRow(ships, letter, seaColumn, boxer)
    }

    this.buildTallyRow(ships, 'P', landColumn, boxer)
    for (const letter of land) {
      this.buildTallyRow(ships, letter, landColumn, boxer)
    }
    this.buildBombRow(landColumn, carpetBombsUsed)
    surfaceContainer.appendChild(seaColumn)
    surfaceContainer.appendChild(landColumn)

    this.tallyBox.appendChild(surfaceContainer)
  }
}

/* ----- ./src/playerUI.js ----- */

import { gameMaps, gameHost } from './maps.js'
import { StatusUI } from './StatusUI.js'

export const gameStatus = new StatusUI()

export class PlayerUI {
  constructor () {
    this.board = {}
    this.placing = false
    this.containerWidth = gameHost.containerWidth
  }

  cellSize () {
    return gameHost.containerWidth / gameMaps.current.cols
  }

  gridCellAt (r, c) {
    const result = this.board.children[r * gameMaps.current.cols + c]
    if (result?.classList) return result
    throw new Error(
      'Invalid cell' + JSON.stringify(result) + 'at ' + r + ',' + c
    )
  }

  displayAsRevealed (cell, letter) {
    if (cell) {
      cell.style.background =
        gameMaps.shipColors[letter] || 'rgba(255, 209, 102, 0.3)'
      cell.style.color = gameMaps.shipLetterColors[letter] || '#ffd166'
      cell.textContent = letter
    }
  }
  revealShip (ship) {
    for (const [r, c] of ship.cells) {
      const cell = this.gridCellAt(r, c)
      this.displayAsRevealed(cell, ship.letter)
    }
  }

  clearClasses () {
    for (const cell of this.board.children) {
      cell.classList.remove('hit', 'frd-hit', 'frd-sunk', 'miss', 'placed')
    }
  }
  displayAsSunk (cell, letter) {
    // cell.textContent = ''
    cell.classList.add('frd-sunk')
    //  cell.style.background = gameMaps.shipColors[letter] || 'rgba(0,0,0,0.8)'
    // cell.style.color = gameMaps.shipLetterColors[letter] || '#000'
    //cell.classList.remove('hit')
    cell.classList.remove('miss')
  }
  cellSunkAt (r, c, letter) {
    const cell = this.gridCellAt(r, c)
    this.displayAsSunk(cell, letter)
  }

  cellHit (r, c) {
    const cell = this.gridCellAt(r, c)
    cell.classList.add('hit')
  }
  cellMiss (r, c) {
    const cell = this.gridCellAt(r, c)

    if (cell.classList.contains('placed')) return
    cell.classList.add('miss')
  }
  surroundMiss (r, c, cellMiss) {
    if (!cellMiss) return
    // surrounding water misses
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr
        const cc = c + dc
        if (gameMaps.inBounds(rr, cc)) {
          cellMiss(rr, cc)
        }
      }
  }
  displaySurround (cells, letter, cellMiss, display) {
    for (const [r, c] of cells) {
      // surrounding water misses
      this.surroundMiss(r, c, cellMiss)
      if (display) {
        display(r, c, letter)
      }
    }
  }
  resetBoardSize () {
    const cellSize = this.cellSize()
    this.board.style.setProperty('--cols', gameMaps.current.cols)
    this.board.style.setProperty('--rows', gameMaps.current.rows)
    this.board.style.setProperty('--boxSize', cellSize.toString() + 'px')
    this.board.innerHTML = ''
  }
  buildCell (r, c, onClickCell) {
    const cell = document.createElement('div')
    const land = gameMaps.isLand(r, c)
    const c1 = c + 1
    const r1 = r + 1
    cell.className = 'cell'
    cell.classList.add(land ? 'land' : 'sea')
    const checker = (r + c) % 2 === 0
    cell.classList.add(checker ? 'light' : 'dark')
    if (!land && c1 < gameMaps.current.cols && gameMaps.isLand(r, c1)) {
      cell.classList.add('rightEdge')
    }
    if (c !== 0 && !land && gameMaps.isLand(r, c - 1)) {
      cell.classList.add('leftEdge')
    }
    if (r1 < gameMaps.current.rows && land !== gameMaps.isLand(r1, c)) {
      cell.classList.add('bottomEdge')
    }
    cell.dataset.r = r
    cell.dataset.c = c

    if (onClickCell) {
      cell.addEventListener('click', () => onClickCell(r, c))
    }
    this.board.appendChild(cell)
  }
  buildBoard (onClickCell) {
    this.board.innerHTML = ''
    for (let r = 0; r < gameMaps.current.rows; r++) {
      for (let c = 0; c < gameMaps.current.cols; c++) {
        this.buildCell(r, c, onClickCell)
      }
    }
  }
}
export const playerUI = new PlayerUI()

/* ----- ./src/Score.js ----- */

export class Score {
  constructor () {
    this.shot = new Set()
    this.autoMisses = 0
  }
  reset () {
    this.shot.clear()
    this.autoMisses = 0
  }
  newShotKey (r, c) {
    const key = `${r},${c}`
    if (this.shot.has(key)) return null
    return key
  }
  createShotKey (r, c) {
    const key = this.newShotKey(r, c)
    if (key) {
      this.shot.add(key)
    }
    return key
  }
  noOfShots () {
    return this.shot.size - this.autoMisses
  }

  addAutoMiss (r, c) {
    const key = this.createShotKey(r, c)
    if (!key) return null // already shot here
    this.autoMisses++
    return key
  }
}

/* ----- ./src/Ship.js ----- */

import { gameMaps } from './maps.js'
import { terrain } from './Shape.js'

export class Ship {
  constructor (id, symmetry, letter) {
    this.id = id
    this.symmetry = symmetry
    this.letter = letter
    this.cells = []
    this.hits = new Set()
    this.sunk = false
  }
  place (placed) {
    this.cells = placed
    this.hits = new Set()
    this.sunk = false
    return placed
  }
  unplace () {
    this.cells = []
    this.hits = new Set()
    this.sunk = false
  }
  placeCells (variant, r0, c0) {
    let placing = []
    for (const [dr, dc] of variant) {
      const rr = r0 + dr,
        cc = c0 + dc
      placing.push([rr, cc])
    }
    return placing
  }
  placeVariant (variant, r0, c0) {
    this.cells = this.placeCells(variant, r0, c0)
  }
  isRightType (r, c) {
    const shipType = this.type()
    const isLand = gameMaps.isLand(r, c)
    // area rules
    if (shipType === 'G' && !isLand) return false
    if (shipType === 'S' && isLand) return false

    return true
  }
  noTouchCheck (r, c, shipCellGrid) {
    for (let nr = r - 1; nr <= r + 1; nr++)
      for (let nc = c - 1; nc <= c + 1; nc++) {
        if (gameMaps.inBounds(nr, nc) && shipCellGrid[nr][nc]) return false
      }
    return true
  }
  canPlace (variant, r0, c0, shipCellGrid) {
    const placing = this.placeCells(variant, r0, c0)
    if (
      placing.some(([r, c]) => {
        return !gameMaps.inBounds(r, c)
      })
    ) {
      // console.log('out of bounds')
      return false
    }
    if (
      placing.some(([r, c]) => {
        return this.isRightType(r, c) === false
      })
    ) {
      //console.log('wrong type')
      return false
    }

    if (
      placing.some(([r, c]) => {
        return (gameMaps.inBounds(r, c) && shipCellGrid[r][c]) === true
      })
    ) {
      //   console.log('overlapping')
      return false
    }
    if (
      placing.some(([r, c]) => {
        return this.noTouchCheck(r, c, shipCellGrid) === false
      })
    ) {
      //   console.log('touching')
      return false
    }
    // console.log('good')
    return true
    /*
    return !placing.some(([r, c]) => {
      return (
        !gameMaps.inBounds(r, c) ||
        this.isRightType(r, c) === false ||
        this.noTouchCheck(r, c, shipCellGrid) === false
      )
    })
      */
  }
  addToGrid (shipCellGrid) {
    const letter = this.letter
    const id = this.id
    for (const [r, c] of this.cells) {
      shipCellGrid[r][c] = { id, letter }
    }
  }
  shape () {
    return gameMaps.shapesByLetter[this.letter]
  }
  sunkDescription (middle = ' ') {
    return terrain.current.sunkDescription(this.letter, middle)
  }
  type () {
    return gameMaps.shipTypes[this.letter]
  }
}

/* ----- ./src/player.js ----- */

import { gameMaps } from './maps.js'
import { gameStatus } from './playerUI.js'
import { Score } from './Score.js'
import { Ship } from './Ship.js'

export class Player {
  constructor (ui) {
    this.ships = []
    this.score = new Score()
    this.opponent = null
    this.UI = ui
    this.shipCellGrid = []
    this.boardDestroyed = false
    this.carpetBombsUsed = 0
    this.preamble0 = 'Your'
    this.preamble = 'You were '
    this.resetShipCells()
    this.displayInfo = gameStatus.info.bind(gameStatus)
  }
  createShips () {
    const ships = []
    let id = 1
    for (const base of gameMaps.baseShapes) {
      const letter = base.letter
      const symmetry = base.symmetry
      const num = gameMaps.current.shipNum[letter]
      for (let i = 0; i < num; i++) {
        ships.push(new Ship(id, symmetry, letter))
        id++
      }
    }
    return ships
  }

  resetShipCells () {
    this.shipCellGrid = Array.from({ length: gameMaps.current.rows }, () =>
      Array(gameMaps.current.cols).fill(null)
    )
  }
  recordAutoMiss (r, c) {
    const key = this.score.addAutoMiss(r, c)
    if (!key) return // already shot here
    this.UI.cellMiss(r, c)
  }
  recordFleetSunk () {
    this.displayInfo('All ' + this.preamble0 + ' Ships Destroyed!')
    this.UI.displayFleetSunk()
    this.boardDestroyed = true
  }
  checkFleetSunk () {
    if (this.ships.every(s => s.sunk)) {
      this.recordFleetSunk()
    }
  }
  shipCellAt (r, c) {
    return this.shipCellGrid[r]?.[c]
  }
  markSunk (ship) {
    ship.sunk = true
    this.sunkWarning(ship)
    this.UI.displaySurround(
      ship.cells,
      ship.letter,
      (r, c) => this.recordAutoMiss(r, c),
      (r, c, letter) => this.UI.cellSunkAt(r, c, letter)
    )
    this.checkFleetSunk()
  }
  sunkDescription (ship) {
    if (this.opponent) {
      return this.preamble0 + ' ' + ship.sunkDescription(' was ')
    }
    return ship.sunkDescription()
  }
  sunkLetterDescription (letter) {
    if (this.opponent) {
      return this.preamble0 + ' ' + gameMaps.sunkDescription(letter, ' was ')
    }
    return gameMaps.sunkDescription(letter)
  }
  sunkWarning (ship) {
    this.displayInfo(this.sunkDescription(ship))
  }

  checkForHit (r, c, key, shipCell) {
    const hitShip = this.ships.find(s => s.id === shipCell.id)
    if (!hitShip) {
      this.UI.cellMiss(r, c)
      return { hit: false, sunk: '' }
    }
    hitShip.hits.add(key)

    this.UI.cellHit(r, c)

    if (hitShip.hits.size === hitShip.cells.length) {
      // ship sunk
      this.markSunk(hitShip)
      return { hit: true, sunkLetter: hitShip.letter }
    }
    return { hit: true, sunkLetter: '' }
  }

  fireShot (r, c, key) {
    const shipCell = this.shipCellAt(r, c)
    if (!shipCell) {
      this.UI.cellMiss(r, c)
      return { hit: false, sunk: '' }
    }
    return this.checkForHit(r, c, key, shipCell)
  }
  hitDescription (hits) {
    if (this.opponent) {
      return this.preamble + ' Hit (x' + hits.toString() + ')'
    } else {
      return hits.toString() + ' Hits'
    }
  }
  updateResultsOfBomb (hits, sunks) {
    if (this.boardDestroyed) {
      // already handled  in updateUI
    } else if (hits === 0) {
      if (this.opponent) {
        this.displayInfo('The Mega Bomb missed ' + this.preamble0 + ' ships')
      } else {
        this.displayInfo('The Mega Bomb missed everything!')
      }
    } else if (sunks.length === 0) {
      this.displayInfo(this.hitDescription(hits))
    } else if (sunks.length === 1) {
      this.displayInfo(
        this.hitDescription(hits) + ' and ' + this.sunkLetterDescription(sunks)
      )
    } else {
      let message = this.hitDescription(hits) + ','
      for (let sunk of sunks) {
        message += ' and ' + this.sunkLetterDescription(sunk)
      }
      message += ' Destroyed'
      this.displayInfo(message)
    }
  }
  effectById (id, tempEffect) {
    const element = document.getElementById(id)
    this.effect(element, tempEffect)
  }
  effect (element, tempEffect) {
    element.classList.add(tempEffect)
    element.addEventListener(
      'animationend',
      () => {
        element.classList.remove(tempEffect)
      },
      { once: true }
    )
  }
  flash () {
    this.effectById('battleship-game', 'flash')
    this.effect(this.UI.board, 'burst')
  }
  flame (r, c, bomb) {
    if (bomb) {
      const delay = Math.floor(Math.random() * 150) + 80
      setTimeout(() => {
        const cell = this.UI.gridCellAt(r, c)
        this.effect(cell, 'flames')
      }, delay)
    } else {
      const cell = this.UI.gridCellAt(r, c)
      this.effect(cell, 'flames')
    }
  }
  processShot (r, c, bomb) {
    this.flame(r, c, bomb)

    const key = this.score.createShotKey(r, c)
    if (key === null) {
      // if we are here, it is because of carpet bomb, so we can just
      return { hit: false, sunk: '' }
    }

    const result = this.fireShot(r, c, key)

    this.updateUI(this.ships)
    return result
  }
  updateTally (ships, carpetBombsUsed, noOfShots) {
    ships = ships || this.ships
    if (this.UI.placing && this.UI.placeTally) {
      this.UI.placeTally(ships)
    } else if (this.opponent) {
      this.UI.score.display(ships, noOfShots)
      this.UI.score.altBuildTally(ships, carpetBombsUsed)
    } else {
      this.UI.score.display(ships, noOfShots)
      this.UI.score.buildTally(ships, carpetBombsUsed)
    }
  }
}

/* ----- ./src/enemyUI.js ----- */

import { gameMaps } from './maps.js'
import { gameStatus, PlayerUI } from './playerUI.js'
import { ScoreUI } from './ScoreUI.js'

class EnemyUI extends PlayerUI {
  constructor () {
    super()
    this.board = document.getElementById('enemy-board')
    this.score = new ScoreUI('enemy')
    this.carpetBtn = document.getElementById('carpetBtn')
    this.revealBtn = document.getElementById('revealBtn')
  }
  displayFleetSunk () {
    gameStatus.display('Fleet Destroyed', 'All  - Well Done!')
    this.board.classList.add('destroyed')
  }
  revealAll (ships) {
    for (const ship of ships) {
      this.revealShip(ship)
    }

    gameStatus.display('Enemy Fleet Revealed', 'You Gave Up')
    this.board.classList.add('destroyed')
  }

  displayAsSunk (cell, letter) {
    cell.textContent = letter
    cell.style.color = gameMaps.shipLetterColors[letter] || '#fff'
    cell.style.background =
      gameMaps.shipColors[letter] || 'rgba(255,255,255,0.2)'
    cell.classList.remove('hit')
    cell.classList.remove('miss')
  }
  cellSunkAt (r, c, letter) {
    const cell = this.gridCellAt(r, c)
    this.displayAsSunk(cell, letter)
  }
  clearVisuals () {
    for (const cell of this.board.children) {
      cell.textContent = ''
      cell.style.background = ''
      cell.style.color = ''
      cell.classList.remove('hit', 'frd-hit', 'miss', 'placed')
    }
  }
  reset () {
    this.board.innerHTML = ''
    this.board.classList.remove('destroyed')
    gameStatus.display('Single Shot Mode', 'Click On Square To Fire')
  }
}
export const enemyUI = new EnemyUI()

/* ----- ./src/enemy.js ----- */

import { randomPlaceShape } from './utils.js'
import { gameMaps } from './maps.js'
import { enemyUI } from './enemyUI.js'
import { Player } from './player.js'
import { gameStatus } from './playerUI.js'

class Enemy extends Player {
  constructor (enemyUI) {
    super(enemyUI)
    this.preamble = 'Enemy'
    this.preamble = 'The enemy was '
    this.carpetMode = false
    this.isRevealed = false
  }
  toggleCarpetMode () {
    this.setCarpetMode(!this.carpetMode)
  }
  setCarpetMode (mode) {
    const newMode =
      !(this.isRevealed || this.carpetBombsUsed >= gameMaps.maxBombs) && mode
    if (newMode === this.carpetMode) return
    this.carpetMode = newMode
    if (this.carpetMode) {
      this.UI.board.classList.add('bomb')
    } else {
      this.UI.board.classList.remove('bomb')
    }
    this.updateUI(enemy.ships)
  }

  isCarpetMode () {
    return this.carpetMode && this.carpetBombsUsed >= gameMaps.maxBombs
  }
  placeAll (ships) {
    ships = ships || this.ships

    // attempt whole-board placement; retry if any shape fails
    for (let attempt = 0; attempt < 100; attempt++) {
      this.resetShipCells()

      let ok = true
      for (const ship of ships) {
        const placed = randomPlaceShape(ship, this.shipCellGrid)
        if (!placed) {
          ok = false
          break
        }
      }

      if (ok) return true
    }

    throw new Error('Failed to place all ships after many attempts')
  }
  revealAll () {
    this.UI.clearClasses()
    this.UI.revealAll(this.ships)

    this.boardDestroyed = true
    this.isRevealed = true
  }
  updateUI (ships) {
    ships = ships || this.ships
    // stats
    this.UI.score.display(ships, this.score.noOfShots())
    // mode
    if (this.isRevealed) {
      /// this.UI.modeStatus.textContent = 'Enemy Fleet Revealed' // already done
    } else if (this.boardDestroyed) {
      /// this.UI.displayFleetSunk() // already done
    } else if (this.carpetMode) {
      gameStatus.displayBombStatus(
        this.carpetBombsUsed,
        'Click On Square To Drop Bomb'
      )
      this.UI.carpetBtn.innerHTML = '<span class="shortcut">S</span>ingle Shot'
    } else {
      this.UI.carpetBtn.innerHTML = '<span class="shortcut">M</span>ega Bomb'
      gameStatus.display('Single Shot Mode', 'Click On Square To Fire')
    }
    // buttons
    this.UI.carpetBtn.disabled =
      this.boardDestroyed ||
      this.isRevealed ||
      this.carpetBombsUsed >= gameMaps.maxBombs
    this.UI.revealBtn.disabled = this.boardDestroyed || this.isRevealed
    this.updateTally(this.ships, this.carpetBombsUsed, this.score.noOfShots())
  }
  onClickCell (r, c) {
    if (enemy.boardDestroyed || enemy.isRevealed) return // no action if game over
    if (enemy.carpetMode && enemy.carpetBombsUsed >= gameMaps.maxBombs) {
      gameStatus.info('No Mega Bombs Left - Switch To Single Shot')

      enemy.setCarpetMode(false)
      return
    }
    if (enemy?.opponent?.boardDestroyed) {
      gameStatus.info('Game Over - No More Shots Allowed')
      return
    }
    enemy.tryFireAt(r, c)
  }
  tryFireAt (r, c) {
    if (!this.score.newShotKey(r, c) && !this.carpetMode) {
      gameStatus.info('Already Shot Here - Try Again')
      return false
    }
    this.fireAt(r, c)
    this.updateUI()
    if (enemy?.opponent) {
      enemy.opponent.seekStep()
    }
    return true
  }
  fireAt (r, c) {
    if (this.carpetMode) {
      // Mega Bomb mode: affect 3x3 area centered on (r,c)
      if (this.carpetBombsUsed >= gameMaps.maxBombs) {
        return
      }
      this.processCarpetBomb(r, c)
      return
    }
    this.processShot(r, c, false)
  }

  processCarpetBomb (r, c) {
    let hits = 0
    let sunks = ''
    this.carpetBombsUsed++
    ;({ hits, sunks } = this.dropBomb(r, c, hits, sunks))
    // update status
    this.updateResultsOfBomb(hits, sunks)

    this.updateBombStatus()
    this.flash()
  }
  dropBomb (r, c, hits, sunks) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr
        const nc = c + dc
        if (gameMaps.inBounds(nr, nc)) {
          const result = this.processShot(nr, nc, true)
          if (result?.hit) hits++
          if (result?.sunkLetter) sunks += result.sunkLetter
        }
      }
    }
    return { hits, sunks }
  }

  updateBombStatus () {
    gameStatus.displayBombStatus(this.carpetBombsUsed)
    if (this.carpetBombsUsed >= gameMaps.maxBombs) {
      this.setCarpetMode(false)
      gameStatus.display('Single Shot Mode')
    }
  }

  onClickCarpetMode () {
    this.toggleCarpetMode()
  }
  onClickReveal () {
    if (!this.isRevealed) {
      this.revealAll()
      this.updateUI(enemy.ships)
    }
  }
  wireupButtons () {
    this.UI.carpetBtn.addEventListener(
      'click',
      enemy.onClickCarpetMode.bind(enemy)
    )
    this.UI.revealBtn.addEventListener('click', enemy.onClickReveal.bind(enemy))
  }
  resetModel () {
    this.setCarpetMode(false)
    this.carpetBombsUsed = 0
    this.boardDestroyed = false
    this.isRevealed = false
    this.score.reset()
    this.ships = this.createShips()
  }
  buildBoard () {
    this.UI.buildBoard(enemy.onClickCell)

    // update destroyed state class
    this.UI.board.classList.toggle('destroyed', this.boardDestroyed)
  }
  resetUI (ships) {
    this.UI.reset()
    // this.UI.clearVisuals()
    this.buildBoard()
    this.placeAll(ships)
    this.updateUI(ships)
  }
}

export const enemy = new Enemy(enemyUI)

/* ----- ./src/setup.js ----- */

import { mapUI, huntUI } from './chooseUI.js'
import { gameMaps } from './maps.js'

export function removeShortcuts () {
  document.removeEventListener('keydown')
}

export function setupDropdowns (boardSetup, refresh, huntMode) {
  // Define urlParams using the current window's search string
  const urlParams = new URLSearchParams(window.location.search)
  const mapChoices = urlParams.getAll('mapName')

  const mapName =
    mapChoices[0] || localStorage.getItem('geoffs-battleship.map-name')

  let mapIndex = gameMaps.list.findIndex(m => m.title === mapName)
  if (mapIndex < 0) mapIndex = 0

  mapUI.setup(function (index) {
    const title = gameMaps.setTo(index)
    boardSetup()
    refresh()
    localStorage.setItem('geoffs-battleship.map-name', title)
  }, mapIndex)

  gameMaps.setTo(mapIndex)

  boardSetup()
  function switchToSeek () {
    const params = new URLSearchParams()
    params.append('mapName', gameMaps.current.title)
    const location = `./battleseek.html?${params.toString()}`
    window.location.href = location
  }
  function switchToHide () {
    const params = new URLSearchParams()
    params.append('mapName', gameMaps.current.title)

    const location = `./index.html?${params.toString()}`
    window.location.href = location
  }

  huntUI.setup(
    function () {
      switch (huntUI.choose.value) {
        case '0':
          if (huntMode !== 'hide') switchToHide()
          break
        case '1':
          if (huntMode !== 'seek') switchToSeek()
          break
        default:
          console.log('unknown hunt mode')
          break
      }
    },
    huntMode === 'hide' ? 0 : 1
  )
}

/* ----- ./src/enemySetup.js ----- */

import { enemy } from './enemy.js'

let otherboard = null
const newGameBtn = document.getElementById('newGame')
export function newGame () {
  if (otherboard) otherboard()
  enemy.resetModel()
  enemy.resetUI(enemy.ships)
}

function setupSeekShortcuts (placement) {
  if (placement) {
    document.getElementById('newPlace2').addEventListener('click', placement)
  }

  function handleSeekShortcuts (event) {
    switch (event.key) {
      case 'p':
      case 'P':
        if (placement) placement()
        break
      case 'r':
      case 'R':
        newGame()
        break
      case 'v':
      case 'V':
        enemy.onClickReveal()
        break
      case 'm':
      case 'M':
        if (!enemy.carpetMode) enemy.onClickCarpetMode()
        break
      case 's':
      case 'S':
        if (enemy.carpetMode) enemy.onClickCarpetMode()
        break
    }
  }

  document.addEventListener('keydown', handleSeekShortcuts)

  return () => document.removeEventListener('keydown', handleSeekShortcuts)
}

export function setupEnemy (placement, opponentBoard) {
  otherboard = opponentBoard

  // wire buttons
  newGameBtn.addEventListener('click', newGame)
  enemy.wireupButtons()
  return setupSeekShortcuts(placement)
}

/* ----- ./src/battleseek.js ----- */

import { setupDropdowns } from './setup.js'
import { setupEnemy, newGame } from './enemySetup.js'
import { enemyUI } from './enemyUI.js'

setupGameOptions(enemyUI.resetBoardSize.bind(enemyUI), newGame, 'seek')
setupEnemy()
// initial
newGame()
