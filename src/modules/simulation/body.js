import { EventEmitter } from 'events'
import Vector from './vector'
import is from 'is-explicit'

/******************************************************************************/
// Constants
/******************************************************************************/

const BASE_RADIUS = 0.25
const RADIUS_MULTIPLIER = 0.1
const COLLIDE_LOW_THRESHOLD = 2
const COLLIDE_RADIUS_FACTOR = 0.75

const NUM_CACHE_PROPERTIES = 5

/******************************************************************************/
// Helpers
/******************************************************************************/

function radiusFromMass(mass) {
  return BASE_RADIUS + Math.cbrt(mass) * RADIUS_MULTIPLIER
}

function collisionRadiusFromRadius(radius) {
  return radius < COLLIDE_LOW_THRESHOLD ? radius
    : (radius - COLLIDE_LOW_THRESHOLD) * COLLIDE_RADIUS_FACTOR + COLLIDE_LOW_THRESHOLD
}


/******************************************************************************/
// Private Symbols
/******************************************************************************/

const _mass = Symbol('mass'),
  _radius = Symbol('radius'),
  _collisionRadius = Symbol('collision-radius'),
  _cache = Symbol('cache'),
  _startTick = Symbol('start-tick')


export default class Body extends EventEmitter {

  constructor(mass, pos, vel, startTick) {
    super()

    if (!is(mass, Number))
      throw new TypeError('mass must be a Number')

    if (!is(pos, Vector))
      throw new TypeError('pos must be a Vector')

    if (!is(vel, Vector))
      throw new TypeError('vel must be a Vector')

    if (!is(startTick, Number))
      throw new TypeError('startTick must be a Number')

    this[_radius] = null
    this[_collisionRadius] = null
    this.mass = mass

    this.pos = pos.copy()
    this.vel = vel.copy()
    this.force = Vector.zero

    this[_cache] = []
    this[_startTick] = startTick

  }

  cache(tick) {
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

  }

  shiftCache(tick) {
    const index = (tick - this[_startTick]) * NUM_CACHE_PROPERTIES
    const cache = this[_cache]

    if (index >= 0)
      cache.splice(0, index)

    this[_startTick] -= tick
    if (this[_startTick] < 0)
      this[_startTick] = 0

  }

  statsAtTick(tick) {
    const index = (tick - this[_startTick]) * NUM_CACHE_PROPERTIES
    const cache = this[_cache]

    const mass = cache[index]

    //only return stats if body exists at this tick
    if (!mass || mass <= 0)
      return null

    const radius = radiusFromMass(mass)

    return {
      mass,
      radius,
      collisionRadius: collisionRadiusFromRadius(radius),
      pos: new Vector(cache[index + 1], cache[index + 2]),
      vel: new Vector(cache[index + 3], cache[index + 4])
    }
  }

  get mass() {
    return this[_mass]
  }

  set mass(value) {
    this[_mass] = value
    this[_radius] = radiusFromMass(this[_mass])
    this[_collisionRadius] = collisionRadiusFromRadius(this[_radius])
  }

  get radius() {
    return this[_radius]
  }

  get collisionRadius() {
    return this[_collisionRadius]
  }

  get destroyed() {
    return this.mass <= 0
  }

}
