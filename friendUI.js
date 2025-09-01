import { gameMaps } from './map.js'
import { playerUI, ScoreUI } from './playerUI.js'
import { selection, setSelection } from './utils.js'

let lastEntered = [-1, -1]
export const friendUI = {
  __proto__: playerUI,
  board: document.getElementById('friend-board'),
  score: new ScoreUI('friend'),
  rotateBtn: document.getElementById('rotateBtn'),
  flipBtn: document.getElementById('flipBtn'),
  testBtn: document.getElementById('testBtn'),
  shipTray: document.getElementById('shipTray'),
  planeTray: document.getElementById('planeTray'),
  buildingTray: document.getElementById('buildingTray'),
  gridCellAt: function (r, c) {
    const cols = gameMaps.current.cols
    const index = r * cols + c
    const result = this.board.children[index]
    if (result && result.classList) return result
    throw new Error(
      'Invalid cell' + JSON.stringify(result) + 'at ' + r + ',' + c
      //    + ' index ' + index + ' cols ' + cols + ' in array ' + JSON.stringify(this.board.children)
    )
  },
  makeDroppable: function (shipCellGrid) {
    for (const cell of this.board.children) {
      cell.textContent = ''
      cell.classList.remove('hit', 'miss')
      this.drop(cell)
      this.dragEnter(cell, shipCellGrid)
      //  this.dragLeave(cell)
    }
  },
  drop: function (cell) {
    cell.addEventListener('drop', e => {
      e.preventDefault()
    })
  },
  dragEnter: function (cell, shipCellGrid) {
    cell.addEventListener('dragenter', e => {
      e.preventDefault()

      if (!selection) return

      const el = e.target
      const r = parseInt(el.dataset.r)
      const c = parseInt(el.dataset.c)
      if (lastEntered[0] === r && lastEntered[1] === c) return

      lastEntered = [r, c]
      const [r0, c0] = selection.offsetCell(r, c)

      if (!gameMaps.inBounds(r0, c0)) return

      const canPlace = selection.canPlace(r0, c0, shipCellGrid)
      const variant = selection.variant()
      for (const el of this.board.children) {
        el.classList.remove('good', 'bad')
      }
      for (const [dr, dc] of variant) {
        //    const [rr, cc] = selection.offsetCell(dr,dc)
        const rr = dr + r0
        const cc = dc + c0

        if (gameMaps.inBounds(rr, cc)) {
          const cell = this.gridCellAt(rr, cc)
          cell.classList.add(canPlace ? 'good' : 'bad')
        }
      }
    })
  },
  dragEnd: function (div) {
    div.addEventListener('dragend', e => {
      e.preventDefault()
      for (const el of this.board.children) {
        el.classList.remove('good', 'bad')
      }
      if (selection) selectionremove()
      selection = null
    })
  },
  dragLeave: function (div) {
    div.addEventListener('dragleave', e => {
      e.preventDefault()
      for (const el of this.board.children) {
        el.classList.remove('good', 'bad')
      }
    })
  },
  makeDraggable: function (dragShip, ship) {
    dragShip.setAttribute('draggable', 'true')
    this.dragStart(dragShip, ship)
  },
  dragStart: function (dragShip, ship) {
    dragShip.addEventListener('dragstart', e => {
      const rect = e.target.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top

      //   e.dataTransfer.setData("application/offset", JSON.stringify({ offsetX, offsetY }));
      e.dataTransfer.effectAllowed = 'move'
      //   e.dataTransfer.setDragImage(draggable, offsetX, offsetY);

      e.dataTransfer.setDragImage(new Image(), 0, 0)

      //   const select =
      setSelection(ship, offsetX, offsetY, friendUI.cellSize)
      selection.moveTo(e.clientX, e.clientY)
      this.rotateBtn.setAttribute(
        'disabled',
        selection.canRotate() ? 'false' : 'true'
      )
      this.flipBtn.setAttribute(
        'disabled',
        selection.canFlip() ? 'false' : 'true'
      )
    })
  },
  setDragShipContents (dragShip, cells, letter) {
    const maxR = Math.max(...cells.map(s => s[0])) + 1
    const maxC = Math.max(...cells.map(s => s[1])) + 1

    dragShip.setAttribute(
      'style',
      `display:grid;--boxSize:${
        this.cellSize.toString() + 'px'
      };grid-template-rows:repeat(${maxR}, var(--boxSize));grid-template-columns:repeat(${maxC}, var(--boxSize));gap:0px;`
    )

    for (let r = 0; r < maxR; r++) {
      for (let c = 0; c < maxC; c++) {
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
    }
  },
  buildTrayItem: function (ship, tray) {
    const shape = ship.shape()
    const dragShip = document.createElement('div')
    this.setDragShipContents(dragShip, shape.cells, shape.letter)
    this.makeDraggable(dragShip, ship)
    tray.appendChild(dragShip)
  },
  buildTrays: function (ships) {
    for (const ship of ships) {
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
          throw new Error('Unknown type for ' + JSON.stringify(ship, null, 2)) // The 'null, 2' adds indentation for readability);
      }
    }
  },
  placeShipBox: function (ship) {
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
  },
  placeTally: function (ships) {
    this.score.buildShipTally(ships, this.placeShipBox)
    // no bombs row
  },
  clearVisuals: function () {
    for (const el of this.board.children) {
      el.textContent = ''
      el.style.background = ''
      el.style.color = ''
      el.classList.remove('hit', 'miss')
    }
  },
  reset: function () {
    this.board.innerHTML = ''
  }
}
