import { randomPlaceShape } from './utils.js'
import { gameMaps } from './map.js'
import { enemyUI } from './enemyUI.js'
import { player } from './player.js'
import { gameStatus } from './playerUI.js'

export const enemy = {
  __proto__: player,
  shipCellGrid: [],
  carpetBombsUsed: 0,
  carpetMode: false,
  isRevealed: false,
  boardDestroyed: false,
  UI: enemyUI,
  resetShipCells: function () {
    this.shipCellGrid = Array.from({ length: gameMaps.current.rows }, () =>
      Array(gameMaps.current.cols).fill(null)
    )
  },
  placeAll: function (ships) {
    ships = ships || this.ships

    // attempt whole-board placement; retry if any shape fails
    for (let attempt = 0; attempt < 100; attempt++) {
      this.resetShipCells()

      let ok = true

      for (const ship of ships) {
        const placed = randomPlaceShape(ship, this.shipCellGrid)
        if (placed) {
          ship.place(placed)
        } else {
          ok = false
          break
        }
      }

      if (ok) return true
    }
    throw new Error('Failed to place all ships after many attempts')
  },
  revealAll: function () {
    this.UI.revealAll(this.ships)

    this.boardDestroyed = true
    this.isRevealed = true
  },
  updateUI: function (ships) {
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
    this.UI.score.buildTally(this.ships, this.carpetBombsUsed)
  },
  onClickCell: function (r, c) {
    if (enemy.boardDestroyed || enemy.isRevealed) return // no action if game over

    if (!enemy.score.newShotKey(r, c) && !enemy.carpetMode) {
      gameStatus.info('Already Shot Here - Try Again')
      return
    }

    if (enemy.carpetMode) {
      // Mega Bomb mode: affect 3x3 area centered on (r,c)
      if (enemy.carpetBombsUsed >= gameMaps.maxBombs) {
        gameStatus.info('No Mega Bombs Left')
        return
      }
      enemy.processCarpetBomb(r, c)
      return
    }
    enemy.processShot(r, c)
  },

  recordAutoMiss: function (r, c) {
    const key = this.score.addAutoMiss(r, c)
    if (!key) return // already shot here
    this.UI.cellMiss(r, c)
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
  processCarpetBomb: function (r, c) {
    let hits = 0
    let sunks = ''
    this.carpetBombsUsed++
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr
        const nc = c + dc
        if (gameMaps.inBounds(nr, nc)) {
          const result = this.processShot(nr, nc)
          if (result && result.hit) hits++
          if (result && result.sunkLetter) sunks += result.sunkLetter
        }
      }
    }

    // update status
    if (this.boardDestroyed) {
      // already handled  in updateUI
    } else if (hits === 0) {
      gameStatus.info('The Mega Bomb missed everything!')
    } else if (sunks.length === 0) {
      gameStatus.info(hits.toString() + ' Hits')
    } else if (sunks.length === 1) {
      gameStatus.info(
        hits.toString() + ' Hits and ' + gameMaps.sunkDescription(sunks)
      )
    } else {
      let message = hits.toString() + ' Hits,'
      for (let sunk of sunks) {
        message += ' and ' + gameMaps.sunkDescription(sunk)
      }
      message += ' Destroyed'
      gameStatus.info(message)
    }
    gameStatus.displayBombStatus(this.carpetBombsUsed)
    if (this.carpetBombsUsed >= gameMaps.maxBombs) {
      this.carpetMode = false
      gameStatus.display('Single Shot Mode')
    }
  },
  onClickCarpetMode: function () {
    if (!enemy.isRevealed && enemy.carpetBombsUsed < gameMaps.maxBombs) {
      enemy.carpetMode = !enemy.carpetMode
      enemy.updateUI(enemy.ships)
    }
  },
  onClickReveal: function () {
    if (!enemy.isRevealed) {
      enemy.revealAll()
      enemy.updateUI(enemy.ships)
    }
  },
  wireupButtons: function () {
    this.UI.carpetBtn.addEventListener('click', enemy.onClickCarpetMode)
    this.UI.revealBtn.addEventListener('click', enemy.onClickReveal)
  },
  resetModel: function () {
    this.carpetMode = false
    this.carpetBombsUsed = 0
    this.boardDestroyed = false
    this.isRevealed = false
    this.score.reset()
    this.ships = this.createShips()
  },
  buildBoard: function () {
    this.UI.buildBoard(enemy.onClickCell)

    // update destroyed state class
    this.UI.board.classList.toggle('destroyed', this.boardDestroyed)
  },
  resetUI: function (ships) {
    this.UI.reset()
    // this.UI.clearVisuals()
    this.buildBoard()
    this.placeAll(ships)
    this.updateUI(ships)
  }
}
