import { gameMaps } from './map.js'
import { friendUI } from './friendUI.js'
import { player } from './player.js'
import { selection } from './utils.js'

export const friend = {
  __proto__: player,
  shipCellGrid: [],
  occupied: new Set(),
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

  onClickCell: function (r, c) {},

  onClickRotate: function () {
     if(selection && selection.canRotate())
     {
      selection.rotate()
     }
  },

  onClickRotateLeft: function () {
     if(selection && selection.canRotate())
     {
      selection.leftRotate()
     }
  },
  onClickFlip: function () {
     if(selection)
     {
      selection.flip()
     }
  },
  onClickTest: function () {
    
  },
  wireupButtons: function () {
    this.UI.rotateBtn.addEventListener('click', friend.onClickRotate)
    this.UI.flipBtn.addEventListener('click', friend.onClickFlip)
    this.UI.flipBtn.addEventListener('click', friend.onClickTest)
  },
  resetModel: function () {
    this.score.reset()
    this.ships = this.createShips()
  },
  buildBoard: function () {
    this.UI.buildBoard(friend.onClickCell)
    this.resetShipCells()
    this.UI.makeDroppable(this.shipCellGrid)
  //  this.UI.dragLeave(this.UI.board)
  },
  resetUI: function (ships) {
    ships = ships || this.ships
    this.UI.reset()
    // this.UI.clearVisuals()

    this.buildBoard()
    this.UI.buildTrays(ships, this.shipCellGrid)
    this.updateUI(ships)
  }
}
