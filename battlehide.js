import { mapUI } from './mapUI.js'
import { friend } from './friend.js'

const newGameBtn = document.getElementById('newGame')
friend.UI.resetBoardSize()
function newGame () {
  friend.resetModel()
  friend.resetUI(friend.ships)
}
// wire buttons
newGameBtn.addEventListener('click', newGame)
friend.wireupButtons()

mapUI.setup(function () {
  friend.UI.resetBoardSize()
  newGame()
})
document.addEventListener('keydown', function (event) {
  switch (event.key) {
    case 'c':
    case 'C':
      newGame()
      break
    case 'r':
    case 'R':
      friend.onClickRotate()
      break
    case 'l':
    case 'L':
      friend.onClickRotateLeft()
      break
    case 'f':
    case 'F':
      friend.onClickFlip()
      break
    case 't':
    case 'T':
      friend.onClickTest()
      break
  }
})

friend.UI.dragEnd(document)


// initial
newGame()
