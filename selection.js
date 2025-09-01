import { gameMaps } from './map.js'
import { friend } from './friend.js'
import {
  selection,
  removeSelection,
  setSelectionBuilder,
  canPlace,
  placeVariant
} from './utils.js'

class Ghost {
  constructor (variant, letter) {
    const el = document.createElement('div')
    el.classList.add('selection')
    this.element = el
    this.letter = letter
    el.className = 'ship-ghost'
    friend.UI.setDragShipContents(el, variant, letter)
    document.body.appendChild(el)
  }
  setVariant (variant) { 
    if (this.element) {
      this.element.innerHTML = ''
      friend.UI.setDragShipContents(this.element, variant, this.letter)
   
    }
  }
  remove () {
    if (this.element) this.element.remove()
    this.element = null
  }
  moveTo (x, y) {
    if (this.element) {
    //  this.element.style.left = x + 10 + 'px'
   //   this.element.style.top = y + 10 + 'px'

      this.element.style.left = x  + 'px'
      this.element.style.top = y  + 'px'
    }
  }
}

class SelectedShip {
  constructor (ship, offsetX, offsetY, cellSize, source) {
    const row = Math.floor(offsetY / cellSize)
    const col = Math.floor(offsetX / cellSize)
    this.source = source
    this.cursor = [row, col]
    this.offset = [offsetX, offsetY]
    this.ship = ship
    const shape = ship.shape()
    const letter = ship.letter
    const variants = shape.variants()
    this.type = shape.type()
    this.id = ship.id
    this.shape = shape
    this.index = 0
    this.letter = letter
    this.variants = variants
    // this.noOfVariants = variants.length
    this.ghost = new Ghost(variants[0], letter)
  }
  remove () {
    if (this.ghost) this.ghost.remove()
    this.ghost = null
  }
  moveTo (x, y) {
    if (this.ghost) this.ghost.moveTo(x, y)
  }
  move (e) {
    this.moveTo(e.pageX - this.offset[0] - 13, e.pageY - this.offset[1] - 13)
  }
  setVariantByIndex (index) {
    this.index = index
    const variant = this.variants[index]
    this.ghost.setVariant(variant)
  }
  variant () {
    return this.variants[this.index]
  }
  canFlip () {
    const symmetry = this.shape.symmetry
    return symmetry === 'H' || symmetry === 'A'
  }
  canRotate () { 
    const symmetry = this.shape.symmetry
    return symmetry === 'H' || symmetry === 'A' || symmetry === 'L'
  }
  rotate () {
    let index = this.index
    const symmetry = this.shape.symmetry
    switch (symmetry) {
      case 'L':
        index = index === 0 ? 1 : 0
        break
      case 'H':
        index = (index + 1) % 4
        break
      case 'A':
        const flipped = index > 1 ? 2 : 0
        const rotated = index % 2
        index = flipped + (rotated === 0 ? 1 : 0)
        break
    } 
  //  const [x,y] = this.offset
 //   this.offset = [-y,x]
  //  const [r,c] = this.cursor
  //  this.cursor = [r,-c]


    this.offset = [0,0] 
    this.cursor = [0,0]
    this.setVariantByIndex(index)
  }
  leftRotate () {
    let index = this.index
    const symmetry = this.shape.symmetry
    switch (symmetry) {
      case 'L':
        index = index === 0 ? 1 : 0
        break
      case 'H':
        index = (index - 1) % 4
        break
      case 'A':
        const flipped = index > 1 ? 2 : 0
        const rotated = index % 2
        index = flipped + (rotated === 0 ? 1 : 0)
        break
    }
    this.setVariantByIndex(index)
  }
  flip () {
    let index = this.index
    const symmetry = this.shape.symmetry
    switch (symmetry) {
      case 'H':
        index = (index + 2) % 4
        break
      case 'A':
        const flipped = index > 1 ? 0 : 2
        const rotated = index % 2
        index = flipped + rotated
        break
    }
    this.setVariantByIndex(index)
  }
  inAllBounds (r, c, variant) {
    variant = variant || this.variant()

    try {
      const maxShipR = Math.max(...variant.map(s => s[0]))
      const maxShipC = Math.max(...variant.map(s => s[1]))
      return gameMaps.inAllBounds(r, c, maxShipR, maxShipC)
    } catch (error) {
      console.error('An error occurred:', error.message)
      return false
    }
  }
  canPlace (r, c, shipCellGrid) {
    const variant = this.variant()
    if (this.ghost && this.inAllBounds(r, c, variant)) {
      return canPlace(variant, r, c, this.letter, shipCellGrid)
    }
    return false
  }
  addToShipCell (r, c, shipCellGrid) {
    return placeVariant(
      this.variant(),
      r,
      c,
      this.letter,
      this.id,
      shipCellGrid
    )
  }
  offsetCell (r, c) {
    const r0 = r - this.cursor[0]
    const c0 = c - this.cursor[1]
    return [r0, c0]
  }
  canPlaceCells (r, c, shipCellGrid) {
    const r0 = r - this.cursor[0]
    const c0 = c - this.cursor[1]
    return this.canPlace(r0, c0, shipCellGrid)
  }
  placeCells (r, c, shipCellGrid) {
    const r0 = r - this.cursor[0]
    const c0 = c - this.cursor[1]
    if (this.canPlace(r0, c0, shipCellGrid)) {
      return this.addToShipCell(r0, c0, shipCellGrid)
    }
    return null
  }

  place (r, c, shipCellGrid) {
    const placed = this.placeCells(r, c, shipCellGrid) 
    if (placed) {
      return this.ship.place(placed)
    }
    return null
  }
}

setSelectionBuilder((ship, offsetX, offsetY, cellSize, source) => {
  return new SelectedShip(ship, offsetX, offsetY, cellSize, source)
}) 

