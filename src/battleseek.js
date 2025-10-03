import { setupGameOptions, setupTabs } from './navbar.js'
import { setupEnemy, newGame } from './enemySetup.js'
import { enemyUI } from './enemyUI.js'

fetch('./navbars.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('navbar').innerHTML = html

    document.getElementById('choose-map-container').classList.remove('hidden')
    //  document.getElementById("tab-seek").classList.add('you-are-here')
    setupTabs('seek')

    setupGameOptions(enemyUI.resetBoardSize.bind(enemyUI), newGame)
    setupEnemy()
    // initial
    newGame()
  })

  .catch(err => console.error('Failed to load navbar:', err))
