import is from 'is-explicit'
import EventEmitter from 'events'
import now from 'performance-now'
import Body from './body'
import Vector from './vector'

/******************************************************************************/
// Simulation Class
/******************************************************************************/

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

    const bodies = this[bodies]
    const interval = this[interval]

    //calculate loop
    while (interval.bodyIndex < bodies.length) {
      this[_calculate](bodies[interval.bodyIndex])

      if (interval.exceeded)
        break

      interval.bodySubIndex = 0
      interval.bodyIndex += 1
    }

    //apply loop
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i]

      //we need to write the body class and figure out how cacheing is going to
      //work before we do this step

    }

    if (!interval.exceeded)
      interval.bodyIndex = 0
  }

  [_calculate](body) {
    //This function gets called a lot, so there are
    //some manual inlining and optimizations
    //i've made. I dunno if they make a difference in the
    //grand scheme of things, but it helps my OCD

    const bodies = this[_bodies]
    const interval = this[_interval]

    // relative position vector between two bodies
    // declared outside of the while loop
    // to save garbage collections on Vector objects
    const relative = Vector.zero

    if (interval.bodySubIndex === 0)
      body.force.x = 0, body.force.y = 0

    if (body.destroyed)
      return

    while (interval.bodySubIndex < bodies.length) {
      const otherBody = bodies[interval.bodySubIndex]

      if (body != otherBody && !otherBody.destroyed) {

        //inlining body.pos.sub(otherBody.pos)
        relative.x = body.pos.x - otherBody.pos.x
        relative.y = body.pos.y - otherBody.pos.y

        const distSqr = relative.sqrMagnitude
        //inlining relative.magnitude
        const dist = Math.sqrt(distSqr)

        if (dist < otherBody.collisionRadius + body.collisionRadius)
          this[_collide](body, otherBody)

        const G = this.g * body.mass / distSqr

        //inlining body.iadd(new Vector(G * relative.x / dist, G * relative.y / dist)
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

    small.destroyed = true
    small.emit('body-collision', big)
    big.emit('body-collision', small)

    this.emit('body-collision', small, big)

    const totalMass = big.mass + small.mass
    big.pos
      .imult(big.mass)
      .iadd(small.pos.mult(small.mass))
      .idiv(totalMass)

    big.vel
      .imult(big.mass)
      .iadd(small.vel.mult(small.mass))
      .idiv(totalMass)

    big.mass = totalMass
  }


  [_update]() {

    const interval = this[_interval]

    interval.start = now()
    interval.exceeded = false
    this.emit('interval-start')

    if (!this[_paused])
      while(!interval.check())
        this[_integrate]()

    this.emit('interval-complete')
  }

  // API **********************************************************************/
  constructor(updateDelta = 20, g = 0.225) {
    super()
    //this.updateDelta readonly
    Object.defineProperty(this, 'updateDelta', { value: updateDelta})
    //this.g readonly
    Object.defineProperty(this, 'g', { value: g})
    this[_bodies] = new Array()
    this[_update] = this[_update].bind(this)
    this[_interval] = {
      id: null,
      start: 0,
      exceeded: false,
      currentTick: 0,

      bodyIndex: 0,
      bodySubIndex: 0,

      check() {
        const delta = now() - this.start
        this.exceeded = delta >= this.updateDelta
        return this.exceeded
      }
    }
  }

  start() {

    if (!this[_paused])
      return

    const interval = this[interval]

    if (!interval.id)
      interval.id = setInterval(this[_update], this.updateDelta)

    this[_paused] = false
  }

  stop() {
    const interval = this[_interval]
    if (interval.id !== null)
      clearInterval(interval.id)

    this[_paused] = true
  }

  pause() {
    if (this[_paused])
      return

    this[_paused] = true
  }

  get running() {
    return this[_interval].id !== null
  }

  get paused() {
    return this[_paused]
  }

  createBody(mass, pos, vel) {
    const body = new Body(mass,
        new Vector(pos.x, pos.y),
        new Vector(vel.x, vel.y))

    this[_bodies].push(body)
    this.emit('body-create', body)

    return body
  }

  copy() {
    const duplicate = new Simulation(this.updateDelta, this.g)
    for (const body of this[_bodies])
      if (!body.destroyed)
        duplicate.createBody(body.mass, body.pos, body.vec)

    return duplicate
  }

}

new Simulation()
