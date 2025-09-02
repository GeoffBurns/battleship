import { gameMaps, gameHost } from './map.js'

export class StatusUI {
  constructor () { 
    this.mode = document.getElementById('modeStatus')
    this.game = document.getElementById('gameStatus')
    this.line = document.getElementById('statusLine')
  }
  display (mode, game) {
    this.mode.textContent = mode
    if (game) {
      this.info(game)
    }
  }
  bombStatus (carpetBombsUsed) {
    return `Bomb Mode (${gameMaps.maxBombs - carpetBombsUsed} left)`
  }
  displayBombStatus (carpetBombsUsed, game) {
    return this.display(this.bombStatus(carpetBombsUsed), game)
  }
  info (game) {
    this.game.textContent = game
  }
}

export class ScoreUI {
  constructor (playerPrefix) {
    // Initialization logic
    //
    this.shots = document.getElementById(playerPrefix + '-shots')
    this.hits = document.getElementById(playerPrefix + '-hits')
    this.sunk = document.getElementById(playerPrefix + '-sunk')
    this.placed = document.getElementById(playerPrefix + '-placed')
    this.endured = document.getElementById(playerPrefix + '-endured')
    this.tallyBox = document.getElementById(playerPrefix + '-tallyBox')
  }
  display (ships, shots) {
    this.shots.textContent = shots.toString()
    const hits = ships.reduce((sum, s) => sum + s.hits.size, 0)
    this.hits.textContent = hits.toString()
    const sunkCount = ships.filter(s => s.sunk).length
    this.sunk.textContent = `${sunkCount} / ${ships.length}`
  }
  resetTallyBox () {
    this.tallyBox.innerHTML = ''
  }
  buildShipBox (ship) {
    const box = document.createElement('div')
    const letter = ship.letter
    box.className = 'tally-box'
    if (ship.sunk) {
      box.textContent = 'X'
      box.style.background = '#ff8080'
      box.style.color = '#400'
    } else {
      box.textContent = letter
      box.style.background = gameMaps.shipColors[letter] || '#333'
      box.style.color = gameMaps.shipLetterColors[letter] || '#fff'
    }
    return box
  }
  buildTallyRow (ships, letter, rowList, boxer) {
    boxer = boxer || this.buildShipBox
    const row = document.createElement('div')
    row.className = 'tally-row'
    const matching = ships.filter(s => s.letter === letter)

    matching.forEach(s => {
      const box = boxer(s)
      row.appendChild(box)
    })
    rowList.appendChild(row)
  }
  buildBombRow (rowList, carpetBombsUsed) {
    const row = document.createElement('div')
    row.className = 'tally-row'

    for (let i = 0; i < gameMaps.maxBombs; i++) {
      const box = document.createElement('div')
      box.className = 'tally-box'

      if (i < carpetBombsUsed) {
        box.textContent = 'X'
        box.style.background = '#999'
      } else {
        box.textContent = 'M'
        box.style.background = gameMaps.shipLetterColors['M']
      }
      row.appendChild(box)
    }
    rowList.appendChild(row)
  }
  buildShipTally (ships, boxer) {
    this.resetTallyBox()
    this.buildTallyRow(ships, 'P', this.tallyBox, boxer)
    const surfaceContainer = document.createElement('div')
    surfaceContainer.setAttribute('style', 'display:flex;gap:40px;')

    const seaColumn = document.createElement('div')
    const landColumn = document.createElement('div')
    const sea = ['A', 'B', 'C', 'D']
    const land = ['G', 'U']
    for (const letter of sea) {
      this.buildTallyRow(ships, letter, seaColumn, boxer)
    }
    for (const letter of land) {
      this.buildTallyRow(ships, letter, landColumn, boxer)
    }
    surfaceContainer.appendChild(seaColumn)
    surfaceContainer.appendChild(landColumn)

    this.tallyBox.appendChild(surfaceContainer)
  }
  buildTally (ships, carpetBombsUsed) {
    this.buildShipTally(ships)
    // bombs row
    this.buildBombRow(this.tallyBox, carpetBombsUsed)
  }
}

export const gameStatus = new StatusUI()
export const playerUI = {
  board: {},
  containerWidth: gameHost.containerWidth,
  cellSize: function() {
    return gameHost.containerWidth / gameMaps.current.cols
  },
  resetBoardSize: function () {
    const cellSize = this.cellSize()
    this.board.style.setProperty('--cols', gameMaps.current.cols)
    this.board.style.setProperty('--rows', gameMaps.current.rows)
    this.board.style.setProperty('--boxSize', cellSize.toString() + 'px')
    this.board.innerHTML = ''
  },
  buildBoard: function (onClickCell) {
    this.board.innerHTML = ''
    for (let r = 0; r < gameMaps.current.rows; r++) {
      for (let c = 0; c < gameMaps.current.cols; c++) {
        const cell = document.createElement('div')
        const land = gameMaps.isLand(r, c)
        const c1 = c + 1
        const r1 = r + 1
        cell.className = 'cell'
        cell.classList.add(land ? 'land' : 'sea')
        const checker = (r + c) % 2 === 0
        cell.classList.add(checker ? 'light' : 'dark')
        if (!land && c1 < gameMaps.current.cols && gameMaps.isLand(r, c1)) {
          cell.classList.add('rightEdge')
        }
        if (c !== 0 && !land && gameMaps.isLand(r, c - 1)) {
          cell.classList.add('leftEdge')
        }
        if (r1 < gameMaps.current.rows && land !== gameMaps.isLand(r1, c)) {
          cell.classList.add('bottomEdge')
        }
        cell.dataset.r = r
        cell.dataset.c = c
        cell.addEventListener('click', () => onClickCell(r, c))
        this.board.appendChild(cell)
      }
    }
  }
}
