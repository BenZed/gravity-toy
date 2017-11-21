import { radiusFromMass } from '../util'
import { Vector, sqrt } from 'math-plus'

/******************************************************************************/
// Physics Body
/******************************************************************************/

// This class has functionality for integrating a body's physics and collisions

/******************************************************************************/
// Class
/******************************************************************************/

class Body {

  real = true
  psuedoMass = 0
  link = null

  force = Vector.zero

  constructor (id, mass, pos, vel) {

    this.id = id
    this.mass = mass
    this.pos = pos
    this.vel = vel
    this.radius = radiusFromMass(mass)

  }

  calculatePsuedoMass (bodies, world) {
    this.calculateForces(bodies, world, true)
  }

  // This loop inside this function is called a lot throughout
  // a single tick, so there are some manual inlining and optimizations
  // I've made. I dunno if they make any real difference in the
  // grand scheme of things, but it helps my OCD
  calculateForces (bodies, world, addPsuedoMassOnly = false) {

    // Relative position vector between two bodies.
    // Declared outside of the while loop to save
    // garbage collections on Vector objects
    const relative = Vector.zero

    // Reset Forces
    if (!addPsuedoMassOnly) {
      this.force.x = 0
      this.force.y = 0
    }

    this.link = null
    let linkAttraction = -Infinity

    for (const body of bodies.real) {

      if (this === body)
        continue

      // inlining body.pos.sub(this.pos)
      relative.x = body.pos.x - this.pos.x
      relative.y = body.pos.y - this.pos.y

      const distSqr = relative.sqrMagnitude

      const mass = addPsuedoMassOnly ? body.mass : body.mass + body.psuedoMass

      const attraction = world.g * mass / distSqr
      if (linkAttraction < attraction) {
        linkAttraction = attraction
        this.link = body
      }

      if (!addPsuedoMassOnly) {
        // inlining relative.magnitude
        const dist = sqrt(distSqr)
        this.force.iadd(relative.imult(attraction).idiv(dist))
      }

    }

    if (addPsuedoMassOnly)
      this.link.psuedoMass += this.mass
  }
}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Body
