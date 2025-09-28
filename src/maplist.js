import { gameMaps } from './maps.js'
import { WatersUI } from './playerUI.js'
import { Waters } from './player.js'
import { ScoreUI } from './ScoreUI.js'
import { setupTabs, switchToEdit, switchTo } from './setup.js'

class MapList {
  constructor (id) {
    this.listId = id || 'list-container'
    this.container = document.getElementById(this.listId)
    this.input = document.getElementById('inputField')
    this.inputDiv = document.getElementById('inputDiv')
    this.okBtn = document.getElementById('okBtn')
    this.cancelBtn = document.getElementById('cancelBtn')

    this.currentRenameEntry = null
    this.okBtn.addEventListener('click', this.renameOk.bind(this))
    this.cancelBtn.addEventListener('click', this.renameCancel.bind(this))
  }

  renameOk () {
    const newName = this.input.value.trim()
    const map = this.currentRenameEntry?.map
    if (newName && map) {
      map.rename(newName)
      this.inputDiv.classList.add('hidden')
      this.input.value = ''
      this.currentRenameEntry = null
      this.refresh()
    }
  }
  renameCancel () {
    const buttons = this.currentRenameEntry?.buttonList
    buttons?.map(c => c.classList.remove('hidden'))
    this.inputDiv.classList.add('hidden')
    this.input.value = ''
    this.currentRenameEntry = null
  }

  refresh () {
    this.container.innerHTML = ''
    this.makeList()
  }

  addEntryButton (name, idx, map, buttons, callback, controls) {
    const btn = document.createElement('button')
    btn.id = name + '-' + idx.toString()
    btn.textContent = name
    btn.addEventListener('click', callback.bind(this, map, controls))
    buttons.appendChild(btn)
    return btn
  }

  addMiniMap (map, boardViewModel, entryContent, idx) {
    const boardWrapper = document.createElement('div')
    boardWrapper.className = 'board-wrap map-list'

    boardWrapper.style.width = '200px'
    const board = document.createElement('div')

    board.className = 'board'
    board.id = 'custom-map-board-' + idx.toString()
    board.style.width = '200px'
    board.style.margin = '0 0'
    board.style.padding = '0 0'
    boardViewModel.containerWidth = 200
    boardViewModel.board = board
    boardViewModel.resetBoardSize(map)
    boardViewModel.buildBoard(null, board, map)
    boardWrapper.appendChild(board)
    entryContent.appendChild(boardWrapper)
    return boardWrapper
  }

  addEntryButtons (idx, map, entryContent) {
    const buttons = document.createElement('div')
    buttons.className = 'panel-controls map-list'
    let controls = []
    controls.push(
      this.addEntryButton('delete', idx, map, buttons, function (map) {
        map.remove()
        this.refresh()
      })
    )
    controls.push(
      this.addEntryButton('copy', idx, map, buttons, function (map) {
        map.clone()
        this.refresh()
      })
    )

    controls.push(
      this.addEntryButton(
        'rename',
        idx,
        map,
        buttons,
        function (map, controls) {
          controls.map(c => c.classList.add('hidden'))
          this.currentRenameEntry = { map: map, buttonList: controls }
          buttons.appendChild(this.inputDiv)
          this.inputDiv.classList.remove('hidden')
          this.input.value = map.title
          this.input.focus()
        },
        controls
      )
    )

    controls.push(
      this.addEntryButton('export', idx, map, buttons, function (map) {
        saveToFile(map)
      })
    )

    controls.push(
      this.addEntryButton('edit', idx, map, buttons, function (map) {
        switchToEdit(map.title)
      })
    )
    controls.push(
      this.addEntryButton('print', idx, map, buttons, function (map) {
        switchTo('print', 'print', map.title)
      })
    )
    entryContent.appendChild(buttons)

    return buttons
  }

  setupTallyBox (idx, entryContent) {
    const boardWrapper2 = document.createElement('div')
    boardWrapper2.className = 'board-wrap map-list'
    boardWrapper2.style.minWidth = '160px'
    const tallyContainer = document.createElement('div')
    tallyContainer.className = 'tally-box-container map-list'
    tallyContainer.id = 'tally-container-' + idx.toString()

    tallyContainer.style.minWidth = '160px'
    const tallybox = document.createElement('div')
    tallybox.id = idx.toString() + '-tallybox'
    tallybox.className = 'tally-boxes'

    tallyContainer.appendChild(tallybox)
    boardWrapper2.appendChild(tallyContainer)
    boardWrapper2.style.minWidth = '160px'
    entryContent.appendChild(boardWrapper2)
    return [tallybox, boardWrapper2]
  }

  fillTallyBox (idx, map, tallybox, boardViewModel) {
    const model = new Waters()
    const ships = model.createShips(map)
    model.ships = ships
    boardViewModel.score = new ScoreUI(idx.toString())
    boardViewModel.score.tallyBox = tallybox
    boardViewModel.score.buildTally(ships, 0, null, true)
  }

  addEntry (map, idx) {
    const entry = document.createElement('div')
    entry.id = 'custom-map-' + map.title
    entry.className = 'map-entry'

    entry.classList.add('info-wrap', idx % 2 ? 'alt' : 'standard')
    const entryTitle = document.createElement('h2')
    entryTitle.textContent = map.title

    entry.appendChild(entryTitle)
    const entryContent = document.createElement('div')
    entryContent.className = 'entry-container'

    const boardViewModel = new WatersUI()
    const boardNode = this.addMiniMap(map, boardViewModel, entryContent, idx)
    const [tallybox, tallyWrapper] = this.setupTallyBox(idx, entryContent)

    const buttonsNode = this.addEntryButtons(idx, map, entryContent)

    entry.appendChild(entryContent)
    this.container.appendChild(entry)
    this.fillTallyBox(idx, map, tallybox, boardViewModel)

    const height =
      Math.max(boardNode.offsetHeight, tallyWrapper.offsetHeight, 60) + 20
    buttonsNode.style.maxHeight = height + 'px'
  }

  makeList () {
    const maps = gameMaps.customMapList()
    let idx = 0
    for (const map of maps) {
      if (map) {
        this.addEntry(map, idx)
      } else {
        console.log('Skipping empty map at index', idx)
      }
      idx++
    }
  }
}

setupTabs('list')
const mapList = new MapList()
mapList.makeList()

function saveAsJson (json, filename = 'data.json') {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename // suggested filename
  document.body.appendChild(a)
  a.click()
  a.remove()

  // release memory
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function saveToFile (map, suggestedName) {
  const json = map.jsonString()
  suggestedName =
    suggestedName || (map.title ? map.title + '.json' : 'map.json')

  // feature-detect
  if ('showSaveFilePicker' in window) {
    try {
      const opts = {
        suggestedName,
        types: [
          {
            description: 'JSON file',
            accept: { 'application/json': ['.json'] }
          }
        ]
      }
      const handle = await window.showSaveFilePicker(opts)
      const writable = await handle.createWritable()
      await writable.write(json)
      await writable.close()
      return { success: true, handle }
    } catch (err) {
      // user may cancel or some error occurred
      return { success: false, error: err }
    }
  } else {
    // Fallback
    saveAsJson(json, suggestedName)
    return { success: true, fallback: true }
  }
}
