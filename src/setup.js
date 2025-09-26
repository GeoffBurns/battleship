import { heightUI, mapUI, widthUI } from './chooseUI.js'
import { gameMaps } from './maps.js'
import { custom } from './custom.js'
import { terrain } from './Shape.js'
import { SavedCustomMap } from './map.js'

export function removeShortcuts () {
  document.removeEventListener('keydown')
}

export function switchToEdit (mapName) {
  const params = new URLSearchParams()
  params.append('edit', mapName)

  const location = `./battlebuild.html?${params.toString()}`
  window.location.href = location
}

export function switchTo (target, huntMode) {
  const params = new URLSearchParams()
  const mapName = gameMaps.current.title
  params.append('mapName', mapName)

  if (huntMode === 'build' && custom.noOfPlacedShips() > 0) {
    terrain.current.updateCustomMaps(mapName)
    custom.store()
    gameMaps.addCurrentCustomMap()
    params.append('placedShips', '')
  }

  const location = `./${target}.html?${params.toString()}`
  window.location.href = location
}
export function setupTabs (huntMode) {
  function switchToSeek () {
    switchTo('battleseek', huntMode)
  }
  function switchToHide () {
    switchTo('index', huntMode)
  }
  function switchToBuild () {
    switchTo('battlebuild', huntMode)
  }

  function switchToList () {
    switchTo('maplist', huntMode)
  }

  function switchToImport () {
    // Create a hidden file input
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'

    input.onchange = e => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = evt => {
        try {
          const map = new SavedCustomMap(JSON.parse(evt.target.result))
          if (gameMaps.getMap(map.title) || gameMaps.getCustomMap(map.title)) {
            if (
              !confirm(
                'A map with this title already exists. Do you want to overwrite it?'
              )
            ) {
              return
            }
          }
          map.saveToLocalStorage()
          alert('Map imported successfully.')
        } catch (err) {
          alert('Invalid JSON: ' + err.message)
        }
      }
      reader.readAsText(file)
    }

    // Trigger the file dialog
    input.click()
  }
  if (huntMode !== 'build')
    document
      .getElementById('tab-build')
      ?.addEventListener('click', switchToBuild)

  if (huntMode !== 'hide')
    document.getElementById('tab-hide')?.addEventListener('click', switchToHide)

  if (huntMode !== 'seek')
    document.getElementById('tab-seek')?.addEventListener('click', switchToSeek)

  if (huntMode !== 'list')
    document.getElementById('tab-list')?.addEventListener('click', switchToList)

  if (huntMode !== 'import')
    document
      .getElementById('tab-import')
      ?.addEventListener('click', switchToImport)
}

function setupMapSelection (boardSetup, refresh) {
  const urlParams = new URLSearchParams(window.location.search)
  const mapChoices = urlParams.getAll('mapName')
  const placedShips = urlParams.has('placedShips')
  const mapName = mapChoices[0] || gameMaps.getLastMapTitle()

  mapUI.setup(
    function (_index, title) {
      gameMaps.setTo(title)
      boardSetup()
      refresh()
      gameMaps.storeLastMap()
    },
    null,
    mapName
  )

  gameMaps.setTo(mapName)
  return placedShips
}

export function validateWidth () {
  let width = parseInt(widthUI.choose.value, 10)
  if (isNaN(width) || width < gameMaps.minWidth || width > gameMaps.maxWidth) {
    width = widthUI.min
    widthUI.choose.value = width
  }
  return width
}

export function validateHeight () {
  let height = parseInt(heightUI.choose.value, 10)
  if (
    isNaN(height) ||
    height < gameMaps.minHeight ||
    height > gameMaps.maxHeight
  ) {
    height = heightUI.min
    heightUI.choose.value = height
  }
  return height
}

function setupMapOptions (boardSetup, refresh) {
  const urlParams = new URLSearchParams(window.location.search)
  const editingMap = gameMaps.getEditableMap(urlParams.getAll('edit')[0])

  const map =
    editingMap ||
    gameMaps.getMap(urlParams.getAll('mapName')[0]) ||
    gameMaps.getLastMap()
  let mapWidth = gameMaps.getLastWidth(map?.cols)
  let mapHeight = gameMaps.getLastHeight(map?.rows)

  setupTabs('build')

  widthUI.setup(function (_index) {
    const width = validateWidth()
    const height = validateHeight()
    gameMaps.setToBlank(height, width)

    gameMaps.storeLastWidth(width)

    boardSetup()
    refresh()
  }, mapWidth)

  heightUI.setup(function (_index) {
    const width = validateWidth()
    const height = validateHeight()
    gameMaps.setToBlank(height, width)
    gameMaps.storeLastHeight(height)
    boardSetup()
    refresh()
  }, mapHeight)

  if (editingMap) {
    gameMaps.setTo(editingMap.title)
  } else {
    gameMaps.setToBlank(mapHeight, mapWidth)
  }

  return editingMap
}

export function setupGameOptions (boardSetup, refresh, huntMode) {
  // Define urlParams using the current window's search string
  const placedShips = setupMapSelection(boardSetup, refresh)
  boardSetup()
  setupTabs(huntMode)
  return placedShips
}

export function setupBuildOptions (boardSetup, refresh, huntMode, editHandler) {
  // Define urlParams using the current window's search string

  setupTabs(huntMode)
  const editing = setupMapOptions(boardSetup, refresh)
  if (editing && editHandler) {
    editHandler(editing)
  } else {
    boardSetup()
  }
  return editing
}
