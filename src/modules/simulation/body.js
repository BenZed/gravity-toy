import { EventEmitter } from 'events'
import Vector from './vector'
import is from 'is-explicit'

export class Body extends EventEmitter {

  constructor(mass, pos, vel) {
    super()

    if (!is(mass, Number))
      throw new TypeError('mass must be a Number')

    if (!is(pos, Vector))
      throw new TypeError('pos must be a Vector')

    if (!is(vel, Vector))
      throw new TypeError('vel must be a Vector')

    this.mass = mass
    this.pos = pos
    this.vel = vel
    this.cache = []
    
  }

  get destroyed() {
    return this.mass <= 0
  }

}
