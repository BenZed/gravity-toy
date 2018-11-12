import { cbrt } from '@benzed/math'

import { MASS_MIN, RADIUS_MIN, RADIUS_FACTOR } from '../constants'

/******************************************************************************/
// Main
/******************************************************************************/

function radiusFromMass (...args) {

  // why?
  // So that this function can be attached to an object that has mass
  // and used as a getter
  const mass = isFinite(args[0]) ? args[0] : this ? this.mass : MASS_MIN

  return RADIUS_MIN + cbrt(mass - MASS_MIN) * RADIUS_FACTOR

}

function massFromRadius (...args) {

  // why?
  // So that this function can be attached to an object that has mass
  // and used as a getter
  const radius = isFinite(args[0]) ? args[0] : this ? this.radius : RADIUS_MIN

  return ((radius - RADIUS_MIN) / RADIUS_FACTOR) ** 3 + MASS_MIN

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default radiusFromMass

export { radiusFromMass, massFromRadius }
