import { gameMaps } from './maps.js'

export class StatusUI {
  constructor () {
    this.mode = document.getElementById('modeStatus')
    this.game = document.getElementById('gameStatus')
    this.line = document.getElementById('statusLine')
    this.line2 = document.getElementById('statusLine2')
  }
  clear () {
    this.display('', '')
  }
  display (mode, game) {
    this.mode.textContent = mode
    if (game) {
      this.info(game)
    }
  }
  displayAmmoStatus (wps) {
    const { ammo, weapon } = wps
    return this.display(weapon.ammoStatus(ammo), weapon.hint)
  }
  info (game) {
    this.game.textContent = game
  }
}
