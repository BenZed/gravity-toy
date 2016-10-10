import is from 'is-explicit'
import EventEmitter from 'events'
import now from 'performance-now'
import Body, {NUM_CACHE_PROPERTIES} from './body'
import Vector from './vector'

/******************************************************************************/
// Simulation Class
/******************************************************************************/

//Used to make the interval between updates more consistent
const UPDATE_SLACK = 10

const ONE_GIG = 1073741824 //bytes
const MAX_MEMORY = ONE_GIG * 0.5
const MAX_NUMBER_ALLOCATIONS = MAX_MEMORY / 8
const MAX_CACHE_ALLOCATIONS = MAX_NUMBER_ALLOCATIONS / NUM_CACHE_PROPERTIES

//Symbols for "private" properties
const _bodies = Symbol('bodies'),
  _update     = Symbol('update'),
  _paused     = Symbol('paused'),
  _interval   = Symbol('interval'),
  _calculate  = Symbol('calculate'),
  _integrate  = Symbol('intergrate'),
  _collide    = Symbol('collide')

export default class Simulation extends EventEmitter {

  // UPDATE *******************************************************************/
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

    const TIME_STEP = this.UPDATE_DELTA * 0.001

    //apply loop
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i]

      if (body.destroyed)
        continue

      //velocity verlette integrator
      const oldVel = body.vel.copy()
      const newVel = oldVel.add(body.force.mult(TIME_STEP))
      body.vel = oldVel.add(newVel).mult(0.5)

      body.pos.iadd(body.vel)

      body.cache(interval.currentTick)
    }

    interval.bodyIndex = 0
    interval.currentTick ++
  }

  //This function gets called a lot, so there are
  //some manual inlining and optimizations
  //i've made. I dunno if they make a difference in the
  //grand scheme of things, but it helps my OCD
  [_calculate](body) {

    const bodies = this[_bodies]
    const interval = this[_interval]

    // relative position vector between two bodies
    // declared outside of the while loop
    // to save garbage collections on Vector objects
    const relative = Vector.zero

    //if the body sub index is zero, that means we
    //didn't leave in the middle of a force calculation
    //and we can reset
    if (interval.bodySubIndex === 0)
      body.force.x = 0, body.force.y = 0

    if (body.destroyed)
      return

    while (interval.bodySubIndex < bodies.length) {
      const otherBody = bodies[interval.bodySubIndex]

      if (body != otherBody && !otherBody.destroyed) {

        //inlining body.pos.sub(otherBody.pos)
        relative.x = otherBody.pos.x - body.pos.x
        relative.y = otherBody.pos.y - body.pos.y

        const distSqr = relative.sqrMagnitude

        //inlining relative.magnitude
        const dist = Math.sqrt(distSqr)

        if (dist < body.collisionRadius + otherBody.collisionRadius)
          this[_collide](body, otherBody)

        const G = this.G * (otherBody.mass / distSqr)

        //inlining body.iadd(relative.imult(G).idiv(dist))
        body.force.x += G * relative.x / dist
        body.force.y += G * relative.y / dist

      }

      interval.bodySubIndex++

      if (interval.check())
        return
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

    small.mass = 0 //this sets the destroyed flag to true
    big.mass = totalMass

    small.emit('body-collision', big)
    big.emit('body-collision', small)

    this.emit('body-collision', small, big)
  }

  [_update]() {
    const interval = this[_interval]
    const bodies = this[_bodies]

    interval.start = now()
    interval.exceeded = false
    this.emit('interval-start')

    const MaxCacheSize = this.maxCacheSize

    if (!this[_paused] && bodies.length > 0 && interval.currentTick < MaxCacheSize)
      while(!interval.check())
        this[_integrate]()

    for (let i = 0; i < bodies.length; i ++)
      this.emit('interval-body-update', bodies[i])

    interval.check() //to update interval.delta after interval-body-update listeners

    this.emit('interval-complete', Math.max(this.UPDATE_DELTA + UPDATE_SLACK, interval.delta))
  }

  // API **********************************************************************/
  constructor(UPDATE_DELTA = 20, G = 0.225) {
    super()

    //this.UPDATE_DELTA readonly
    Object.defineProperty(this, 'UPDATE_DELTA', { value: UPDATE_DELTA })

    //this.G readonly
    Object.defineProperty(this, 'G', { value: G })

    this[_update] = this[_update].bind(this)
    this[_paused] = true
    this[_bodies] = []

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

  get cacheSize() {
    return this[_interval].currentTick
  }

  get maxCacheSize() {
    return Math.floor(MAX_CACHE_ALLOCATIONS / this[_bodies].length)
  }

  get maxCacheSeconds() {
    return this.maxCacheSize / (this.UPDATE_DELTA + UPDATE_SLACK)
  }

  createBody(mass, pos = Vector.zero, vel = Vector.zero, tick) {

    tick = tick || this.cacheSize

    const body = new Body(mass,
        new Vector(pos.x, pos.y),
        new Vector(vel.x, vel.y),
        tick)

    body.cache(tick)

    this[_bodies].push(body)
    this.emit('body-create', body)

    return body
  }

  shiftCache(tick) {
    const newBodies = []

    // for ()

  }

  copy() {
    const duplicate = new Simulation(this.UPDATE_DELTA, this.G)
    for (const body of this[_bodies])
      if (!body.destroyed)
        duplicate.createBody(body.mass, body.pos, body.vec)

    return duplicate
  }

}
