import { EventEmitter } from 'events'
import { constProperty } from './helper'
import Vector from './vector'
import is from 'is-explicit'
/******************************************************************************/
// Constants
/******************************************************************************/

const BASE_MASS = 100
const COLLIDE_LOW_THRESHOLD = 4
const COLLIDE_RADIUS_FACTOR = 0.95
const COLLISION_RADIUS_MIN = 0.5

export const NUM_CACHE_PROPERTIES = 5

const { max, cbrt } = Math

/******************************************************************************/
// Helpers
/******************************************************************************/

function radiusFromMass(mass, rBase, rFactor) {

  return mass < BASE_MASS
    ? rBase * mass / BASE_MASS
    : rBase + cbrt(mass - BASE_MASS) * rFactor
}

function collisionRadiusFromRadius(radius) {
  return max(radius < COLLIDE_LOW_THRESHOLD
    ? radius
    : (radius - COLLIDE_LOW_THRESHOLD) * COLLIDE_RADIUS_FACTOR + COLLIDE_LOW_THRESHOLD

    , COLLISION_RADIUS_MIN)
}

/******************************************************************************/
// Private Symbols
/******************************************************************************/

const _mass = Symbol('mass'),
  _radius = Symbol('radius'),
  _collisionRadius = Symbol('collision-radius'),
  _cache = Symbol('cache'),
  _writeCacheAtTick = Symbol('write-cache-at-tick'),
  _applyStatsAtTick = Symbol('apply-stats-at-tick'),
  _tickIndex = Symbol('tick-index'),
  _shiftCache = Symbol('shift-cache'),
  _endTick = Symbol('end-tick'),
  _startTick = Symbol('start-tick')

export default class Body extends EventEmitter {

  //static symbols for 'protected' properties
  static [_writeCacheAtTick] = 'write-cache-at-tick'

  static [_applyStatsAtTick] = 'apply-stats-at-tick'

  static [_cache] = 'cache'

  constructor(mass, pos, vel, startTick, radiusBase, radiusFactor) {
    super()

    if (!is(mass, Number))
      throw new TypeError('mass must be a Number')

    if (!is(pos, Vector))
      throw new TypeError('pos must be a Vector')

    if (!is(vel, Vector))
      throw new TypeError('vel must be a Vector')

    if (!is(startTick, Number))
      throw new TypeError('startTick must be a Number')

    this[_cache] = []
    this[_startTick] = startTick
    this[_endTick] = null

    constProperty(this, 'radiusBase', radiusBase)
    constProperty(this, 'radiusFactor', radiusFactor)

    this.mass = mass
    this.pos = pos.copy()
    this.vel = vel.copy()
    this.force = Vector.zero

  }

  get mass() {
    return this[_mass]
  }

  set mass(value) {

    if (!this.exists && this[_mass] !== undefined && value > 0)
      return console.warn('cannot set a body\'s mass, once it\'s been destroyed.') //eslint-disable-line no-console

    this[_mass] = max(value, 0)
    this[_radius] = radiusFromMass(this[_mass], this.radiusBase, this.radiusFactor)
    this[_collisionRadius] = collisionRadiusFromRadius(this[_radius])
  }

  get radius() {
    return this[_radius]
  }

  get collisionRadius() {
    return this[_collisionRadius]
  }

  get exists() {
    return this[_mass] > 0
  }

  get cacheSize() {
    return this[_cache].length / NUM_CACHE_PROPERTIES
  }

  get startTick() {
    return this[_startTick]
  }

  get endTick() {
    return this[_endTick]
  }

  posAtTick(tick) {
    const index = this[_tickIndex](tick)
    const cache = this[_cache]

    const mass = cache[index]
    //only return stats if body exists at this tick
    if (!mass || mass <= 0)
      return null

    return new Vector(cache[index + 1], cache[index + 2])
  }

  statsAtTick(tick) {
    const index = this[_tickIndex](tick)
    const cache = this[_cache]

    const mass = cache[index]

    //only return stats if body exists at this tick
    if (!mass || mass <= 0)
      return null

    const radius = radiusFromMass(mass, this.radiusBase, this.radiusFactor)

    return {
      mass,
      radius,
      collisionRadius: collisionRadiusFromRadius(radius),
      pos: new Vector(cache[index + 1], cache[index + 2]),
      vel: new Vector(cache[index + 3], cache[index + 4])
    }
  }

  [_tickIndex](tick) {
    return (tick - this[_startTick]) * NUM_CACHE_PROPERTIES
  }

  [_writeCacheAtTick](tick) {

    const index = (tick - this[_startTick]) * NUM_CACHE_PROPERTIES

    const cache = this[_cache]

    //the cache is a single serialized array full of numbers.
    //I'm imagining that the less object references put into the cache array,
    //the longer they can be.
    cache[index] = this[_mass]
    cache[index + 1] = this.pos.x
    cache[index + 2] = this.pos.y
    cache[index + 3] = this.vel.x
    cache[index + 4] = this.vel.y

    if (this[_mass] <= 0 && !is(this[_endTick], Number))
      this[_endTick] = tick

  }

  [_applyStatsAtTick](tick) {

    // throw new Error('applyStatsAtTick doens\'t yet work')
    if (tick < this[_startTick])
      return false

    const stats = this.statsAtTick(tick)

    if (!stats) {
      this.mass = 0
      return true
    }

    this.mass = stats.mass
    this.pos = stats.pos
    this.vel = stats.vel

    return true
  }

  [_applyStatsAtTick](tick) {
    const index = this[_tickIndex](tick)
    const cache = this[_cache]

    const mass = cache[index]

    //only return stats if body exists at this tick
    if (!mass || mass <= 0)
      return null

    const radius = radiusFromMass(mass, this.radiusBase, this.radiusFactor)

    return {
      mass,
      radius,
      collisionRadius: collisionRadiusFromRadius(radius),
      pos: new Vector(cache[index + 1], cache[index + 2]),
      vel: new Vector(cache[index + 3], cache[index + 4])
    }
  }

  [_shiftCache](tick) {
    const index = this[_tickIndex](tick)
    const cache = this[_cache]

    if (index >= 0)
      cache.splice(0, index)

    this[_startTick] = max(this[_startTick] - tick, 0)
  }

}
