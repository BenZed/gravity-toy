import Simulation from './simulation'
import { lerp, randomRange, randomVec, orbitalVelocity } from './simulation/helper'
import Vector from './simulation/vector'

const { max, min, abs } = Math

const DefaultParams = {
  //Gravitational constant. The higher, the more attractive
  //bodies are.
  g: 0.5,

  //radius of the area bodies are placed into
  areaRadius: 500,

  //density of the bodies within the area
  //the total mass of all bodies will be the
  //areaDensity times areaRadius
  areaDensity: 500,

  //Maximum number of bodies in the area.
  maxBodyCount: 1500,

  //The smallest a body can be. In pixels.
  radiusBase: 0.25,

  //the radius of a body will be the radius base of plus
  //the cube root of it's mass times the radius factor.
  radiusFactor: 0.5,

  massRange: [100, 1000],

  //1 = small bodies on edge
  //0 = evenly distributed
  //-1 = larger bodies on edge
  massEdgeBalance: 0.9,

  //percentage of total-mass in first core body
  massCore: 0.9,

  //percentage of massRange hi that a nested disc is created
  nestThreshold: 0.5,

  speedMax: 2.5,

  //1 = smaller bodies move faster
  //0 = body speeds are random
  //-1 = larger bodies move faster
  speedMassBalance: 0.75,

  //0 = bodies travel clockwise around area
  //1 = bodies travel in a random direction
  direction: 0.8,

  posOffset: Vector.zero,

  velOffset: Vector.zero

}

function createBodyProps(params) {

  const { massRange, massEdgeBalance, massCore, speedMax, speedMassBalance, direction,
    areaRadius, areaDensity, maxBodyCount, posOffset, velOffset, radiusBase } = params

  const [lo, hi] = massRange
  const props = []
  let totalMass = areaDensity * areaRadius
  const originalTotalMass = totalMass

  while (totalMass > 0 && props.length < maxBodyCount) {

    const firstBody = props.length === 0
    const mass = firstBody && massCore > 0 ? massCore * totalMass : max(randomRange(lo, hi), 1)
    totalMass -= mass

    if (firstBody) {
      const pos = posOffset
      const vel = velOffset
      props.push({ mass, pos, vel })
      continue
    }

    const massFactor = (mass - lo) / (hi - lo)

    //Determine Position
    const massEdgeFactor = massEdgeBalance >= 0 ? 1 - massFactor: massFactor
    const randomPos = randomVec(areaRadius, radiusBase)
    const massPos = randomPos.normalized().mult(massEdgeFactor * areaRadius)
    const pos = randomPos.lerp(massPos, abs(massEdgeBalance))

    pos.iadd(posOffset)

    //Determin Velocity
    // const massVelFactor = speedMassBalance >= 0 ? 1 - massFactor: massFactor
    // const massMag = massVelFactor * speedMax
    // const mag = lerp(randMag, massMag, abs(speedMassBalance))

    const rMag = randomRange(0, speedMax)
    const rDir = randomVec().normalized().mult(rMag)
    const cDir = orbitalVelocity(pos, {
      pos: posOffset,
      mass: props[0].mass
    }, params.g)

    if (isNaN(cDir.x))
      cDir.x = 0

    if (isNaN(cDir.y))
      cDir.y = 0

    const vel = cDir.lerp(rDir, 1 - direction)
    vel.iadd(velOffset)

    // if (massFactor > nestThreshold)
    //   props.push(...createNestedBodyProps(params, mass, pos, vel))
    // else
    props.push({ mass, pos, vel })
  }

  if (totalMass > 0) {
    const massBuff = totalMass / props.length
    props.forEach(prop => prop.mass += massBuff)
  }


  console.log(props.length)

  return props
}

function addBodiesToNewSimulation(props, { g, radiusBase, radiusFactor}) {
  const sim = new Simulation({g, radiusBase, radiusFactor})

  props.forEach(prop => sim.createBody({...prop}))

  return sim
}

/******************************************************************************/
//Exports/******************************************************************************/

//Generates a simulation with bodies within a circular
//area depending on inputted params
export default function generate(input = {}) {
  console.log(input)

  const params = {...DefaultParams, ...input}

  const props = createBodyProps(params)

  console.log(params)
  const sim = addBodiesToNewSimulation(props, params)

  return sim
}

export { generate }

export function randomParams() {

  const lo = randomRange(1, 100)
  const hi = lo * randomRange(10,1000)
  const g = randomRange(0.5, 10)

  return {
    g: g,
    radiusBase: randomRange(0.5,1),
    radiusFactor: randomRange(0.25,1) * max(g/2, 1),
    areaDensity: randomRange(10,10000),
    areaRadius: randomRange(200,2000),
    massRange: [lo,hi],
    massEdgeBalance: randomRange(-1,1),
    speedMassBalance: randomRange(-1,1),
    speedMax: randomRange(0.1, 1000) * g,
    direction: randomRange(0, 1),
  }
}
