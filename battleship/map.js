import { inRange } from './maps.js'

export class Map {
  constructor (title, rows, cols, shipNum, landArea) {
    this.title = title
    this.rows = rows
    this.cols = cols
    this.shipNum = shipNum
    this.landArea = landArea
  }
  inBounds (r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols
  }
  inAllBounds (r, c, height, width) {
    return r >= 0 && r + height < this.rows && c + width >= 0 && c < this.cols
  }
  isLand (r, c) {
    return this.landArea.some(inRange(r, c))
  }
}
