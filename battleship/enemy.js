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
