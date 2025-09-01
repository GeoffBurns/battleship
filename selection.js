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
      this.element.style.left = x + 10 + 'px'
      this.element.style.top = y + 10 + 'px'
    }
  }
}

class SelectedShip {
  constructor (ship, offsetX, offsetY, cellSize) {
    const row = Math.floor(offsetY / cellSize)
    const col = Math.floor(offsetX / cellSize)
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
  setVariant (index) {
    this.index = index
    const variant = this.variant[index]
    this.ghost.setVariant(variant)
  }
  variant () {
    return this.variants[this.index]
  }
  canFlip () {
    const type = this.type
    return type === 'H' || type === 'A'
  }
  canRotate () {
    const type = this.type
    return type === 'H' || type === 'A' || type === 'L'
  }
  rotate () {
    let index = this.index
    switch (this.type) {
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
    this.setVariant(index)
  }
  leftRotate () {
    let index = this.index
    switch (this.type) {
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
    this.setVariant(index)
  }
  flip () {
    let index = this.index
    switch (this.type) {
      case 'H':
        index = (index + 2) % 4
        break
      case 'A':
        const flipped = index > 1 ? 0 : 2
        const rotated = index % 2
        index = flipped + rotated
        break
    }
    this.setVariant(index)
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

    //  console.log("vs - " + JSON.stringify(this.variants))
    //    console.log("v - " + JSON.stringify(variant))
    if (this.ghost && this.inAllBounds(r, c, variant)) {
      return canPlace(variant, r, c, this.letter, shipCellGrid)
    }
    return false
  }
  addToShipCell (r, c, shipCellGrid) {
    return placeVariant(
      r,
      c,
      this.variant(),
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
    const r0 = r - this.cursor[0] - 1
    const c0 = c - this.cursor[1] - 1
    return canPlace(r0, c0, shipCellGrid)
  }
  placeCells (r, c, shipCellGrid) {
    const r0 = r - this.cursor[0] - 1
    const c0 = c - this.cursor[1] - 1
    if (canPlace(r0, c0, shipCellGrid)) {
      return addToShipCell(r0, c0, shipCellGrid)
    }
    return null
  }

  place (r, c, shipCellGrid) {
    const placed = placeCells(r, c, shipCellGrid)
    if (placed) return this.ship.place()
  }
}

setSelectionBuilder((ship, offsetX, offsetY, cellSize) => {
  return new SelectedShip(ship, offsetX, offsetY, cellSize)
})

document.addEventListener('dragend', () => {
  removeSelection()
})

document.addEventListener('dragover', e => {
  e.preventDefault()

  if (!selection) return

  // position ghost under cursor
  selection.move(e)
})
