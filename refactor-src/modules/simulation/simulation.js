import Define from 'define-utility'
import Integrator from './integrator'

import is from 'is-explicit'

import { floor, clamp } from 'math-plus'

// import Body from './body'

/******************************************************************************/
// Constants
/******************************************************************************/

const ONE_MB = 1048576 //bytes
const NUMBER_SIZE = 8 // bytes
const CACHABLE_PROPERTIES = 5
const ALLOCATIONS_PER_MB = ONE_MB / (NUMBER_SIZE * CACHABLE_PROPERTIES)

const DEFAULT_PROPERTIES = {

  g: 1,
  delta: 20, //milliseconds

  radiusBase: 0.5, //pixels
  radiusFactor: 0.25,

  maxCacheMemory: 320 // megabytes

}

/******************************************************************************/
// Main Simulation Class
/******************************************************************************/

//constants for symbolic properties
const CACHE = Symbol('cache'),
  BODIES = Symbol('bodies'),
  INTEGRATOR = Symbol('integrator')

class Body {
  constructor({pos, vel, mass}, id) {

    this.pos = pos
    this.vel = vel
    this.mass = mass

    this.id = id

  }
}

function Cache(maxMemory) {

  if (this == null)
    throw new Error('Cache must be instanced.')

  Define(this)

    .let('id', 0)
    .let('tick', 0)
    .let('allocations', 0)
    .const('maxMemory', maxMemory)

    .get('maxTicks', () => {
      const maxAllocations = this.maxMemory * ALLOCATIONS_PER_MB
      const percentUsed = this.allocations / maxAllocations

      return floor(this.tick / percentUsed)
    })

    .const('invalidate', (tick, before = false) => {})

    .const('read', tick => {
      const bodies = []
      for (const i in this) {
        const storage = this[i]
        bodies.push()
      }// fuck, make this not suck

    })

    .const('write', bodies => console.log('write cach', bodies))

}

export default class Simulation {

  constructor(props = {}) {

    if (!is(props, Object))
      throw new TypeError('first argument, if defined, should be an Object.')

    const { g, delta,
      maxCacheMemory,
      radiusBase,
      radiusFactor } = { ...DEFAULT_PROPERTIES, ...props }

    Define(this)
      .const.enum('g', g)
      .const.enum('delta', delta)
      .const(CACHE, new Cache(maxCacheMemory))
      .const(INTEGRATOR, new Integrator(this[CACHE].write))

    this[INTEGRATOR]('initialize', { g, delta })
  }

  start() {
    this[INTEGRATOR]('start')
  }

  stop() {
    this[INTEGRATOR]('stop')
  }

  createBody(props, tick = this[CACHE].tick) {

    const cache = this[CACHE]

    if (!is(props, Object))
      throw new Error('createBody() requires a props object as its first parameter')

    if (!is(tick, Number))
      throw new Error('tick, if provided, is expected to be a number.')

    if (tick < 0 || tick > cache.tick)
      throw new Error('tick out of range')

    const id = cache.id++
    const body = new Body(props, id)

    const storage = []
    Define(storage)
      .const('body', body)
      .const('startTick', tick)

    cache[id] = storage
    cache.invalidate(tick)

    this[INTEGRATOR]('set-bodies', cache.read(tick))

  }

}
