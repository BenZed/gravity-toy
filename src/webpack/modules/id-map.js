// An id map, quite simply, is a map that takes id's as keys, and
// stores any value.

// An id is any object with an 'equals' function, that returns true if two
// objects are value-equivalent (not reference equivalent)

// ObjectIds fit quite nicely, but strings or numbers will work too.

// Beyond that, it has the exact same api as javascripts Map object

/******************************************************************************/
// Symbols
/******************************************************************************/

const IDS = Symbol('map-ids')

const VALUES = Symbol('map-values')

/******************************************************************************/
// Helper
/******************************************************************************/

export function idValid (input) {

  const type = typeof input
  if (type === 'string')
    return true

  if (type === 'number' && !Number.isNaN(input))
    return true

  if (type === 'symbol')
    return true

  return type === 'object' &&
    input !== null &&
    typeof input.equals === 'function'
}

function idsEqual (a, b) {

  return typeof a === 'object'
    ? typeof b === 'object' && a.equals(b)
    : a === b
}

function getIndex (idA, map) {

  // So this class can be extended
  const Map = map.constructor

  if (!Map.idValid(idA))
    throw new Error(`${idA} is not a valid id.`)

  for (let index = 0; index < map[IDS].length; index++) {
    const idB = map[IDS][index]

    if (Map.idsEqual(idA, idB))
      return index
  }

  return map[IDS].length
}

/******************************************************************************/
// Types
/******************************************************************************/

class IdMap {

  static idValid = idValid

  static idsEqual = idsEqual

  constructor (...keyValues) {

    if (keyValues.length % 2 !== 0)
      throw new Error('Must be an even number of arguments.')

    for (let i = 0; i < keyValues.length; i += 2) {

      const key = keyValues[i]
      const value = keyValues[i + 1]

      this.set(key, value)
    }
  }

  get (key) {
    const index = getIndex(key, this)
    return this[VALUES][index]
  }

  set (key, value) {
    const index = getIndex(key, this)

    this[IDS][index] = key
    this[VALUES][index] = value

    return this
  }

  has (key) {
    const index = getIndex(key, this)
    return index !== this.size
  }

  delete (key) {
    const index = getIndex(key, this)
    const exists = index !== this.size

    this[IDS].splice(index, 1)
    this[VALUES].splice(index, 1)

    return exists
  }

  clear () {
    this[IDS].length = 0
    this[VALUES].length = 0
  }

  forEach (func) {
    for (let i = 0; i < this.size; i++) {
      const id = this[IDS][i]
      const value = this[VALUES][i]

      func([id, value], i, this)
    }
  }

  get size () {
    return this[IDS].length
  }

  * keys () {
    for (let i = 0; i < this.size; i++) {
      const id = this[IDS][i]
      yield id
    }
  }

  * values () {
    for (let i = 0; i < this.size; i++) {
      const value = this[VALUES][i]
      yield value
    }
  }

  * [Symbol.iterator] () {
    for (let i = 0; i < this.size; i++) {
      const id = this[IDS][i]
      const value = this[VALUES][i]

      yield [id, value]
    }
  }

  [Symbol.toStringTag] () {
    return 'IdMap'
  }

  [IDS] = [];

  [VALUES] = []

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default IdMap
