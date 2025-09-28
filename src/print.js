import { setupPrintOptions } from './setup.js'
import { friendUI } from './friendUI.js'
import { Friend } from './friend.js'
import { enemyUI } from './enemyUI.js'
import { enemy } from './enemy.js'
import { gameMaps } from './maps.js'

const friend = new Friend(friendUI)

function resetBoardSize () {
  friendUI.resetBoardSizePrint()
  enemyUI.resetBoardSizePrint()
}

function refresh () {
  friend.ships = friend.createShips()
  enemy.ships = enemy.createShips()
  friendUI.buildBoardPrint()
  enemyUI.buildBoardPrint()
  friendUI.score.buildTally(friend.ships, 0)
  enemyUI.score.buildTally(enemy.ships, 0)
  document.title = "Geoff's Battleship - " + gameMaps.current.title
}
const printMap = setupPrintOptions(resetBoardSize, refresh, 'print')

resetBoardSize()
refresh()
if (printMap) {
  window.print()
}

// initial
