import { gameMaps } from './maps.js'
import { gameStatus } from './playerUI.js'
import { Score } from './Score.js'
import { terrain } from './Shape.js'
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
      return (
        this.preamble0 + ' ' + terrain.current.sunkDescription(letter, ' was ')
      )
    }
    return terrain.current.sunkDescription(letter)
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
