import { expect } from 'chai'
import SortedArray from '../src/modules/simulation/util/sorted-array'
// eslint-disable-next-line no-unused-vars
/* global describe it before after beforeEach afterEach */

describe.only('Sorted Array', () => {

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
    const ezer = new Person('ezer', 98)

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

    it('works with any object that provides a numerical valueOf', () => {

      const people = new SortedArray(ezer, ben, nick, jimney, chuck, jordo)

      expect(people).to.deep.equal([ chuck, nick, jordo, ben, jimney, ezer ])
      const jordoIndex = people.indexOf(jordo)
      expect(jordoIndex).to.equal(2)
    })

    it('allows a predicate sorting function', () => {
      const people = new SortedArray(ezer, ben, nick, jimney, chuck, jordo)
      people.sort((a, b) => a > b ? -1 : a < b ? 1 : 0)
      expect(people).to.deep.equal([ ezer, jimney, ben, jordo, nick, chuck ])

      const benIndex = people.indexOf(ben)
      expect(benIndex).to.equal(2)
    })

  })

})
