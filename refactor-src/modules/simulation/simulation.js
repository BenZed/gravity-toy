import Define from 'define-utility'
import Integrator from './integrator'

import is from 'is-explicit'
import now from 'performance-now'

import { Vector, floor, sqrt, max, min } from 'math-plus'

// import Body from './body'

console.log(Integrator)

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
const BODIES = Symbol('bodies'),
  CACHE = Symbol('cache'),
  INTEGRATOR = Symbol('integrator')

export default class Simulation {

  constructor(props = {}) {

    if (!is(props, Object))
      throw new TypeError('first argument, if defined, should be an Object.')

    const { g,
      delta,
      maxCacheMemory,
      radiusBase,
      radiusFactor } = { ...DEFAULT_PROPERTIES, ...props }

    Define(this)
      .const.enum('g', g)
      .const.enum('delta', delta)
      .const(BODIES, [])
      .const(INTEGRATOR, new Integrator(g, delta))
      .const(CACHE, {
        tick: 0,
        allocations: 0,
        get maxTicks() {
          const maxAllocations = maxCacheMemory * ALLOCATIONS_PER_MB
          const percentUsed = this.allocations.size / maxAllocations

          return floor(this.tick / percentUsed)
        }
      })

  }

  start() {
    this[INTEGRATOR].send('start')
  }

  stop() {
    this[INTEGRATOR].send('stop')
  }

  *[Symbol.iterator]() {
    for (const body of this[BODIES])
      yield body
  }

}

new Simulation
