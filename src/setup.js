import { heightUI, mapUI, widthUI } from './chooseUI.js'
import { gameMaps } from './maps.js'
import { custom } from './custom.js'
import { terrain } from './Shape.js'

export function removeShortcuts () {
  document.removeEventListener('keydown')
}

export function switchTo (target, huntMode) {
  const params = new URLSearchParams()
  params.append('mapName', gameMaps.current.title)

  if (huntMode === 'build' && custom.noOfPlacedShips() > 0) {
    terrain.current.updateCustomMaps(gameMaps.current)
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

  if (huntMode !== 'build')
    document
      .getElementById('tab-build')
      ?.addEventListener('click', switchToBuild)

  if (huntMode !== 'hide')
    document.getElementById('tab-hide')?.addEventListener('click', switchToHide)

  if (huntMode !== 'seek')
    document.getElementById('tab-seek')?.addEventListener('click', switchToSeek)
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

  const map =
    gameMaps.getMap(urlParams.getAll('mapName')[0]) || gameMaps.getLastMap()
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

  gameMaps.setToBlank(mapHeight, mapWidth)
}

export function setupGameOptions (boardSetup, refresh, huntMode) {
  // Define urlParams using the current window's search string

  const placedShips = setupMapSelection(boardSetup, refresh)

  boardSetup()

  setupTabs(huntMode)
  return placedShips
}

export function setupBuildOptions (boardSetup, refresh, huntMode) {
  // Define urlParams using the current window's search string

  setupMapOptions(boardSetup, refresh)

  boardSetup()

  setupTabs(huntMode)
}
