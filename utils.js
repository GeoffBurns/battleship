
import {
  gameMaps
} from './map.js'

// geometry helpers
const inRange = (r, c) => element =>
  element[0] == r && element[1] <= c && element[2] >= c

export function inBounds (r, c) {
  return r >= 0 && r < gameMaps.current.rows && c >= 0 && c < gameMaps.current.cols
}
export function isLand (r, c) {
  return gameMaps.current.landArea.some(inRange(r, c))
}
// variant helpers
function rotate (shape) {
  return shape.map(([r, c]) => [c, -r])
}
function flipV (shape) {
  return shape.map(([r, c]) => [-r, c])
}
function normalize (shape) {
  const minR = Math.min(...shape.map(s => s[0]))
  const minC = Math.min(...shape.map(s => s[1]))
  return shape.map(([r, c]) => [r - minR, c - minC])
}
function asymmetricVariantsOf (cells) {
  let fliped = flipV(cells)
  return [cells, rotate(cells), fliped, rotate(fliped)]
}
function symmetricVariantsOf (cells) {
  let variants = [cells]
  for (let i = 0; i < 3; i++) {
    variants.push(rotate(variants[variants.length - 1]))
  }
  return variants
}
function straightVariantsOf (cells) {
  return [cells, rotate(cells)]
}
function variantsOf (shapeElement) {
  if (!shapeElement || !shapeElement.symmetry || !shapeElement.cells)
    throw new Error(
      'Invalid shapeElement ' + JSON.stringify(shapeElement, null, 2)
    )
  switch (shapeElement.symmetry) {
    case 'A':
      return asymmetricVariantsOf(shapeElement.cells)
    case 'S':
      return [shapeElement.cells]
    case 'H':
      return symmetricVariantsOf(shapeElement.cells)
    case 'L':
      return straightVariantsOf(shapeElement.cells)
    default:
      throw new Error(
        'Unknown symmetry type for ' + JSON.stringify(shapeElement, null, 2)
      ) // The 'null, 2' adds indentation for readability);
  }
}
// placement rules: no-touch (including diagonals), and area restrictions
function canPlace (variant, r0, c0, letter, player) {
  for (const [dr, dc] of variant) {
    const rr = r0 + dr,
      cc = c0 + dc
    if (!inBounds(rr, cc)) return false
    // area rules
    if (gameMaps.shipTypes[letter] === 'G' && !isLand(rr, cc)) return false
    if (gameMaps.shipTypes[letter] === 'S' && isLand(rr, cc)) return false
    // no-touch check neighbors
    for (let nr = rr - 1; nr <= rr + 1; nr++)
      for (let nc = cc - 1; nc <= cc + 1; nc++) {
        if (inBounds(nr, nc) && player.grid[nr][nc]) return false
      }
  }
  return true
}
function placeVariant (variant, r0, c0, letter, id, player) {
  const placedCells = [] 
  for (const [dr, dc] of variant) {
    const rr = r0 + dr,
      cc = c0 + dc
    player.grid[rr][cc] = { id, letter }
    placedCells.push([rr, cc])
  }
  return placedCells
}
function shuffleArray (array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}
export function randomPlaceShape (shapeObj, player) {
  const letter = shapeObj.letter
  const id = shapeObj.id
  const shape = gameMaps.shapesByLetter[letter]
  if (!shape) throw new Error('No shape for letter ' + letter)
  let variants0 = variantsOf(shape)
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
      if (canPlace(variant, r0, c0, letter, player)) {
        return placeVariant(variant, r0, c0, letter, id, player)
      }
    }
  }
  return null
}
export function sunkDescription (letter) {
  return (
    gameMaps.shipDescription[letter] + ' ' + gameMaps.shipSunkDescriptions[gameMaps.shipTypes[letter]]
  )
}
