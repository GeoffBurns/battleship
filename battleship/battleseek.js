import { setupDropdowns } from './setup.js'
import { setupEnemy, newGame } from './enemySetup.js'
import { enemyUI } from './enemyUI.js'

setupDropdowns(enemyUI.resetBoardSize.bind(enemyUI), newGame, 'seek')
setupEnemy()
// initial
newGame()
