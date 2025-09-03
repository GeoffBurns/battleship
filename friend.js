import { gameMaps } from './map.js'
import { friendUI } from './friendUI.js'
import { player } from './player.js'
import { clickedShip } from './utils.js'
import { gameStatus } from './playerUI.js'

export const friend = {
  __proto__: player,
  shipCellGrid: [],
  testContinue: true,
  UI: friendUI,
  resetShipCells: function () {
    this.shipCellGrid = Array.from({ length: gameMaps.current.rows }, () =>
      Array(gameMaps.current.cols).fill(null)
    )
  },
  updateUI: function (ships) {
    ships = ships || this.ships

    this.UI.placeTally(ships)
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

  randomHit: function (hits) {
    const len = hits.length
    if (len > 1) return null
    if (len === 1) return hits[0]
    const pick = Math.floor(Math.random() * len)
    return hits[pick]
  },
  chase: function (hits, seeking) {
    for (let i = 0; i < 30; i++) {
      const [r, c] = this.randomHit(hits)
      for (let j = 0; j < 15; j++) {
        if (!friend.testContinue) {
          clearInterval(seeking)
          return
        }
        const dir = gameMaps.isLand(r, c) ? 5 : 4
        const p = Math.floor(Math.random() * dir)
        switch (p) {
          case 0:
            return this.processShot(r, c + 1)
          case 1:
            return this.processShot(r, c - 1)
          case 2:
            return this.processShot(r + 1, c)
          case 3:
            return this.processShot(r - 1, c + 1)
          case 4: 
            switch (Math.floor(Math.random() * 4)) {
              case 0:
                return this.processShot(r + 1, c + 1)
              case 1:
                return this.processShot(r - 1, c - 1)
              case 2:
                return this.processShot(r + 1, c - 1)
              case 3:
                return this.processShot(r - 1, c + 1)
            }
        }
      }
    }
  },
  randomSeek: function (seeking) {
    const maxAttempts = 200
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (!friend.testContinue) {
        clearInterval(seeking)
        return
      }
      const r = Math.floor(Math.random() * gameMaps.current.rows)
      const c = Math.floor(Math.random() * gameMaps.current.cols)
      const key = this.score.createShotKey(r, c)
      if (key === null) { 
         continue
      }
      return this.processShot(r, c)
    }
  },  
  seek () {
    this.testContinue = true
    this.score.shot = new Set()
    let seeking = setInterval(function () {
      if (friend.testContinue) { 
        friend.seekStep(seeking)
      } else {
        clearInterval(seeking)
      }
    }, 350)
  },
  seekStep: function (seeking) {
    const hits = this.ships.filter(s => !s.sunk).flatMap(s => [...s.hits])

    if (hits.length > 0) {
      this.chase(hits, seeking)
    } else {
      this.randomSeek(seeking)
    }
  },

  //onClickCell: function (r, c) {},

  onClickRotate: function () {
    if (clickedShip && clickedShip.canRotate()) {
      clickedShip.rotate()
    }
  },
  onClickRotateLeft: function () {
    if (clickedShip && clickedShip.canRotate()) {
      clickedShip.leftRotate()
    }
  },
  onClickFlip: function () {
    if (clickedShip) {
      clickedShip.flip()
    }
  },
  onClickTest: function () { 
    friend.UI.testMode()
    friend.UI.testBtn.disabled = true
    friend.resetShipCells()
    friend.score.reset() 
    friend.seek()
  },
  onClickStop: function () {
    friend.testContinue = false
    friend.UI.readyMode()
    friend.UI.testBtn.disabled = false
  },
  wireupButtons: function () {
    this.UI.rotateBtn.addEventListener('click', friend.onClickRotate)
    this.UI.flipBtn.addEventListener('click', friend.onClickFlip)
    this.UI.testBtn.addEventListener('click', friend.onClickTest)
    this.UI.stopBtn.addEventListener('click', friend.onClickStop)
  },
  resetModel: function () {
    this.score.reset()
    this.ships = this.createShips()
  },
  buildBoard: function () {
    this.UI.buildBoard(friend.onClickCell)
    this.resetShipCells()
    this.UI.makeDroppable(this.shipCellGrid, this.ships)
    //  this.UI.dragLeave(this.UI.board)
  },
  resetUI: function (ships) {
    ships = ships || this.ships
    this.UI.reset(ships)
    // this.UI.clearVisuals()

    this.buildBoard()
    this.UI.buildTrays(ships, this.shipCellGrid)
    this.updateUI(ships)
  }
}
