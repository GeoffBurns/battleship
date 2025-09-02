import { gameMaps } from './map.js'
import { friend } from './friend.js'
import {
  selection,
  removeSelection,
  setSelectionBuilder,
  setClickedShipBuilder,
  canPlace,
  placeVariant
} from './utils.js'

 function normalize (cells) {
    const minR = Math.min(...cells.map(s => s[0]))
    const minC = Math.min(...cells.map(s => s[1]))
    return cells.map(([r, c]) => [r - minR, c - minC])
  } 
    
 function normalizeVariants (variants) {
     return  variants.map(v=>normalize(v))
  } 

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
  hide() {
    this.element.style.opacity = 0
  }
  show() {
    this.element.style.opacity = ''
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

      this.element.style.left = x + 'px'
      this.element.style.top = y + 'px'
    }
  }
}
class ClickedShip {
  constructor (ship, source, variantIndex) {
    this.source = source
    this.ship = ship
    const shape = ship.shape()
    this.type = shape.type()
    this.id = ship.id
    this.shape = shape
    this.index = variantIndex || 0
    this.letter = ship.letter
    this.variants = normalizeVariants(shape.variants())
  }
  setVariantByIndex (index) {
    this.index = index
    const variant = this.variants[index]
    if (this.source) {
      this.source.innerHTML = ''
      friend.UI.setDragShipContents(this.source, variant, this.letter)
      this.source.dataset.variant = index
    } 
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
}

class SelectedShip {
  constructor (ship, offsetX, offsetY, cellSize, source, variantIndex) {
    const row = Math.floor(offsetY / cellSize)
    const col = Math.floor(offsetX / cellSize)
    this.source = source
    this.cursor = [row, col]
    this.offset = [offsetX, offsetY]
    this.ship = ship
    const shape = ship.shape() 
    this.type = shape.type()
    this.id = ship.id
    this.shape = shape
    this.index = variantIndex || 0
    const letter = ship.letter
    this.letter = letter
    const variants = normalizeVariants(shape.variants())
    this.variants = variants 
    this.ghost = new Ghost(variants[variantIndex], letter)
    this.shown = true
  }
hide() {
    this.shown = false
    if (this.ghost) this.ghost.hide()
}
  show() {
    this.shown = true
    if (this.ghost) this.ghost.show()
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

    this.offset = [0, 0]
    this.cursor = [0, 0]
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

setSelectionBuilder((ship, offsetX, offsetY, cellSize, source, index) => {
  return new SelectedShip(ship, offsetX, offsetY, cellSize, source, index)
})
setClickedShipBuilder((ship,   source, index) => {
  return new ClickedShip(ship,  source, index)
})