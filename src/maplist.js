import { gameMaps } from './maps.js'
import { WatersUI } from './playerUI.js'
import { Waters } from './player.js'
import { ScoreUI } from './ScoreUI.js'
import { setupTabs } from './setup.js'

class MapList {
  constructor (id) {
    this.listId = id || 'list-container'
    this.container = document.getElementById(this.listId)
  }

  makeList () {
    const maps = gameMaps.customMapList()
    let idx = 0
    for (const map of maps) {
      const entry = document.createElement('div')
      entry.id = 'custom-map-' + map.title
      entry.className = 'map-entry'

      const entryTitle = document.createElement('h4')
      entryTitle.textContent = map.title

      entry.appendChild(entryTitle)
      const entryContent = document.createElement('div')
      entryContent.className = 'entry-container'
      const boardWrapper = document.createElement('div')
      boardWrapper.className = 'board-wrap'

      boardWrapper.style.width = '200px'
      const board = document.createElement('div')

      board.className = 'board'
      board.id = 'custom-map-board-' + idx.toString()
      board.style.width = '200px'
      board.style.margin = '0 0'
      board.style.padding = '0 0'
      const boardViewModel = new WatersUI()
      boardViewModel.containerWidth = 200
      boardViewModel.board = board
      boardViewModel.resetBoardSize(map)
      boardViewModel.buildBoard(null, board, map)
      boardWrapper.appendChild(board)
      entryContent.appendChild(boardWrapper)
      const boardWrapper2 = document.createElement('div')
      boardWrapper2.className = 'board-wrap'
      const tallyContainer = document.createElement('div')
      tallyContainer.className = 'tally-box-container'
      tallyContainer.id = 'tally-container-' + idx.toString()

      const tallybox = document.createElement('div')
      tallybox.id = idx.toString() + '-tallybox'
      tallybox.className = 'tally-boxes'

      tallyContainer.appendChild(tallybox)
      boardWrapper2.appendChild(tallyContainer)
      boardWrapper2.style.width = '200px'
      entryContent.appendChild(boardWrapper2)
      entry.appendChild(entryContent)
      this.container.appendChild(entry)
      const model = new Waters()
      const ships = model.createShips(map)
      model.ships = ships
      boardViewModel.score = new ScoreUI(idx.toString())
      boardViewModel.score.tallyBox = tallybox
      boardViewModel.score.buildTally(ships, 0, null, true)
      idx++
    }
  }
}

setupTabs('list')
const mapList = new MapList()
mapList.makeList()
