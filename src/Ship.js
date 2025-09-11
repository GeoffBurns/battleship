import { gameMaps } from './maps.js'
import { terrain } from './Shape.js'

export class Ship {
  constructor (id, symmetry, letter) {
    this.id = id
    this.symmetry = symmetry
    this.letter = letter
    this.cells = []
    this.hits = new Set()
    this.sunk = false
  }
  place (placed) {
    this.cells = placed
    this.hits = new Set()
    this.sunk = false
    return placed
  }
  unplace () {
    this.cells = []
    this.hits = new Set()
    this.sunk = false
  }
  placeCells (variant, r0, c0) {
    let placingTheCells = []
    for (const [dr, dc] of variant) {
      const rr = r0 + dr,
        cc = c0 + dc
      placingTheCells.push([rr, cc])
    }
    return placingTheCells
  }
  placeVariant (variant, r0, c0) {
    this.cells = this.placeCells(variant, r0, c0)
  }
  isRightType (r, c) {
    const shipType = this.type()
    const isLand = gameMaps.isLand(r, c)
    // area rules
    if (shipType === 'G' && !isLand) return false
    if (shipType === 'S' && isLand) return false

    return true
  }
  noTouchCheck (r, c, shipCellGrid) {
    for (let nr = r - 1; nr <= r + 1; nr++)
      for (let nc = c - 1; nc <= c + 1; nc++) {
        if (gameMaps.inBounds(nr, nc) && shipCellGrid[nr][nc]) return false
      }
    return true
  }
  canPlace (variant, r0, c0, shipCellGrid) {
    const placing = this.placeCells(variant, r0, c0)
    if (
      placing.some(([r, c]) => {
        return !gameMaps.inBounds(r, c)
      })
    ) {
      // console.log('out of bounds')
      return false
    }
    if (
      placing.some(([r, c]) => {
        return this.isRightType(r, c) === false
      })
    ) {
      //console.log('wrong type')
      return false
    }

    if (
      placing.some(([r, c]) => {
        return (gameMaps.inBounds(r, c) && shipCellGrid[r][c]) === true
      })
    ) {
      //   console.log('overlapping')
      return false
    }
    if (
      placing.some(([r, c]) => {
        return this.noTouchCheck(r, c, shipCellGrid) === false
      })
    ) {
      //   console.log('touching')
      return false
    }
    // console.log('good')
    return true
    /*
    return !placing.some(([r, c]) => {
      return (
        !gameMaps.inBounds(r, c) ||
        this.isRightType(r, c) === false ||
        this.noTouchCheck(r, c, shipCellGrid) === false
      )
    })
      */
  }
  addToGrid (shipCellGrid) {
    const letter = this.letter
    const id = this.id
    for (const [r, c] of this.cells) {
      shipCellGrid[r][c] = { id, letter }
    }
  }
  shape () {
    return gameMaps.shapesByLetter[this.letter]
  }
  sunkDescription (middle = ' ') {
    return terrain.current.sunkDescription(this.letter, middle)
  }
  type () {
    return gameMaps.shipTypes[this.letter]
  }
}
