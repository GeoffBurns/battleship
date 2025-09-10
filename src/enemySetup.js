import { enemy } from './enemy.js'

let otherboard = null
const newGameBtn = document.getElementById('newGame')
export function newGame () {
  if (otherboard) otherboard()
  enemy.resetModel()
  enemy.resetUI(enemy.ships)
  enemy.updateMode()
}

function setupSeekShortcuts (placement) {
  if (placement) {
    document.getElementById('newPlace2').addEventListener('click', placement)
  }

  function handleSeekShortcuts (event) {
    switch (event.key) {
      case 'p':
      case 'P':
        if (placement) placement()
        break
      case 'r':
      case 'R':
        newGame()
        break
      case 'v':
      case 'V':
        enemy.onClickReveal()
        break
      case 'm':
      case 'M':
        if (!enemy.carpetMode) enemy.onClickCarpetMode()
        break
      case 's':
      case 'S':
        if (enemy.carpetMode) enemy.onClickCarpetMode()
        break
    }
  }

  document.addEventListener('keydown', handleSeekShortcuts)

  return () => document.removeEventListener('keydown', handleSeekShortcuts)
}

export function setupEnemy (placement, opponentBoard) {
  otherboard = opponentBoard

  // wire buttons
  newGameBtn.addEventListener('click', newGame)
  enemy.wireupButtons()
  return setupSeekShortcuts(placement)
}
