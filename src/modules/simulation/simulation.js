import Define from 'define-utility'
import Integrator from './integrator'

import is from 'is-explicit'

import { floor, min, Vector } from 'math-plus'
import { MASS_MIN, radiusFromMass } from './helper'

/******************************************************************************/
// Constants
/******************************************************************************/

const ONE_MB = 1048576 //bytes
const NUMBER_SIZE = 8 // bytes
const NUM_CACHE_PROPS = 6
const ALLOCATIONS_PER_MB = ONE_MB / (NUMBER_SIZE * NUM_CACHE_PROPS)

const NO_PARENT = -1 //cache index value if body has no parent

const DEFAULT_PROPERTIES = {

  g: 1,

  maxCacheMemory: 320 // megabytes

}

//constants for symbolic properties
const CACHE    = Symbol('cache'),
  INTEGRATOR   = Symbol('integrator'),
  TICK_INITIAL = Symbol('tick-initial'),
  TICK_END     = Symbol('tick-end'),
  TICK_INDEX   = Symbol('tick-index')

/******************************************************************************/
// Cache Object
/******************************************************************************/

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

    .const('invalidateBefore', tick => {

      if (tick > this.tick || tick < 0)
        throw new Error(`${tick} is out of range 0 - ${this.tick}`)

      this.tick -= tick

      for (const id in this) {
        const body = this[id]

        let newInitial = body[TICK_INITIAL] - tick
        if (newInitial < 0) {

          const count = -newInitial * NUM_CACHE_PROPS
          body[CACHE].splice(0, count)
          newInitial = 0

        }

        body[TICK_INITIAL] = newInitial
      }
    })

    .const('invalidateAfter', tick => {

      if (tick > this.tick || tick < 0)
        throw new Error(`${tick} is out of range 0 - ${this.tick}`)

      this.tick = tick

      for (const id in this) {
        const body = this[id]

        const index = body[TICK_INDEX](tick + 1)
        if (index <= 0) {
          delete this[id]
          continue
        }

        const cache = body[CACHE]

        cache.length = min(index, cache.length)

      }
    })

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
      const destroyed = data[i++]

      for (const id of destroyed)
        this[id][TICK_END] = this.tick

      while (i < data.length) {
        const id =   data[i++],
          mass =     data[i++],
          x =        data[i++],
          y =        data[i++],
          vx =       data[i++],
          vy =       data[i++],
          parentId = data[i++]

        this[id][CACHE].push(mass, x, y, vx, vy, parentId)
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
      .let.enum('mass', mass)
      .get.enum('radius', radiusFromMass)
      .const.enum('pos', pos)
      .const.enum('vel', vel)
      .const('id', id)
      .const('parentId', NO_PARENT)
      .const(CACHE, [mass, pos.x, pos.y, vel.x, vel.y, NO_PARENT])
      .let(TICK_INITIAL, tick)
      .let(TICK_END,     null)
  }

  [TICK_INDEX](tick) {
    return (floor(tick) - this[TICK_INITIAL]) * NUM_CACHE_PROPS
  }

  read(tick) {

    const cache = this[CACHE]
    let i = this[TICK_INDEX](tick)

    const mass = cache[i++]

    //if we've gotten here, the requested tick has not been cached for this body,
    //the request tick is in an invalid range or it is not a number
    if (mass === undefined)
      return null

    const x = cache[i++]
    const y = cache[i++]
    const vx = cache[i++]
    const vy = cache[i++]
    const parentId = cache[i++]

    return [ mass, x, y, vx, vy, parentId ]

  }

  update(tick) {

    const data = this.read(tick)
    if (!data)
      return false

    const [ mass, x, y, vx, vy, parentId ] = data

    this.mass = mass

    this.pos.x = x
    this.pos.y = y

    this.vel.x = vx
    this.vel.y = vy

    this.parentId = parentId

    return true

  }

}

/******************************************************************************/
// Main Simulation Class
/******************************************************************************/

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
    cache.invalidateAfter(tick)

    this[INTEGRATOR]('set-bodies', cache.read(tick))

    return body

  }

}
