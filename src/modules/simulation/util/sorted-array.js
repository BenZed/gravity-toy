/******************************************************************************/
// Helper
/******************************************************************************/

const STRICT = Symbol('return -1 if missing')

function ascending (a, b) {
  return a > b ? 1 : a < b ? -1 : 0
}

function search (arr, value, strict) {

  let min = 0
  let max = arr.length - 1

  // If the array is sorted in descending order
  // const delta = arr[max] < arr[min]
  //   ? -1
  //   : 1

  while (min <= max) {
    const mid = (min + max) >> 1
    const _value = arr[mid]

    if (_value === value)
      return mid

    if (_value < value)
      min = mid + 1 // delta
    else
      max = mid
  }

  return strict === STRICT ? -1 : min
}

/******************************************************************************/
// Main
/******************************************************************************/

class SortedArray extends Array {

  static get [Symbol.species] () {
    return Array
  }

  constructor (...args) {
    super(...args)
    this.sort()
  }

  // Insertion sort
  sort (compare = ascending) {

    const { length } = this

    for (let i = 1; i < length; i++) {
      const item = this[i]

      // eslint-disable-next-line no-var
      for (var ii = i - 1; ii >= 0 && compare(this[ii], item) > 0; ii--)
        this[ii + 1] = this[ii]

      this[ii + 1] = item
    }

    return this
  }

  filter (...args) {
    const filtered = super.filter(...args)
    return new SortedArray(...filtered)
  }

  map (...args) {
    const mapped = super.map(...args)
    return new SortedArray(...mapped)
  }

  lastIndexOf (value) {
    const index = search(this, value, STRICT)
    return index
  }

  indexOf (value) {
    let index = this.lastIndexOf(value)

    // Search returns the last index of a given value, where indexOf should
    // return the first
    while (this[index - 1] === value)
      index--

    return index
  }

  insert (value) {
    const index = search(this, value)
    this.splice(index, 0, value)

    return index
  }

  remove (value) {
    const index = this.lastIndexOf(value)
    if (index > -1)
      this.splice(index, 1)

    return index
  }
}

/******************************************************************************/
// Exports
/******************************************************************************/

export default SortedArray
