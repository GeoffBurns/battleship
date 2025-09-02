import { gameMaps } from './map.js'
import { friendUI } from './friendUI.js'
import { player } from './player.js'
import { clickedShip, selection } from './utils.js'

export const friend = {
  __proto__: player,
  shipCellGrid: [],
  seekCellGrid: [],
  occupied: new Set(),
  UI: friendUI,
  resetShipCells: function () {
    this.shipCellGrid = Array.from({ length: gameMaps.current.rows }, () =>
      Array(gameMaps.current.cols).fill(null)
    )
  },
  resetSeekCells: function () {
    this.seekCellGrid = Array.from({ length: gameMaps.current.rows }, () =>
      Array(gameMaps.current.cols).fill(null)
    )
  },
  updateUI: function (ships) {
    ships = ships || this.ships

    this.UI.placeTally(ships)
  },
  chase: function (hits) {},
  randomSeek: function () {
    const maxAttempts = 200
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const r = Math.floor(Math.random() * gameMaps.current.rows)
      const c = Math.floor(Math.random() * gameMaps.current.cols)
      const key = this.score.createShotKey(r, c)
      if (key === null) {
        // if we are here, it is because of carpet bomb, so we can just
        continue
      }
      return this.fireShot()
    }
  },
  fireShot () {},
  seekStep: function () {
    const hits = this.ships.filter(s => !s.sunk).flatMap(s => [...s.hits])

    if (hits.length > 0) {
      this.chase(hits)
    } else {
      this.randomSeek()
    }
  },

  onClickCell: function (r, c) {},

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
  onClickTest: function () {},
  wireupButtons: function () {
    this.UI.rotateBtn.addEventListener('click', friend.onClickRotate)
    this.UI.flipBtn.addEventListener('click', friend.onClickFlip)
    this.UI.testBtn.addEventListener('click', friend.onClickTest)
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
