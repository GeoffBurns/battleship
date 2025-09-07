import { gameMaps } from './map.js'

export class ChooseUI {
  constructor (list, tagetId) {
    this.list = list
    this.choose = document.getElementById(tagetId)
    this.containerWidth = 520
  }

  setup (callback, defaultIndex = 0) {
    let id = 0
    this.list.forEach(choice => {
      let option = document.createElement('option')
      option.value = id
      option.textContent = choice
      this.choose.appendChild(option)
      if (id === defaultIndex) {
        option.selected = 'selected'
      }
      id++
    })
    this.onChange(callback)
  }

  onChange (callback) {
    this.choose.addEventListener('change', function () {
      const index = this.value
      const title = gameMaps.setTo(index)
      callback(index, title)
    })
  }
}

export const mapUI = new ChooseUI(
  gameMaps.list.map(m => m.title),
  'chooseMap'
)
export const huntUI = new ChooseUI(['hide', 'seek'], 'chooseHunt')
