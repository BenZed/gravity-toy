import is from 'is-explicit'
import { Vector, sqrt } from 'math-plus'
import { DEFAULT_PHYSICS } from '../constants'

/******************************************************************************/
// Main
/******************************************************************************/

function orbitalVelocity (bodyOrPos, parent, g = DEFAULT_PHYSICS.g) {

  const boundType = typeof this
  if (boundType === 'number')
    g = boundType

  else if (boundType === 'object') {
    const simulation = this
    g = simulation.g
  }

  const pos = is(bodyOrPos, Vector) ? bodyOrPos : bodyOrPos.pos

  const relative = pos.sub(parent.pos)
  const dist = relative.magnitude

  // I'm not sure why I have to divide by 10. According to Google
  // this equation should work without it
  const speed = sqrt(g * parent.mass / dist) * 0.1

  return relative
    .iperpendicular()
    .imult(speed)
    .iadd(parent.vel)

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default orbitalVelocity
