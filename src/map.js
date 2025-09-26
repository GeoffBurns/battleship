import { seaAndLand, terrain, addCellToFootPrint } from './Shape.js'

// geometry helper
export const inRange = (r, c) => element =>
  element[0] == r && element[1] <= c && element[2] >= c

export function locationKey (r, c) {
  return `${r},${c}`
}

export class Map {
  constructor (title, rows, cols, shipNum, landArea, mapTerrain, land) {
    this.title = title
    this.rows = rows
    this.cols = cols
    this.shipNum = shipNum
    this.landArea = landArea
    this.land = land instanceof Set ? land : new Set()
    this.terrain = mapTerrain || terrain.current
    this.subterrainTrackers = this.terrain.subterrains.map(s => {
      return {
        subterrain: s,
        total: new Set(),
        m_zone: s.zones.filter(z => z.isMarginal)[0],
        margin: new Set(),
        c_zone: s.zones.filter(z => !z.isMarginal)[0],
        core: new Set(),
        footprint: new Set()
      }
    })
    this.calcTrackers()
  }
  recalcTracker (subterrain, tracker) {
    tracker.total.clear()
    tracker.margin.clear()
    tracker.core.clear()

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.setTracker(r, c, subterrain, tracker)
      }
    }
  }
  calcTrackers () {
    for (const tracker of this.subterrainTrackers) {
      this.recalcTracker(tracker.subterrain, tracker)
    }
  }
  setTracker (r, c, subterrain, tracker) {
    const isLand = subterrain.isTheLand
    if (isLand !== this.isLand(r, c)) return
    const key = `${r},${c}`
    tracker.total.add(key)
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (!(i === 0 && j === 0) && this.inBounds(r + i, c + j)) {
          if (isLand !== this.isLand(r + i, c + j)) {
            tracker.margin.add(key)
          }
        }
      }
    }
    tracker.core = new Set(
      [...tracker.total].filter(x => !tracker.margin.has(x))
    )
  }

  calcFootPrints () {
    for (const tracker of this.subterrainTrackers) {
      this.calcFootPrint(tracker)
    }
  }

  calcFootPrint (tracker) {
    tracker.footprint.clear()

    tracker.total.forEach((value, key) => {
      const pair = key.split(',')
      const r = parseInt(pair[0])
      const c = parseInt(pair[1])
      addCellToFootPrint(r, c, tracker.footprint)
    })
  }
  inBounds (r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols
  }
  inAllBounds (r, c, height, width) {
    return r >= 0 && r + height < this.rows && c + width >= 0 && c < this.cols
  }

  addLand (_r, _c) {
    throw new Error('Not a custom map')
  }

  subterrain (r, c) {
    /* todo more logic if more than default and land 
        e.g. rock, caverns and lava in UnderDark Terrains */
    //  const isLand = this.isLand(r, c)
    //  return isLand ? this.terrain.landSubterrain : this.terrain.defaultSubterrain

    for (const tracker of this.subterrainTrackers) {
      if (tracker.total.has(locationKey(r, c))) return tracker.subterrain
    }

    return this.terrain.defaultSubterrain
  }

  zoneDetail (r, c) {
    for (const tracker of this.subterrainTrackers) {
      if (tracker.total.has(locationKey(r, c))) {
        if (tracker.margin.has(locationKey(r, c)))
          return [tracker.subterrain, tracker.m_zone]
        else if (tracker.core.has(locationKey(r, c)))
          return [tracker.subterrain, tracker.c_zone]
        else {
          throw new Error('Unknown zone')
        }
      }
    }
    throw new Error('Unknown subterrain')
  }
  zone (r, c) {
    /* todo more logic for zone restrictions */
    return this.zoneDetail(r, c)[1]
  }

  zoneInfo (r, c, zoneDetail) {
    switch (zoneDetail) {
      case 0:
        return []
      case 1:
        return [this.subterrain(r, c)]
      case 2:
        return this.zoneDetail(r, c)
      default:
        throw new Error('zoneDetail not valid :', zoneDetail)
    }
  }
  isLand (r, c) {
    return this.landArea.some(inRange(r, c))
  }
}
function getCopyNumKey (terrain, cols, rows) {
  return `geoffs-battleship.${terrain.key}-index-${cols}x${rows}`
}
function getCopyNum (terrain, cols, rows) {
  return parseInt(localStorage.getItem(getCopyNumKey(terrain, cols, rows)))
}
function setCopyNum (terrain, cols, rows, index) {
  localStorage.setItem(getCopyNumKey(terrain, cols, rows), index)
}
function getNextCopyNum (terrain, cols, rows) {
  return getCopyNum(terrain, cols, rows) + 1 || 1
}
function makeTitle (terrain, cols, rows) {
  const index = getNextCopyNum(terrain, cols, rows)
  setCopyNum(terrain, cols, rows, index)
  return `${terrain.key}-${index}-${cols}x${rows}`
}

export class CustomMap extends Map {
  constructor (title, rows, cols, shipNum, land, mapTerrain) {
    super(title, rows, cols, shipNum, [], mapTerrain || terrain.current, land)
  }

  isLand (r, c) {
    return this.land.has(`${r},${c}`)
  }

  jsonObj () {
    const data = { ...this }
    delete data.terrain
    delete data.land
    data.land = [...this.land]
    data.terrain = this.terrain.title
    return data
  }
  jsonString () {
    const data = this.jsonObj()
    return JSON.stringify(data, null, 2)
  }
  saveToLocalStorage (title, key) {
    title = title || makeTitle(this.terrain, this.cols, this.rows)
    key = key || this.localStorageKey(title)

    localStorage.setItem(key, this.jsonString())

    this.terrain.updateCustomMaps(title)
  }

  localStorageKey (title) {
    this.title = title || makeTitle(this.terrain, this.cols, this.rows)
    return `geoffs-battleship.${this.title}`
  }
}

const withModifyable = Base =>
  class extends Base {
    addLand (r, c) {
      if (this.inBounds(r, c)) this.land.add(`${r},${c}`)
    }

    removeLand (r, c) {
      if (this.inBounds(r, c)) this.land.delete(`${r},${c}`)
    }

    addShips (ships) {
      this.shipNum = {}
      for (const ship of ships) {
        this.shipNum[ship.letter] = (this.shipNum[ship.letter] || 0) + 1
      }
    }
    setLand (r, c, subterrain) {
      if (subterrain.isDefault) {
        this.removeLand(r, c)
      } else {
        this.addLand(r, c)
      }
    }
  }

export class CustomBlankMap extends withModifyable(CustomMap) {
  constructor (rows, cols, mapTerrain) {
    super(
      makeTitle(mapTerrain || terrain.current, cols, rows),
      rows,
      cols,
      0,
      new Set(),
      mapTerrain || terrain.current
    )
  }
  indexToken (rows, cols) {
    return getCopyNumKey(this.terrain, cols, rows)
  }

  setSize (rows, cols) {
    this.title = makeTitle(this.terrain.title, cols, rows)
    this.rows = rows
    this.cols = cols
    for (const key of this.land) {
      const [r, c] = key.split(',').map(n => parseInt(n, 10))
      if (!this.inBounds(r, c)) this.land.delete(key)
    }
  }
}

export class SavedCustomMap extends CustomMap {
  constructor (data) {
    super(
      data.title,
      data.rows,
      data.cols,
      data.shipNum,
      new Set([...data.land])
    )
    this.terrain =
      terrain.terrains.find(t => t.title === data.terrain) || seaAndLand
  }

  static loadObj (title) {
    const data = localStorage.getItem(`geoffs-battleship.${title}`)
    if (!data) return //throw new Error('No such saved map')
    const obj = JSON.parse(data)
    return obj
  }

  static load (title) {
    const obj = SavedCustomMap.loadObj(title)
    return new SavedCustomMap(obj)
  }

  localStorageKey () {
    return `geoffs-battleship.${this.title}`
  }

  remove () {
    const key = this.localStorageKey()
    const title = this.title
    localStorage.removeItem(key)
    const check = localStorage.getItem(key)
    if (check) {
      throw new Error('Failed to delete map with key ' + key)
    }

    this.terrain.deleteCustomMaps(title)
  }

  rename (newTitle) {
    this.remove()
    this.title = newTitle
    this.saveToLocalStorage(newTitle)
  }

  clone (newTitle) {
    newTitle = newTitle || makeTitle(this.terrain, this.cols, this.rows)
    this.title = newTitle
    const key = this.localStorageKey()
    this.saveToLocalStorage(newTitle, key)

    const check = localStorage.getItem(key)
    if (!check) {
      throw new Error('Failed to copy map with key ' + key)
    }
  }
}
export class EditedCustomMap extends withModifyable(SavedCustomMap) {
  constructor (data) {
    super(data)
  }
  static load (title) {
    const obj = SavedCustomMap.loadObj(title)
    return new EditedCustomMap(obj)
  }
}
