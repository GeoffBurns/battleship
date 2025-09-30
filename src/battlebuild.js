import { customUI } from './customUI.js'
import {
  dragOverAddingHandlerSetup,
  onClickRotate,
  onClickFlip,
  onClickRotateLeft,
  tabCursor,
  enterCursor,
  setupDragHandlers,
  setupDragBrushHandlers,
  moveCursorBase
} from './placementUI.js'
import { placedShipsInstance } from './selection.js'
import { custom } from './custom.js'
import { gameMaps } from './maps.js'
import {
  setupBuildOptions,
  validateHeight,
  validateWidth,
  switchTo
} from './setup.js'

customUI.resetBoardSize()

placedShipsInstance.registerUndo(customUI.undoBtn)
function onClickAuto () {}
function onClickUndo () {
  custom.resetShipCells()
  customUI.clearVisuals()
  custom.score.reset()
  placedShipsInstance.popAndRefresh(
    custom.shipCellGrid,
    ship => {
      customUI.markPlaced(ship.cells, ship.letter)
    },
    ship => {
      customUI.subtraction(custom, ship)
    }
  )
}

function onClickAccept (editingMap) {
  const ships = custom.createCandidateShips()
  custom.candidateShips = ships
  if (editingMap) {
    custom.ships = custom.createShips()
  }
  custom.resetShipCells()
  customUI.buildBoard()
  customUI.addShipMode(ships)
  customUI.displayShipTrackingInfo(custom)

  customUI.makeAddDroppable(custom)
  setupDragHandlers(customUI)
  customUI.placelistenCancellables.push(
    dragOverAddingHandlerSetup(custom, customUI)
  )
}
function onClickDefault () {
  gameMaps.setToDefaultBlank(validateHeight(), validateWidth())
  customUI.refreshAllColor()

  customUI.score.refreshZoneInfo(custom)
}
function onClickClear () {
  if (customUI.placingShips) {
    customUI.shipTray.innerHTML = ''
    customUI.buildingTray.innerHTML = ''
    customUI.planeTray.innerHTML = ''
    newPlacement()
    return
  }

  gameMaps.clearBlank()
  customUI.refreshAllColor()
  customUI.score.refreshZoneInfo(custom)
}

function clearShips () {
  customUI.showNotice('ships removed')
  custom.ships = []

  customUI.score.addShipTally(custom.ships)
  customUI.displayAddInfo(custom)
  customUI.score.displayAddZoneInfo(custom)
}

function saveMap () {
  switchTo('index', 'build')
}

function wireupButtons () {
  customUI.newPlacementBtn.addEventListener('click', onClickClear)
  customUI.acceptBtn.addEventListener('click', onClickAccept)
  customUI.reuseBtn.addEventListener('click', onClickDefault)
  customUI.resetBtn.addEventListener('click', clearShips)
  customUI.publishBtn.addEventListener('click', saveMap)
  customUI.rotateBtn.addEventListener('click', onClickRotate)
  customUI.rotateLeftBtn.addEventListener('click', onClickRotateLeft)
  customUI.flipBtn.addEventListener('click', onClickFlip)
  customUI.undoBtn.addEventListener('click', onClickUndo)
  // customUI.autoBtn.addEventListener('click', onClickAuto)
}

function moveCursor (event) {
  moveCursorBase(event, customUI, custom)
}

function setupBuildShortcuts () {
  function handleBuildShortcuts (event) {
    switch (event.key) {
      case 'a':
      case 'A':
        onClickAccept()
        break
      case 'c':
      case 'C':
        onClickClear()
        break
      case 'd':
      case 'D':
        onClickDefault()
        break
      case 'r':
      case 'R':
        onClickRotate()
        break
      case 's':
      case 'S':
        clearShips()
        break
      case 'l':
      case 'L':
        onClickRotateLeft()
        break
      case 'f':
      case 'F':
        onClickFlip()
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
        tabCursor(event, customUI, custom.ships, custom.shipCellGrid)
        break
      case 'Enter':
        enterCursor(event, customUI, custom.ships, custom.shipCellGrid)
        break
    }
  }

  document.addEventListener('keydown', handleBuildShortcuts)

  return () => document.removeEventListener('keydown', handleBuildShortcuts)
}

function setReuseBtn () {
  customUI.reuseBtn.disabled = !gameMaps.hasMapSize(
    validateHeight(),
    validateWidth()
  )
}

function newPlacement () {
  customUI.resetAdd(custom)
  customUI.buildBoard((_r, _c) => {})
  customUI.makeBrushable(custom)
  customUI.buildBrushTray(gameMaps.terrain)
  customUI.brushMode()
  customUI.acceptBtn.disabled = false
  setReuseBtn()
  customUI.score.setupZoneInfo(custom, customUI)
  customUI.rotateBtn.disabled = true
  customUI.flipBtn.disabled = true
  customUI.rotateLeftBtn.disabled = true
  customUI.undoBtn.disabled = true
}
// wire buttons
wireupButtons()

setupBuildShortcuts()
const editing = setupBuildOptions(
  customUI.resetBoardSize.bind(customUI),
  newPlacement,
  'build',
  onClickAccept.bind(null, true)
)

if (!editing) {
  setupDragBrushHandlers(customUI)
  // initial
  newPlacement()
}
console.table({ ...localStorage })
//localStorage.clear()
