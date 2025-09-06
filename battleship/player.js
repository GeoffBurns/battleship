import { gameMaps } from './map.js'
import { gameStatus } from './playerUI.js'

class Score {
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
    return gameMaps.sunkDescription(this.letter, middle)
  }
  type () {
    return gameMaps.shipTypes[this.letter]
  }
}

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
