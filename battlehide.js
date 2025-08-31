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

mapUI.setup(function () {
  friend.UI.resetBoardSize()
  newGame()
})
document.addEventListener('keydown', function (event) {
  switch (event.key) {
    case 'r':
    case 'R':
      newGame()
      break
  }
})

// initial
newGame()
