import { expect } from 'chai'

// eslint-disable-next-line no-unused-vars
/* global describe it before after beforeEach afterEach */

class Tester {

  constructor (subject) {
    this.subject = subject
  }

  do (func, times = 10000000) {
    const start = Date.now()
    for (let i = 0; i < times; i++)
      func(this.subject, i)

    return Date.now() - start
  }
}

describe.skip('Map Performance', () => {

  const ENTRIES = 2000

  const obj = new Tester({})
  const map = new Tester(new Map())

  const objSetIntTime = obj.do((obj, i) => { obj[i % ENTRIES] = i })
  const mapSetIntTime = map.do((map, i) => map.set(i % ENTRIES, i))

  it(`should be slower at setting integer values than objects ${mapSetIntTime}ms < ${objSetIntTime}ms`, () => {
    expect(mapSetIntTime).to.be.above(objSetIntTime)
  })

  const objSetStrTime = obj.do((obj, i) => { obj[`${i % ENTRIES}`] = i })
  const mapSetStrTime = map.do((map, i) => map.set(`${i % ENTRIES}`, i))

  it(`should be faster at setting string values than objects ${mapSetStrTime}ms < ${objSetStrTime}ms`, () => {
    expect(mapSetStrTime).to.be.below(objSetStrTime)
  })

  const objGetIntTime = obj.do((obj, i) => obj[i % ENTRIES])
  const mapGetIntTime = map.do((map, i) => map.get(i % ENTRIES))

  it(`should be slower at getting integer values than objects ${mapGetIntTime}ms < ${objGetIntTime}ms`, () => {
    expect(mapGetIntTime).to.be.above(objGetIntTime)
  })

  const objGetStrTime = obj.do((obj, i) => obj[`${i % ENTRIES}`])
  const mapGetStrTime = map.do((map, i) => map.get(`${i % ENTRIES}`))

  it(`should be faster at getting string values than objects ${mapGetStrTime}ms < ${objGetStrTime}ms`, () => {
    expect(mapGetStrTime).to.be.below(objGetStrTime)
  })

  const objIterateTime = obj.do((obj, i) => {
    let count = 0
    for (const key in obj) {
      const value = obj[key]
      count += value
    }
    return count
  }, 1000)

  const mapIterateTime = map.do((map, i) => {
    let count = 0
    for (const value of map.values())
      count += value

    return count
  }, 1000)

  it(`should be faster at iterating values than objects ${mapIterateTime}ms < ${objIterateTime}ms`, () => {
    expect(mapIterateTime).to.be.below(objIterateTime)
  })

})
