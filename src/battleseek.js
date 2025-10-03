import { setupGameOptions } from './navbar.js'
import { setupEnemy, newGame } from './enemySetup.js'
import { enemyUI } from './enemyUI.js'

setupGameOptions(enemyUI.resetBoardSize.bind(enemyUI), newGame, 'seek')
setupEnemy()
// initial
newGame()
