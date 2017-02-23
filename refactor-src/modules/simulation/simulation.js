import Define from 'define-utility'
import Integrator from './integrator'

import is from 'is-explicit'

import { floor, Vector } from 'math-plus'
import { MASS_MIN, radiusFromMass } from './helper'

/******************************************************************************/
// Constants
/******************************************************************************/

const ONE_MB = 1048576 //bytes
const NUMBER_SIZE = 8 // bytes
const CACHABLE_PROPERTIES = 5

const ALLOCATIONS_PER_MB = ONE_MB / (NUMBER_SIZE * CACHABLE_PROPERTIES)

const DEFAULT_PROPERTIES = {

  g: 1,

  maxCacheMemory: 320 // megabytes

}

function Cache(maxMemory) {

  Define(this)

    .let('id', 0)
    .let('tick', 0)
    .let('allocations', 0)

    .get('maxTicks', () => {
      const maxAllocations = this.maxMemory * ALLOCATIONS_PER_MB
      const percentUsed = this.allocations / maxAllocations

      return floor(this.tick / percentUsed)
    })

    .const('maxMemory', maxMemory)
    .const('invalidate', (tick, before = false) => {})
    .const('read', tick => {

      const output = []

      //the only enumerable properties of
      //a cache object will be bodies
      for (const id in this) {
        const body = this[id]
        const data = body.read(tick, true)
        if (!data)
          continue

        output.push(body.id, ...data)
      }

      return output

    })

    .const('write', data => {

      this.tick++

      let i = 0
      while (i < data.length) {
        const id = data[i++],
          mass =   data[i++],
          x =      data[i++],
          y =      data[i++],
          vx =     data[i++],
          vy =     data[i++]

        this[id][CACHE].push(mass, x, y, vx, vy)
      }

    })

}

/******************************************************************************/
// Body Class
/******************************************************************************/

class Body {

  constructor(props, tick, id) {

    //Holy validations, batman!
    if (!is(props, Object))
      throw new Error('Body requires a props object as its first parameter')

    if (!isFinite(tick))
      throw new Error('Tick is expected to be a number.')

    let { mass, vel, pos } = props

    if (is(pos) && !is(pos, Vector))
      throw new Error('props.pos, if defined, is expected to be a Vector.')
    pos = pos || Vector.zero

    if (is(vel) && !is(vel, Vector))
      throw new Error('props.vel, if defined, is expected to be a Vector.')
    vel = vel || Vector.zero

    if (!is(mass) || mass < MASS_MIN)
      throw new Error(`props.mass, if defined, must be a number above or equal to ${MASS_MIN}`)
    mass = mass || MASS_MIN

    Define(this)
      .let('mass', mass)
      .get('radius', radiusFromMass)
      .const('pos', pos)
      .const('vel', vel)
      .const('id', id)
      .const(CACHE, [mass, pos.x, pos.y, vel.x, vel.y])
      .const(INITIAL_TICK, tick)
  }

  read(tick) {

    const cache = this[CACHE]
    let i = (tick - this[INITIAL_TICK]) * CACHABLE_PROPERTIES

    const mass = cache[i++]

    //if we've gotten here, the requested tick has not been cached for this body,
    //the request tick is in an invalid range or it is not a number
    if (mass === undefined)
      return null

    const x = cache[i++]
    const y = cache[i++]
    const vx = cache[i++]
    const vy = cache[i++]

    return [ mass, x, y, vx, vy ]

  }

  update(tick) {
    const data = this.read(tick)
    if (!data)
      return false

    const [mass, x, y, vx, vy] = data
    this.mass = mass
    this.pos.x = x
    this.pos.y = y
    this.vel.x = vx
    this.vel.y = vy

    return true

  }

}

/******************************************************************************/
// Main Simulation Class
/******************************************************************************/

//constants for symbolic properties
const CACHE = Symbol('cache'),
  INTEGRATOR = Symbol('integrator'),
  INITIAL_TICK = Symbol('initial-tick')

export default class Simulation {

  constructor(props = {}) {

    if (!is(props, Object))
      throw new TypeError('first argument, if defined, should be an Object.')

    const { g, maxCacheMemory } = { ...DEFAULT_PROPERTIES, ...props }

    Define(this)
      .const.enum('g', g)
      .const(CACHE, new Cache(maxCacheMemory))
      .const(INTEGRATOR, new Integrator(this[CACHE].write))

    this[INTEGRATOR]('initialize', { g })

  }

  start() {
    this[INTEGRATOR]('start')
  }

  stop() {
    this[INTEGRATOR]('stop')
  }

  createBody = (props = {}, tick = this[CACHE].tick) =>  {

    const cache = this[CACHE]

    if (tick < 0 || tick > cache.tick)
      throw new Error('tick out of range')

    const id = cache.id++

    const body = new Body(props, tick, id)

    cache[id] = body
    cache.invalidate(tick)

    this[INTEGRATOR]('set-bodies', cache.read(tick))

    return body

  }

}
