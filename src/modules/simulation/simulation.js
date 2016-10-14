import is from 'is-explicit'
import EventEmitter from 'events'
import now from 'performance-now'

import Body, { NUM_CACHE_PROPERTIES } from './body'
import Vector from './vector'
import { getProtectedSymbol, constProperty } from './helper'

const { floor, sqrt, max } = Math

/******************************************************************************/
// Simulation Class
/******************************************************************************/

//Used to make the interval between updates as consistent as possible
const UPDATE_SLACK = 10

const ONE_MEG = 1048576 //bytes
const MAX_MEMORY = ONE_MEG * 320
const MAX_NUMBER_ALLOCATIONS = MAX_MEMORY / 8 //bytes
const COLLISION_POINT_VECTOR_FACTOR = 0.75
const MAX_CACHE_ALLOCATIONS = floor(MAX_NUMBER_ALLOCATIONS / NUM_CACHE_PROPERTIES)

//Symbols for "private" properties
const _bodies = Symbol('bodies'),
  _update     = Symbol('update'),
  _paused     = Symbol('paused'),
  _interval   = Symbol('interval'),
  _calculate  = Symbol('calculate'),
  _integrate  = Symbol('intergrate'),
  _collide    = Symbol('collide'),
  _cacheSize  = Symbol('cache-size'),
  _applyCacheAtTick  = Symbol('apply-cache-at-tick')

//Symbols for Body "protected" peropties

const _writeCacheAtTick = getProtectedSymbol(Body, 'write-cache-at-tick'),
  _applyStatsAtTick = getProtectedSymbol(Body, 'apply-stats-at-tick')

export default class Simulation extends EventEmitter {

  // API **********************************************************************/
  constructor(UPDATE_DELTA = 20, G = 0.75) {
    super()

    constProperty(this, 'UPDATE_DELTA', UPDATE_DELTA)

    constProperty(this, 'G', G)

    this[_paused] = true
    this[_bodies] = []
    this[_cacheSize] = 0

    this[_interval] = {
      id: null,
      start: 0,
      delta: 0,
      exceeded: false,
      currentTick: 0,

      bodyIndex: 0,
      bodySubIndex: 0,

      check() {
        this.delta = now() - this.start
        return this.exceeded = this.delta >= UPDATE_DELTA
      }
    }
  }

  start() {
    if (!this[_paused])
      return

    const interval = this[_interval]

    //because the integrator will run for the number of milliseconds specified
    //by update delta, it's still going to take a small amount of time to perform
    //commands after the integration is complete. Things like caching/updating
    //body positions and firing event subscribers. Adding UPDATE_SLACK will help
    //to make the framerate more consistent
    if (!interval.id)
      interval.id = setInterval(this[_update], this.UPDATE_DELTA + UPDATE_SLACK)

    this[_paused] = false
  }

  stop() {
    const interval = this[_interval]

    if (interval.id !== null)
      clearInterval(interval.id)

    this[_paused] = true
  }

  get running() {
    return this[_interval].id !== null
  }

  get paused() {
    return this[_paused]
  }

  set paused(value) {
    this[_paused] = !!value
  }

  get cachedTicks() {
    return this[_interval].currentTick
  }

  get maxCacheTicks() {
    const totalCacheUsed = this[_cacheSize] / MAX_CACHE_ALLOCATIONS

    const maxCacheTicks = floor(this[_interval].currentTick / totalCacheUsed)

    return is(maxCacheTicks, Number) ? maxCacheTicks : Infinity
  }

  get cachedSeconds() {
    return this[_interval].currentTick / (this.UPDATE_DELTA + UPDATE_SLACK)
  }

  get maxCacheSeconds() {
    return this.maxCacheTicks / (this.UPDATE_DELTA + UPDATE_SLACK)
  }

  createBodyAtTick(tick, mass, pos = Vector.zero, vel = Vector.zero) {

    tick = is(tick, Number) ? tick : this.cachedTicks

    const body = new Body(mass,
        new Vector(pos.x, pos.y),
        new Vector(vel.x, vel.y),
        tick)


    body[_writeCacheAtTick](tick)
    this[_bodies].push(body)
    this.emit('body-create', body)

    this[_applyCacheAtTick](tick)

    return body
  }

  forEachBody(func) {
    this[_bodies].forEach(func)
  }

  get numBodies() {
    return this[_bodies].length
  }

  copy() {
    const duplicate = new Simulation(this.UPDATE_DELTA, this.G)
    for (const body of this[_bodies])
      if (body.exists)
        duplicate.createBody(body.mass, body.pos, body.vec)

    return duplicate
  }

  [_applyCacheAtTick](tick) {

    const interval = this[_interval]
    const bodies = this[_bodies]

    if (tick > interval.currentTick)
      throw new Error('Can\'t apply tick that hasn\'t happened yet.')

    interval.currentTick = tick

    let i = 0
    while(i < bodies.length) {
      const body = bodies[i]

      if (body[_applyStatsAtTick](tick))
        i++
      else bodies.splice(i, 1)
    }
  }

  [_integrate]() {

    const bodies = this[_bodies]
    const interval = this[_interval]

    // calculate loop
    while (interval.bodyIndex < bodies.length) {
      this[_calculate](bodies[interval.bodyIndex])

      if (interval.exceeded)
        return

      interval.bodySubIndex = 0
      interval.bodyIndex += 1
    }

    //count the cache and apply the physics integrator

    this[_cacheSize] = 0
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i]

      if (!body.exists) {
        this[_cacheSize] += body.cacheSize
        continue
      }

      //Velocity Verlet

      const oldVel = body.vel.copy()
      const newVel = oldVel.add(body.force.mult(this.UPDATE_DELTA * 0.001))
      body.vel = oldVel.add(newVel).mult(0.5)

      body.pos.iadd(body.vel)

      body[_writeCacheAtTick](interval.currentTick)
      this[_cacheSize] += body.cacheSize
    }

    interval.bodyIndex = 0
    interval.currentTick ++
  }

  //This function gets called a lot, so there are
  //some manual inlining and optimizations
  //I've made. I dunno if they make a difference in the
  //grand scheme of things, but it helps my OCD
  [_calculate](body) {

    if (!body.exists)
      return

    const bodies = this[_bodies]
    const interval = this[_interval]

    // Relative position vector between two bodies.
    // Declared outside of the while loop to save
    // garbage collections on Vector objects
    const relative = Vector.zero

    //Series of points to test collisions from.
    //If the body is moving slow enough, this should only include one point.
    const collisionPoints = [body.pos]

    //During the collision detection phase, we'll save time by using
    //squard distances
    const collisionRadiusSqr = body.collisionRadius ** 2
    const velMagnitudeSqr = body.vel.sqrMagnitude

    //Velocity Collision Factor. If this number
    //is greater than one, we need to add collisionPoints,
    //because the object is moving so fast that a regular
    //circle-overlap test could miss.
    const vcf = velMagnitudeSqr / collisionRadiusSqr

    //Fill the positions if necessary
    if (vcf > 1) {

      //The COLLISION_POINT_VECTOR_FACTOR reduces the number of points
      //we need to create by taking into account how much they'll overlap
      //with the collisinRadius
      const length = vcf * COLLISION_POINT_VECTOR_FACTOR
      const inc = body.vel.div(length)
      const pos = body.pos.copy()

      while (collisionPoints.length < length)
        collisionPoints.push(pos.iadd(inc).copy())
    }

    //If the bodySubIndex is zero, that means we
    //didn't leave in the middle of a force calculation
    //and we can reset.
    if (interval.bodySubIndex === 0)
      body.force.x = 0, body.force.y = 0

    while (interval.bodySubIndex < bodies.length) {

      const otherBody = bodies[interval.bodySubIndex++]

      if (interval.check())
        break

      if (body === otherBody || !otherBody.exists)
        continue

      //inlining otherBody.pos.sub(body.pos)
      relative.x = otherBody.pos.x - body.pos.x
      relative.y = otherBody.pos.y - body.pos.y

      let distSqr = relative.sqrMagnitude

      const otherCollisionRadiusSqr = otherBody.collisionRadius ** 2

      //skip collisionPoint checking if the otherBody is too far away to warrant
      if (!(collisionRadiusSqr + velMagnitudeSqr + otherCollisionRadiusSqr < distSqr)) {

        //check all of the collisionPoints
        for (let i = 0; i < collisionPoints.length; i++) {
          //reuse relative because we dont need it for the rest of this iteration
          relative.x = otherBody.pos.x - collisionPoints[i].x
          relative.y = otherBody.pos.y - collisionPoints[i].y

          //reuse distSqr cuz fuck it, why not?
          distSqr = relative.sqrMagnitude

          //ta daaaa
          if (collisionRadiusSqr + otherCollisionRadiusSqr > distSqr) {
            this[_collide](body, otherBody)
            break
          }
        }
      }

      //Don't calculate forces if we just collided
      if (!body.exists || !otherBody.exists)
        continue

      //inlining relative.magnitude
      const dist = sqrt(distSqr)

      const G = this.G * otherBody.mass / distSqr

      //inlining with squared distances
      body.force.x += G * relative.x / dist
      body.force.y += G * relative.y / dist
    }
  }

  [_collide](b1, b2) {
    const [big, small] = b1.mass > b2.mass ? [b1,b2] : [b2,b1]

    const totalMass = big.mass + small.mass
    big.pos
      .imult(big.mass)
      .iadd(small.pos.mult(small.mass))
      .idiv(totalMass)

    big.vel
      .imult(big.mass)
      .iadd(small.vel.mult(small.mass))
      .idiv(totalMass)

    small.mass = 0 //this sets the exists flag to false
    big.mass = totalMass

    small.emit('body-collision', big)
    big.emit('body-collision', small)
    this.emit('body-collision', small, big)
  }

  [_update] = () => {
    const interval = this[_interval]
    const bodies = this[_bodies]

    //start the interval
    interval.start = now()
    interval.exceeded = false
    this.emit('interval-start', deltaTime)

    //integrate until the time budget has been used up or the cache is full
    if (!this[_paused] && bodies.length > 0 && interval.currentTick < this.maxCacheTicks)
      while(!interval.check())
        this[_integrate]()

    const deltaTime = max(this.UPDATE_DELTA + UPDATE_SLACK, interval.delta)

    this.emit('interval-complete', deltaTime)
  }

}
