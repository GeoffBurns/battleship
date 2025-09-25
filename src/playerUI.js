import { gameMaps, gameHost } from './maps.js'
import { StatusUI } from './StatusUI.js'

export const gameStatus = new StatusUI()

export class WatersUI {
  constructor () {
    this.board = {}
    this.placingShips = false
    this.containerWidth = gameHost.containerWidth
  }

  cellSize () {
    return this.containerWidth / gameMaps.current.cols
  }

  gridCellRawAt (r, c) {
    return this.board.children[r * gameMaps.current.cols + c]
  }
  gridCellAt (r, c) {
    const result = this.gridCellRawAt(r, c)
    if (result?.classList) return result
    throw new Error(
      'Invalid cell' + JSON.stringify(result) + 'at ' + r + ',' + c
    )
  }

  displayAsRevealed (cell, letter) {
    if (cell) {
      cell.style.background =
        gameMaps.shipColors[letter] || 'rgba(255, 209, 102, 0.3)'
      cell.style.color = gameMaps.shipLetterColors[letter] || '#ffd166'
      cell.textContent = letter
    }
  }
  revealShip (ship) {
    for (const [r, c] of ship.cells) {
      const cell = this.gridCellAt(r, c)
      this.displayAsRevealed(cell, ship.letter)
    }
  }

  clearClasses () {
    for (const cell of this.board.children) {
      cell.classList.remove('hit', 'frd-hit', 'frd-sunk', 'miss', 'placed')
    }
  }
  displayAsSunk (cell, _letter) {
    // cell.textContent = ''
    cell.classList.add('frd-sunk')
    //  cell.style.background = gameMaps.shipColors[letter] || 'rgba(0,0,0,0.8)'
    // cell.style.color = gameMaps.shipLetterColors[letter] || '#000'
    //cell.classList.remove('hit')
    cell.classList.remove('miss')
  }
  cellSunkAt (r, c, letter) {
    const cell = this.gridCellAt(r, c)
    this.displayAsSunk(cell, letter)
  }

  cellHit (r, c) {
    const cell = this.gridCellAt(r, c)
    cell.classList.add('hit')
  }
  cellMiss (r, c) {
    const cell = this.gridCellAt(r, c)

    if (cell.classList.contains('placed')) return
    cell.classList.add('miss')
  }
  surroundMiss (r, c, cellMiss) {
    if (!cellMiss) return
    // surrounding water misses
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr
        const cc = c + dc
        if (gameMaps.inBounds(rr, cc)) {
          cellMiss(rr, cc)
        }
      }
  }
  displaySurround (cells, letter, cellMiss, display) {
    for (const [r, c] of cells) {
      // surrounding water misses
      this.surroundMiss(r, c, cellMiss)
      if (display) {
        display(r, c, letter)
      }
    }
  }
  resetBoardSize (map) {
    if (!map) map = gameMaps.current
    const cellSize = this.cellSize()
    this.board.style.setProperty('--cols', map.cols)
    this.board.style.setProperty('--rows', map.rows)
    this.board.style.setProperty('--boxSize', cellSize.toString() + 'px')
    this.board.innerHTML = ''
  }

  colorize (r, c) {
    this.colorizeCell(this.gridCellRawAt(r, c), r, c)
  }

  recolor (r, c) {
    this.recolorCell(this.gridCellRawAt(r, c), r, c)
  }
  refreshAllColor () {
    for (const el of this.board.children) {
      this.refreshColor(el)
    }
  }
  refreshColor (cell) {
    const r = parseInt(cell.dataset.r)
    const c = parseInt(cell.dataset.c)
    this.uncolorCell(cell)
    this.colorizeCell(cell, r, c)
  }
  uncolorCell (cell) {
    cell.classList.remove(
      'land',
      'sea',
      'light',
      'dark',
      'rightEdge',
      'leftEdge',
      'topEdge',
      'bottomEdge'
    )
  }
  recolorCell (cell, r, c) {
    this.uncolorCell(cell)
    this.colorizeCell(cell, r, c)
  }
  colorizeCell (cell, r, c, map) {
    if (!map) map = gameMaps.current

    const land = map.isLand(r, c)
    const c1 = c + 1
    const r1 = r + 1
    cell.classList.add(land ? 'land' : 'sea')
    const checker = (r + c) % 2 === 0
    cell.classList.add(checker ? 'light' : 'dark')
    if (!land && c1 < map.cols && map.isLand(r, c1)) {
      cell.classList.add('rightEdge')
    }
    if (c !== 0 && !land && map.isLand(r, c - 1)) {
      cell.classList.add('leftEdge')
    }
    if (r1 < map.rows && land !== map.isLand(r1, c)) {
      cell.classList.add('bottomEdge')
    }
    if (r !== 0 && !land && map.isLand(r - 1, c)) {
      cell.classList.add('topEdge')
    }
  }
  buildCell (r, c, onClickCell, map) {
    const cell = document.createElement('div')
    cell.className = 'cell'
    this.colorizeCell(cell, r, c, map)
    cell.dataset.r = r
    cell.dataset.c = c

    if (onClickCell) {
      cell.addEventListener('click', onClickCell)
    }
    this.board.appendChild(cell)
  }
  buildBoard (onClickCell, thisRef, map) {
    if (!map) map = gameMaps.current
    this.board.innerHTML = ''
    for (let r = 0; r < map.rows; r++) {
      for (let c = 0; c < map.cols; c++) {
        if (onClickCell)
          this.buildCell(r, c, onClickCell.bind(thisRef, r, c), map)
        else this.buildCell(r, c, null, map)
      }
    }
  }
  clearVisuals () {
    for (const el of this.board.children) {
      el.textContent = ''
      el.style.background = ''
      el.style.color = ''
      el.classList.remove('hit', 'miss', 'frd-hit', 'frd-sunk', 'placed')
    }
  }
}
