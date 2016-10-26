import { Simulation, Vector } from './modules/simulation'
import { lerp, escaping } from './modules/simulation/helper'

const { ceil, max, abs, random } = Math

const MAX_BODIES = 2500
const TICKS_UNTIL_COMPLETION = 1000 * 60 * 60

const CLOSE_BODY_DISTANCE = 10800
const CLOSE_BODY_POINTS = 5

export function generate(params = {}, radius = 500) {

  //simulation props
  const g = params.g || 0.5
  const radiusBase = params.radiusBase || 0.25
  const radiusFactor = params.radiusFactor || 0.5

  const sim = new Simulation({g, radiusBase, radiusFactor})

  //body creation props
  const density = params.density || 500
  const massRange = params.massRange || [100, 1000]

  //1 smaller bodies on edge
  //0 evenly distributed
  //-1 larger bodies on edge
  const massEdgeBalance = params.massEdgeBalance || 0.9

  const velMax = params.velMax || 2.5

  //0 for fully clockwise
  //1 for completely random
  const velDirCoeff = params.velDirCoeff || 0.8

  //1 for smaller bodies faster
  //0 for evenly distributed
  //-1 for larger bodies faster
  const velMassBalance = params.velMassBalance || 0.75

  //calculate props
  const [mLo, mHi] = massRange
  let totalMass = max(ceil(density * radius), 1)

  const originalTotalMass = totalMass

  const props = []
  while (totalMass > 0 && props.length < MAX_BODIES) {

    const mass = randomRange(mLo, mHi)
    totalMass -= mass

    const massFactor = (mass - mLo) / (mHi - mLo)

    //Determine Position
    const massEdgeFactor = massEdgeBalance >= 0 ? 1 - massFactor: massFactor
    const randomPos = randomVec(radius)
    const massPos = randomPos.normalized().mult(massEdgeFactor * radius)
    const pos = randomPos.lerp(massPos, abs(massEdgeBalance))

    //Determin Velocity
    const massVelFactor = velMassBalance >= 0 ? 1 - massFactor: massFactor
    const massMag = massVelFactor * velMax
    const randMag = randomRange(0, velMax)
    const mag = lerp(randMag, massMag, abs(velMassBalance))

    const rDir = randomVec().normalized().mult(mag)
    const cDir = pos.normalized().perpendicular().mult(mag)
    const vel = cDir.lerp(rDir, 1 - velDirCoeff)

    props.push({mass, pos, vel})
  }


  if (totalMass > 0) {
    const massBuff = totalMass / props.length
    props.forEach(prop => prop.mass += massBuff)
  }

  props.forEach(prop => sim.createBody({...prop}))

  addEventHandlers(sim, originalTotalMass)

  return sim
}

function addEventHandlers(sim, totalMass) {

  let score = 0

  sim.on('tick-complete', tick => {
    const bodies = getSystemBodies(sim)

    let systemMass = 0
    bodies.forEach(body => systemMass += body.mass)

    score += systemMass / totalMass

    if (tick >= TICKS_UNTIL_COMPLETION || bodies.length < 5)
      complete(sim, score * sim.g * bodies.length)
  })


}

function complete(sim, score) {
  if (sim.paused)
    return

  sim.paused = true

  console.log('complete', score)
}

/******************************************************************************/
// Helper
/******************************************************************************/

function getLargestBody(sim) {
  let largest = null

  sim.forEachBody(body => {
    if (!body.exists)
      return

    if (largest === null || largest.mass < body.mass)
      largest = body
  })

  return largest
}

function getSystemBodies(sim) {
  const largest = getLargestBody(sim)
  const bodies = []

  sim.forEachBody(body => {
    if (!body.exists)
      return

    body.escaping = body != largest && escaping(body, largest, sim.g)
    if (!body.escaping)
      bodies.push(body)
  })

  return bodies
}

function getCloseBodies(sim, body, dist = CLOSE_BODY_DISTANCE) {
  const bodies = []

  sim.forEachBody(b => {
    if (!b.exists)
      return

    if (b.pos.sub(body.pos).magnitude > dist)
      return

    bodies.push(b)
  })

  return bodies
}

export function randomParams() {

  const lo = randomRange(1, 100)
  const hi = lo * randomRange(10,1000)
  const g = randomRange(0.5, 5)
  return {
    g: g,
    radiusBase: randomRange(0.1,1),
    radiusFactor: randomRange(0.1,1),
    density: randomRange(1000,5000),
    massRange: [lo,hi],
    massEdgeBalance: randomRange(-1,1),
    velMax: randomRange(0.5, 10) * g,
    velDirCoeff: randomRange(0, 1),
    velMassBalance: randomRange(-1,1)
  }
}

export function randomVec(maxR = 1, minR = 0) {
  const angle = random() * 2 * Math.PI
  let radius
  do {
    radius = minR + random() * maxR
  } while (radius > maxR || radius < minR)

  const x = radius * Math.cos(angle)
  const y = radius * Math.sin(angle)

  return new Vector(x,y)
}

export function randomRange(lo, hi) {
  return (hi - lo) * random() + lo
}

export default generate
