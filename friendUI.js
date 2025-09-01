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
  markPlaced: function (cells, letter) {
    for (const [r, c] of cells) {
      // surrounding water misses
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr
          const cc = c + dc
          if (gameMaps.inBounds(rr, cc)) {
            this.cellMiss(rr, cc)
          }
        }
      this.cellPlacedAt(r, c, letter)
    }
  },
  makeDroppable: function (shipCellGrid, ships) {
    for (const cell of this.board.children) {
      cell.textContent = ''
      cell.classList.remove('hit', 'miss')
      this.drop(cell, shipCellGrid, ships)
      this.dragEnter(cell, shipCellGrid)
    }
  },
  drop: function (cell, shipCellGrid, ships) {
    cell.addEventListener('drop', e => {
      e.preventDefault()

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
      }
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
     e.target.style.opacity = ''; 
      for (const el of this.board.children) {
        el.classList.remove('good', 'bad')
      }

     /*
  if (e.dataTransfer.dropEffect === 'none') {
     //   console.log('Drag was cancelled or no valid drop target.');
    } else {
      //  console.log('Drag was successful with drop effect:', event.dataTransfer.dropEffect);
    }*/
      if (selection) {
     /*   const source = selection.source
        if (source) {
          source.style.opacity = 1
          console.log(JSON.stringify(source))
        }*/
        selection.remove()
        setSelection(null)
      }
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
      setSelection(ship, offsetX, offsetY, friendUI.cellSize, e.target)
      selection.moveTo(e.clientX, e.clientY)
      // e.target.style.display = 'none'
      e.target.style.opacity = 0.6

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
  /*
  displayAs: function (cell, what) {
    cell.classList.add(what)
    //  what[0].toUpperCase()
    //    gameStatus.info(what[0].toUpperCase() + what.slice(1) + '!')
  },*/
  cellMiss: function (r, c) {
    const cell = this.gridCellAt(r, c)
    if (cell.classList.contains('placed')) return
    cell.classList.add('miss')
    //  this.displayAs(cell, 'miss')
  },
  displayAsPlaced: function (cell, letter) {
    cell.textContent = letter
    cell.style.color = gameMaps.shipLetterColors[letter] || '#fff'
    cell.style.background =
      gameMaps.shipColors[letter] || 'rgba(255,255,255,0.2)'

    cell.classList.add('placed')
    cell.classList.remove('miss')
  },
  cellPlacedAt: function (r, c, letter) {
    const cell = this.gridCellAt(r, c)
    this.displayAsPlaced(cell, letter)
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
