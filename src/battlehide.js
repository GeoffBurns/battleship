import { setupGameOptions, fetchNavBar } from './navbar.js'
import { friendUI } from './friendUI.js'
import {
  dragOverPlacingHandlerSetup,
  onClickRotate,
  onClickFlip,
  onClickRotateLeft,
  tabCursor,
  enterCursor,
  moveCursorBase
} from './placementUI.js'
import { placedShipsInstance } from './selection.js'
import { Friend } from './friend.js'
import { enemy } from './enemy.js'
import { setupEnemy, newGame } from './enemySetup.js'
import { gameStatus } from './playerUI.js'
import { randomPlaceShape } from './utils.js'

const friend = new Friend(friendUI)
placedShipsInstance.registerUndo(friendUI.undoBtn)

friendUI.resetBoardSize()

function moveStatus (oldline, newLine, placement) {
  moveStatusChildren(newLine)

  const temp = newLine
  gameStatus.line2 = oldline
  gameStatus.line = temp
  oldline.classList.add('hidden')
  newLine.classList.remove('hidden')
  const wrap = document.getElementById('statusLine-wrap')
  if (placement) {
    wrap.classList.remove('hidden')
  } else {
    wrap.classList.add('hidden')
  }
}
function moveStatusChildren (newLine) {
  newLine.appendChild(gameStatus.game)
  newLine.appendChild(gameStatus.mode)
}
function onClickTest () {
  friend.test.bind(friend)()
}
let removeHideShorcuts = null
let removeSeekShorcuts = null
function onClickReturnToPlacement () {
  const enemyContainer = document.getElementById('enemy-container')
  enemyContainer.classList.add('hidden')
  moveStatus(gameStatus.line, gameStatus.line2, true)

  const tallyTitle = document.getElementById('tally-title')
  const tallyBox = document.getElementById('friend-tally-container')
  tallyBox.prepend(tallyTitle)
  if (removeSeekShorcuts) removeSeekShorcuts()

  removeHideShorcuts = setupHideShortcuts()
  enemy.opponent = null
  friend.opponent = null
  newPlacement()
}

function resetFriendBoard () {
  friend.restartBoard()
  friend.updateUI(friend.ships)
}
function onClickSeek () {
  friendUI.seekMode()
  const enemyContainer = document.getElementById('enemy-container')
  enemyContainer.classList.remove('hidden')

  moveStatus(gameStatus.line, gameStatus.line2, false)
  gameStatus.line.classList.add('small')

  const tallyTitle = document.getElementById('tally-title')
  const placeControls = document.getElementById('place-controls')
  placeControls.appendChild(tallyTitle)
  if (removeHideShorcuts) removeHideShorcuts()

  enemy.opponent = friend
  friend.opponent = enemy

  friend.restartBoard()
  friend.updateUI(friend.ships)

  removeSeekShorcuts = setupEnemy(onClickReturnToPlacement, resetFriendBoard)
  enemy.UI.resetBoardSize()
  friend.setupUntried()
  newGame()
}
function onClickAuto () {
  const ships = friend.ships
  for (let attempt = 0; attempt < 100; attempt++) {
    let ok = true
    for (const ship of ships) {
      const placed = randomPlaceShape(ship, friend.shipCellGrid)
      if (!placed) {
        friend.resetShipCells()
        friendUI.clearVisuals()
        friendUI.placeTally(ships)
        friendUI.displayShipInfo(ships)
        ok = false
        break
      }
      friendUI.placement(placed, ships, ship)
    }
    if (ok) return true
  }
}
function onClickUndo () {
  friend.resetShipCells()
  friendUI.clearVisuals()
  friend.score.reset()
  const ship = placedShipsInstance.popAndRefresh(
    friend.shipCellGrid,
    ship => {
      friendUI.markPlaced(ship.cells, ship.letter)
    },
    ship => {
      friendUI.addShipToTrays(friend.ships, ship)
    }
  )
  friendUI.unplacement(friend.ships, ship)
}

function onClickStop () {
  friend.testContinue = false
  friendUI.readyMode()
  friendUI.testBtn.disabled = false
}

function wireupButtons () {
  friendUI.newPlacementBtn.addEventListener('click', newPlacement)
  friendUI.rotateBtn.addEventListener('click', onClickRotate)
  friendUI.rotateLeftBtn.addEventListener('click', onClickRotateLeft)
  friendUI.flipBtn.addEventListener('click', onClickFlip)
  friendUI.undoBtn.addEventListener('click', onClickUndo)
  friendUI.autoBtn.addEventListener('click', onClickAuto)
  friendUI.testBtn.addEventListener('click', onClickTest)
  friendUI.seekBtn.addEventListener('click', onClickSeek)
  friendUI.stopBtn.addEventListener('click', onClickStop)
}

function moveCursor (event) {
  moveCursorBase(event, friendUI, friend)
}

function setupHideShortcuts () {
  function handleHideShortcuts (event) {
    switch (event.key) {
      case 'c':
      case 'C':
        newPlacement()
        break
      case 'r':
      case 'R':
        onClickRotate()
        break
      case 'l':
      case 'L':
        onClickRotateLeft()
        break
      case 'f':
      case 'F':
        onClickFlip()
        break
      case 't':
      case 'T':
        onClickTest()
        break
      case 's':
      case 'S':
        onClickStop()
        break
      case 'u':
      case 'U':
        onClickUndo()
        break
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        moveCursor(event)
        break
      case 'Tab':
        tabCursor(event, friendUI, friend.ships, friend.shipCellGrid)
        break
      case 'Enter':
        enterCursor(event, friendUI, friend.ships, friend.shipCellGrid)
        break
    }
  }

  document.addEventListener('keydown', handleHideShortcuts)

  return () => document.removeEventListener('keydown', handleHideShortcuts)
}

function newPlacement () {
  friend.testContinue = false
  friendUI.testBtn.disabled = false
  friendUI.seekBtn.disabled = false

  friendUI.clearVisuals()
  friendUI.placeMode()
  friend.resetModel()
  friend.resetUI(friend.ships)

  friendUI.rotateBtn.disabled = true
  friendUI.flipBtn.disabled = true
  friendUI.rotateLeftBtn.disabled = true
  friendUI.undoBtn.disabled = true
}
// wire buttons
wireupButtons()

dragOverPlacingHandlerSetup(friend, friendUI)
removeHideShorcuts = setupHideShortcuts()

fetchNavBar('hide', "Geoff's Battleship (Hide & Seek)", function () {
  document.getElementById('choose-map-container').classList.remove('hidden')

  const placedShips = setupGameOptions(
    friendUI.resetBoardSize.bind(friendUI),
    newPlacement
  )
  // initial
  newPlacement()

  if (placedShips) {
    friend.load()
    friend.updateUI(friend.ships)
    friendUI.readyMode()
  }
})
