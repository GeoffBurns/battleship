import { gameMaps } from './maps.js'
import { WatersUI, gameStatus } from './playerUI.js'
import { ScoreUI } from './ScoreUI.js'
import { ClickedShip, DraggedShip, Brush } from './selection.js'
import { cursor } from './cursor.js'
import { CustomBlankMap } from './map.js'
import { Ship } from './Ship.js'

let lastEntered = [-1, -1]
let clickedShip = null
let noticeTimerId = null
let selection = null
let tipsTimerId = null

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

export function enterCursor (event, viewModel, ships, shipCellGrid) {
  if (!viewModel.placingShips) return
  if (cursor.isDragging) return
  if (!cursor.isGrid) return
  event.preventDefault()
  const cell = viewModel.gridCellAt(cursor.x, cursor.y)
  viewModel.handleDropEvent(cell, shipCellGrid, ships)
  selection = null
  createSelection(ships, shipCellGrid, null)
}

function createSelection (viewModel, ships, shipCellGrid, shipId) {
  const shipElement =
    shipId === null
      ? viewModel.getFirstTrayItem()
      : viewModel.getTrayItem(shipId)

  if (shipElement === null) return
  const id = shipId === null ? parseInt(shipElement.dataset.id) : shipId
  const ship = ships.find(s => s.id === id)
  const variantIndex = parseInt(shipElement.dataset.variant)

  selection = new DraggedShip(
    ship,
    0,
    0,
    viewModel.cellSize(),
    shipElement,
    variantIndex,
    viewModel.setDragShipContents.bind(viewModel)
  )
  selection.shown = false
  cursor.y = 0
  cursor.x = 0
  viewModel.highlight(shipCellGrid, 0, 0)
}
export function tabCursor (event, viewModel, ships, shipCellGrid) {
  if (!viewModel.placingShips) return
  if (cursor.isDragging) return

  event.preventDefault()

  cursor.isGrid = !cursor.isGrid

  if (cursor.isGrid) {
    viewModel.disableRotateFlip()
    const shipId = clickedShip?.ship.id
    viewModel.removeClicked()
    clickedShip = null
    createSelection(ships, shipCellGrid, shipId)
  } else {
    removeSelection()

    viewModel.removeHighlight()
    viewModel.assignByCursor('ArrowRight', ships)
  }
}
function removeSelection () {
  if (!selection) return
  selection.remove()
  selection = null
}

export class PlacementUI extends WatersUI {
  constructor (terroritory) {
    super()
    this.placingShips = true
    this.board = document.getElementById(terroritory + '-board')
    this.score = new ScoreUI(terroritory)
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
    this.specialTray = document.getElementById('specialTray')
    this.brushTray = document.getElementById('brushTray')
    this.weaponTray = document.getElementById('weaponTray')
    this.buildingTray = document.getElementById('buildingTray')
    this.tips = []
    this.addText = ' added'
    this.removeText = ' removed'
    this.brushlistenCancellables = []
    this.placelistenCancellables = []
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
  makeAddDroppable (model) {
    for (const cell of this.board.children) {
      cell.textContent = ''
      cell.classList.remove('hit', 'miss', 'placed')
      this.addDrop(cell, model)
      this.dragEnter(cell, model.shipCellGrid)
    }
  }
  makeBrushable (model) {
    for (const cell of this.board.children) {
      this.dragBrushEnter(cell, model)
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
      this.placement(placed, ships, selection.ship)

      if (selection) {
        const container = selection.source.parentElement
        selection.source.remove()
        if (
          container.classList.contains('drag-ship-container') &&
          container.children.length === 0
        )
          container.remove()
      }
      clickedShip = null
    }

    removeSelection()
  }
  handleAddDropEvent (cell, model, e) {
    if (e) e.preventDefault()

    this.removeHighlight()
    cursor.isDragging = false
    if (!selection) return

    const r = parseInt(cell.dataset.r)
    const c = parseInt(cell.dataset.c)

    const placed = selection.place(r, c, model.shipCellGrid)
    if (placed) {
      const newId = this.addition(placed, model, selection.ship)
      selection.source.dataset.id = newId
      clickedShip = null
    }
    this.displayShipTrackingInfo(model)
    removeSelection()
  }

  addDrop (cell, model) {
    cell.addEventListener(
      'drop',
      this.handleAddDropEvent.bind(this, cell, model)
    )
  }
  drop (cell, shipCellGrid, ships) {
    cell.addEventListener(
      'drop',
      this.handleDropEvent.bind(this, cell, shipCellGrid, ships)
    )
  }

  removeHighlight () {
    for (const el of this.board.children) {
      el.classList.remove('good', 'notgood', 'bad', 'worse')
    }
  }

  highlight (shipCellGrid, r, c) {
    if (!selection?.ghost) return
    if (r === null) r = lastEntered[0]
    if (c === null) c = lastEntered[1]
    const [r0, c0] = selection.offsetCell(r, c)
    if (!gameMaps.inBounds(r0, c0)) return

    this.removeHighlight()

    const placing = selection.placeable().placeAt(r0, c0)

    const canPlace = placing.canPlace(shipCellGrid)
    const cells = placing.cells
    for (const [rr, cc, dm] of cells) {
      if (gameMaps.inBounds(rr, cc)) {
        const cell = this.gridCellAt(rr, cc)
        let cellClass = 'bad'
        if (canPlace) {
          cellClass = 'good'
        } else if (dm === 1) {
          cellClass = 'notgood'
        }
        cell.classList.add(cellClass)
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
  dragBrushEnter (cell, model) {
    /// this.brushlistenCancellables = []

    function setLandCells (r, c, min, max, map, subterrain) {
      for (let i = min; i < max; i++) {
        for (let j = min; j < max; j++) {
          if (gameMaps.inBounds(r + i, c + j)) {
            map.setLand(r + i, c + j, subterrain)
          }
        }
      }
    }

    function recolorCells (r, c, min, max) {
      for (let i = min - 1; i < max + 1; i++) {
        for (let j = min - 1; j < max + 1; j++) {
          if (gameMaps.inBounds(r + i, c + j)) {
            this.recolor(r + i, c + j)
          }
        }
      }
    }

    const handler = e => {
      e.preventDefault()
      const el = e.target
      const r = parseInt(el.dataset.r)
      const c = parseInt(el.dataset.c)
      if (lastEntered[0] === r && lastEntered[1] === c) return

      lastEntered = [r, c]

      const size = selection?.size
      const subterrain = selection?.subterrain
      const map = gameMaps.current

      if (!(selection?.size && subterrain && map instanceof CustomBlankMap))
        return

      let min = size > 2 ? -1 : 0
      let max = size < 2 ? 1 : 2

      setLandCells(r, c, min, max, map, subterrain)
      recolorCells.call(this, r, c, min, max)
      this.score.refreshZoneInfo(model)
    }
    cell.addEventListener('dragenter', handler)
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
          this.specialTray.children[0] ||
          this.buildingTray.children[0]

        break
      case 'ArrowUp':
        shipnode =
          this.buildingTray.children[0] ||
          this.specialTray.children[0] ||
          this.planeTray.children[0] ||
          this.shipTray.children[0]
        break
      case 'ArrowLeft':
        shipnode =
          this.lastItem(this.buildingTray) ||
          this.lastItem(this.specialTray) ||
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

  getTrayItemInfo (shipId, adaptInfo) {
    let trays = [
      this.shipTray,
      this.planeTray,
      this.buildingTray,
      this.specialTray
    ]
    let itemIndex = 0
    let trayIndex = 0

    for (const tray of trays) {
      for (const child of tray.children) {
        const id = parseInt(child.dataset.id)
        if (id === shipId) {
          return adaptInfo(child, trayIndex, itemIndex, trays)
        }
        itemIndex++
      }
      trayIndex++
      itemIndex = 0
    }
    return null
  }

  getTrayItem (shipId) {
    const adaptInfo = (child /* , trayIndex, itemIndex, trays */) => {
      return child
    }
    return this.getTrayItemInfo(shipId, adaptInfo)
  }

  getFirstTrayItem () {
    return (
      this.shipTray.children[0] ||
      this.planeTray.children[0] ||
      this.buildingTray.children[0]
    )
  }

  moveAssignByCursor (arrowKey, clickedShip) {
    let shipnode = clickedShip.source

    const shipId = parseInt(shipnode.dataset.id)
    if (shipId === null || shipnode === null) return null

    const adaptInfo = (child, trayIndex, itemIndex, trays) => {
      return this.moveNextTrayItem(arrowKey, trays, itemIndex, trayIndex)
    }

    return this.getTrayItemInfo(shipId, adaptInfo)
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
    const shape = ship.shape()
    this.showNotice(shape.tip)
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
    const handler = e => {
      const shipElement = e.target
      if (shipElement?.style) shipElement.style.opacity = ''
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
      this.removeHighlight()
      if (callback) callback()
    }
    div.addEventListener('dragend', handler)
    this.placelistenCancellables.push(() => {
      div.removeEventListener('dragend', handler)
    })
  }
  dragBrushEnd (div, callback) {
    const dragBrushEndHandler = _e => {
      this.refreshAllColor()

      if (callback) callback()
    }
    div.addEventListener('dragend', dragBrushEndHandler)
    this.brushlistenCancellables.push(() => {
      div.removeEventListener('dragend', dragBrushEndHandler)
    })
  }
  dragLeave (div) {
    const handler = e => {
      e.preventDefault()
      for (const el of this.board.children) {
        el.classList.remove('good', 'bad')
      }
    }
    div.addEventListener('dragleave', handler)

    this.brushlistenCancellables.push(() => {
      div.removeEventListener('dragleave', handler)
    })
  }
  makeBrushDraggable (brush, size, subterrain) {
    brush.className = 'draggable'
    brush.setAttribute('draggable', 'true')
    this.dragBrushStart(brush, size, subterrain)
  }

  makeDraggable (dragShip, ships) {
    dragShip.className = 'draggable'
    dragShip.setAttribute('draggable', 'true')
    this.dragStart(dragShip, ships)
    this.onClickTrayItem(dragShip, ships)
  }
  onClickTrayItem (dragShip, ships) {
    dragShip.addEventListener('click', e => {
      const shipElement = e.currentTarget
      const shipId = parseInt(shipElement.dataset.id)
      if (e.target !== shipElement && !shipId) {
        return
      }

      const ship = ships.find(s => s.id === shipId)
      this.assignClicked(ship, shipElement)
    })
  }

  dragStart (dragShip, ships) {
    dragShip.addEventListener('dragstart', e => {
      const shipElement = e.currentTarget
      const shipId = parseInt(shipElement.dataset.id)
      if (e.target !== shipElement && !shipId) {
        return
      }

      const ship = ships.find(s => s.id === shipId)

      this.showNotice(ship.shape().tip)

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
  dragBrushStart (brush, size, subterrain) {
    brush.addEventListener('dragstart', e => {
      if (e.target !== e.currentTarget) {
        return
      }
      const shipElement = e.currentTarget

      e.dataTransfer.effectAllowed = 'all'

      cursor.isDragging = true
      selection = new Brush(
        size,
        subterrain
        // this.cellSize(),
        //  shipElement,
        //   this.setBrushContents.bind(this)
      )
      //   selection.moveTo(e.clientX, e.clientY)
      shipElement.style.opacity = '0.6'
    })
  }

  setDragShipContents (dragShip, cells, letter, special) {
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
        this.createDragShipCell(dragShip, cells, letter, r, c, special)
      }
    }
  }

  setBrushContents (brush, size, subterrain) {
    brush.setAttribute(
      'style',
      `display:grid;place-items: center;--boxSize:${
        this.cellSize().toString() + 'px'
      };grid-template-rows:repeat(${size}, var(--boxSize));grid-template-columns:repeat(${size}, var(--boxSize));gap:0px;`
    )
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        this.appendBrushCell(brush, r, c, subterrain.lightColor)
      }
    }
  }

  createDragShipCell (dragShip, cells, letter, r, c, special) {
    if (cells.some(shipcell => shipcell[0] === r && shipcell[1] === c)) {
      this.appendCell(
        dragShip,
        r,
        c,
        gameMaps.shipColors[letter],
        gameMaps.shipLetterColors[letter],
        letter,
        special
      )
    } else {
      this.appendEmptyCell(dragShip, r, c)
    }
  }
  setCoords (cell, r, c) {
    cell.dataset.r = r
    cell.dataset.c = c
  }
  makeCell (r, c) {
    const cell = document.createElement('div')
    cell.className = 'cell'
    this.setCoords(cell, r, c)
    return cell
  }
  appendEmptyCell (dragItem, r, c) {
    const cell = this.makeCell(r, c)
    cell.classList.add('empty')
    dragItem.appendChild(cell)
  }
  appendBrushCell (dragItem, r, c, bg) {
    const cell = this.makeCell(r, c)

    cell.style.background = bg || 'rgba(255, 209, 102, 0.3)'

    dragItem.appendChild(cell)
  }
  appendCell (dragItem, r0, c0, bg, fg, letter, special) {
    const cell = this.makeCell()

    cell.style.background = bg || 'rgba(255, 209, 102, 0.3)'
    if (letter) cell.style.color = fg || '#ffd166'
    const isSpecial = special?.some(([r, c]) => r0 === r && c0 === c)
    if (isSpecial) {
      cell.classList.add('special')
    } else {
      cell.textContent = letter
    }
    dragItem.appendChild(cell)
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
  buildTrayItem (ships, ship, tray) {
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
    this.setDragShipContents(
      dragShip,
      shape.cells,
      shape.letter,
      shape.variants().special()
    )
    this.makeDraggable(dragShip, ships)
    dragShipContainer.appendChild(dragShip)
    tray.appendChild(dragShipContainer)
  }
  buildBrush (size, subterrain, tray) {
    const brushContainer = document.createElement('div')
    const id = subterrain.letter + size.toString()

    brushContainer.className = 'drag-brush-container'
    brushContainer.dataset.id = id
    brushContainer.setAttribute(
      'style',
      'display: flex;justify-content: center;align-items: center;'
    )
    const brush = document.createElement('div')
    brush.className = 'drag-brush'
    brush.dataset.size = size
    brush.dataset.id = subterrain + size.toString()
    this.setBrushContents(brush, size, subterrain)
    this.makeBrushDraggable(brush, size, subterrain)
    brushContainer.appendChild(brush)
    tray.appendChild(brushContainer)
  }
  buildBrushTray (terrain) {
    this.brushTray.innerHTML = ''
    for (let i = 1; i < 4; i++) {
      for (const subterrain of terrain.subterrains) {
        this.buildBrush(i, subterrain, this.brushTray)
      }
    }
  }
  buildTrays (ships) {
    for (const ship of ships) {
      this.addShipToTrays(ships, ship)
    }
  }
  addShipToTrays (ships, ship) {
    const type = ship.type()
    switch (type) {
      case 'A':
        this.buildTrayItem(ships, ship, this.planeTray)
        break
      case 'S':
        this.buildTrayItem(ships, ship, this.shipTray)
        break
      case 'M':
      case 'T':
      case 'X':
        this.buildTrayItem(ships, ship, this.specialTray)
        break
      case 'G':
        this.buildTrayItem(ships, ship, this.buildingTray)
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

  placement (placed, ships, ship) {
    this.showNotice(ship.description() + this.addText)
    this.markPlaced(placed, ship.letter)
    this.placeTally(ships)
    this.displayShipInfo(ships)
  }

  displayShipTrackingInfo (model) {
    this.score.addShipTally(model.ships)
    this.displayAddInfo(model)
    this.score.displayAddZoneInfo(model)
  }
  addition (placed, model, ship) {
    this.showNotice(ship.description() + this.addText)
    this.markPlaced(placed, ship.letter)
    const id = model.nextId
    const newShip = new Ship(id, ship.symmetry, ship.letter)
    model.nextId++
    model.ships.push(ship)

    gameMaps.current.addShips(model.ships)

    const index = model.candidateShips.findIndex(s => s.id === ship.id)
    model.candidateShips[index] = newShip

    return id
  }

  subtraction (model, ship) {
    this.showNotice(ship.description() + this.removeText)
    const indexToRemove = model.ships.findIndex(s => s.id === ship.id)
    if (indexToRemove >= 0) model.ships.splice(indexToRemove, 1)

    this.score.addShipTally(model.ships)
    this.displayAddInfo(model)
    this.score.displayAddZoneInfo(model)
  }

  unplacement (ships, ship) {
    this.showNotice(ship.description() + this.removeText)
    this.placeTally(ships)
    this.displayShipInfo(ships)
  }

  showNotice (notice) {
    clearInterval(noticeTimerId)
    noticeTimerId = null
    gameStatus.info(notice)
    // turn off tips
    noticeTimerId = setInterval(() => {
      // turn on tips
      clearInterval(noticeTimerId)
      noticeTimerId = null
    }, 2000)
  }

  showTips () {
    gameStatus.clear()

    let index = 0

    gameStatus.info(this.tips[0])
    tipsTimerId = setInterval(() => {
      if (tipsTimerId === false) {
        clearInterval(tipsTimerId)
        tipsTimerId = null
      } else {
        if (noticeTimerId) return
        gameStatus.info(this.tips[index])
        index = (index + 1) % this.tips.length
      }
    }, 13000)
  }
  displayAddInfo (model) {
    if (!model.ships) return
    this.publishBtn.disabled = model.displacementRatio() < 0.35
    this.score.placed.textContent = model.ships.length.toString()
  }
  noOfShips () {
    return this.ships.length
  }
  noOfPlacedShips () {
    return this.ships.filter(s => s.cells.length > 0).length
  }
  displayShipInfo (ships) {
    if (!ships) return
    const total = ships.length
    const placed = ships.filter(s => s.cells.length > 0).length
    this.score.placed.textContent = `${placed} / ${total}`
  }
  reset (ships) {
    this.board.innerHTML = ''
    this.shipTray.innerHTML = ''
    this.planeTray.innerHTML = ''
    this.specialTray.innerHTML = ''
    this.buildingTray.innerHTML = ''
    this.displayShipInfo(ships)
  }
  resetAdd (model) {
    this.board.innerHTML = ''
    this.shipTray.innerHTML = ''
    this.planeTray.innerHTML = ''
    this.specialTray.innerHTML = ''
    this.buildingTray.innerHTML = ''
    this.displayAddInfo(model)
  }
}

let lastmodifier = ''
let dragCounter = 0

export function setupDragHandlers (viewModel) {
  viewModel.dragEnd(document, () => {
    lastmodifier = ''
    dragCounter = 0
  })

  viewModel.board.addEventListener('dragenter', e => {
    e.preventDefault()

    dragCounter++
    if (dragCounter > 1 || !selection) return
    selection.hide()
  })

  viewModel.board.addEventListener('dragleave', e => {
    e.preventDefault()
    dragCounter--
    if (dragCounter > 0) return

    viewModel.removeHighlight()

    if (!selection) return
    selection.show()
  })
}

export function setupDragBrushHandlers (viewModel) {
  viewModel.dragBrushEnd(document, () => {
    lastmodifier = ''
  })
}

export function dragOverPlacingHandlerSetup (model, viewModel) {
  document.addEventListener('dragover', e => {
    e.preventDefault()

    //const isBuilding = model instanceof Custom
    //const isPlacing = model instanceof Friend

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
      viewModel.highlight(model.shipCellGrid)
    }
    // position ghost under cursor
    if (selection?.shown) {
      selection.move(e)
    }
  })
}

export function dragOverAddingHandlerSetup (model, viewModel) {
  const handler = e => {
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
      viewModel.highlight(model.shipCellGrid)
    }
    // position ghost under cursor
    if (selection?.shown) {
      selection.move(e)
    }
  }
  document.addEventListener('dragover', handler)
  return () => document.removeEventListener('dragover', handler)
}

function moveGridCursor (event, shipCellGrid, viewModel) {
  event.preventDefault()
  switch (event.key) {
    case 'ArrowUp':
      cursor.x--
      if (cursor.x < 0) cursor.x = gameMaps.current.rows - 1
      viewModel.highlight(shipCellGrid, cursor.x, cursor.y)
      break
    case 'ArrowDown':
      cursor.x++
      if (cursor.x >= gameMaps.current.rows) cursor.x = 0
      viewModel.highlight(shipCellGrid, cursor.x, cursor.y)
      break
    case 'ArrowLeft':
      cursor.y--
      if (cursor.y < 0) cursor.y = gameMaps.current.cols - 1
      viewModel.highlight(shipCellGrid, cursor.x, cursor.y)
      break
    case 'ArrowRight':
      cursor.y++
      if (cursor.y >= gameMaps.current.cols) cursor.y = 0
      viewModel.highlight(shipCellGrid, cursor.x, cursor.y)
      break
  }
}

export function moveCursorBase (event, viewModel, model) {
  if (!viewModel.placingShips || cursor.isDragging) return

  event.preventDefault()
  if (cursor.isGrid) {
    moveGridCursor(event, model.shipCellGrid)
  } else {
    viewModel.assignByCursor(event.key, model.ships)
  }
}
