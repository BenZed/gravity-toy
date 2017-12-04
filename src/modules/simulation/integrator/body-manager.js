import { min, sqrt, Vector } from 'math-plus'
import { SortedArray, radiusFromMass, closestPointOnLine } from '../util'

/******************************************************************************/
// Constants
/******************************************************************************/

const DELTA = 1 / 60 // 30 ticks represents 1 second

const RELATIVE_VELOCITY_EPSILON = 1

/******************************************************************************/
// Main
/******************************************************************************/

class BodyManager {

  nextAssignId = 0
  sendInterval = 0

  destroyed = []
  absorbing = []
  created = []
  psuedo = []
  living = []
  real = []

  boundsX = new SortedArray()
  boundsY = new SortedArray()

  overlaps = {
    * [Symbol.iterator] () {
      for (const key in this)
        yield this[key]
    }
  }

  checkBoundsIfEdgesOverlap = (e1, e2) => {

    const above = e1 >= e2
    if (above)
      this.checkBounds(e1.body, e2.body)

    return above ? 1 : -1
  }

  checkBounds = (b1, b2) => {

    if (b1 === b2)
      return

    const { overlaps } = this

    const key = pairKey(b1, b2)
    const hasPair = key in overlaps
    const hasOverlap = b1.bounds.overlap(b2.bounds)

    if (hasPair && !hasOverlap)
      delete overlaps[key]

    else if (!hasPair && hasOverlap)
      overlaps[key] = [ b1, b2 ]
  }

  updateOverlaps () {

    const { boundsX, boundsY, living, checkBoundsIfEdgesOverlap } = this

    for (const body of living)
      body.bounds.refresh()

    boundsX.sort(checkBoundsIfEdgesOverlap)
    boundsY.sort(checkBoundsIfEdgesOverlap)

  }

  setBodies (bodies, physics) {

    this.living.length = 0
    this.living.push(...bodies)
    this.sort(physics)

    const { boundsX, boundsY } = this

    boundsX.length = 0
    boundsY.length = 0

    for (const body of this.living) {
      const { bounds } = body

      bounds.refresh()

      // push, rather than insert so that any initially overlapping bodies will
      // be caught by the first updateOverlaps()
      boundsX.push(bounds.l, bounds.r)
      boundsY.push(bounds.t, bounds.b)
    }

  }

  calculateForces (physics) {

    const { living, psuedo, real } = this

    for (const body of living)
      body.massFromPsuedoBodies = 0

    for (const body of psuedo)
      calculatePsuedoMass(body, real, physics)

    for (const body of psuedo)
      calculateForces(body, real, physics)

    for (const body of real)
      calculateForces(body, real, physics)

  }

  applyForces (physics) {

    const { living } = this

    for (const body of living) {
      const { force, vel, pos } = body

      force.imult(DELTA).idiv(physics.physicsSteps)

      vel.iadd(vel.add(force)).imult(0.5)
      pos.iadd(vel)
    }
  }

  checkCollisions (physics) {
    let needsSort = false

    for (const key in this.overlaps) {
      const [ b1, b2 ] = this.overlaps[key]

      // If either body was destroyed in another collision
      if (b1.mass <= 0 || b2.mass <= 0)
        delete this.overlaps[key]

      else if (didCollide(b1, b2)) {
        delete this.overlaps[key]

        this.combineBodies(b1, b2)
        needsSort = true
      }

    }

    if (needsSort)
      this.sort(physics)
  }

  combineBodies (...args) {

    const [ big, small ] = args.sort(byMass)

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
    big.radius = radiusFromMass(totalMass)

    small.mass = 0
    small.radius = 0

    const { boundsX, boundsY } = this

    boundsX.remove(small.bounds.r)
    boundsX.remove(small.bounds.l)
    boundsY.remove(small.bounds.b)
    boundsY.remove(small.bounds.t)
  }

  sort (physics) {

    const { living, real, psuedo, destroyed } = this
    const { realBodiesMin, realMassThreshold } = physics

    real.length = 0
    psuedo.length = 0

    if (living.length === 0)
      return

    // largest at 0, smallest at last
    living.sort(byMass)

    const minRealIndex = min(realBodiesMin, living.length)

    for (let i = 0; i < living.length; i++) {
      const body = living[i]

      // If we encounter a destroyed body, then all future bodies will also be
      // destroyed, and they shouldn't be added to the real or psuedo arrays
      if (body.mass <= 0)
        break

      // if we havent gotten to the minRealIndex yet, then this is considered
      // a real body. If we have, then this body's mass must be under the
      // realMassThreshold
      body.real = i < minRealIndex || body.mass >= realMassThreshold
      if (body.real)
        real.push(body)
      else
        psuedo.push(body)
    }

    // destroyed bodies have zero mass and since we're sorted by mass they'll
    // all be at the end of the array. While there are still destroyed bodies at
    // the end of the all array, pop them and place them in the destroyed array
    while (last(living).mass <= 0) {
      const body = living.pop()
      destroyed.push(body)
    }

  }

}

/******************************************************************************/
// Private
/******************************************************************************/

function didCollide (...args) {

  const [ fast, slow ] = args.sort(bySpeed)

  const rel = fast.vel.sub(slow.vel)

  let dist

  // Due to float point precision errors, we can't use the same linear algebra
  // to determine the position of moving circles if their velocities are very
  // close because we'll get false positives.

  dist = fast.pos.sub(slow.pos).magnitude
  if (rel.sqrMagnitude < RELATIVE_VELOCITY_EPSILON) {
    const col = closestPointOnLine(fast.pos.sub(rel), fast.pos, slow.pos)
    dist = col.sub(slow.pos).magnitude
  }

  return dist < fast.radius + slow.radius
}

function calculatePsuedoMass (body, bodies, physics) {
  calculateForces(body, bodies, physics, true)
}

// This loop inside this function is called a lot throughout
// a single tick, so there are some manual inlining and optimizations
// I've made. I dunno if they make any real difference in the
// grand scheme of things, but it helps my OCD
function calculateForces (body, bodies, physics, addPsuedoMassOnly = false) {

  // Relative position vector between two bodies.
  // Declared outside of the while loop to save
  // garbage collections on Vector objects
  const relative = Vector.zero

  // Reset Forces
  if (!addPsuedoMassOnly) {
    body.force.x = 0
    body.force.y = 0
  }

  body.link = null

  let linkAttraction = -Infinity

  for (const other of bodies) {

    if (body === other)
      continue

    // inlining body.pos.sub(this.pos)
    relative.x = other.pos.x - body.pos.x
    relative.y = other.pos.y - body.pos.y

    const distSqr = relative.sqrMagnitude

    const mass = addPsuedoMassOnly
      ? other.mass
      : other.mass + other.massFromPsuedoBodies

    const attraction = physics.g * mass / distSqr
    if (linkAttraction < attraction) {
      linkAttraction = attraction
      body.link = other
    }

    if (!addPsuedoMassOnly) {
      // inlining relative.magnitude
      const dist = sqrt(distSqr)
      body.force.iadd(relative.imult(attraction).idiv(dist))
    }

  }

  if (addPsuedoMassOnly && !body.real && body.link)
    body.link.massFromPsuedoBodies += body.mass
}

/******************************************************************************/
// Helper
/******************************************************************************/

const byMass = (a, b) => a.mass > b.mass
  ? -1 : a.mass < b.mass
  ? 1 : 0 // eslint-disable-line indent

const bySpeed = (a, b) => {

  const aSqrVel = a.vel.sqrMagnitude
  const bSqrVel = b.vel.sqrMagnitude

  return aSqrVel > bSqrVel
    ? -1 : aSqrVel < bSqrVel
    ? 1 : 0 // eslint-disable-line indent
}

const last = arr => arr[arr.length - 1]

const pairKey = (b1, b2) =>
  b1.id < b2.id
    ? `${b1.id}-${b2.id}`
    : `${b2.id}-${b1.id}`

/******************************************************************************/
// Exports
/******************************************************************************/

export default BodyManager
