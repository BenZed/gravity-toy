import is from 'is-explicit'
import define from 'define-utility'

import EventEmitter from 'events'

import Integrator from './integrator'

import { Body, CACHE, CACHED_VALUES_PER_TICK } from './body'

import { ceil, min } from 'math-plus'

/******************************************************************************/
// Data
/******************************************************************************/

const DEFAULT_PROPS = Object.freeze({

  // Gravitational Constant
  g: 1,

  // Higher steps mean more calculation time, but more precision
  physicsSteps: 8,

  // More memory === more ticks
  maxCacheMemory: 256, // megabytes

  // As a lossy optimization, bodies below a certain mass threshold can be considered
  // pseudo bodies and excluded from the primary integration loop. This speeds
  // up the simulation at a cost of realism. 0 means disabled.
  realMassThreshold: 0,

  // There must be at least this many real bodies before bodies under the aforementioned
  // mass threshold are considered psuedo
  realBodiesMin: Infinity

})

const ONE_MB = 1024 * 1024 // bytes

const NUMBER_SIZE = 8 // size of a javascript number value, in bytes

// One body allocation is equal to the amount of memory a single body stores
// during a single tick. This number is useful to determine when a simulation
// should stop integrating so it doesn't take up too much memory.
const BODY_ALLOCS_PER_MB = (ONE_MB / (NUMBER_SIZE * CACHED_VALUES_PER_TICK))::ceil()

const TICK = Symbol('tick')

const BODIES = Symbol('bodies')

const INTEGRATOR = Symbol('integrator')

/******************************************************************************/
// Class
/******************************************************************************/

class Simulation extends EventEmitter {

  constructor (props = {}) {

    super()

    if (!is.plainObject(props))
      throw new TypeError('props argument must be a plain object')

    const { g, physicsSteps, realMassThreshold, realBodiesMin, maxCacheMemory } =
      { ...DEFAULT_PROPS, ...props }

    if (!is(maxCacheMemory, Number) || maxCacheMemory <= 0)
      throw new Error('maxCacheMemory must be above zero')

    const integrator = new Integrator({
      onTick: this::writeTick,
      g,
      physicsSteps,
      realMassThreshold,
      realBodiesMin
    })

    this::define()
      .enum.const('g', g)
      .enum.const('maxCacheMemory', maxCacheMemory)
      .const(INTEGRATOR, integrator)
      .const(BODIES, {
        nextAssignId: 0,
        map: new Map()
      })
      .const(TICK, {
        current: 0,
        first: 0,
        last: 0
      })

  }

  start (tick = this.currentTick) {

    this::assertTick(tick)

    if (tick < this.lastTick)
      this.clearAfterTick(tick)

    const bodies = this[BODIES]

    const stream = [
      // The integrator expects the first value in the stream array to last id
      // assigned to a new body
      bodies.nextAssignId
    ]

    for (const body of bodies.map.values()) {
      const cache = body[CACHE]
      if (tick < cache.birthTick || (cache.deathTick !== null && tick > cache.deathTick))
        continue

      stream.push(body.id)

      // If this is the current tick, we want to take the values to
      // send to the integrator from the body's current values, not
      // not the cache. This way, if changes have been made, they'll
      // be reflected in the integration results
      if (tick === this.currentTick)
        stream.push(
          body.mass,
          body.pos.x,
          body.pos.y,
          body.vel.x,
          body.vel.y
        )
      else {
      // Otherwise, we want to take the values from the cache.
        let index = cache.getTickDataIndex(tick)
        stream.push(
          cache.data[index++], // mass
          cache.data[index++], // posX
          cache.data[index++], // posY
          cache.data[index++], // velX
          cache.data[index++] /// velY
        )
      }
    }

    // If the only thing in the simulation is the last assigned id, then there must
    // not be any bodies.
    if (stream.length <= 1)
      throw new Error(`Cannot start simulation. No bodies exist at tick ${tick}.`)

    this[INTEGRATOR].start(stream)
  }

  stop () {
    this[INTEGRATOR].stop()
  }

  get running () {
    return !!this[INTEGRATOR].worker
  }

  get firstTick () {
    return this[TICK].first
  }

  get lastTick () {
    return this[TICK].last
  }

  get currentTick () {
    return this[TICK].current
  }

  set currentTick (value) {
    this.setCurrentTick(value)
  }

  setCurrentTick (tick) {
    this::assertTick(tick)

    const bodies = this[BODIES]

    for (const body of bodies.map.values())
      setBodyValuesFromCache(body, tick)

    this[TICK].current = tick
  }

  createBodies (props, tick = this.currentTick) {

    if (!is(props, Array))
      props = [ props ]

    const bodies = this[BODIES]
    const created = []

    for (const prop of props) {

      const id = bodies.nextAssignId++
      const body = new Body(prop, tick, id)
      bodies.map.set(id, body)

      // If we're not on the tick that we're adding the body
      // to, it's current values should be changed.
      setBodyValuesFromCache(body, this.currentTick)

      created.push(body)
    }

    if (this.running)
      this.start(tick)

    else if (tick < this.lastTick)
      this.clearAfterTick(tick)

    return created
  }

  clearAfterTick (tick = this.currentTick) {
    this::assertTick(tick)

    if (tick < this.currentTick)
      this.setCurrentTick(tick)

    this[TICK].last = tick

    const bodies = this[BODIES]
    for (const body of bodies.map.values()) {
      const cache = body[CACHE]

      if (tick < cache.birthTick) {
        bodies.map.delete(body.id)
        continue
      }

      if (tick < cache.deathTick)
        cache.deathTick = null

      const index = cache.getTickDataIndex(tick) + CACHED_VALUES_PER_TICK
      const { data } = cache

      data.length = min(index, data.length)
    }

  }

  clearBeforeTick (tick = this.currentTick) {
    this::assertTick(tick)

    if (tick > this.currentTick)
      this.setCurrentTick(tick)

    this[TICK].first = tick

    const bodies = this[BODIES]
    for (const body of bodies.map.values()) {
      const cache = body[CACHE]

      if (cache.deathTick !== null && tick >= cache.deathTick) {
        bodies.map.delete(body.id)
        continue
      }

      if (tick > cache.birthTick) {
        const delta = tick - cache.birthTick
        const length = delta * CACHED_VALUES_PER_TICK

        cache.data.splice(0, length)
        cache.birthTick = tick
      }
    }
  }

  [Symbol.iterator] () {
    return this[BODIES].map.values()
  }

  * bodies () {
    for (const body of this)
      yield body
  }

  get numBodies () {
    return this[BODIES].map.size
  }

  * livingBodies (tick = this.currentTick) {
    this::assertTick(tick)

    for (const body of this) {
      const cache = body[CACHE]
      if ((cache.deathTick === null || tick <= cache.deathTick) &&
        tick >= cache.birthTick)
        yield body
    }
  }

  numLivingBodies (tick = this.currentTick) {
    return [ ...this.livingBodies(tick) ].length
  }

  runForNumTicks (totalTicks, startTick = this.currentTick) {
    this::assertTick(startTick)

    if (!is(totalTicks, Number) || totalTicks <= 0)
      throw new Error('totalTicks must be a number above zero.')

    let ticks = 0
    let handler

    return new Promise(resolve => {

      handler = lastTick => {
        if (++ticks >= totalTicks)
          resolve(lastTick)
      }

      this.on('tick', handler)
      if (!this.running)
        this.start(startTick)

    }).then(lastTick => {
      this.removeListener('tick', handler)
      this.stop()
      return lastTick
    })

  }

}

/******************************************************************************/
// Private Danglers
/******************************************************************************/

function writeTick (stream) {

  const simulation = this
  if (!simulation.running)
    return

  const bodies = simulation[BODIES]
  const tick = simulation[TICK]

  tick.last++

  let i = 0
  bodies.lastAssignedId = stream[i++]

  while (i < stream.length) {
    const id = stream[i++]
    const body = bodies.map.get(id)
    body[CACHE].data.push(
      stream[i++], // mass
      stream[i++], // posX
      stream[i++], // posY
      stream[i++], // velX
      stream[i++], // velY
      stream[i++] // parentId
    )
  }

  simulation.emit('tick', tick.last)

}

function assertTick (tick) {

  const { firstTick, lastTick } = this

  if (!is(tick, Number))
    throw new TypeError('tick should be a number.')

  if (tick < firstTick || tick > lastTick)
    throw new RangeError(`${tick} is out of range, ${firstTick} to ${lastTick}`)

}

/******************************************************************************/
// Helper
/******************************************************************************/

function setBodyValuesFromCache (body, tick) {

  const cache = body[CACHE]
  const { data } = cache

  let index = cache.getTickDataIndex(tick)

  body.mass = data[ index++ ] || null
  const exists = body.mass !== null

  body.pos.x = exists ? data[ index++ ] : NaN
  body.pos.y = exists ? data[ index++ ] : NaN
  body.vel.x = exists ? data[ index++ ] : NaN
  body.vel.y = exists ? data[ index++ ] : NaN
  body.parentId = exists ? data[ index++ ] : NaN

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Simulation
