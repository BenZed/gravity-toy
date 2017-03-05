import Define from 'define-utility'
import Integrator, { INTEGRATOR } from './integrator'

import is from 'is-explicit'
import { clamp } from 'math-plus'

import Body, { NO_PARENT } from './body'
import Cache, { CACHE, TICK_INDEX } from './cache'

/******************************************************************************/
// Main Simulation Class
/******************************************************************************/

const SIMULATION_DEFAULTS = {

  g: 1,
  physicsSteps: 4,
  realBodiesMin: 150,
  realMassThreshold: 100,
  maxCacheMemory: 320 // megabytes

}

export default class Simulation {

  constructor(props = {}) {

    if (!is(props, Object))
      throw new TypeError('first argument, if defined, should be an Object.')

    const { g, physicsSteps, realMassThreshold, realBodiesMin,  maxCacheMemory }
        = { ...SIMULATION_DEFAULTS, ...props }

    const cache = new Cache(maxCacheMemory)
    const integrator = new Integrator(cache.write)

    Define(this)
      .const.enum('g', g)
      .const(CACHE, cache)
      .const(INTEGRATOR, integrator)
      .let(TICK_INDEX, 0)

    this[INTEGRATOR]('initialize', [ g, physicsSteps, realMassThreshold, realBodiesMin ])

  }

  start = () => this[INTEGRATOR]('start')

  stop = () => this[INTEGRATOR]('stop')

  get tick() {
    //why clamp it? in case the cache was invalidated without the tick being
    //reset
    return clamp(this[TICK_INDEX], 0, this.maxTick)
  }

  set tick(value) {

    if (value < 0 || value > this.maxTick)
      throw new Error('tick out of range')

    const cache = this[CACHE]

    for (const id in cache) {
      const body = cache[id]
      const data = body.read(value)

      if (data) {
        let i = 0
        body.mass = data[i++]
        body.pos.x = data[i++]
        body.pos.y = data[i++]
        body.vel.x = data[i++]
        body.vel.y = data[i++]
        body.parentId = data[i++]

      } else {
        body.mass = NaN
        body.pos.x = NaN
        body.pos.y = NaN
        body.vel.x = NaN
        body.vel.y = NaN
        body.parentId = NO_PARENT
      }

    }

    this[TICK_INDEX] = value
  }

  get maxTick() {
    return this[CACHE].tick
  }

  applyBodies = (tick = this.tick) => {

    if (tick < 0 || tick > this.maxTick)
      throw new Error('tick out of range')

    throw new Error('not yet implemented')

  }

  createBody = (props = {}, tick = this.tick) =>
    this.createBodies([props], tick)[0]

  createBodies = (props = [], tick = this.tick) =>  {

    const cache = this[CACHE]

    if (tick < 0 || tick > cache.tick)
      throw new Error('tick out of range')

    const created = []
    for (const prop of props) {

      const id = cache.id++
      const body = new Body(prop, tick, id)

      cache[id] = body

      created.push(body)
    }

    cache.invalidateAfter(tick)
    this[INTEGRATOR]('set-bodies', cache.read(tick))

    return created

  }

  [Symbol.iterator] = function*() {

    for (const id in this[CACHE]) {

      const body = this[CACHE][id]
      if (body.exists)
        yield body

    }
  }

  get numBodies() {
    let count = 0
    for (const body of this) //eslint-disable-line
      count++

    return count
  }

}
