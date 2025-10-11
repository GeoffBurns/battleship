import { gameMaps } from './maps.js'
import { all, mixed } from './Shape.js'
import { dragNDrop } from './dragndrop.js'

export class ScoreUI {
  constructor (playerPrefix) {
    // Initialization logic
    //
    this.shots = document.getElementById(playerPrefix + '-shots')
    this.hits = document.getElementById(playerPrefix + '-hits')
    this.sunk = document.getElementById(playerPrefix + '-sunk')
    this.placed = document.getElementById(playerPrefix + '-placed')
    this.weaponsPlaced = document.getElementById(playerPrefix + '-weapons')
    this.zone = document.getElementById(playerPrefix + '-zone')
    this.shotsLabel = document.getElementById(playerPrefix + '-shots-label')
    this.hitsLabel = document.getElementById(playerPrefix + '-hits-label')
    this.sunkLabel = document.getElementById(playerPrefix + '-sunk-label')
    this.placedLabel = document.getElementById(playerPrefix + '-placed-label')
    this.weaponsLabel = document.getElementById(playerPrefix + '-weapons-label')
    this.zoneLabel = document.getElementById(playerPrefix + '-zone-label')
    this.tallyBox = document.getElementById(playerPrefix + '-tallyBox')
    this.zoneSync = []
  }
  display (ships, shots) {
    this.shots.textContent = shots.toString()
    const hits = ships.reduce((sum, s) => sum + s.hits.size, 0)
    this.hits.textContent = hits.toString()
    const sunkCount = ships.filter(s => s.sunk).length
    this.sunk.textContent = `${sunkCount} / ${ships.length}`
  }

  createZoneEntry (labelTxt, bag, stress, style) {
    const entry = document.createElement('div')
    entry.style = style
    const label = document.createElement(stress)
    label.textContent = labelTxt + ' : '
    entry.appendChild(label)
    const count = document.createElement('span')
    count.textContent = bag.size.toString()
    entry.appendChild(count)
    this.zone.appendChild(entry)
    return count
  }

  displacementDescription (ratio) {
    const thresholds = [
      { limit: 0.02, desc: 'empty' },
      { limit: 0.15, desc: 'lonely' },
      { limit: 0.22, desc: 'very scattered' },
      { limit: 0.27, desc: 'scattered' },
      { limit: 0.31, desc: 'very sparse ' },
      { limit: 0.38, desc: 'sparse' },
      { limit: 0.45, desc: 'very loose' },
      { limit: 0.49, desc: 'loose' },
      { limit: 0.53, desc: 'medium' },
      { limit: 0.58, desc: 'close' },
      { limit: 0.63, desc: 'very close' },
      { limit: 0.68, desc: 'tight' },
      { limit: 0.72, desc: 'very tight' },
      { limit: 0.76, desc: 'crowded' },
      { limit: 0.8, desc: 'very crowded' },
      { limit: 0.81, desc: 'compact' },
      { limit: 0.83, desc: 'very compact' }
    ]
    for (const { limit, desc } of thresholds) {
      if (ratio < limit) return desc
    }
    return 'very squeezy'
  }

  createAddZoneEntry (labelTxt, displacedArea, ships, stress, style, extra) {
    extra = extra || 0
    const entry = document.createElement('div')
    entry.style = style
    const label = document.createElement(stress)
    label.textContent = labelTxt + ' : '
    entry.appendChild(label)
    const tightness = document.createElement('span')

    const shipDisplacement =
      ships.reduce(
        (accumulator, ship) => accumulator + ship.shape().displacement,
        0
      ) + extra
    tightness.textContent = this.displacementDescription(
      shipDisplacement / displacedArea
    )
    //  + ` ${shipDisplacement} / ${displacedArea}`
    entry.appendChild(tightness)
    this.zone.appendChild(entry)
    return tightness
  }
  displayZoneInfo () {
    for (const entry of this.zoneSync) {
      gameMaps.current.recalcTracker(entry.tracker.subterrain, entry.tracker)
      entry.counts[0].textContent = entry.tracker.total.size.toString()
      entry.counts[1].textContent = entry.tracker.margin.size.toString()
      entry.counts[2].textContent = entry.tracker.core.size.toString()
    }
  }
  refresh
  displayAddZoneInfo (model) {
    this.zone.innerHTML = ''
    const displacedArea = model.displacedArea()

    this.createAddZoneEntry(
      'Map',
      displacedArea,
      model.ships,
      'b',
      'line-height:1.2;'
    )
    const mixedShapes = model.ships
      .map(s => s.shape())
      .filter(s => s.subterrain === mixed)
    const airShapes = model.ships
      .map(s => s.shape())
      .filter(s => s.subterrain === all)
    const airAmount =
      airShapes.reduce(
        (accumulator, shape) => accumulator + shape.displacement,
        0
      ) / 4
    for (const tracker of gameMaps.current.subterrainTrackers) {
      gameMaps.current.recalcTracker(tracker.subterrain, tracker)
      gameMaps.current.calcFootPrint(tracker)
      const displacedArea = (tracker.total.size + tracker.footprint.size) / 2

      const mixedAmount = mixedShapes.reduce(
        (accumulator, shape) =>
          accumulator + shape.displacementFor(tracker.subterrain),
        0
      )

      this.createAddZoneEntry(
        tracker.subterrain.title,
        displacedArea,
        model.ships.filter(s => s.shape().subterrain === tracker.subterrain),
        'span',
        'line-height:1.2;',
        airAmount + mixedAmount
      )
    }
  }

  setupZoneInfo () {
    let display = []
    this.zone.innerHTML = ''
    for (const tracker of gameMaps.current.subterrainTrackers) {
      gameMaps.current.recalcTracker(tracker.subterrain, tracker)

      let counts = []
      counts.push(
        this.createZoneEntry(
          tracker.subterrain.title,
          tracker.total,
          'b',
          'line-height:1.2;'
        )
      )
      counts.push(
        this.createZoneEntry(
          tracker.m_zone.title,
          tracker.margin,
          'span',
          'font-size:75%;line-height:1.2'
        )
      )
      counts.push(
        this.createZoneEntry(
          tracker.c_zone.title,
          tracker.core,
          'span',
          'font-size:75%;line-height:1.2'
        )
      )
      display.push({ tracker: tracker, counts: counts })
    }
    this.zoneSync = display
  }
  resetTallyBox () {
    this.tallyBox.innerHTML = ''
  }
  buildShipBox (ship) {
    const box = document.createElement('div')
    const letter = ship.letter
    box.className = 'tally-box'
    if (ship.sunk) {
      box.textContent = 'X'
      box.style.background = '#ff8080'
      box.style.color = '#400'
    } else {
      box.textContent = letter
      box.style.background = gameMaps.shipColors[letter] || '#333'
      box.style.color = gameMaps.shipLetterColors[letter] || '#fff'
    }
    return box
  }
  buildTallyRow (ships, letter, rowList, boxer, tallyGroup) {
    boxer = boxer || this.buildShipBox

    const row = document.createElement('div')
    row.className = 'tally-row'
    switch (tallyGroup) {
      case 'S':
        row.classList.add('sea')
        break
      case 'G':
        row.classList.add('land')
        break
      case 'A':
        row.classList.add('air')
        break
      case 'X':
        row.classList.add('special')
        break
    }
    const matching = ships.filter(s => s.letter === letter)

    matching.forEach(s => {
      const box = boxer(s)
      row.appendChild(box)
    })

    rowList.appendChild(row)
  }

  buildBombRow (rowList, viewModel, weaponSystem) {
    if (!weaponSystem.weapon.isLimited) return
    const ammoTotal = weaponSystem.ammoTotal()
    const ammoUsed = weaponSystem.ammoUsed()
    const row = document.createElement('div')
    row.className = 'tally-row'
    row.classList.add('weapon')
    for (let i = 0; i < ammoTotal; i++) {
      const box = document.createElement('div')
      dragNDrop.makeDraggable(viewModel, box, null, weaponSystem.weapon, true)
      box.className = 'tally-box'
      box.style.fontSize = '105%'
      if (i < ammoUsed) {
        box.textContent = 'X'
        box.style.background = gameMaps.shipColors[weaponSystem.weapon.letter]
        box.style.opacity = 0.45
        box.style.color = '#000'
      } else {
        box.textContent = weaponSystem.weapon.letter
        box.style.background = gameMaps.shipColors[weaponSystem.weapon.letter]
        box.style.color = gameMaps.shipLetterColors[weaponSystem.weapon.letter]
      }
      row.appendChild(box)
    }
    rowList.appendChild(row)
  }
  buildShipTally (ships, boxer) {
    this.altBuildTally(ships, [], boxer)
  }
  buildTallyFromModel (model, viewModel) {
    this.altBuildTally(
      model.ships,
      model.loadOut.weaponSystems,
      null,
      viewModel,
      true
    )
  }

  buildTally (ships, weaponSystems, viewModel) {
    this.altBuildTally(ships, weaponSystems, null, viewModel, true)
  }
  addShipTally (ships) {
    this.altBuildTally(ships, [], null, false)
  }

  altBuildTally (ships, weaponSystems, boxer, viewModel, withWeapons) {
    function shipLetters (tallyGroup) {
      return [
        ...new Set(
          ships
            .filter(s => s.shape().tallyGroup === tallyGroup)
            .map(s => s.letter)
        )
      ].toSorted()
    }
    this.resetTallyBox()

    const tallyTitle = document.getElementById('tally-title')
    if (tallyTitle) {
      tallyTitle.classList.toggle('hidden', ships.length === 0)
    }

    const surfaceContainer = document.createElement('div')
    surfaceContainer.classList.add('tally-group-container')

    const seaColumn = document.createElement('div')
    seaColumn.className = 'tally-col'
    const landColumn = document.createElement('div')
    landColumn.className = 'tally-col'

    const sea = shipLetters('S')
    const land = shipLetters('G')
    const air = shipLetters('A')
    const special = shipLetters('X')

    const count = { s: 0, g: 0 }
    const incSea = () => count.s++
    const incLand = () => count.g++
    for (const letter of sea) {
      this.buildTallyRow(ships, letter, seaColumn, boxer, 'S')
      incSea()
    }

    for (const letter of land) {
      this.buildTallyRow(ships, letter, landColumn, boxer, 'G')
      incLand()
    }
    const airTrack =
      count.s < count.g
        ? { col: seaColumn, inc: incSea }
        : { col: landColumn, inc: incLand }

    for (const letter of air) {
      this.buildTallyRow(ships, letter, airTrack.col, boxer, 'A')
      airTrack.inc()
    }
    const specialTrack =
      count.s < count.g
        ? { col: seaColumn, inc: incSea }
        : { col: landColumn, inc: incLand }
    for (const letter of special) {
      this.buildTallyRow(ships, letter, specialTrack.col, boxer, 'X')
      specialTrack.inc()
    }
    if (withWeapons && viewModel) {
      const weaponTrack =
        count.s < count.g
          ? { col: seaColumn, inc: incSea }
          : { col: landColumn, inc: incLand }
      for (const wps of weaponSystems) {
        this.buildBombRow(weaponTrack.col, viewModel, wps)
      }
    }
    surfaceContainer.appendChild(seaColumn)
    surfaceContainer.appendChild(landColumn)

    this.tallyBox.appendChild(surfaceContainer)
  }
}
