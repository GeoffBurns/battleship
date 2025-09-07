import { mapUI, huntUI } from './mapUI.js'
import { gameMaps } from './map.js'

export function removeShortcuts () {
  document.removeEventListener('keydown')
}

export function setupDropdowns (boardSetup, refresh, huntMode) {
  // Define urlParams using the current window's search string
  const urlParams = new URLSearchParams(window.location.search)
  const mapChoices = urlParams.getAll('mapName')

  const mapName =
    mapChoices[0] || localStorage.getItem('geoffs-battleship.map-name')

  let mapIndex = gameMaps.list.findIndex(m => m.title === mapName)
  if (mapIndex < 0) mapIndex = 0

  mapUI.setup(function (_index, title) {
    boardSetup()
    refresh()
    localStorage.setItem('geoffs-battleship.map-name', title)
  }, mapIndex)

  gameMaps.setTo(mapIndex)

  console.log('setup ', mapName, mapIndex, gameMaps.current.title, mapChoices)
  boardSetup()
  function switchToSeek () {
    const params = new URLSearchParams()
    params.append('mapName', gameMaps.current.title)

    window.location.href = `./battleseek.html?${params.toString()}`
  }
  function switchToHide () {
    const params = new URLSearchParams()
    params.append('mapName', gameMaps.current.title)

    window.location.href = `./index.html?${params.toString()}`
  }

  huntUI.setup(
    function () {
      switch (huntUI.choose.value) {
        case '0':
          if (huntMode !== 'hide') switchToHide()
          break
        case '1':
          if (huntMode !== 'seek') switchToSeek()
          break
        default:
          console.log('unknown hunt mode')
          break
      }
    },
    huntMode === 'hide' ? 0 : 1
  )
}
