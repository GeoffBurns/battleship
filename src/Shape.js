import {
  Dihedral4,
  Klein4,
  Blinker,
  Cyclic4,
  Invariant,
  Variant3
} from './variants.js'
export const terrain = {
  current: null,
  terrains: [],
  add: function (newT) {
    if (!this.terrains.includes(newT)) {
      this.terrains.push(newT)
    }
  },
  setCurrent: function (newCurrent) {
    this.add(newCurrent)
    this.current = newCurrent
  }
}

export function addCellToFootPrint (r, c, fp) {
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      fp.add(`${r + i},${c + j}`)
    }
  }
}
export class Shape {
  constructor (letter, symmetry, cells, tallyGroup, tip, racks) {
    this.letter = letter
    this.symmetry = symmetry
    this.cells = cells
    this.racks =
      racks instanceof Array
        ? new Set(racks.map(([r, c]) => `${r},${c}`))
        : null
    this.canAttachWeapons = racks && racks.length > 0
    this.isAttachedToRack = false
    this.terrain = terrain.current
    this.subterrain = null
    this.validator = Function.prototype
    this.zoneDetail = 0
    this.tip = tip
    this.tallyGroup = tallyGroup
    const area = cells.length
    let footPrint = new Set()
    for (const cell of cells) {
      addCellToFootPrint(cell[0], cell[1], footPrint)
    }
    this.displacement = (area + footPrint.size) / 2
    this.vulnerable = []
    this.hardened = []
    this.immune = []
  }
  canBeOn (subterrain) {
    return this.subterrain === subterrain
  }
  protectionAgainst (weapon) {
    if (this.immune.find(w => w === weapon)) return 3
    if (this.hardened.find(w => w === weapon)) return 2
    if (this.vulnerable.find(w => w === weapon)) return 0
    return 1
  }
  attachWeapon (ammoBuilder) {
    if (!this.canAttachWeapons) {
      throw new Error('Cannot attach weapon to shape ' + this.letter)
    }
    if (this.isAttachedToRack) {
      throw new Error('Weapon already attached to shape ' + this.letter)
    }
    this.isAttachedToRack = true
    const newObject = {}
    for (const key in this.racks) {
      newObject[key] = ammoBuilder()
    }
    this.attachedWeapons = newObject
    return this.attachedWeapons
  }

  variants () {
    switch (this.symmetry) {
      case 'D':
        return new Dihedral4(this.cells, this.validator, this.zoneDetail)
      case 'A':
        return new Klein4(this.cells, this.validator, this.zoneDetail)
      case 'S':
        return new Invariant(this.cells, this.validator, this.zoneDetail)
      case 'H':
        return new Cyclic4(this.cells, this.validator, this.zoneDetail)
      case 'L':
        return new Blinker(this.cells, this.validator, this.zoneDetail)
      default:
        throw new Error(
          'Unknown symmetry type for ' + JSON.stringify(this, null, 2)
        ) // The 'null, 2' adds indentation for readability);
    }
  }
  placeables () {
    return this.variants().placeables()
  }
  type () {
    return this.terrain.ships.types[this.letter]
  }
  color () {
    return this.terrain.ships.colors[this.letter]
  }
  sunkDescription (middle = ' ') {
    return this.description() + middle + this.shipSunkDescriptions()
  }
  letterColors () {
    return this.terrain.ships.letterColors[this.letter]
  }
  description () {
    return this.terrain.ships.description[this.letter]
  }
  shipSunkDescriptions () {
    return this.terrain.ships.shipSunkDescriptions[this.type()]
  }
}

const MIN_CUSTOM_WIDTH = 16
const MAX_CUSTOM_WIDTH = 22
const MIN_CUSTOM_HEIGHT = 6
const MAX_CUSTOM_HEIGHT = 12

class SubTerrain {
  constructor (
    title,
    lightColor,
    darkColor,
    letter,
    isDefault,
    isTheLand,
    zones
  ) {
    this.title = title
    this.lightColor = lightColor
    this.darkColor = darkColor
    this.letter = letter
    this.isDefault = isDefault || false
    this.isTheLand = isTheLand || false
    this.zones = zones
    this.margin = zones.filter(z => z.isMarginal)[0]
    this.core = zones.filter(z => !z.isMarginal)[0]
  }

  clone () {
    return new SubTerrain(
      this.title,
      this.lightColor,
      this.darkColor,
      this.letter,
      this.isDefault,
      this.isTheLand,
      this.zones
    )
  }
}

function Zone (title, letter, isMarginal) {
  this.title = title
  this.letter = letter
  this.isMarginal = isMarginal
}

class ShipCatelogue {
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
    this.letterColors = shipLetterColors
    this.descriptions = shipDescription
    this.types = shipTypes
    this.colors = shipColors
    this.shapesByLetter = Object.fromEntries(
      baseShapes.map(base => [base.letter, base])
    )
  }
  addShapes (shapes) {
    this.baseShapes = shapes
    this.shapesByLetter = Object.fromEntries(
      shapes.map(base => [base.letter, base])
    )
  }

  sunkDescription (letter, middle = ' ') {
    return (
      this.descriptions[letter] +
      middle +
      this.shipSunkDescriptions[this.types[letter]]
    )
  }
}

class Terrain {
  constructor (title, ShipCatelogue, subterrains, tag) {
    this.title = title || 'Unknown'
    this.key = title.toLowerCase().replace(/\s+/g, '-')
    this.ships = ShipCatelogue
    this.minWidth = MIN_CUSTOM_WIDTH
    this.maxWidth = MAX_CUSTOM_WIDTH
    this.minHeight = MIN_CUSTOM_HEIGHT
    this.maxHeight = MAX_CUSTOM_HEIGHT
    this.subterrains = subterrains
    this.zones = subterrains.flatMap(s => s.zones)
    this.defaultSubterrain =
      subterrains.filter(s => s.isDefault)[0] || subterrains[0]
    this.landSubterrain =
      subterrains.filter(s => s.isTheLand)[0] || subterrains[1]
    this.tag = tag
  }

  customMapsLocalStorageKey () {
    return `geoffs-battleship.${this.key}-custom-maps`
  }

  getCustomMapsRaw () {
    return localStorage.getItem(this.customMapsLocalStorageKey()) || ''
  }

  setCustomMapsRaw (csv) {
    return localStorage.setItem(this.customMapsLocalStorageKey(), csv)
  }

  getCustomMapSet () {
    const customMaps = this.getCustomMapsRaw()
    if (customMaps) return new Set(customMaps.split(','))

    return new Set()
  }
  localStorageMapKey (title) {
    return `geoffs-battleship.${title}`
  }
  updateCustomMaps (title) {
    let customMaps = this.getCustomMapSet()
    if (customMaps.has(title)) {
      return
    }
    customMaps.add(title)
    const list = [...customMaps].filter(
      t => t && t.length > 0 && localStorage.getItem(this.localStorageMapKey(t))
    )

    const csv = list.join()
    localStorage.setItem(this.customMapsLocalStorageKey(), csv)
  }
  deleteCustomMaps (title) {
    let customMaps = this.getCustomMapSet()

    customMaps.delete(title)
    localStorage.setItem(this.customMapsLocalStorageKey, [...customMaps].join())
  }
  renameCustomMaps (oldMap, newTitle) {
    let customMaps = this.getCustomMapSet()

    customMaps.delete(oldMap.title)
    oldMap.title = newTitle
    customMaps.add(oldMap.title)
    localStorage.setItem(
      this.customMapsLocalStorageKey(),
      [...customMaps].join()
    )
  }

  getCustomMaps (builder) {
    const customMaps = this.getCustomMapsRaw()
    if (!customMaps) return []
    return [...this.getCustomMapSet()]
      .map(title => builder(title))
      .filter(m => m !== null)
  }

  getCustomMapTitles () {
    const customMaps = this.getCustomMapsRaw()
    if (!customMaps) return []
    return [...this.getCustomMapSet()]
  }

  sunkDescription (letter, middle = ' ') {
    return this.ships.sunkDescription(letter, middle)
  }
}

const seaAndLandShips = new ShipCatelogue(
  [],
  {
    A: 'Shot Down',
    G: 'Destroyed',
    M: 'Destroyed',
    T: 'Destroyed',
    X: 'Destroyed',
    S: 'Sunk'
  },
  {
    A: '#ff6666',
    T: '#ffccff',
    B: '#66ccff',
    C: '#66ff66',
    D: '#99ff33',
    O: '#33cc99',
    S: '#3399cc',
    Q: '#ffcc66',
    H: '#ff6699',
    J: '#ff884d',
    P: '#cc99ff',
    G: '#ff99cc',
    R: '#6699ff',
    U: '#ffff66',
    L: '#ff9933',
    N: '#33ffcc',
    I: '#cc33cc',
    Y: '#7799ee',
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
    Q: 'Stealth Bomber',
    H: 'Helicopter',
    J: 'Fighter Jet',
    P: 'Airplane',
    G: 'Anti-Aircraft Gun',
    R: 'Radar Station',
    U: 'Underground Bunker',
    L: 'Bomb Shelter',
    N: 'Naval Base',
    I: 'Pier',
    Y: 'Supply Depot'
  },
  {
    A: 'S',
    T: 'S',
    B: 'S',
    C: 'S',
    O: 'S',
    D: 'S',
    S: 'S',
    Q: 'A',
    H: 'A',
    J: 'A',
    P: 'A',
    G: 'G',
    R: 'G',
    U: 'G',
    L: 'G',
    N: 'X',
    I: 'X',
    Y: 'X'
  },
  {
    A: 'rgba(255,102,102,0.3)',
    B: 'rgba(102,204,255,0.3)',
    C: 'rgba(102,255,102,0.3)',
    D: 'rgba(153, 255, 51,0.3)',
    S: 'rgba(51, 153, 204,0.3)',
    G: 'rgba(255,153,204,0.3)',
    U: 'rgba(255,255,102,0.3)',
    T: 'rgba(255,204,255,0.3)',
    O: 'rgba(51,204,153,0.3)',
    Q: 'rgba(255,204,102,0.3)',
    H: 'rgba(255,102,153,0.3)',
    J: 'rgba(255,136,77,0.3)',
    R: 'rgba(102,153,255,0.3)',
    L: 'rgba(255, 153, 51,0.3)',
    N: 'rgba(51, 255, 204,0.3)',
    I: 'rgba(204, 51, 204,0.3)',
    Y: 'rgba(51, 51, 204,0.3)'
  }
)

const deep = new Zone('Depths', 'D', false)
const littoral = new Zone('Shallows', 'L', true)
const coast = new Zone('Coast', 'C', true)
const inland = new Zone('Highlands', 'I', false)
const sea = new SubTerrain('Sea', '#1a78d6', '#1761b0', 'S', true, false, [
  littoral,
  deep
])
const land = new SubTerrain('Land', '#348239', '#296334', 'G', false, true, [
  coast,
  inland
])
export const mixed = new SubTerrain(
  'Mixed',
  '#888',
  '#666',
  'M',
  false,
  false,
  []
)
export const all = new SubTerrain('Air', '#a77', '#955', 'A', false, false, [])

export const seaAndLand = new Terrain(
  'Sea and Land',
  seaAndLandShips,
  [sea, land],
  'SeaAndLand'
)

class Building extends Shape {
  constructor (description, letter, symmetry, cells, tip, racks) {
    super(
      letter,
      symmetry,
      cells,
      'G',
      tip || `place ${description} on the land`,
      racks
    )
    this.descriptionText = description
    this.terrain = seaAndLand
    this.subterrain = land

    this.validator = Building.validator
    this.zoneDetail = Building.zoneDetail
    this.canBeOn = HillFort.canBe
  }
  static canBe (subterrain) {
    return subterrain === land
  }
  static validator = zoneInfo => Building.canBe(zoneInfo[0])
  static zoneDetail = 1
  type () {
    return 'G'
  }
  sunkDescriptionRaw () {
    return 'Destroyed'
  }

  description () {
    return this.descriptionText
  }
}
class HillFort extends Building {
  constructor (description, letter, symmetry, cells, racks) {
    super(
      description,
      letter,
      symmetry,
      cells,
      `place ${description} on the highlands`,
      racks
    )
    this.validator = HillFort.validator
    this.zoneDetail = HillFort.zoneDetail
    this.canBeOn = HillFort.canBe
    this.notes = [
      `${description} can not touch sea squares; must be surrounded by land squares.`
    ]
  }
  static canBe (subterrain, zone) {
    return subterrain === land && zone === inland
  }
  static validator = zoneInfo => HillFort.canBe(zoneInfo[0], zoneInfo[1])
  static zoneDetail = 2
}
class CoastalPort extends Building {
  constructor (description, letter, symmetry, cells, racks) {
    super(
      description,
      letter,
      symmetry,
      cells,
      `place ${description} on the coast`,
      racks
    )
    this.validator = CoastalPort.validator
    this.zoneDetail = CoastalPort.zoneDetail
    this.canBeOn = CoastalPort.canBe
    this.notes = [`${description} must be touching sea squares.`]
  }

  static canBe (subterrain, zone) {
    return subterrain === land && zone === coast
  }
  static validator = zoneInfo => CoastalPort.canBe(zoneInfo[0], zoneInfo[1])
  static zoneDetail = 2
}
class Plane extends Shape {
  constructor (description, letter, symmetry, cells, racks) {
    super(
      letter,
      symmetry,
      cells,
      'A',
      `place ${description} at any location`,
      racks
    )
    this.descriptionText = description
    this.terrain = seaAndLand
    this.subterrain = all
    this.canBeOn = Plane.canBe
    this.immune = ['Z']
  }

  static canBe = Function.prototype
  static validator = Plane.canBe
  static zoneDetail = 0

  type () {
    return 'A'
  }
  sunkDescription () {
    return 'Shot Down'
  }
  description () {
    return this.descriptionText
  }

  canBeOn () {
    return true
  }
}

class SeaVessel extends Shape {
  constructor (description, letter, symmetry, cells, tip, racks) {
    super(
      letter,
      symmetry,
      cells,
      'S',
      tip || `place ${description} in the sea`,
      racks
    )
    this.descriptionText = description
    this.terrain = seaAndLand
    this.subterrain = sea

    this.validator = SeaVessel.validator
    this.zoneDetail = SeaVessel.zoneDetail
    this.canBeOn = SeaVessel.canBe
  }
  static canBe (subterrain) {
    return subterrain === sea
  }
  static validator = zoneInfo => SeaVessel.canBe(zoneInfo[0])
  static zoneDetail = 1

  type () {
    return 'S'
  }
  sunkDescription () {
    return 'Sunk'
  }
  description () {
    return this.descriptionText
  }
}

class DeepSeaVessel extends SeaVessel {
  constructor (description, letter, symmetry, cells, racks) {
    super(
      description,
      letter,
      symmetry,
      cells,
      `place ${description} in the deep sea`,
      racks
    )
    this.validator = DeepSeaVessel.validator
    this.zoneDetail = DeepSeaVessel.zoneDetail
    this.notes = [
      `${description} can not touch land squares; must be surrounded by sea squares.`
    ]
    this.canBeOn = DeepSeaVessel.canBe
  }
  static canBe (subterrain, zone) {
    return subterrain === sea && zone === deep
  }
  static validator = zoneInfo => DeepSeaVessel.canBe(zoneInfo[0], zoneInfo[1])
  static zoneDetail = 2
}
class ShallowDock extends SeaVessel {
  constructor (description, letter, symmetry, cells, racks) {
    super(
      description,
      letter,
      symmetry,
      cells,
      `place ${description} in the shallow sea`,
      racks
    )
    this.validator = ShallowDock.validator
    this.zoneDetail = ShallowDock.zoneDetail

    this.notes = [`${description} must be touching land squares.`]
    this.canBeOn = ShallowDock.canBe
  }
  static canBe (subterrain, zone) {
    return subterrain === sea && zone === littoral
  }
  static validator = zoneInfo => ShallowDock.canBe(zoneInfo[0], zoneInfo[1])
  static zoneDetail = 2
}

class SubShape {
  constructor (validator, zoneDetail, subterrain) {
    this.validator = validator
    this.zoneDetail = zoneDetail
    this.subterrain = subterrain
    this.faction = 1
  }

  clone () {
    return new SubShape(this.validator, this.zoneDetail, this.subterrain)
  }
}
class StandardCells extends SubShape {
  constructor (validator, zoneDetail, subterrain) {
    super(validator, zoneDetail, subterrain)
    this.cells = []
  }
  setCells (allCells, secondary) {
    this.cells = allCells.filter(
      ([r0, c0]) => !secondary.cells.some(([r, c]) => r0 === r && c0 === c)
    )
  }
}
class SpecialCells extends SubShape {
  constructor (cells, validator, zoneDetail, subterrain) {
    super(validator, zoneDetail, subterrain)
    this.cells = cells
  }
}

class Hybrid extends Shape {
  constructor (description, letter, symmetry, cells, subGroups, tip, racks) {
    super(
      letter,
      symmetry,
      cells,
      'X',
      tip || `place ${description} so that the parts are in the correct area`,
      racks
    )
    this.primary = subGroups[0]
    this.primary.setCells(cells, subGroups[1])
    this.secondary = subGroups[1]
    this.subGroups = subGroups
    this.size = cells.length
    for (const group of subGroups) {
      group.faction = group.cells.length / this.size
    }
    this.descriptionText = description
    this.terrain = seaAndLand
    this.subterrain = mixed
    this.canBeOn = Function.prototype
  }
  displacementFor (subterrain) {
    const groups = this.subGroups.filter(g => g.subterrain === subterrain)
    const result = groups.reduce(
      (accumulator, group) => accumulator + group.faction * this.displacement,
      0
    )
    return result
  }
  variants () {
    return new Variant3(
      this.cells,
      [this.primary, this.secondary],
      this.symmetry
    )
  }
  type () {
    return 'M'
  }
  sunkDescription () {
    return 'Destroyed'
  }
  description () {
    return this.descriptionText
  }
}

class Transformer extends Hybrid {
  constructor (
    description,
    letter,
    symmetry,
    cells,
    primeType,
    secondaryType,
    secondaryCells,
    secondarySymmetry,
    racks
  ) {
    super(
      description,
      letter,
      symmetry,
      cells,
      primeType,
      secondaryType,
      secondaryCells,
      racks
    )
    this.secondarySymmetry = secondarySymmetry
  }

  type () {
    return 'T'
  }
}

const undergroundBunker = new Building('Underground Bunker', 'U', 'H', [
  [0, 0],
  [1, 0],
  [1, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [0, 4]
])

const antiAircraftGun = new Building('Anti-Aircraft Gun', 'G', 'S', [
  [0, 0],
  [1, 1],
  [0, 2],
  [2, 0],
  [2, 2]
])
const radarStation = new Building('Radar Station', 'R', 'H', [
  [0, 0],
  [1, 0],
  [2, 0],
  [2, 1],
  [2, 2]
])

const bombShelter = new HillFort('Bomb Shelter', 'L', 'H', [
  [0, 0],
  [1, 0],
  [1, 1],
  [1, 2],
  [0, 2]
])
bombShelter.hardened = ['M']
bombShelter.notes = [
  `The ${bombShelter.descriptionText} is hardened against Mega bombs.`,
  `Only the center square of the bomb will destroy the ${bombShelter.descriptionText} the surrounding squares will only reveal the ${bombShelter.descriptionText} `
]

const supplyDepot = new Hybrid(
  'Supply Depot',
  'Y',
  'D',
  [
    [0, 0],
    [1, 0],
    [1, 1]
  ],
  [
    new StandardCells(Building.validator, Building.zoneDetail, land),
    new SpecialCells(
      [[0, 0]],
      CoastalPort.validator,
      CoastalPort.zoneDetail,
      land
    )
  ],
  'place Supply Depot on the coast.'
)
supplyDepot.subterrain = land
supplyDepot.canBeOn = Building.canBe
supplyDepot.notes = [
  `the dotted parts of the ${supplyDepot.descriptionText} must be placed adjacent to sea.`
]
const pier = new Hybrid(
  'Pier',
  'I',
  'H',
  [
    [0, 0],
    [1, 0]
  ],
  [
    new StandardCells(SeaVessel.validator, SeaVessel.zoneDetail, sea),
    new SpecialCells(
      [[0, 0]],
      ShallowDock.validator,
      ShallowDock.zoneDetail,
      sea
    )
  ],
  'place Pier adjacent to the coast.'
)
pier.canBeOn = SeaVessel.canBe
pier.subterrain = sea
pier.notes = [
  `the dotted parts of the ${pier.descriptionText} must be placed adjacent to land.`
]

const navalBase = new Hybrid(
  'Naval Base',
  'N',
  'D',
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1]
  ],
  [
    new StandardCells(Building.validator, Building.zoneDetail, land),
    new SpecialCells(
      [
        [0, 0],
        [1, 0]
      ],
      SeaVessel.validator,
      SeaVessel.zoneDetail,
      sea
    )
  ],
  'place Naval Base half on land and half on sea.'
)
navalBase.notes = [
  `the dotted parts of the ${navalBase.descriptionText} must be placed on sea, while the undotted parts on the land`
]
const jetFighterCraft = new Plane('Jet Fighter', 'J', 'H', [
  [0, 1],
  [1, 1],
  [2, 0],
  [2, 1],
  [2, 2]
])

jetFighterCraft.vulnerable = ['F']
const helicopter = new Plane('Helicopter', 'H', 'S', [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, 2],
  [2, 1]
])
helicopter.vulnerable = ['W', 'F']
const airplane = new Plane('Airplane', 'P', 'H', [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, 2]
])
airplane.vulnerable = ['W', 'F']
const stealthBomber = new Plane('Stealth Bomber', 'Q', 'H', [
  [0, 0],
  [1, 0],
  [2, 0],
  [0, 1],
  [1, 1],
  [0, 2]
])
stealthBomber.hardened = ['W']

const aircraftCarrier = new SeaVessel('Aircraft Carrier', 'A', 'A', [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 1],
  [1, 2],
  [1, 3],
  [1, 4]
])

const tanker = new SeaVessel('Tanker', 'T', 'L', [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5]
])
tanker.vulnerable = ['Z', '+']
const battleship = new SeaVessel('Battleship', 'B', 'L', [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4]
])
const oilRig = new DeepSeaVessel('Oil Rig', 'O', 'S', [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1]
])
oilRig.vulnerable = ['M']
oilRig.notes = [
  `The ${oilRig.descriptionText} is vulnerable against Mega bombs.`,
  `The squares of the ${oilRig.descriptionText} adjacent to the bomb will also be destroyed.`
]
const cruiser = new SeaVessel('Cruiser', 'C', 'L', [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3]
])
const destroyer = new SeaVessel(
  'Destroyer',
  'D',
  'L',
  [
    [0, 0],
    [0, 1],
    [0, 2]
  ],
  null,
  [[0, 2]]
)

const submarine = new SeaVessel(
  'Submarine',
  'S',
  'L',
  [
    [0, 0],
    [0, 1]
  ],
  null,
  [
    [0, 0],
    [0, 1]
  ]
)
submarine.vulnerable = ['E']
submarine.hardened = ['M']
submarine.immune = ['R']
submarine.notes = [
  `The ${submarine.descriptionText} is hardened against Mega bombs.`,
  `Only the center square of the bomb will destroy the ${submarine.descriptionText} the surrounding squares will only reveal the ${submarine.descriptionText}.`
]

seaAndLandShips.addShapes([
  undergroundBunker,
  antiAircraftGun,
  radarStation,
  aircraftCarrier,
  stealthBomber,
  helicopter,
  jetFighterCraft,
  bombShelter,
  airplane,
  tanker,
  battleship,
  navalBase,
  cruiser,
  oilRig,
  supplyDepot,
  destroyer,
  pier,
  submarine
])

terrain.setCurrent(seaAndLand)

export class Weapon {
  constructor (name, letter, isLimited, destroys, points) {
    this.name = name
    this.plural = name + 's'
    this.letter = letter
    this.isLimited = isLimited
    this.destroys = destroys
    this.points = points
    this.hasFlash = false
  }

  info () {
    return `${this.name} (${this.letter})`
  }
}

export class StandardShot extends Weapon {
  constructor () {
    super('Standard Shot', '-', false, true, 1)
    this.cursors = ['']
    this.hint = 'Click On Square To Fire'
    this.buttonHtml = '<span class="shortcut">S</span>ingle Shot'
  }
  aoe (coords) {
    return [[coords[0][0], coords[0][1], 4]]
  }
  ammoStatus () {
    return `Single Shot Mode`
  }
}

export const standardShot = new StandardShot()

export class Megabomb extends Weapon {
  constructor (ammo) {
    super('Megabomb', 'M', true, true, 1)
    this.ammo = ammo
    this.cursors = ['bomb']
    this.hint = 'Click On Square To Drop Bomb'

    this.buttonHtml = '<span class="shortcut">M</span>ega Bomb'
    this.hasFlash = true
  }

  ammoStatus (ammoLeft) {
    return `Bomb Mode (${ammoLeft} left)`
  }

  aoe (coords) {
    const r = coords[0][0]
    const c = coords[0][1]
    let result = [[r, c, 2]]
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        if (i !== 0 || j !== 0) {
          result.push([r + i, c + j, 1])
        }
      }
    }
    for (let i = -1; i < 2; i++) {
      result.push([r + i, c - 2, 0])
      result.push([r + i, c + 2, 0])
    }
    for (let j = -1; j < 2; j++) {
      result.push([r - 2, c + j, 0])
      result.push([r + 2, c + j, 0])
    }
    return result
  }
}

export class WeaponSystem {
  constructor (weapon) {
    this.ammo = weapon.isLimited ? weapon.ammo : null
    this.weapon = weapon
  }
  ammoLeft () {
    return this.ammo
  }
  ammoTotal () {
    return this.weapon.ammo
  }

  ammoUsed () {
    return this.weapon.ammo - this.ammo
  }
}
export class LoadOut {
  constructor (weapons) {
    this.weapons = weapons
    this.weaponSystems = LoadOut.wps(weapons)
    this.allSystems = [...this.weaponSystems]
    this.OutOfAllAmmo = Function.prototype
    this.OutOfAmmo = Function.prototype
    this.destroy = Function.prototype
    this.reveal = Function.prototype
    this.onCursorChange = Function.prototype
    this.sound = Function.prototype
    this.index = 0
    this.coords = []
  }

  static wps (weapons) {
    return weapons.map(w => {
      return new WeaponSystem(w)
    })
  }
  limitedSystems () {
    return this.weaponSystems.filter(w => w.weapon.isLimited)
  }
  limitedAllSystems () {
    return this.allSystems.filter(w => w.weapon.isLimited)
  }
  limitedWeapons () {
    return this.weapons.filter(w => w.isLimited)
  }
  totalAmmo () {
    return this.limitedSystems().reduce((acc, w) => acc + w.ammo, 0)
  }
  ammoLeft () {
    return this.limitedSystems().reduce((acc, w) => acc + w.ammoLeft(), 0)
  }
  reload (weapons) {
    weapons = weapons || this.weapons
    this.weaponSystems = LoadOut.wps(weapons)
  }
  weaponSystem () {
    return this.weaponSystems[this.index]
  }

  nextWeaponSystem () {
    return this.weaponSystems[this.nextIndex()]
  }
  weapon () {
    return this.weaponSystem().weapon
  }
  switchTo (wletter) {
    const idx = this.weaponSystems.findIndex(
      w => w.weapon.letter === wletter && w.ammo > 0
    )
    if (idx < 0) return false
    this.index = idx
    return true
  }
  switchToSShot () {
    this.index = 0
    return true
  }
  nextWeapon () {
    return this.nextWeaponSystem().weapon
  }
  removeWeaponSystem () {
    const i = this.index
    this.weaponSystems.splice(i, 1)

    if (i >= this.weaponSystems.length) {
      this.index = 0
    }
  }
  isOutOfAmmo () {
    return 1 >= this.weaponSystems.length
  }
  currentAmmo () {
    return this.weaponSystem().ammo
  }
  hasNoCurrentAmmo () {
    return !this.hasCurrentAmmo()
  }
  hasCurrentAmmo () {
    return !this.weapon().isLimited || this.currentAmmo() !== 0
  }
  useAmmo () {
    if (!this.weapon().isLimited) return

    this.weaponSystem().ammo--

    if (this.hasNoCurrentAmmo()) {
      const oldWeapon = this.weapon()
      this.removeWeaponSystem()
      this.OutOfAmmo(oldWeapon, this.weapon())
      if (this.isOutOfAmmo()) {
        this.OutOfAllAmmo()
      }
    }
  }
  cursors () {
    return this.weaponSystems
      .flatMap(w => {
        return w.weapon.cursors
      })
      .filter(c => c !== '')
  }

  cursor () {
    const weapon = this.weapon()
    const index = Math.min(this.coords.length, weapon.points - 1)
    return weapon.cursors[index]
  }

  nextIndex () {
    let idx = this.index
    idx++
    if (idx >= this.weaponSystems.length) {
      idx = 0
    }
    return idx
  }
  switchToNextWPS () {
    this.index = this.nextIndex()
    this.coords = []
  }
  switch () {
    const oldCursor = this.cursor()
    this.switchToNextWPS()

    this.onCursorChange(oldCursor, this.cursor())
    return this.weapon()
  }

  aim (r, c) {
    const oldCursor = this.cursor()
    this.coords = []
    this.onCursorChange(oldCursor, this.cursor())
    this.coords.push([r, c])
    if (this.coords.length >= this.weapon().points) {
      this.fire(this.coords)
      this.coords = []
    }

    const newCursor = this.cursor()
    if (oldCursor !== newCursor) {
      this.onCursorChange(oldCursor, this.cursor())
    }
  }

  dismiss () {
    const oldCursor = this.cursor()
    this.coords = []
    this.onCursorChange(oldCursor, this.cursor())
  }

  fire () {
    const weapon = this.weapon()
    const effected = weapon.aoe(this.coords)
    this.useAmmo()
    if (weapon.destroys) {
      this.destroy(weapon, effected)
    } else {
      this.reveal(weapon, effected)
    }
  }
}
