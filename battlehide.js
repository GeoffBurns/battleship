import { mapUI } from './mapUI.js'
import { friend } from './friend.js'
import { selection } from './utils.js'
import { friendUI } from './friendUI.js'

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


let lastmodifier = ''

document.addEventListener('dragover', e => {
  e.preventDefault()

  if (!selection) return
  const effect = e.dataTransfer.dropEffect
  const allow = e.dataTransfer.effectAllowed

  if (lastmodifier !== allow)
  {
    lastmodifier = allow
    if (allow === 'link') {
      friend.onClickRotate()
      friendUI.highlight(friend.shipCellGrid)
    } else if (allow === 'copy') {
      friend.onClickFlip()
      friendUI.highlight(friend.shipCellGrid)
    } else if (allow === 'none') {
      friend.onClickRotateLeft()
      friendUI.highlight(friend.shipCellGrid)
    }
  }
 
  // position ghost under cursor
  selection.move(e)
})


// initial
newGame()
