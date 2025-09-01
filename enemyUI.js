import { gameMaps } from './map.js'
import { gameStatus, playerUI, ScoreUI } from './playerUI.js'

export const enemyUI = {
  __proto__: playerUI,
  board: document.getElementById('enemy-board'),
  score: new ScoreUI('enemy'),
  carpetBtn: document.getElementById('carpetBtn'),
  revealBtn: document.getElementById('revealBtn'),
  displayFleetSunk: function () {
    gameStatus.display('Fleet Destroyed', 'All  - Well Done!')
    this.board.classList.add('destroyed')
  },
  gridCellAt: function (r, c) {
    const result = this.board.children[r * gameMaps.current.cols + c]
    if (result && result.classList) return result
    throw new Error(
      'Invalid cell' + JSON.stringify(result) + 'at ' + r + ',' + c
    )
  },
  displayAsRevealed: function (cell, letter) {
    if (cell) {
      cell.style.background =
        gameMaps.shipColors[letter] || 'rgba(255, 209, 102, 0.3)'
      cell.style.color = gameMaps.shipLetterColors[letter] || '#ffd166'
      cell.textContent = letter
    }
  },
  revealShip: function (ship) {
    for (const [r, c] of ship.cells) {
      const cell = this.gridCellAt(r, c)
      this.displayAsRevealed(cell, ship.letter)
    }
  },
  revealAll: function (ships) {
    for (const ship of ships) {
      this.revealShip(ship)
    }

    gameStatus.display('Enemy Fleet Revealed', 'You Gave Up')
    this.board.classList.add('destroyed')
  },
  displayAs: function (cell, what) {
    cell.classList.add(what)
    what[0].toUpperCase()
    gameStatus.info(what[0].toUpperCase() + what.slice(1) + '!')
  },
  cellHit: function (r, c) {
    const cell = this.gridCellAt(r, c)
    this.displayAs(cell, 'hit')
  },
  cellMiss: function (r, c) {
    const cell = this.gridCellAt(r, c)

    this.displayAs(cell, 'miss')
  },
  displayAsSunk: function (cell, letter) {
    cell.textContent = letter
    cell.style.color = gameMaps.shipLetterColors[letter] || '#fff'
    cell.style.background =
      gameMaps.shipColors[letter] || 'rgba(255,255,255,0.2)'
    cell.classList.remove('hit')
    cell.classList.remove('miss')
  },
  cellSunkAt: function (r, c, letter) {
    const cell = this.gridCellAt(r, c)
    this.displayAsSunk(cell, letter)
  },
  clearVisuals: function () {
    for (const cell of this.board.children) {
      cell.textContent = ''
      cell.style.background = ''
      cell.style.color = ''
      cell.classList.remove('hit', 'miss')
    }
  },

  reset: function () {
    this.board.innerHTML = ''
    this.board.classList.remove('destroyed')
    gameStatus.display('Single Shot Mode', 'Click On Square To Fire')
  }
}
