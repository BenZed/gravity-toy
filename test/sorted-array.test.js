import { expect } from 'chai'
import SortedArray, { UnsafeSortError } from '../src/modules/simulation/util/sorted-array'

// eslint-disable-next-line no-unused-vars
/* global describe it before after beforeEach afterEach */

const descending = (a, b) => a > b ? -1 : a < b ? 1 : 0

describe('Sorted Array', () => {

  it('is a class', () => {
    expect(() => SortedArray())
      .to
      .throw('invoked without \'new\'')
  })

  it('extends Array', () => {
    const arr = new SortedArray()
    expect(arr).to.be.instanceof(Array)
  })

  describe('constructor()', () => {
    it('sorts provided arguments', () => {
      const arr = new SortedArray(4, 2, 3, 5, 1, 6, 0)
      expect([...arr]).to.deep.equal([0, 1, 2, 3, 4, 5, 6])
    })
  })

  describe('sort()', () => {

    class Person {
      constructor (name, age) {
        this.name = name
        this.age = age
      }

      valueOf () {
        return this.age
      }
    }

    const chuck = new Person('chuck', 15)
    const nick = new Person('nick', 30)
    const jordo = new Person('jordan', 31)
    const ben = new Person('ben', 32)
    const jimney = new Person('jimney', 35)
    const ebenzer = new Person('ezer', 98)

    it('sorts contents', () => {

      const arr = new SortedArray()
      arr.push(5)
      arr.push(3)
      arr.push(10)
      arr.push(2)
      arr.push(1)
      arr.push(0)

      arr.sort()

      expect(arr).to.deep.equal([0, 1, 2, 3, 5, 10])
    })

    it('sets unsafe flag to false', () => {

      const arr = new SortedArray()
      arr.push(5)
      arr.push(3)

      expect(arr).to.have.property('unsafe', true)
      expect(arr).to.deep.equal([5, 3])

      arr.sort()
      expect(arr).to.deep.equal([3, 5])
      expect(arr).to.have.property('unsafe', false)

    })

    it('works with any object that provides a numerical valueOf', () => {

      const people = new SortedArray(ebenzer, ben, nick, jimney, chuck, jordo)

      expect(people).to.deep.equal([ chuck, nick, jordo, ben, jimney, ebenzer ])
    })

    describe('compare sorting functions', () => {

      const people = new SortedArray(ebenzer, ben, nick, jimney, chuck, jordo)

      before(() => people.sort(descending))

      it('allows custom sorting', () => {
        expect(people).to.deep.equal([ ebenzer, jimney, ben, jordo, nick, chuck ])
      })

      it('passing in a custom sorter sets comparer property', () => {
        expect(people.comparer).to.be.equal(descending)
      })

      it('indexOf() returns correct indexes on custom sorted arrays', () => {
        expect(people.indexOf(ben)).to.equal(2)
      })

      it('lastIndexOf() returns correct indexes on custom sorted arrays', () => {
        expect(people.indexOf(jordo)).to.equal(3)
      })

      it('insert() places items correctly into custom sorted arrays', () => {
        const pCopy = new SortedArray(...people)
        pCopy.sort(descending)

        const stew = new Person('stewie', 8)
        expect(pCopy.insert(stew)).to.be.equal(6)
        expect(pCopy.indexOf(stew)).to.be.equal(6)
      })

      it('remove() correctly removes items from custom sorted arrays', () => {
        const pCopy = new SortedArray(...people)
        pCopy.sort(descending)

        expect(pCopy.remove(ben)).to.be.equal(2)
        expect(pCopy.indexOf(ben)).to.be.equal(-1)
      })
    })
  })

  describe('filter()', () => {
    const arr = new SortedArray(8, 4, 1, 0, 9, 12, 13, 8, 17, 5)
    const filtered = arr.filter(n => n % 2 === 0)

    it('filters contents via function', () => {
      expect(filtered).to.deep.equal([ 0, 4, 8, 8, 12 ])
    })

    it('returns a SortedArray', () => {
      expect(filtered).to.be.instanceof(SortedArray)
    })

    it('retains unsafe flag from filteree')

    it('custom comparers are passed to filtered arrays', () => {
      const arr2 = new SortedArray(...arr)
      arr2.sort(descending)

      const filtered2 = arr2.filter(n => n < 8)
      expect(filtered2.comparer).to.be.equal(arr2.comparer)
      expect(filtered2).to.be.deep.equal([5, 4, 1, 0])
    })
  })

  describe('slice', () => {

    const arr = new SortedArray(0, 1, 2, 3, 4, 5)

    const sliced = arr.slice(1, 4)

    it('inherits Array.prototype.slice functionality', () => {
      expect(sliced).to.deep.equal([ 1, 2, 3 ])
    })

    it('retains unsafe flag from slicee')

    it('returns a SortedArray', () => {
      expect(sliced).to.be.instanceof(SortedArray)
    })

  })

  describe('map()', () => {
    const arr = new SortedArray(4, 16, 25, 36, 49, 64)
    const mapped = arr.map(Math.sqrt)

    it('maps contents via function', () => {
      expect(mapped).to.deep.equal([2, 4, 5, 6, 7, 8])
    })

    it('returns a SortedArray', () => {
      expect(mapped).to.be.instanceof(SortedArray)
    })

    it('sets unsafe flag on returned array')

    it('custom comparers are passed to mapped arrays', () => {
      const arr2 = new SortedArray(...arr)
      arr2.sort(descending)

      const mapped2 = arr2.map(Math.sqrt)
      expect(mapped2.comparer).to.be.equal(arr2.comparer)
      expect(mapped2).to.deep.equal([8, 7, 6, 5, 4, 2])
    })
  })

  describe('concat()', () => {

    const arr = new SortedArray(0, 2, 4, 6)
    const concated = arr.concat([1, 7])

    it('merges to arrays', () => {
      expect(concated).to.deep.equal([0, 2, 4, 6, 1, 7])
    })

    it('returns a SortedArray', () => {
      expect(concated).to.be.instanceof(SortedArray)
    })

    it('sets unsafe flag on returned array', () =>
      expect(concated.unsafe).to.be.true
    )

  })

  describe('lastIndexOf()', () => {

    const arr = new SortedArray(1, 2, 2, 2, 3, 3, 4)

    it('Gets the last index of a value', () => {
      expect(arr.lastIndexOf(2)).to.be.equal(3)
      expect(arr.lastIndexOf(3)).to.be.equal(5)
    })

    it('throws if array is unsafe', () => {
      const arr = new SortedArray(4, 5)
      arr.push(0)
      expect(() => arr.indexOf(0)).to.throw(UnsafeSortError)
    })

    it('returns -1 if value doesnt exist', () => {
      expect(arr.lastIndexOf(100)).to.be.equal(-1)
    })

  })

  describe('indexOf()', () => {

    const arr = new SortedArray(1, 2, 2, 2, 3, 3, 4)

    it('Gets the first index of a value', () => {
      expect(arr.indexOf(2)).to.be.equal(1)
      expect(arr.indexOf(3)).to.be.equal(4)
    })

    it('throws if array is unsafe', () => {
      const arr = new SortedArray(4, 5)

      arr.push(0)

      expect(() => arr.indexOf(0)).to.throw(UnsafeSortError)
    })

    it('returns -1 if value doesnt exist', () => {
      expect(arr.indexOf(100)).to.be.equal(-1)
    })

  })

  describe('insert()', () => {

    const arr = new SortedArray(0, 1, 2, 3, 5, 6, 7, 8)
    const index = arr.insert(4)

    it('inserts a value into it\'s sorted location', () => {
      expect(arr.indexOf(4)).to.be.equal(4)
    })

    it('throws if array is unsafe', () => {
      const arr = new SortedArray(0, 5)
      arr.push(3)
      expect(() => arr.insert(2)).to.throw(UnsafeSortError)
    })

    it('returns index of placed location', () => {
      expect(index).to.be.equal(arr.indexOf(4))
    })

  })

  describe('remove()', () => {

    const arr = new SortedArray(0, 1, 2, 3, 4, 5, 6, 7, 8)
    const index = arr.remove(4)

    it('removes a value', () => {
      expect(arr.indexOf(4)).to.be.equal(-1)
    })

    it('throws if array is unsafe', () => {
      const arr = new SortedArray(1, 2, 3)
      arr.push(0)
      expect(() => arr.remove(1)).to.throw(UnsafeSortError)
    })

    it('returns index of removed location', () => {
      expect(index).to.be.equal(4)
    })

  })

  describe('push()', () => {

    const arr = new SortedArray(3, 2, 0, 1)
    arr.push(10, 8, 10)

    it('adds items to end of array without sorting', () => {
      expect(arr).to.deep.equal([0, 1, 2, 3, 10, 8, 10])
    })

    it('sets unsafe flag to true', () =>
      expect(arr.unsafe).to.be.true
    )
  })

  describe('unshift()', () => {

    const arr = new SortedArray(3, 2, 0, 1)
    arr.unshift(10, 8, 10)

    it('adds items to beginning of array without sorting', () => {
      expect(arr).to.deep.equal([10, 8, 10, 0, 1, 2, 3])
    })

    it('sets unsafe flag to true', () =>
      expect(arr.unsafe).to.be.true
    )
  })

  describe('splice()', () => {
    const arr = new SortedArray(3, 2, 0, 1)
    arr.splice(2, 0, 10, 8, 10)

    it('inherits Array.prototype.splice functionality', () => {
      expect(arr).to.deep.equal([0, 1, 10, 8, 10, 2, 3])
    })

    it('sets unsafe flag to true', () =>
      expect(arr.unsafe).to.be.true
    )
  })

  describe('reverse()', () => {
    const arr = new SortedArray(2, 3, 1, 0)
    arr.reverse()

    it('inherits Array.prototype.reverse functionality', () => {
      expect(arr).to.deep.equal([3, 2, 1, 0])
    })

    it('sets unsafe flag to true', () =>
      expect(arr.unsafe).to.be.true
    )
  })

  describe('copyWithin()', () => {
    const arr = new SortedArray(2, 3, 1, 0)
    arr.copyWithin(2, 0)

    it('inherits Array.prototype.reverse functionality', () => {
      expect(arr).to.deep.equal([0, 1, 0, 1])
    })

    it('sets unsafe flag to true', () =>
      expect(arr.unsafe).to.be.true
    )
  })

  describe('.unsafe', () => {
    it('is read only', () => {
      const arr = new SortedArray(0, 1, 2, 3)
      expect(() => { arr.unsafe = true }).to.throw('has only a getter')
    })
  })

  describe(`Symbol('compare-function') property`, () => {

    it('should not be enumerable', () => {
      const arr = new SortedArray(1, 2, 3, 4)
      const [ COMPARER ] = Object.getOwnPropertySymbols(arr)

      for (const key in arr)
        if (key === COMPARER)
          throw new Error(`${COMPARER} should not be enumerable.`)
    })
  })

})
