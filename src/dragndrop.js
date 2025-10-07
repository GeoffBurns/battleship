import { DraggedShip, Brush } from './selection.js'
import { cursor } from './cursor.js'
import { gameMaps } from './maps.js'
import { CustomMap } from './map.js'

let selection = null

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

let lastmodifier = ''
let dragCounter = 0

export function setupDragHandlers (viewModel) {
  dragNDrop.dragEnd(document, viewModel, () => {
    lastmodifier = ''
    dragCounter = 0
  })

  viewModel.board.addEventListener('dragenter', e => {
    const isShip = e.dataTransfer.types.includes('ship')
    if (!isShip) return
    e.preventDefault()

    dragCounter++
    if (dragCounter > 1 || !selection) return
    selection.hide()
  })

  viewModel.board.addEventListener('dragleave', e => {
    const isShip = e.dataTransfer.types.includes('ship')
    if (!isShip) return
    e.preventDefault()
    dragCounter--
    if (dragCounter > 0) return

    viewModel.removeHighlight()

    if (!selection) return
    selection.show()
  })
}

export function setupDragBrushHandlers (viewModel) {
  dragNDrop.dragBrushEnd(document, viewModel, () => {
    lastmodifier = ''
  })
}

export function dragOverPlacingHandlerSetup (model, viewModel) {
  document.addEventListener('dragover', e => {
    e.preventDefault()

    if (!selection) return
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
      dragNDrop.highlight(viewModel, model.shipCellGrid)
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
      dragNDrop.highlight(viewModel, model.shipCellGrid)
    }
    // position ghost under cursor
    if (selection?.shown) {
      selection.move(e)
    }
  }
  document.addEventListener('dragover', handler)
  return () => document.removeEventListener('dragover', handler)
}

export function enterCursor (event, viewModel, model) {
  if (!viewModel.placingShips) return
  if (cursor.isDragging) return
  if (!cursor.isGrid) return
  event.preventDefault()
  const cell = viewModel.gridCellAt(cursor.x, cursor.y)
  dragNDrop.handleDropEvent(cell, model, viewModel)
  selection = null
  createSelection(viewModel, model.ships, model.shipCellGrid, null)
}

function createSelection (viewModel, ships, shipCellGrid, shipId) {
  const shipElement =
    shipId === null
      ? viewModel.getFirstTrayItem()
      : viewModel.getTrayItem(shipId)

  if (shipElement === null) return
  const id = shipId === null ? parseInt(shipElement.dataset.id) : shipId
  const ship = ships.find(s => s.id === id)
  const variantIndex = parseInt(shipElement.dataset.variant) || 0

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
}

export function tabCursor (event, viewModel, model) {
  if (!viewModel.placingShips) return
  if (cursor.isDragging) return

  event.preventDefault()

  cursor.isGrid = !cursor.isGrid

  if (cursor.isGrid) {
    viewModel.disableRotateFlip()
    const shipId = clickedShip?.ship.id
    viewModel.removeClicked()
    clickedShip = null
    createSelection(viewModel, model.ships, model.shipCellGrid, shipId)
  } else {
    removeSelection()

    viewModel.removeHighlight()
    viewModel.assignByCursor('ArrowRight', model.ships)
  }
}

function removeSelection () {
  if (!selection) return
  selection.remove()
  selection = null
}

class DraggedWeapon {
  constructor (weapon, substract) {
    this.weapon = weapon
    this.substract = substract
  }
  remove () {
    // nothing to remove
  }
  addToMap (map) {
    map = map || gameMaps.current
    const weapons = map.weapons

    const idx = weapons.findIndex(w => w.letter === this.weapon.letter)
    if (idx < 0) {
      weapons.push(this.weapon)
    } else if (this.substract) {
      weapons[idx].ammo--
    } else {
      weapons[idx].ammo++
    }
    map.weapons = weapons
  }
}

class DragNDrop {
  getClickedShip () {
    return clickedShip
  }
  setClickedShip (clicked) {
    clickedShip = clicked
  }
  handleDropEvent (cell, model, viewModel, e) {
    if (e) e.preventDefault()
    viewModel.removeHighlight()
    cursor.isDragging = false
    if (!selection) return

    if (selection instanceof DraggedShip) {
      const r = parseInt(cell.dataset.r)
      const c = parseInt(cell.dataset.c)

      const placed = selection.place(r, c, model.shipCellGrid)
      if (placed) {
        viewModel.placement(placed, model, selection.ship)

        if (selection?.source) {
          viewModel.removeDragShip(selection?.source)
        }
        clickedShip = null
      }
    }
    if (selection instanceof DraggedWeapon) {
      selection.addToMap()
    }
    removeSelection()
  }

  handleTakeDropEvent (model, viewModel, e) {
    if (!selection) return

    if (selection instanceof DraggedWeapon && selection.substract) {
      if (e) e.preventDefault()
      cursor.isDragging = false

      selection.addToMap()
      model.armWeapons()
    }
    viewModel.displayShipTrackingInfo(model)
  }

  handleAddDropEvent (cell, model, viewModel, e) {
    if (e) e.preventDefault()

    viewModel.removeHighlight()
    cursor.isDragging = false
    if (!selection) return

    if (selection instanceof DraggedShip) {
      const r = parseInt(cell.dataset.r)
      const c = parseInt(cell.dataset.c)

      const placed = selection.place(r, c, model.shipCellGrid)
      if (placed) {
        const newId = viewModel.addition(placed, model, selection.ship)
        selection.source.dataset.id = newId
        clickedShip = null
      }
    }

    if (selection instanceof DraggedWeapon) {
      selection.addToMap()
      model.armWeapons()
    }
    viewModel.displayShipTrackingInfo(model)

    removeSelection()

    viewModel.checkTrays()
  }

  addDrop (cell, model, viewModel) {
    cell.addEventListener(
      'drop',
      this.handleAddDropEvent.bind(this, cell, model, viewModel)
    )
  }

  takeDrop (viewModel, model) {
    viewModel.trays.addEventListener(
      'drop',
      this.handleTakeDropEvent.bind(this, model, viewModel)
    )
  }
  drop (cell, model, viewModel) {
    cell.addEventListener(
      'drop',
      this.handleDropEvent.bind(this, cell, model, viewModel)
    )
  }

  highlight (viewModel, shipCellGrid, r, c) {
    if (!selection?.ghost) return
    if (r === null) r = lastEntered[0]
    if (c === null) c = lastEntered[1]
    const [r0, c0] = selection.offsetCell(r, c)
    if (!gameMaps.inBounds(r0, c0)) return

    viewModel.removeHighlight()

    const placing = selection.placeable().placeAt(r0, c0)

    const canPlace = placing.canPlace(shipCellGrid)
    const cells = placing.cells
    for (const [rr, cc, dm] of cells) {
      if (gameMaps.inBounds(rr, cc)) {
        const cell = viewModel.gridCellAt(rr, cc)
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
  dragEnter (cell, model, viewModel) {
    cell.addEventListener('dragenter', e => {
      e.preventDefault()
      const isShip = e.dataTransfer.types.includes('ship')
      if (!isShip) return

      const el = e.target
      const r = parseInt(el.dataset.r)
      const c = parseInt(el.dataset.c)
      if (lastEntered[0] === r && lastEntered[1] === c) return

      lastEntered = [r, c]
      this.highlight(viewModel, model.shipCellGrid, r, c)
    })
  }

  dragBrushEnter (cell, viewModel) {
    function setLandCells (r, c, min, max, map, subterrain) {
      for (let i = min; i < max; i++) {
        for (let j = min; j < max; j++) {
          if (gameMaps.inBounds(r + i, c + j)) {
            map.setLand(r + i, c + j, subterrain)
          }
        }
      }
    }

    function recolorCells (viewModel, r, c, min, max) {
      for (let i = min - 1; i < max + 1; i++) {
        for (let j = min - 1; j < max + 1; j++) {
          if (gameMaps.inBounds(r + i, c + j)) {
            viewModel.recolor(r + i, c + j)
          }
        }
      }
    }

    const handler = e => {
      e.preventDefault()
      const isBrush = e.dataTransfer.types.includes('brush')
      if (!isBrush) return
      const el = e.target
      const r = parseInt(el.dataset.r)
      const c = parseInt(el.dataset.c)
      if (lastEntered[0] === r && lastEntered[1] === c) return

      lastEntered = [r, c]

      const size = selection?.size
      const subterrain = selection?.subterrain
      const map = gameMaps.current

      if (!(selection?.size && subterrain && map instanceof CustomMap)) return

      let min = size > 2 ? -1 : 0
      let max = size < 2 ? 1 : 2

      setLandCells(r, c, min, max, map, subterrain)
      recolorCells.call(this, viewModel, r, c, min, max)
      viewModel.score.displayZoneInfo()
    }
    cell.addEventListener('dragenter', handler)
  }

  dragEnd (div, viewModel, callback) {
    const handler = e => {
      const isShip = e.dataTransfer.types.includes('ship')
      if (!isShip) return

      const shipElement = e.target
      if (shipElement?.style) shipElement.style.opacity = ''
      for (const el of viewModel.board.children) {
        el.classList.remove('good', 'bad')
      }

      cursor.isDragging = false
      if (e.dataTransfer.dropEffect !== 'none') {
        // The item was successfully dropped on a valid drop target
        viewModel.disableRotateFlip()
      } else {
        // The drag operation was canceled or dropped on an invalid target
        viewModel.assignClicked(selection.ship, shipElement)
      }

      removeSelection()
      viewModel.removeHighlight()
      if (callback) callback()
    }
    div.addEventListener('dragend', handler)
    viewModel.placelistenCancellables.push(() => {
      div.removeEventListener('dragend', handler)
    })
  }
  dragBrushEnd (div, viewModel, callback) {
    const dragBrushEndHandler = e => {
      const isBrush = e.dataTransfer.types.includes('brush')
      if (!isBrush) return

      viewModel.refreshAllColor()

      if (callback) callback()
    }
    div.addEventListener('dragend', dragBrushEndHandler)
    viewModel.brushlistenCancellables.push(() => {
      div.removeEventListener('dragend', dragBrushEndHandler)
    })
  }
  makeBrushDraggable (brush, size, subterrain) {
    brush.className = 'draggable'
    brush.setAttribute('draggable', 'true')
    this.dragBrushStart(brush, size, subterrain)
  }

  dragBrushStart (brush, size, subterrain) {
    brush.addEventListener('dragstart', e => {
      if (e.target !== e.currentTarget) {
        return
      }
      e.dataTransfer.setData('brush', subterrain + size.toString())
      const shipElement = e.currentTarget

      e.dataTransfer.effectAllowed = 'all'

      cursor.isDragging = true
      selection = new Brush(size, subterrain)
      shipElement.style.opacity = '0.6'
    })
  }

  dragStartWeapon (viewModel, dragShip, weapon, substract) {
    dragShip.addEventListener('dragstart', e => {
      const shipElement = e.currentTarget
      const shipId = parseInt(shipElement.dataset.id)
      if (e.target !== shipElement && !shipId) {
        return
      }
      e.dataTransfer.setData('weapon', weapon.letter)

      viewModel.showNotice(weapon.tip)

      viewModel.removeClicked()

      e.dataTransfer.effectAllowed = 'all'
      cursor.isDragging = true
      selection = new DraggedWeapon(weapon, substract)
      shipElement.style.opacity = '0.6'
    })
  }
  dragStart (viewModel, dragShip, ships) {
    dragShip.addEventListener('dragstart', e => {
      const shipElement = e.currentTarget
      const shipId = parseInt(shipElement.dataset.id)
      if (e.target !== shipElement && !shipId) {
        return
      }
      e.dataTransfer.setData('ship', shipId.toString())
      const ship = ships.find(s => s.id === shipId)

      viewModel.showNotice(ship.shape().tip)

      const rect = shipElement.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top

      viewModel.removeClicked()

      e.dataTransfer.effectAllowed = 'all'

      e.dataTransfer.setDragImage(new Image(), 0, 0)

      const variantIndex = parseInt(shipElement.dataset.variant)
      cursor.isDragging = true
      selection = new DraggedShip(
        ship,
        offsetX,
        offsetY,
        viewModel.cellSize(),
        shipElement,
        variantIndex,
        viewModel.setDragShipContents.bind(viewModel)
      )
      selection.moveTo(e.clientX, e.clientY)
      shipElement.style.opacity = '0.6'
    })
  }

  makeDraggable (viewModel, dragShip, ships, weapon, subtract) {
    dragShip.className = 'draggable'
    dragShip.setAttribute('draggable', 'true')
    if (weapon) {
      this.dragStartWeapon(viewModel, dragShip, weapon, subtract)
      if (!subtract) this.onClickTrayItemWeapon(viewModel, dragShip, weapon)
    } else {
      this.dragStart(viewModel, dragShip, ships)
      this.onClickTrayItem(viewModel, dragShip, ships)
    }
  }
  onClickTrayItem (viewModel, dragShip, ships) {
    dragShip.addEventListener('click', e => {
      const shipElement = e.currentTarget
      const shipId = parseInt(shipElement.dataset.id)
      if (e.target !== shipElement && !shipId) {
        return
      }

      const ship = ships.find(s => s.id === shipId)
      viewModel.assignClicked(ship, shipElement)
    })
  }
  onClickTrayItemWeapon (viewModel, dragShip, weapon) {
    dragShip.addEventListener('click', e => {
      const shipElement = e.currentTarget
      const letter = shipElement.dataset.letter
      if (e.target !== shipElement && !letter) {
        return
      }

      viewModel.assignClickedWeapon(weapon, shipElement)
    })
  }
}

export const dragNDrop = new DragNDrop()
