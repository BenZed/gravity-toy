import is from 'is-explicit'
import define from 'define-utility'

import { Vector, floor } from '@benzed/math'
import { radiusFromMass } from './util'
import { MASS_MIN, NO_LINK, CACHED_VALUES_PER_TICK } from './constants'

/******************************************************************************/
// Timeline Body
/******************************************************************************/

// This class is for holding all of the data about a body over time.

/******************************************************************************/
// Symbols
/******************************************************************************/

const CACHE = Symbol('cache')

/******************************************************************************/
// Body Class
/******************************************************************************/

class Body {

  constructor (props, tick, id) {

    validateTick(tick)

    const { mass, vel, pos } = validateProps(props)

    this::define()
      .enum.let('mass', mass)
      .enum.get('radius', radiusFromMass)
      .enum.const('pos', pos)
      .enum.const('vel', vel)
      .let('linkId', NO_LINK)
      .let('mergeId', NO_LINK)
      .const('id', id)
      .const(CACHE, {
        birthTick: tick,
        deathTick: null,
        getTickDataIndex,
        data: [ mass, pos.x, pos.y, vel.x, vel.y, NO_LINK ]
      })
  }

  get exists () {
    return is(this.mass, Number) && this.mass > 0
  }

  valueOf () {
    return this.mass
  }

}

/******************************************************************************/
// Private Danglers
/******************************************************************************/

// The CACHE.data is just a long array of numbers. This function returns what
// index in that array represents a given tick.

function getTickDataIndex (tick) {
  const cache = this
  return (floor(tick) - cache.birthTick) * CACHED_VALUES_PER_TICK
}

/******************************************************************************/
// Helper
/******************************************************************************/

function validateProps (props) {

  if (!is.plainObject(props))
    throw new Error('Body requires a plain props object as its first parameter')

  let { mass, vel, pos } = props

  if (is(pos) && !is(pos, Vector))
    throw new Error('props.pos, if defined, is expected to be a Vector.')

  if (is(vel) && !is(vel, Vector))
    throw new Error('props.vel, if defined, is expected to be a Vector.')

  if (!is(mass) || mass < MASS_MIN)
    throw new Error(`props.mass, if defined, must be a number above or equal to ${MASS_MIN}`)

  pos = pos || Vector.zero
  vel = vel || Vector.zero
  mass = mass || MASS_MIN

  return { mass, vel, pos }
}

function validateTick (tick) {

  if (!is(tick, Number) && tick >= 0 && isFinite(tick))
    throw new Error('Tick is expected to be a positive finite number.')

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Body

export { Body, CACHE }
