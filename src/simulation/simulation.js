import is from 'is-explicit'
import define from 'define-utility'
import { min, clamp, Vector } from '@benzed/math'

import EventEmitter from 'events'
import Integrator from './integrator'

import { Body, $$cache } from './body'
import {
  CACHED_VALUES_PER_TICK,
  DEFAULT_PHYSICS,
  DEFAULT_MAX_MB,
  NUMBER_SIZE,
  ONE_MB
} from './constants'

/******************************************************************************/
// Symbols
/******************************************************************************/

const $$tick = Symbol('tick')
const $$bodies = Symbol('bodies')
const $$integrator = Symbol('integrator')

/******************************************************************************/
// Class
/******************************************************************************/

class Simulation extends EventEmitter {

  static fromJSON (json) {
    if (typeof json === 'string')
      json = JSON.parse(json)

    const { bodies, ...init } = json

    const sim = new Simulation(init)

    const props = bodies.map(body => {
      const prop = {
        pos: Vector.toVector(body.pos),
        vel: Vector.toVector(body.vel),
        mass: body.mass
      }
      return prop
    })

    sim.createBodies(props)

    return sim

  }

  constructor (props = {}) {

    super()

    if (!is.plainObject(props))
      throw new TypeError('props argument must be a plain object')

    const { g,
      physicsSteps,
      realMassThreshold,
      realBodiesMin,
      maxCacheMemory = DEFAULT_MAX_MB
    } = { ...DEFAULT_PHYSICS, ...props }

    if (!is.number(maxCacheMemory) || maxCacheMemory <= 0)
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
      .const($$integrator, integrator)
      .const($$bodies, {
        usedBytes: 0,
        maxBytes: maxCacheMemory * ONE_MB,
        updateUsedBytes,
        nextAssignId: 0,
        map: new Map()
      })
      .const($$tick, {
        current: 0,
        first: 0,
        last: 0
      })

  }

  run (tick = this.currentTick) {

    this::assertTick(tick)

    if (tick < this.lastTick)
      this.clearAfterTick(tick)

    const bodies = this[$$bodies]

    const stream = [
      // The integrator expects the first value in the stream array to last id
      // assigned to a new body
      bodies.nextAssignId
    ]

    for (const body of bodies.map.values()) {
      const cache = body[$$cache]
      if (tick < cache.birthTick || (cache.deathTick !== null && tick >= cache.deathTick))
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

    if (bodies.usedBytes === bodies.maxBytes)
      throw new Error(`Cannot start simulation. Cache memory (${this.maxCacheMemory}mb) is full.`)

    this[$$integrator].start(stream)
  }

  runUntil (condition, startTick = this.currentTick, description = 'until condition met') {
    this::assertTick(startTick)

    if (!is.func(condition))
      throw new Error('condition must be a function.')

    let resolver, rejecter

    return new Promise((resolve, reject) => {

      resolver = lastTick => {
        if (condition(lastTick))
          resolve(lastTick)
      }

      rejecter = lastTick => {
        reject(new Error(`Could not run ${description}. Cache memory used up on tick ${lastTick}`))
      }

      this.on('tick', resolver)
      this.once('cache-full', rejecter)

      this.run(startTick)

    }).then(lastTick => {
      this.removeListener('tick', resolver)
      this.removeListener('cache-full', rejecter)

      this.stop()

      return lastTick
    })
  }

  runForNumTicks (totalTicks, startTick = this.currentTick) {
    if (!is.number(totalTicks) || totalTicks <= 0)
      throw new Error('totalTicks must be a number above zero.')

    let ticks = 0

    const condition = () => ++ticks >= totalTicks

    const description = `for ${totalTicks} ticks`

    return this.runUntil(condition, startTick, description)
  }

  runForOneTick (startTick = this.currentTick) {
    const description = `for one tick`

    return this.runUntil(oneTick, startTick, description)
  }

  stop () {
    this[$$integrator].stop()
  }

  get running () {
    return !!this[$$integrator].worker
  }

  get usedCacheMemory () {
    return this[$$bodies].usedBytes / ONE_MB
  }

  get maxCacheMemory () {
    return this[$$bodies].maxBytes / ONE_MB
  }

  get firstTick () {
    return this[$$tick].first
  }

  get lastTick () {
    return this[$$tick].last
  }

  get currentTick () {
    return this[$$tick].current
  }

  set currentTick (value) {
    this.setCurrentTick(value, false)
  }

  setCurrentTick (tick, autoClamp = true) {

    if (autoClamp)
      tick = clamp(tick, this.firstTick, this.lastTick)

    this::assertTick(tick)

    const bodies = this[$$bodies]

    for (const body of bodies.map.values())
      setBodyValuesFromCache(body, tick)

    this[$$tick].current = tick
  }

  createBodies (props, tick = this.currentTick) {

    if (!is.array(props))
      props = [ props ]

    const bodies = this[$$bodies]
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
      this.run(tick)

    else if (tick < this.lastTick)
      this.clearAfterTick(tick)

    return created
  }

  clearAfterTick (tick = this.currentTick) {
    this::assertTick(tick)

    if (tick < this.currentTick)
      this.setCurrentTick(tick)

    this[$$tick].last = tick

    const bodies = this[$$bodies]
    for (const body of bodies.map.values()) {
      const cache = body[$$cache]

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
    bodies.updateUsedBytes()

  }

  clearBeforeTick (tick = this.currentTick) {
    this::assertTick(tick)

    if (tick > this.currentTick)
      this.setCurrentTick(tick)

    this[$$tick].first = tick

    const bodies = this[$$bodies]
    for (const body of bodies.map.values()) {
      const cache = body[$$cache]

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
    bodies.updateUsedBytes()
  }

  body (id) {
    return this[$$bodies].map.get(id)
  }

  [Symbol.iterator] () {
    return this[$$bodies].map.values()
  }

  * bodies (ids = []) {

    if (is.defined(ids) && !is.array(ids))
      ids = [ ids ]

    ids = [ ...ids ] // idArrayCheck mutates the array, so we'll prevent side effects

    for (const body of this)
      if (idArrayCheck(ids, body.id))
        yield body
  }

  get numBodies () {
    return this[$$bodies].map.size
  }

  * livingBodies () {
    for (const body of this)
      if (body.exists)
        yield body
  }

  numLivingBodies () {
    let count = 0
    for (const body of this)
      if (body.exists)
        count++

    return count
  }

  toArray (ids) {
    return [ ...this.bodies(ids) ]
  }

  toJSON () {

    const {
      g, maxCacheMemory
    } = this

    const {
      physicsSteps, realMassThreshold, realBodiesMin
    } = this[$$integrator].init

    const bodies = []
    for (const body of this.livingBodies()) {

      const { pos, vel, mass, id } = body

      bodies.push({
        id,
        pos: { x: pos.x, y: pos.y },
        vel: { x: vel.x, y: vel.y },
        mass
      })
    }

    return {
      bodies,
      g,
      physicsSteps,
      realMassThreshold,
      realBodiesMin,
      maxCacheMemory
    }
  }

}

/******************************************************************************/
// Private Danglers
/******************************************************************************/

function writeTick (data) {

  const simulation = this
  if (!simulation.running)
    return

  const bodies = simulation[$$bodies]
  const tick = simulation[$$tick]

  tick.last++

  bodies.nextAssignId = data.nextAssignId

  for (const { id, mergeId } of data.destroyed) {
    const body = bodies.map.get(id)
    body.mergeId = mergeId

    const cache = body[$$cache]
    cache.deathTick = tick.last
  }

  for (const id of data.created) {
    const body = new Body({}, tick.last, id)

    // ignore initial values as they will be defined by the stream
    body[$$cache].data.length = 0

    bodies.map.set(id, body)
  }

  const { stream } = data
  let i = 0
  while (i < stream.length) {
    const id = stream[i++]
    const body = bodies.map.get(id)

    const cache = body[$$cache]
    cache.data.push(
      stream[i++], // mass
      stream[i++], // posX
      stream[i++], // posY
      stream[i++], // velX
      stream[i++], // velY
      stream[i++] // linkId
    )
  }

  simulation.emit('tick', tick.last)

  bodies.updateUsedBytes()
  if (bodies.usedBytes === bodies.maxBytes) {
    simulation.stop()
    simulation.emit('cache-full', tick.last)
  }
}

function assertTick (tick) {

  const simulation = this

  const { firstTick, lastTick } = simulation

  if (!is.number(tick))
    throw new TypeError('tick should be a number.')

  if (tick < firstTick || tick > lastTick)
    throw new RangeError(`${tick} is out of range, ${firstTick} to ${lastTick}`)

}

function updateUsedBytes () {
  const bodies = this

  let allocations = 0
  for (const body of bodies.map.values())
    allocations += body[$$cache].data.length

  bodies.usedBytes = min(bodies.maxBytes, allocations * NUMBER_SIZE)
}

// This is used in the runForOneTick function which calls the runUntil function
// using this as a condition. runUntil true means it only runs for one tick.
function oneTick () {
  return true
}

/******************************************************************************/
// Helper
/******************************************************************************/

function setBodyValuesFromCache (body, tick) {

  const cache = body[$$cache]
  const { data } = cache

  let index = cache.getTickDataIndex(tick)

  body.mass = data[ index++ ] || null
  body.pos.x = data[ index++ ]
  body.pos.y = data[ index++ ]
  body.vel.x = data[ index++ ]
  body.vel.y = data[ index++ ]
  body.linkId = data[ index++ ]

}

function idArrayCheck (haystack, needle) {

  if (haystack.length === 0)
    return true

  for (let i = 0; i < haystack.length; i++)
    if (haystack[i] === needle) {
      haystack.splice(i, 1) // remove from array to speed it up
      return true
    }

  return false
}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Simulation

export { DEFAULT_PHYSICS }
