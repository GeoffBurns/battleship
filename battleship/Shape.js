import { gameMaps } from './maps.js'

// variant helpers
function rotate (cells) {
  return cells.map(([r, c]) => [c, -r])
}
function flipV (cells) {
  return cells.map(([r, c]) => [-r, c])
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
export class Shape {
  constructor (letter, symmetry, cells) {
    this.letter = letter
    this.symmetry = symmetry
    this.cells = cells
  }

  variants () {
    switch (this.symmetry) {
      case 'A':
        return asymmetricVariantsOf(this.cells)
      case 'S':
        return [this.cells]
      case 'H':
        return symmetricVariantsOf(this.cells)
      case 'L':
        return straightVariantsOf(this.cells)
      default:
        throw new Error(
          'Unknown symmetry type for ' + JSON.stringify(this, null, 2)
        ) // The 'null, 2' adds indentation for readability);
    }
  }
  type () {
    return gameMaps.shipTypes[this.letter]
  }
  noOf () {
    return gameMaps.current.shipNum[this.letter]
  }
  color () {
    return gameMaps.shipColors[this.letter]
  }
  sunkDescription () {
    return gameMaps.sunkDescription(this.letter)
  }
  letterColors () {
    return gameMaps.shipLetterColors[this.letter]
  }
  description () {
    return gameMaps.shipDescription[this.letter]
  }
}
