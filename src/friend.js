import { gameMaps } from './maps.js'
import { Player } from './player.js'

export class Friend extends Player {
  constructor (friendUI) {
    super(friendUI)
    this.testContinue = true
  }

  updateUI (ships) {
    this.updateTally(ships, this.carpetBombsUsed, this.score.noOfShots())
  }

  randomHit (hits) {
    const len = hits.length
    if (len < 1) return null
    if (len === 1) return hits[0]
    const pick = Math.floor(Math.random() * len)
    return hits[pick]
  }
  chase (hits, seeking) {
    for (let i = 0; i < 30; i++) {
      const [r, c] = this.randomHit(hits)
      for (let j = 0; j < 15; j++) {
        if (seeking && (!this.testContinue || this.boardDestroyed)) {
          clearInterval(seeking)
          return
        }
        if (this.walkShot(r, c)) return
      }
    }
  }
  seekHit (r, c, bomb) {
    if (!gameMaps.inBounds(r, c)) return false

    this.flame(r, c, bomb)
    const key = this.score.createShotKey(r, c)
    if (key === null) {
      // if we are here, it is because of carpet bomb, so we can just
      return false
    }

    this.fireShot(r, c, key)

    this.updateUI(this.ships)
    return true
  }
  walkShot (r, c) {
    const dir = gameMaps.isLand(r, c) ? 5 : 4
    const p = Math.floor(Math.random() * dir)
    switch (p) {
      case 0:
        return this.seekHit(r, c + 1, false)
      case 1:
        return this.seekHit(r, c - 1, false)
      case 2:
        return this.seekHit(r + 1, c, false)
      case 3:
        return this.seekHit(r - 1, c, false)
      case 4:
        switch (Math.floor(Math.random() * 4)) {
          case 0:
            return this.seekHit(r + 1, c + 1, false)
          case 1:
            return this.seekHit(r - 1, c - 1, false)
          case 2:
            return this.seekHit(r + 1, c - 1, false)
          case 3:
            return this.seekHit(r - 1, c + 1, false)
        }
    }
  }
  bombImpact (r, c) {
    let i = 0
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr
        const nc = c + dc
        if (
          gameMaps.inBounds(nr, nc) &&
          this.score.newShotKey(nr, nc) !== null
        ) {
          i++
        }
      }
    }
    return i
  }
  seekBomb (r, c) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr
        const nc = c + dc
        if (gameMaps.inBounds(nr, nc)) {
          this.seekHit(nr, nc, true)
        }
      }
    }
    return true
  }

  randomBomb (seeking) {
    for (let impact = 9; impact > 1; impact--)
      for (let attempt = 0; attempt < 12; attempt++) {
        if (seeking && (!this.testContinue || this.boardDestroyed)) {
          clearInterval(seeking)
          return
        }
        const r = Math.floor(Math.random() * (gameMaps.current.rows - 2)) + 1
        const c = Math.floor(Math.random() * (gameMaps.current.cols - 2)) + 1

        if (this.bombImpact(r, c) >= impact && this.seekBomb(r, c)) {
          this.flash()
          this.carpetBombsUsed++
          return
        }
      }
  }
  randomSeek (seeking) {
    const maxAttempts = 130
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (seeking && (!this.testContinue || this.boardDestroyed)) {
        clearInterval(seeking)
        return
      }
      const r = Math.floor(Math.random() * gameMaps.current.rows)
      const c = Math.floor(Math.random() * gameMaps.current.cols)

      if (this.seekHit(r, c, false)) {
        return
      }
    }
  }
  restartBoard () {
    this.boardDestroyed = false
    this.UI.board.classList.remove('destroyed')
    this.carpetBombsUsed = 0
    this.score.reset()
    ///this.UI.clearClasses()
    this.UI.clearVisuals()
    for (const ship of this.ships) {
      ship.sunk = false
      ship.hits = new Set()
      this.UI.revealShip(ship)
    }
  }
  test () {
    this.UI.testMode()
    this.UI.testBtn.disabled = true
    this.UI.seekBtn.disabled = true
    this.UI.stopBtn.disabled = false

    this.restartBoard()

    this.seek()
  }
  seek () {
    this.testContinue = true
    this.boardDestroyed = false
    this.carpetBombsUsed = 0
    this.score.shot = new Set()
    let seeking = setInterval(() => {
      if (seeking && (!this.testContinue || this.boardDestroyed)) {
        clearInterval(seeking)

        this.UI.testBtn.disabled = false
        this.UI.seekBtn.disabled = false
        this.UI.stopBtn.classList.add('hidden')
        seeking = null
      } else {
        this.seekStep(seeking)
      }
    }, 270)
  }
  seekStep (seeking) {
    const hitss = this.ships.filter(s => !s.sunk).flatMap(s => [...s.hits])
    const hits = hitss.map(h => {
      const [r, c] = h.split(',').map(n => parseInt(n))
      return [r, c]
    })

    if (hits.length > 0) {
      this.chase(hits, seeking)
    } else if (this.carpetBombsUsed < gameMaps.maxBombs) {
      this.randomBomb(seeking)
    } else {
      this.randomSeek(seeking)
    }
  }

  resetModel () {
    this.score.reset()
    this.ships = this.createShips()
  }
  buildBoard () {
    this.UI.buildBoard()
    this.resetShipCells()
    this.UI.makeDroppable(this.shipCellGrid, this.ships)
    //  this.UI.dragLeave(this.UI.board)
  }

  resetUI (ships) {
    ships = ships || this.ships
    this.UI.reset(ships)
    // this.UI.clearVisuals()

    this.buildBoard()
    this.UI.buildTrays(ships, this.shipCellGrid)
    this.updateUI(ships)
  }
}
