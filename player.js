import { gameMaps  } from './map.js'
 


const score = { 
  shot: new Set(),
  autoMisses: 0,
  reset: function() {
    this.shot.clear()
    this.autoMisses = 0
  }, 
  newShotKey: function (r, c) {
    const key = `${r},${c}`
    if (this.shot.has(key)) return null
    return key
  },
  createShotKey: function (r, c) {
    const key = this.newShotKey(r, c)
    if (key) {
      this.shot.add(key)
    }
    return key
  },
 noOfShots: function() {
  return (this.shot.size - this.autoMisses)
 },
 addAutoMiss: function (r, c) {
    const key = this.createShotKey(r, c)
    if (!key) return key // already shot here
    this.autoMisses++
    return key
  },
}

export const player = { 
  ships: [], 
  score: score,
  createShips: function () {
    const ships = []
    let id = 1
    for (const base of gameMaps.baseShapes) {
      const letter = base.letter
      const symmetry = base.symmetry
      const num = gameMaps.current.shipNum[letter]
      for (let i = 0; i < num; i++) {
        ships.push({
          id,
          symmetry,
          letter,
          cells: [],
          hits: new Set(),
          sunk: false
        })
        id++
      }
    }
    return ships
  },

}