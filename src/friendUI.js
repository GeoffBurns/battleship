import { gameMaps } from './maps.js'
import { gameStatus, PlayerUI } from './playerUI.js'
import { ScoreUI } from './ScoreUI.js'
import { ClickedShip, DraggedShip } from './selection.js'
import { cursor } from './cursor.js'

let lastEntered = [-1, -1]
let clickedShip = null

export function onClickRotate () {
  if (clickedShip?.canRotate()) {
    clickedShip.rotate()
  }
}
export function onClickRotateLeft () {
  if (clickedShip?.canRotate()) {
    clickedShip.leftRotate()
  }
}
export function onClickFlip () {
  if (clickedShip) {
    clickedShip.flip()
  }
}

let selection = null
export function enterCursor (event, ships, shipCellGrid) {
  if (!friendUI.placingShips) return
  if (cursor.isDragging) return
  if (!cursor.isGrid) return
  event.preventDefault()
  const cell = friendUI.gridCellAt(cursor.x, cursor.y)
  friendUI.handleDropEvent(cell, shipCellGrid, ships)
  selection = null
  createSelection(ships, shipCellGrid, null)
}
export function createSelection (ships, shipCellGrid, shipId) {
  const shipElement =
    shipId === null ? friendUI.getFirstTrayItem() : friendUI.getTrayItem(shipId)

  if (shipElement === null) return
  const id = shipId === null ? parseInt(shipElement.dataset.id) : shipId
  const ship = ships.find(s => s.id === id)
  const variantIndex = parseInt(shipElement.dataset.variant)

  selection = new DraggedShip(
    ship,
    0,
    0,
    friendUI.cellSize(),
    shipElement,
    variantIndex,
    friendUI.setDragShipContents.bind(friendUI)
  )
  selection.shown = false
  cursor.y = 0
  cursor.x = 0
  friendUI.highlight(shipCellGrid, 0, 0)
}
export function tabCursor (event, ships, shipCellGrid) {
  if (!friendUI.placingShips) return
  if (cursor.isDragging) return

  event.preventDefault()

  cursor.isGrid = !cursor.isGrid

  if (cursor.isGrid) {
    friendUI.disableRotateFlip()
    const shipId = clickedShip?.ship.id
    friendUI.removeClicked()
    clickedShip = null
    createSelection(ships, shipCellGrid, shipId)
  } else {
    removeSelection()

    friendUI.removeHighlight()
    friendUI.assignByCursor('ArrowRight', ships)
  }
}
export function removeSelection () {
  if (!selection) return
  selection.remove()
  selection = null
}

export class FriendUI extends PlayerUI {
  constructor () {
    super()
    this.placingShips = true
    this.board = document.getElementById('friend-board')
    this.score = new ScoreUI('friend')
    this.newPlacementBtn = document.getElementById('newPlacement')
    this.rotateBtn = document.getElementById('rotateBtn')
    this.rotateLeftBtn = document.getElementById('rotateLeftBtn')
    this.flipBtn = document.getElementById('flipBtn')
    this.testBtn = document.getElementById('testBtn')
    this.seekBtn = document.getElementById('seekBtn')
    this.stopBtn = document.getElementById('stopBtn')
    this.undoBtn = document.getElementById('undoBtn')
    this.autoBtn = document.getElementById('autoBtn')
    this.trays = document.getElementById('tray-container')
    this.shipTray = document.getElementById('shipTray')
    this.planeTray = document.getElementById('planeTray')
    this.buildingTray = document.getElementById('buildingTray')
  }

  displayFleetSunk () {
    gameStatus.display('Your Fleet is Destroyed', '')
    this.board.classList.add('destroyed')
  }

  markPlaced (cells, letter) {
    this.displaySurround(
      cells,
      letter,
      (r, c) => this.cellMiss(r, c),
      (r, c, letter) => this.cellPlacedAt(r, c, letter)
    )
  }

  makeDroppable (shipCellGrid, ships) {
    for (const cell of this.board.children) {
      cell.textContent = ''
      cell.classList.remove('hit', 'miss', 'placed')
      this.drop(cell, shipCellGrid, ships)
      this.dragEnter(cell, shipCellGrid)
    }
  }
  handleDropEvent (cell, shipCellGrid, ships, e) {
    if (e) e.preventDefault()
    this.removeHighlight()
    cursor.isDragging = false
    if (!selection) return

    const r = parseInt(cell.dataset.r)
    const c = parseInt(cell.dataset.c)

    const placed = selection.place(r, c, shipCellGrid)
    if (placed) {
      this.markPlaced(placed, selection.letter)
      this.placeTally(ships)
      if (selection) {
        const container = selection.source.parentElement
        selection.source.remove()
        if (
          container.classList.contains('drag-ship-container') &&
          container.children.length === 0
        )
          container.remove()
      }
      this.displayShipInfo(ships)
      clickedShip = null
    }

    removeSelection()
  }

  drop (cell, shipCellGrid, ships) {
    cell.addEventListener(
      'drop',
      this.handleDropEvent.bind(this, cell, shipCellGrid, ships)
    )
  }

  cellHit (r, c) {
    const cell = this.gridCellAt(r, c)
    cell.classList.add('frd-hit')
    cell.textContent = ''
    gameStatus.info('You where hit!')
  }

  removeHighlight () {
    for (const el of this.board.children) {
      el.classList.remove('good', 'bad')
    }
  }

  highlight (shipCellGrid, r, c) {
    if (!selection) return
    if (r === null) r = lastEntered[0]
    if (c === null) c = lastEntered[1]

    const [r0, c0] = selection.offsetCell(r, c)
    if (!gameMaps.inBounds(r0, c0)) return

    this.removeHighlight()
    const canPlace = selection.canPlace(r0, c0, shipCellGrid)
    const variant = selection.variant()
    for (const [dr, dc] of variant) {
      const rr = dr + r0
      const cc = dc + c0

      if (gameMaps.inBounds(rr, cc)) {
        const cell = this.gridCellAt(rr, cc)
        cell.classList.add(canPlace ? 'good' : 'bad')
      }
    }
  }
  dragEnter (cell, shipCellGrid) {
    cell.addEventListener('dragenter', e => {
      e.preventDefault()

      const el = e.target
      const r = parseInt(el.dataset.r)
      const c = parseInt(el.dataset.c)
      if (lastEntered[0] === r && lastEntered[1] === c) return

      lastEntered = [r, c]
      this.highlight(shipCellGrid, r, c)
    })
  }
  removeClicked () {
    const elements = document.getElementsByClassName('clicked')
    ;[...elements].forEach(element => {
      // Perform actions on each element
      element.classList.remove('clicked')
    })

    this.rotateBtn.disabled = true
    this.flipBtn.disabled = true
  }
  lastItem (tray) {
    const items = tray.children
    const l = items.length
    if (l === 0) return null
    else return items[l - 1]
  }
  clickAssignByCursor (arrowkey) {
    let shipnode = null
    switch (arrowkey) {
      case 'ArrowDown':
      case 'ArrowRight':
        shipnode =
          this.shipTray.children[0] ||
          this.planeTray.children[0] ||
          this.buildingTray.children[0]

        break
      case 'ArrowUp':
        shipnode =
          this.buildingTray.children[0] ||
          this.planeTray.children[0] ||
          this.shipTray.children[0]
        break
      case 'ArrowLeft':
        shipnode =
          this.lastItem(this.buildingTray) ||
          this.lastItem(this.planeTray) ||
          this.lastItem(this.shipTray)
        break
    }
    return shipnode
  }
  moveToNextTrayItemToTheRight (trays, itemIndex, trayIndex) {
    let indexT = trayIndex
    let indexI = itemIndex
    const traysSize = trays.length
    do {
      const tray = trays[indexT]
      const l = tray.children.length
      indexI++
      if (indexI >= l) {
        indexT++
        indexI = -1
        if (indexT === trayIndex) return trays[trayIndex].children[itemIndex]
        if (indexT >= traysSize) {
          indexT = 0
        }
      } else {
        return tray.children[indexI]
      }
      // eslint-disable-next-line no-constant-condition
    } while (true)
  }
  moveToNextTrayItemDown (trays, itemIndex, trayIndex) {
    let indexT = trayIndex
    const traysSize = trays.length
    do {
      indexT++
      if (indexT === trayIndex && 0 === itemIndex)
        return trays[trayIndex].children[itemIndex]
      if (indexT >= traysSize) {
        indexT = 0
      }

      const tray = trays[indexT]
      const l = tray.children.length
      if (l > 0) return tray.children[0]
      // eslint-disable-next-line no-constant-condition
    } while (true)
  }
  moveToNextTrayItemUp (trays, itemIndex, trayIndex) {
    let indexT = trayIndex
    const traysSize = trays.length
    do {
      indexT--
      if (indexT === trayIndex && 0 === itemIndex)
        return trays[trayIndex].children[itemIndex]
      if (indexT < 0) {
        indexT = traysSize - 1
      }

      const tray = trays[indexT]
      const l = tray.children.length
      if (l > 0) return tray.children[0]
      // eslint-disable-next-line no-constant-condition
    } while (true)
  }
  moveToNextTrayItemToTheLeft (trays, itemIndex, trayIndex) {
    let indexT = trayIndex
    let indexI = itemIndex
    const traysSize = trays.length
    do {
      if (indexI > 0) {
        return trays[indexT].children[indexI - 1]
      } else {
        indexT--
        if (indexT < 0) {
          indexT = traysSize - 1
        }
        const tray = trays[indexT]
        const l = tray.children.length
        indexI = l
        if (indexT === trayIndex) return trays[trayIndex].children[itemIndex]
      }
      // eslint-disable-next-line no-constant-condition
    } while (true)
  }
  moveNextTrayItem (arrowKey, trays, itemIndex, trayIndex) {
    switch (arrowKey) {
      case 'ArrowRight':
        return this.moveToNextTrayItemToTheRight(trays, itemIndex, trayIndex)
      case 'ArrowDown':
        return this.moveToNextTrayItemDown(trays, itemIndex, trayIndex)
      case 'ArrowUp':
        return this.moveToNextTrayItemUp(trays, itemIndex, trayIndex)
      case 'ArrowLeft':
        return this.moveToNextTrayItemToTheLeft(trays, itemIndex, trayIndex)
      default:
        return null
    }
  }
  getTrayItem (shipId) {
    let trays = [this.shipTray, this.planeTray, this.buildingTray]

    for (const tray of trays) {
      for (const child of tray.children) {
        const id = parseInt(child.dataset.id)
        if (id === shipId) {
          return child
        }
      }
    }
    return null
  }
  getFirstTrayItem () {
    return (
      friendUI.shipTray.children[0] ||
      friendUI.planeTray.children[0] ||
      friendUI.buildingTray.children[0]
    )
  }

  moveAssignByCursor (arrowKey, clickedShip) {
    let shipnode = clickedShip.source

    const shipId = parseInt(shipnode.dataset.id)
    if (shipId === null || shipnode === null) return null

    let itemIndex = 0
    let trayIndex = 0
    let trays = [this.shipTray, this.planeTray, this.buildingTray]

    for (const tray of trays) {
      for (const child of tray.children) {
        const id = parseInt(child.dataset.id)
        if (id === shipId) {
          return this.moveNextTrayItem(arrowKey, trays, itemIndex, trayIndex)
        }
        itemIndex++
      }

      trayIndex++
      itemIndex = 0
    }
    return null
  }

  assignByCursor (arrowkey, ships) {
    let shipElement = null
    if (clickedShip)
      shipElement = this.moveAssignByCursor(arrowkey, clickedShip)
    else shipElement = this.clickAssignByCursor(arrowkey)

    if (shipElement === null) return

    const shipId = parseInt(shipElement.dataset.id)
    const ship = ships.find(s => s.id === shipId)
    if (ship && shipElement) this.assignClicked(ship, shipElement)
  }
  disableRotateFlip () {
    this.rotateBtn.disabled = true
    this.rotateLeftBtn.disabled = true
    this.flipBtn.disabled = true
  }
  assignClicked (ship, clicked) {
    const variantIndex = parseInt(clicked.dataset.variant)
    this.removeClicked()
    clickedShip = new ClickedShip(
      ship,
      clicked,
      variantIndex,
      this.setDragShipContents.bind(this)
    )
    clicked.classList.add('clicked')
    this.rotateBtn.disabled = !clickedShip.canRotate()
    this.flipBtn.disabled = !clickedShip.canFlip()
    this.rotateLeftBtn.disabled = !clickedShip.canRotate()
  }
  dragEnd (div, callback) {
    div.addEventListener('dragend', e => {
      const shipElement = e.target
      shipElement.style.opacity = ''
      for (const el of this.board.children) {
        el.classList.remove('good', 'bad')
      }
      cursor.isDragging = false
      if (e.dataTransfer.dropEffect !== 'none') {
        // The item was successfully dropped on a valid drop target
        this.disableRotateFlip()
      } else {
        // The drag operation was canceled or dropped on an invalid target
        this.assignClicked(selection.ship, shipElement)
      }

      removeSelection()
      friendUI.removeHighlight()
      if (callback) callback()
    })
  }
  dragLeave (div) {
    div.addEventListener('dragleave', e => {
      e.preventDefault()
      for (const el of this.board.children) {
        el.classList.remove('good', 'bad')
      }
    })
  }
  makeDraggable (dragShip, ship) {
    dragShip.setAttribute('draggable', 'true')
    this.dragStart(dragShip, ship)
    this.onClickTrayItem(dragShip, ship)
  }
  onClickTrayItem (dragShip, ship) {
    dragShip.addEventListener('click', e => {
      const shipElement = e.currentTarget
      this.assignClicked(ship, shipElement)
    })
  }
  dragStart (dragShip, ship) {
    dragShip.addEventListener('dragstart', e => {
      if (e.target !== e.currentTarget) {
        return
      }
      const shipElement = e.currentTarget
      const rect = shipElement.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top

      this.removeClicked()

      e.dataTransfer.effectAllowed = 'all'

      e.dataTransfer.setDragImage(new Image(), 0, 0)
      const variantIndex = parseInt(shipElement.dataset.variant)
      cursor.isDragging = true
      selection = new DraggedShip(
        ship,
        offsetX,
        offsetY,
        this.cellSize(),
        shipElement,
        variantIndex,
        this.setDragShipContents.bind(this)
      )
      selection.moveTo(e.clientX, e.clientY)
      shipElement.style.opacity = '0.6'
    })
  }
  setDragShipContents (dragShip, cells, letter) {
    const maxR = Math.max(...cells.map(s => s[0])) + 1
    const maxC = Math.max(...cells.map(s => s[1])) + 1

    dragShip.setAttribute(
      'style',
      `display:grid;place-items: center;--boxSize:${
        this.cellSize().toString() + 'px'
      };grid-template-rows:repeat(${maxR}, var(--boxSize));grid-template-columns:repeat(${maxC}, var(--boxSize));gap:0px;`
    )
    for (let r = 0; r < maxR; r++) {
      for (let c = 0; c < maxC; c++) {
        this.createCell(dragShip, cells, letter, r, c)
      }
    }
  }
  createCell (dragShip, cells, letter, r, c) {
    const cell = document.createElement('div')
    cell.className = 'cell'
    if (cells.some(shipcell => shipcell[0] === r && shipcell[1] === c)) {
      cell.style.background =
        gameMaps.shipColors[letter] || 'rgba(255, 209, 102, 0.3)'
      cell.style.color = gameMaps.shipLetterColors[letter] || '#ffd166'
      cell.textContent = letter
    } else {
      cell.classList.add('empty')
    }
    cell.dataset.r = r
    cell.dataset.c = c
    dragShip.appendChild(cell)
  }
  displayAsPlaced (cell, letter) {
    cell.textContent = letter
    cell.style.color = gameMaps.shipLetterColors[letter] || '#fff'
    cell.style.background =
      gameMaps.shipColors[letter] || 'rgba(255,255,255,0.2)'

    cell.classList.add('placed')
    cell.classList.remove('miss')
  }
  cellPlacedAt (r, c, letter) {
    const cell = this.gridCellAt(r, c)
    this.displayAsPlaced(cell, letter)
  }
  buildTrayItem (ship, tray) {
    const shape = ship.shape()

    const dragShipContainer = document.createElement('div')

    dragShipContainer.className = 'drag-ship-container'
    dragShipContainer.dataset.id = ship.id
    dragShipContainer.setAttribute(
      'style',
      'display: flex;justify-content: center;align-items: center;'
    )
    const dragShip = document.createElement('div')
    dragShip.className = 'drag-ship'
    dragShip.dataset.variant = 0
    dragShip.dataset.id = ship.id
    this.setDragShipContents(dragShip, shape.cells, shape.letter)
    this.makeDraggable(dragShip, ship)
    dragShipContainer.appendChild(dragShip)
    tray.appendChild(dragShipContainer)
  }
  buildTrays (ships) {
    for (const ship of ships) {
      this.addShipToTrays(ship)
    }
  }
  addShipToTrays (ship) {
    const type = ship.type()
    switch (type) {
      case 'A':
        this.buildTrayItem(ship, this.planeTray)
        break
      case 'S':
        this.buildTrayItem(ship, this.shipTray)
        break
      case 'G':
        this.buildTrayItem(ship, this.buildingTray)
        break
      default:
        throw new Error('Unknown type for ' + JSON.stringify(ship, null, 2))
    }
  }

  placeShipBox (ship) {
    const box = document.createElement('div')
    box.className = 'tally-box'
    const letter = ship.letter
    if (ship.cells.length === 0) {
      box.textContent = ''
    } else {
      box.textContent = letter
    }
    box.style.background = gameMaps.shipColors[letter] || '#333'
    box.style.color = gameMaps.shipLetterColors[letter] || '#fff'
    return box
  }
  placeTally (ships) {
    this.score.buildShipTally(ships, this.placeShipBox)
    // no bombs row
  }
  clearVisuals () {
    for (const el of this.board.children) {
      el.textContent = ''
      el.style.background = ''
      el.style.color = ''
      el.classList.remove('hit', 'miss', 'frd-hit', 'frd-sunk', 'placed')
    }
  }
  placeMode () {
    this.placingShips = true
    const flexStyle =
      'display: flex; flex-flow: row wrap;gap: 8px; margin-bottom: 8px'

    this.newPlacementBtn.classList.remove('hidden')
    this.testBtn.classList.add('hidden')
    this.seekBtn.classList.add('hidden')
    this.score.shotsLabel.classList.add('hidden')
    this.score.hitsLabel.classList.add('hidden')
    this.score.sunkLabel.classList.add('hidden')
    this.score.placedLabel.classList.remove('hidden')
    this.rotateBtn.classList.remove('hidden')
    this.rotateLeftBtn.classList.remove('hidden')
    this.flipBtn.classList.remove('hidden')
    this.undoBtn.classList.remove('hidden')
    this.autoBtn.classList.remove('hidden')
    this.stopBtn.classList.add('hidden')
    this.trays.classList.remove('hidden')
    this.shipTray.setAttribute('style', flexStyle)
    this.planeTray.setAttribute('style', flexStyle)
    this.buildingTray.setAttribute('style', flexStyle)
    gameStatus.game.classList.remove('hidden')
    gameStatus.mode.classList.remove('hidden')
    gameStatus.line.classList.remove('hidden')
    gameStatus.line.classList.remove('small')
    gameStatus.line.classList.add('medium')
    const panels = document.getElementsByClassName('panel')
    for (const panel of panels) {
      panel.classList.remove('alt')
    }
    gameStatus.clear()
    const infoList = [
      'Drag ships from the trays onto the board.',
      'Click a ship in the tray to select it, then click on the buttons to rotate and flip',
      'While a ship is selected, use the rotate, rotate left and flip buttons to change its orientation.',
      'You can also use modifier keys while dragging: Control (or Command on Mac) to rotate left, Option (or Alt) to flip, Shift to rotate right.',
      'Use the undo button to remove the last placed ship.',
      'Once all ships are placed, you can test your placement or start a game against the computer.'
    ]
    let index = 0

    gameStatus.info(infoList[0])
    let placingInfo = setInterval(() => {
      if (this.placingShips === false) {
        clearInterval(placingInfo)
        placingInfo = null
      } else {
        gameStatus.info(infoList[index])
        index = (index + 1) % infoList.length
      }
    }, 13000)
  }
  readyMode () {
    this.placingShips = false
    this.testBtn.classList.remove('hidden')
    this.seekBtn.classList.remove('hidden')
    this.rotateBtn.classList.add('hidden')
    this.rotateLeftBtn.classList.add('hidden')
    this.flipBtn.classList.add('hidden')
    this.undoBtn.classList.add('hidden')
    this.autoBtn.classList.add('hidden')
    this.stopBtn.classList.add('hidden')
    this.shipTray.classList.add('hidden')
    this.planeTray.classList.add('hidden')
    this.buildingTray.classList.add('hidden')
    this.trays.classList.add('hidden')
    for (const cell of this.board.children) {
      cell.classList.remove('hit', 'placed')
    }

    gameStatus.game.classList.remove('hidden')
    gameStatus.mode.classList.remove('hidden')
    gameStatus.line.classList.remove('hidden')
    gameStatus.line.classList.remove('small')
    gameStatus.line.classList.add('medium')
    const panels = document.getElementsByClassName('panel')
    for (const panel of panels) {
      panel.classList.remove('alt')
    }
    gameStatus.clear()
    gameStatus.info('test your placement or play a game against the computer')
  }
  testMode () {
    this.placingShips = false
    this.testBtn.classList.remove('hidden')
    this.seekBtn.classList.remove('hidden')
    this.stopBtn.classList.remove('hidden')
    this.score.shotsLabel.classList.remove('hidden')
    this.score.hitsLabel.classList.remove('hidden')
    this.score.sunkLabel.classList.remove('hidden')
    this.score.placedLabel.classList.add('hidden')
    this.rotateBtn.classList.add('hidden')
    this.rotateLeftBtn.classList.add('hidden')
    this.flipBtn.classList.add('hidden')
    this.undoBtn.classList.add('hidden')
    this.autoBtn.classList.add('hidden')
    this.shipTray.classList.add('hidden')
    this.planeTray.classList.add('hidden')
    this.buildingTray.classList.add('hidden')
    this.trays.classList.add('hidden')
    gameStatus.game.classList.remove('hidden')
    gameStatus.mode.classList.remove('hidden')
    gameStatus.line.classList.remove('hidden')
    gameStatus.line.classList.add('medium')
  }

  seekMode () {
    this.placingShips = false
    this.testBtn.classList.add('hidden')
    this.newPlacementBtn.classList.add('hidden')
    this.seekBtn.classList.add('hidden')
    this.stopBtn.classList.add('hidden')
    this.score.shotsLabel.classList.remove('hidden')
    this.score.hitsLabel.classList.remove('hidden')
    this.score.sunkLabel.classList.remove('hidden')
    this.score.placedLabel.classList.add('hidden')
    this.rotateBtn.classList.add('hidden')
    this.rotateLeftBtn.classList.add('hidden')
    this.flipBtn.classList.add('hidden')
    this.undoBtn.classList.add('hidden')
    this.autoBtn.classList.add('hidden')
    this.shipTray.classList.add('hidden')
    this.planeTray.classList.add('hidden')
    this.buildingTray.classList.add('hidden')
    this.trays.classList.add('hidden')
    const panels = document.getElementsByClassName('panel')
    for (const panel of panels) {
      panel.classList.add('alt')
    }
    gameStatus.game.classList.remove('hidden')
    gameStatus.mode.classList.remove('hidden')
    gameStatus.line.classList.remove('medium')
    gameStatus.line.classList.add('hidden')
    gameStatus.line2.classList.remove('medium')
    gameStatus.line2.classList.add('small')
  }
  displayShipInfo (ships) {
    const total = ships.length
    const placed = ships.filter(s => s.cells.length > 0).length
    this.score.placed.textContent = `${placed} / ${total}`
    if (total === placed) {
      this.readyMode()
    }
  }
  reset (ships) {
    this.board.innerHTML = ''
    this.shipTray.innerHTML = ''
    this.planeTray.innerHTML = ''
    this.buildingTray.innerHTML = ''
    this.displayShipInfo(ships)
  }
}

export const friendUI = new FriendUI()

let lastmodifier = ''
let dragCounter = 0
friendUI.dragEnd(document, () => {
  lastmodifier = ''
  dragCounter = 0
})

friendUI.board.addEventListener('dragenter', e => {
  e.preventDefault()

  dragCounter++
  if (dragCounter > 1 || !selection) return
  selection.hide()
})

friendUI.board.addEventListener('dragleave', e => {
  e.preventDefault()
  dragCounter--
  if (dragCounter > 0) return

  friendUI.removeHighlight()

  if (!selection) return
  selection.show()
})

export function dragOver (friend) {
  document.addEventListener('dragover', e => {
    e.preventDefault()

    if (!selection) return
    //const effect = e.dataTransfer.dropEffect
    const allow = e.dataTransfer.effectAllowed

    let changed = false
    if (lastmodifier !== allow) {
      lastmodifier = allow
      if (allow === 'link') {
        // mac chrome uses control for rotate
        selection.rotate() // rotate clockwise
        changed = true
      } else if (allow === 'copy') {
        // mac chrome uses option  for flip
        selection.flip()
        changed = true
      } else if (allow === 'none') {
        // mac chrome uses command for rotate left
        selection.leftRotate()
        changed = true
      }
    }

    // position highlight under cursor
    if (changed && selection?.isNotShown()) {
      friendUI.highlight(friend.shipCellGrid)
    }
    // position ghost under cursor
    if (selection?.shown) {
      selection.move(e)
    }
  })
}
