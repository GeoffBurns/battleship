import { gameMaps } from './maps.js'
import { gameStatus, PlayerUI } from './playerUI.js'
import { ScoreUI } from './ScoreUI.js'
import { ClickedShip, DraggedShip } from './selection.js'

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

export function removeSelection () {
  if (selection) selection.remove()
  selection = null
}

export class FriendUI extends PlayerUI {
  constructor () {
    super()
    this.placing = true
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

  drop (cell, shipCellGrid, ships) {
    cell.addEventListener('drop', e => {
      e.preventDefault()
      this.removeHighlight()
      if (!selection) return

      const el = e.target
      const r = parseInt(el.dataset.r)
      const c = parseInt(el.dataset.c)

      const placed = selection.place(r, c, shipCellGrid)
      if (placed) {
        this.markPlaced(placed, selection.letter)
        this.placeTally(ships)
        if (selection) {
          selection.remove()
          selection.source.remove()
        }
        this.displayShipInfo(ships)
      }
    })
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
    r = r || lastEntered[0]
    c = c || lastEntered[1]
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
      removeSelection()
      if (e.dataTransfer.dropEffect !== 'none') {
        // The item was successfully dropped on a valid drop target

        this.rotateBtn.disabled = true
        this.rotateLeftBtn.disabled = true
        this.flipBtn.disabled = true
      } else {
        // The drag operation was canceled or dropped on an invalid target
        this.assignClicked(selection.ship, shipElement)
      }
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
      const shipElement = e.currentTarget
      const rect = shipElement.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top

      this.removeClicked()

      e.dataTransfer.effectAllowed = 'all'

      e.dataTransfer.setDragImage(new Image(), 0, 0)
      const variantIndex = parseInt(shipElement.dataset.variant)
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
    this.placing = true
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
    gameStatus.info('drag ships onto board')
  }
  readyMode () {
    this.placing = false
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
    this.placing = false
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
    this.placing = false
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
      console.log('modifier', allow)
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
