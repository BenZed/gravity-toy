import { EventEmitter } from 'events'
import Vector from './vector'
import is from 'is-explicit'

const BASE_RADIUS = 0.25
const RADIUS_MULTIPLIER = 0.1
const COLLIDE_LOW_THRESHOLD = 2
const COLLIDE_RADIUS_FACTOR = 0.75

const NUM_CACHE_PROPERTIES = 5

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
    this[_mass] = mass

    this.pos = pos.copy()
    this.vel = vel.copy()
    this.force = Vector.zero

    this[_cache] = []
    this[_startTick] = startTick

  }

  cache(tick) {
    const index = (tick - this[_startTick]) * NUM_CACHE_PROPERTIES

    const cache = this[_cache]

    cache[index] = this[_mass]
    cache[index + 1] = this.pos.x
    cache[index + 2] = this.pos.y
    cache[index + 3] = this.vel.x
    cache[index + 4] = this.vel.y

    console.log(this.statsAtTick(tick))
  }

  invalidateCache(tick) {

  }

  statsAtTick(tick) {
    const index = (tick - this[_startTick]) * NUM_CACHE_PROPERTIES
    const cache = this[_cache]

    const pos = new Vector(cache[index + 1], cache[index + 2])

    return {
      mass: cache[index],
      x: pos.x,
      y: pos.y
      // pos: new Vector(cache[index + 1], cache[index + 2]),
      // vel: new Vector(cache[index + 3], cache[index + 4])
    }
  }

  get mass() {
    return this[_mass]
  }

  set mass(value) {
    this[_mass] = value
    this[_radius] = BASE_RADIUS + Math.cbrt(this[_mass]) * RADIUS_MULTIPLIER
    this[_collisionRadius] = this[_radius] < COLLIDE_LOW_THRESHOLD
      ? this[_radius]
      : (this[_radius] - COLLIDE_LOW_THRESHOLD) * COLLIDE_RADIUS_FACTOR + COLLIDE_LOW_THRESHOLD
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
