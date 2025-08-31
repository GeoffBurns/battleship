import { randomPlaceShape, sunkDescription, inBounds, isLand } from './utils.js'
import { gameMaps } from './map.js'
import { friendUI } from './friendUI.js'
import { player } from './player.js'

export const friend = {
  __proto__: player,
  grid: [],
  occupied: new Set(),
  UI: friendUI,

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
    this.UI.reset()
    // this.UI.clearVisuals()
    this.buildBoard()
    this.updateUI(ships)
  }
}
