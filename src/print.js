import { setupPrintOptions, setupTabs, fetchNavBar } from './navbar.js'
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
  friend.setMap()
  enemy.setMap()
  friendUI.buildBoardPrint()
  enemyUI.buildBoardPrint()
  friendUI.score.buildTally(friend.ships, friend.loadOut.weaponSystems)
  enemyUI.score.buildTally(enemy.ships, enemy.loadOut.weaponSystems)
  document.title = "Geoff's Battleship - " + gameMaps.current.title
  friendUI.hideEmptyUnits(friend.ships)

  const groups = friendUI.splitUnits(friend.ships)
  for (let type in groups) {
    const shipsInfo = groups[type]
    for (let letter in shipsInfo) {
      const shipInfo = shipsInfo[letter]
      if (shipInfo)
        friendUI.buildTrayItemPrint(shipInfo, friendUI.getTrayOfType(type))
    }
    const notes = [...Object.values(shipsInfo)].flatMap(info => {
      return info.shape.notes || []
    })
    const notesEl = friendUI.getNotesOfType(type)
    if (notesEl && notes.length > 0) {
      notesEl.classList.remove('hidden')
      notesEl.innerHTML = `<p><b>Notes : </b> ${notes.join('<br>')} </p>`
    }
  }
}

fetchNavBar('print', 'Battleship', function () {
  document.getElementById('second-tab-bar').classList.remove('hidden')
  const select = document.getElementById('choose-map-container')
  select.classList.remove('hidden')
  select.classList.add('right')

  const printMap = setupPrintOptions(resetBoardSize, refresh, 'print')

  resetBoardSize()
  refresh()

  if (printMap) {
    window.print()
  }
})
