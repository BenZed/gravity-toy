import is from 'is-explicit'
import Define from 'define-utility'
import { Vector, floor } from 'math-plus'
import { radiusFromMass } from './util'

import { TICK_INDEX, TICK_INITIAL, TICK_END, CACHE, NUM_CACHE_PROPS } from './cache'

export const NO_PARENT = -1 //parentid if body has no parent

export const MASS_MIN = 50

export default class Body {

  constructor(props, tick, id) {

    //Holy validations, batman!
    if (!is(props, Object))
      throw new Error('Body requires a props object as its first parameter')

    if (!isFinite(tick))
      throw new Error('Tick is expected to be a number.')

    let { mass, vel, pos } = props

    if (is(pos) && !is(pos, Vector))
      throw new Error('props.pos, if defined, is expected to be a Vector.')
    pos = pos || Vector.zero

    if (is(vel) && !is(vel, Vector))
      throw new Error('props.vel, if defined, is expected to be a Vector.')
    vel = vel || Vector.zero

    if (!is(mass) || mass < MASS_MIN)
      throw new Error(`props.mass, if defined, must be a number above or equal to ${MASS_MIN}`)
    mass = mass || MASS_MIN

    Define(this)
      .let.enum('mass', mass)
      .get.enum('radius', radiusFromMass)
      .const.enum('pos', pos)
      .const.enum('vel', vel)
      .const('id', id)
      .let('parentId', NO_PARENT)
      .const(CACHE, [mass, pos.x, pos.y, vel.x, vel.y, NO_PARENT])
      .let(TICK_INITIAL, tick)
      .let(TICK_END,     null)
  }

  [TICK_INDEX](tick) {
    return (floor(tick) - this[TICK_INITIAL]) * NUM_CACHE_PROPS
  }

  get exists() {
    return is(this.mass, Number)
  }

  read(tick) {

    const cache = this[CACHE]
    let i = this[TICK_INDEX](tick)

    const mass = cache[i++]

    //if we've gotten here, the requested tick has not been cached for this body,
    //the request tick is in an invalid range or it is not a number
    if (!is(mass, Number))
      return null

    const x = cache[i++]
    const y = cache[i++]
    const vx = cache[i++]
    const vy = cache[i++]
    const parentId = cache[i++]

    return [ mass, x, y, vx, vy, parentId ]

  }

}
