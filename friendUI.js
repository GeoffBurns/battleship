import { gameMaps } from './map.js'
import { playerUI, ScoreUI } from './playerUI.js'

export const friendUI = {
  __proto__: playerUI,
  board: document.getElementById('friend-board'),
  score: new ScoreUI('friend'),
  shipTray: document.getElementById('shipTray'),
  planeTray: document.getElementById('planeTray'),
  buildingTray: document.getElementById('buildingTray'),
  gridCellAt: function (r, c) {
    const result = this.board.children[r * gameMaps.current.cols + c]
    if (result && result.classList) return result
    throw new Error(
      'Invalid cell' + JSON.stringify(result) + 'at ' + r + ',' + c
    )
  },
  buildTrayItem:function(ship, tray) {
    const shape = ship.shape()

    const cells = shape.cells
    const maxR = Math.max(...cells.map(s => s[0]))+1
    const maxC = Math.max(...cells.map(s => s[1]))+1
    const letter = ship.letter

    const dragShip = document.createElement('div')
 
    dragShip.setAttribute('style', `display:grid;--boxSize:${this.cellSize.toString() + 'px'};grid-template-rows:repeat(${maxR}, var(--boxSize));grid-template-columns:repeat(${maxC}, var(--boxSize));gap:0px;`) 
 

    for (let r = 0; r < maxR; r++) {
      for (let c = 0; c < maxC; c++) {
        const cell = document.createElement('div')
        cell.className = 'cell'
        if ( cells.some(shipcell=>shipcell[0]===r && shipcell[1]===c))
        {
        cell.style.background =
        gameMaps.shipColors[letter] || 'rgba(255, 209, 102, 0.3)'
        cell.style.color = gameMaps.shipLetterColors[letter] || '#ffd166'
        cell.textContent = letter
        }
        cell.dataset.r = r
        cell.dataset.c = c 
        dragShip.appendChild(cell)
      }
    }
        tray.appendChild(dragShip)
  },
   buildTrays: function(ships) {
      for (const ship of ships) {
        const type = ship.type()
        switch(type) {
          case 'A':
            this.buildTrayItem(ship,this.planeTray)
            break;
          case 'S':
            this.buildTrayItem(ship,this.shipTray)
            break;
          case 'G':
            this.buildTrayItem(ship,this.buildingTray) 
            break;
          default:
            throw new Error(
              'Unknown type for ' + JSON.stringify(ship, null, 2)
            ) // The 'null, 2' adds indentation for readability);
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
   },
}
