import { gameMaps } from './map.js'
import { friendUI } from './friendUI.js'
import { player } from './player.js'

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

  resetModel: function () {
    this.score.reset()
    this.ships = this.createShips()
  },
  buildBoard: function () {
    this.UI.buildBoard(friend.onClickCell)
  },
  resetUI: function (ships) {
    ships = ships || this.ships
    this.UI.reset()
    // this.UI.clearVisuals()

    this.buildBoard()
    this.UI.buildTrays(ships)
    this.updateUI(ships)
  }
}
