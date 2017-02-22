import Define from 'define-utility'
import Integrator from './integrator'

import is from 'is-explicit'

import { floor, cbrt, Vector } from 'math-plus'

/******************************************************************************/
// Constants
/******************************************************************************/

const ONE_MB = 1048576 //bytes
const NUMBER_SIZE = 8 // bytes
const CACHABLE_PROPERTIES = 5

const MASS_MIN = 50
const RADIUS_MIN = 0.5 //pixels
const RADIUS_FACTOR = 0.5

const ALLOCATIONS_PER_MB = ONE_MB / (NUMBER_SIZE * CACHABLE_PROPERTIES)

const DEFAULT_PROPERTIES = {

  g: 1,

  maxCacheMemory: 320 // megabytes

}

/******************************************************************************/
// Main Simulation Class
/******************************************************************************/

//constants for symbolic properties
const CACHE = Symbol('cache'),
  INTEGRATOR = Symbol('integrator'),
  INITIAL_TICK = Symbol('initial-tick'),
  WRITE = Symbol('write')

function Body ({mass, pos, vec}, tick, id) {

  if (this == null)
    //it actually doesn't, but I'm enforcing readable code. Sue me.
    throw new Error('Body must be instanced.')

  const body = function(tick, asArray) {

    if (!isFinite(tick) || tick < 0)
      return null

    let i = (tick - this[INITIAL_TICK]) * CACHABLE_PROPERTIES
    const cache = this[CACHE]

    const mass = cache[i++]

    //if we've gotten here, the requested tick has not been cached for this body
    if (mass === undefined)
      return null

    const x = cache[i++]
    const y = cache[i++]
    const vx = cache[i++]
    const vy = cache[i++]

    return asArray
      ? [mass, x, y, vx, vy]
      : {
        mass,
        pos: new Vector(x,y),
        vel: new Vector(x,y),
        radius: radiusFromMass(mass)
      }

  }

  Define(body)
    .const('id', id)
    .const(CACHE, [])
    .const(INITIAL_TICK, tick)
    .const(WRITE, (mass, x, y, vx, vy) =>
      this[CACHE].push(mass, x, y, vx, vy)
    )

  return body

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

      //the only enumerable properties of a cache object will be bodies
      for (const id in this) {
        const body = this[id]
        const data = body.read(tick, true)
        if (!data)
          continue

        output.push(body.id, ...data)

      }

      return output

    })

    .const('write', input => {

      this.tick++

      while (input.length) {
        const [id, mass, x, y, vx, vy] = input.splice(0,6)
        this[id].write(mass, x, y, vx, vy)
      }

      /* one liner for the kids:

      this.tick++ && while(input.length) this[input.shift()].write(...input.splice(0,5))

      */

    })

}

function radiusFromMass(mass) {

  return RADIUS_MIN + cbrt(mass - MASS_MIN) * RADIUS_FACTOR

}

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

  createBody(props, tick = this[CACHE].tick) {

    const cache = this[CACHE]

    if (!is(props, Object))
      throw new Error('createBody() requires a props object as its first parameter')

    if (!is(tick, Number))
      throw new Error('tick, if provided, is expected to be a number.')

    if (is(props.pos) && !is(props.pos, Vector))
      throw new Error('props.pos, if defined, is expected to be a Vector.')
    props.pos = props.pos || Vector.zero

    if (is(props.vel) && !is(props.vel, Vector))
      throw new Error('props.vel, if defined, is expected to be a Vector.')
    props.vel = props.vel || Vector.zero

    if (!is(props.mass) || props.mass < MASS_MIN)
      throw new Error(`props.mass, if defined, must be a number above or equal to ${MASS_MIN}`)
    props.mass = props.mass || MASS_MIN

    if (tick < 0 || tick > cache.tick)
      throw new Error('tick out of range')

    const id = cache.id++

    cache[id] = new Body(props, tick, id)
    cache.invalidate(tick)

    this[INTEGRATOR]('set-bodies', cache.read(tick))

  }

}
