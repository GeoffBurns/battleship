import { gameMaps } from './maps.js'

function shuffleArray (array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1))
    let temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}
export function randomPlaceShape (ship, shipCellGrid) {
  const letter = ship.letter
  const shape = ship.shape()
  if (!shape) throw new Error('No shape for letter ' + letter)
  let variants0 = shape.variants()
  const variants = shuffleArray(variants0)

  // try random placements
  const maxAttempts = 20000
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (const variant of variants) {
      // compute bounds for random origin so variant fits
      const maxR = Math.max(...variant.map(s => s[0]))
      const maxC = Math.max(...variant.map(s => s[1]))
      const r0 = Math.floor(Math.random() * (gameMaps.current.rows - maxR))
      const c0 = Math.floor(Math.random() * (gameMaps.current.cols - maxC))
      if (ship.canPlace(variant, r0, c0, shipCellGrid)) {
        ship.placeVariant(variant, r0, c0)
        ship.addToGrid(shipCellGrid)
        return ship.cells
      }
    }
  }
  return null
}

export function throttle (func, delay) {
  let inThrottle
  let lastFn
  let lastTime

  return function () {
    const context = this
    const args = arguments

    if (!inThrottle) {
      func.apply(context, args)
      lastTime = Date.now()
      inThrottle = true
    } else {
      clearTimeout(lastFn)
      lastFn = setTimeout(function () {
        if (Date.now() - lastTime >= delay) {
          func.apply(context, args)
          lastTime = Date.now()
        }
      }, Math.max(delay - (Date.now() - lastTime), 0))
    }
  }
}
