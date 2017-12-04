/******************************************************************************/
// Helper
/******************************************************************************/

function ascending (a, b) {
  return a > b ? 1 : a < b ? -1 : 0
}

function search (arr, value, strict) {
  let min = 0
  let max = arr.length

  while (min < max) {
    const mid = (min + max) >> 1
    const _value = arr[mid]

    if (_value === value)
      return mid

    if (_value < value)
      min = mid + 1
    else
      max = mid
  }

  return strict ? -1 : min
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
  sort (pred = ascending) {

    const { length } = this

    for (let i = 1; i < length; i++) {
      const item = this[i]

      // eslint-disable-next-line no-var
      for (var ii = i - 1; ii >= 0 && pred(this[ii], item) > 0; ii--)
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

  // Binary Search
  lastIndexOf (value) {
    const index = search(this, value, true)
    return index
  }

  indexOf (value) {
    let index = search(this, value, true)

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
    const index = this.indexOf(value)
    if (index > -1)
      this.splice(index, 1)

    return index
  }
}

/******************************************************************************/
// Exports
/******************************************************************************/

export default SortedArray
