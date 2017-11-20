import { radiusFromMass, MASS_MIN } from '../util'
import { Vector } from 'math-plus'

/******************************************************************************/
// Physics Body
/******************************************************************************/

// This class has functionality for integrating a body's physics and collisions

/******************************************************************************/
// Class
/******************************************************************************/

class Body {

  force = Vector.zero

  constructor (id, mass, pos, vel) {

    this.id = id
    this.mass = mass
    this.pos = pos
    this.vel = vel
    this.radius = radiusFromMass(mass)

  }
}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Body
