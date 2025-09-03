import { gameMaps } from './map.js'
import { gameStatus } from './playerUI.js'

const score = {
  shot: new Set(),  
  autoMisses: 0,
  reset: function () { 
    this.shot.clear()
    this.autoMisses = 0
  },
  newShotKey: function (r, c) {
  const key = `${r},${c}`
   if (this.shot.has(key)) return null
   return key
  },
  createShotKey: function (r, c) {
    const key = this.newShotKey(r, c) 
    if (key) {
      this.shot.add(key)
    }
    return key
  },
  noOfShots: function () {
    return this.shot.size - this.autoMisses
  },
  addAutoMiss: function (r, c) {
    const key = this.createShotKey(r, c)
    if (!key) return key // already shot here
    this.autoMisses++
    return key
  },

}

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
  shape () {
    return gameMaps.shapesByLetter[this.letter]
  }
   sunkDescription () {
    return gameMaps.sunkDescription(this.letter)
  }
  type () {
    return gameMaps.shipTypes[this.letter]
  }
}

export const player = {
  ships: [],
  score: score,

  createShips: function () {
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
  },
    recordAutoMiss: function (r, c) {
    const key = this.score.addAutoMiss(r, c)
    if (!key) return // already shot here
    this.UI.cellMiss(r, c)
  },
  recordFleetSunk: function () {
    this.UI.displayFleetSunk()
    this.boardDestroyed = true
  },
  checkFleetSunk: function () {
    if (this.ships.every(s => s.sunk)) {
      this.recordFleetSunk()
    }
  },
  shipCellAt: function (r, c) {
    return this.shipCellGrid[r]?.[c]
  },
  markSunk: function (ship) {
    ship.sunk = true
    gameStatus.info(ship.sunkDescription())
    for (const [r, c] of ship.cells) {
      // surrounding water misses
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr
          const cc = c + dc
          if (gameMaps.inBounds(rr, cc)) {
            this.recordAutoMiss(rr, cc)
          }
        }
      this.UI.cellSunkAt(r, c, ship.letter)
    }
    this.checkFleetSunk()
  },

  fireShot: function (r, c, key) {
    const shipCell = this.shipCellAt(r, c)
    if (!shipCell) {
      this.UI.cellMiss(r, c) 
      return { hit: false, sunk: '' }
    }
    // check for hit
    const hitShip = this.ships.find(s => s.id === shipCell.id)
    if (!hitShip) {
      this.UI.cellMiss(r, c) 
      return { hit: false, sunk: '' }
    }
    // it's a hit
    hitShip.hits.add(key)

    this.UI.cellHit(r, c)
 
    if (hitShip.hits.size === hitShip.cells.length) {
      // ship sunk
      this.markSunk(hitShip)
 
      return { hit: true, sunkLetter: hitShip.letter }
    }

    return { hit: true, sunkLetter: '' }
  },
  processShot: function (r, c) { 
    const key = this.score.createShotKey(r, c)
    if (key === null) { 
      // if we are here, it is because of carpet bomb, so we can just
      return { hit: false, sunk: '' }
    }

    const result = this.fireShot(r, c, key)

    this.updateUI(this.ships)
    return result
  },

}
