import Define from 'define-utility'
import Integrator from './integrator'

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
  realBodiesMin: 100,
  realMassThreshold: 250,
  maxCacheMemory: 320 // megabytes

}

const INTEGRATOR = Symbol('integrator')

export default class Simulation {

  constructor(props = {}) {

    if (!is(props, Object))
      throw new TypeError('first argument, if defined, should be an Object.')

    const { g, physicsSteps, realMassThreshold, realBodiesMin,  maxCacheMemory }
     = { ...SIMULATION_DEFAULTS, ...props }

    const cache = new Cache(maxCacheMemory)
    const integrator = new Integrator(cache.write, { g, physicsSteps, realMassThreshold, realBodiesMin })

    Define(this)
      .const.enum('g', g)
      .const(CACHE, cache)
      .let(TICK_INDEX, 0)
      .const(INTEGRATOR, integrator)

  }

  get tick() {
    //why clamp it? in case the current tick value was invalidated
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

      } else
        body.mass = NaN

    }

    this[TICK_INDEX] = value
  }

  get maxTick() {
    return this[CACHE].tick
  }

  applyBodies = (tick = this.tick) => {

    if (tick < 0 || tick > this.maxTick)
      throw new Error('tick out of range')

    const cache = this[CACHE]

    //apply any altered values on any existing to their latest cache
    if (tick === this.tick) for (const id in cache) {
      const body = cache[id]
      if (!body.exists)
        continue

      let i = body[TICK_INDEX](tick)
      const bodyCache = body[CACHE]
      bodyCache[i++] = body.mass
      bodyCache[i++] = body.pos.x
      bodyCache[i++] = body.pos.y
      bodyCache[i++] = body.vel.x
      bodyCache[i++] = body.vel.y

    }

    const data = cache.read(tick)
    cache.invalidateAfter(tick)

    this[INTEGRATOR](data)

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

    this.applyBodies(tick)

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
