import { gameMaps } from './maps.js'

export class ScoreUI {
  constructor (playerPrefix) {
    // Initialization logic
    //
    this.shots = document.getElementById(playerPrefix + '-shots')
    this.hits = document.getElementById(playerPrefix + '-hits')
    this.sunk = document.getElementById(playerPrefix + '-sunk')
    this.placed = document.getElementById(playerPrefix + '-placed')

    this.shotsLabel = document.getElementById(playerPrefix + '-shots-label')
    this.hitsLabel = document.getElementById(playerPrefix + '-hits-label')
    this.sunkLabel = document.getElementById(playerPrefix + '-sunk-label')
    this.placedLabel = document.getElementById(playerPrefix + '-placed-label')
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

    const column = document.createElement('div')
    column.className = 'tally-col'
    this.buildTallyRow(ships, 'P', column, boxer)
    const surfaceContainer = document.createElement('div')
    surfaceContainer.setAttribute('style', 'display:flex;gap:40px;')

    const seaColumn = document.createElement('div')
    seaColumn.className = 'tally-col'
    const landColumn = document.createElement('div')
    landColumn.className = 'tally-col'
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

    column.appendChild(surfaceContainer)
    this.tallyBox.appendChild(column)
  }
  buildTally (ships, carpetBombsUsed) {
    this.buildShipTally(ships)
    // bombs row
    this.buildBombRow(this.tallyBox, carpetBombsUsed)
  }

  altBuildTally (ships, carpetBombsUsed, boxer) {
    this.resetTallyBox()
    const surfaceContainer = document.createElement('div')
    surfaceContainer.setAttribute('style', 'display:flex;gap:40px;')

    const seaColumn = document.createElement('div')
    seaColumn.className = 'tally-col'
    const landColumn = document.createElement('div')
    landColumn.className = 'tally-col'
    const sea = ['A', 'B', 'C', 'D']
    const land = ['G', 'U']
    for (const letter of sea) {
      this.buildTallyRow(ships, letter, seaColumn, boxer)
    }

    this.buildTallyRow(ships, 'P', landColumn, boxer)
    for (const letter of land) {
      this.buildTallyRow(ships, letter, landColumn, boxer)
    }
    this.buildBombRow(landColumn, carpetBombsUsed)
    surfaceContainer.appendChild(seaColumn)
    surfaceContainer.appendChild(landColumn)

    this.tallyBox.appendChild(surfaceContainer)
  }
}
