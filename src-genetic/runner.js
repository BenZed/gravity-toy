import fs from 'fs'
import path from 'path'

import { Simulation } from '../lib'
import { pseudoRandom } from '../lib/helper'
import { randomRange, randomVec } from './helper'

export const DefaultResultSettings = {
  ticksSinceLastDestroyedBody: 20000,
  nearbyBodyDistance: 6000,
  leastBodies: 3,
}

export default function(params, settings = DefaultResultSettings) {
  const simulation = new Simulation()

  return new Promise(res => {
    console.log('iteration: ' + params.iteration)

    createBodies(simulation, params)
    createEventHandlers(simulation, params, settings, res)

    simulation.start()

  })
}

function createBodies(simulation, params) {

  const { bodies, radius, mass, vel, centerDensity, massFuzzy, velFuzzy } = params

  const massHi = randomRange(...mass)
  const massLo = randomRange(mass[0], massHi)

  for (let j = 0; j < bodies; j++) {

    const pos = randomVec(radius, radius * pseudoRandom() * centerDensity)

    const edgeFactor = pos.magnitude / radius

    const massEdgeHi = massHi * (1 - edgeFactor)
    const m = Math.min(Math.max(massEdgeHi - massEdgeHi * pseudoRandom() * massFuzzy, massLo), massHi)

    const speed = vel * edgeFactor
    const spin = pos.normalized().perpendicular(speed)

    const v = spin.add(randomVec(spin.magnitude).mult(velFuzzy))

    simulation.createBody( 0, m, pos, v)
  }
}

function createEventHandlers(simulation, params, settings, res) {

  let lastBodyDestroyed = 0
  let interval = 0

  simulation.on('body-collision', () => lastBodyDestroyed = simulation.cachedTicks)

  simulation.on('interval-complete', () => {
    interval ++

    if (interval % 100 === 0) {
      process.stdout.write('.')
      interval = 0
    }
  })

  simulation.on('tick-complete', tick => {

    let complete = false

    if (tick % 1000 === 0) {
      const largest = getLargestBody(simulation)
      const nearby = getBodiesInRange(simulation, largest, settings.nearbyBodyDistance)

      console.log('tick:', tick, 'bodies in system:', nearby.length)

      if (nearby.length <= settings.leastBodies)
        complete = true
    }

    if (tick - lastBodyDestroyed > settings.ticksSinceLastDestroyedBody ||
        tick >= simulation.maxCacheTicks)
      complete = true

    if (complete)
      createScoredResult(simulation, params, res)
  })
}

function createScoredResult(simulation, params, res) {
  simulation.stop()

  let json

  try {
    json = simulation.toJSON(false)
  } catch (err) {
    json = simulation.toJSON(false, true)
  } finally {
    json = { error: 'simulation could not be converted to JSON' }
  }

  json.params = params
  json.score = 0

  const largest = getLargestBody(simulation)
  const nearby = getBodiesInRange(simulation, largest, 6000)

  nearby.forEach(body => {
    json.score += 5
    json.score += body.mass / largest.mass * 10
  })

  const url = path.resolve(__dirname, 'results', `sim-${params.generation}-${params.iteration}.json`)


  fs.writeFileSync(url, JSON.stringify(json, null, 4), 'utf-8')

  res(json)

}

/******************************************************************************/
// Helper
/******************************************************************************/

function getLargestBody(simulation) {
  let largest = null

  simulation.forEachBody(body => {
    if (!body.exists)
      return

    if (largest === null || body.mass > largest.mass)
      largest = body
  })

  return largest
}

function getBodiesInRange(simulation, otherBody, range = 5000) {
  const bodies = []
  simulation.forEachBody(body => {
    if (!body.exists)
      return

    const dist = body.pos.sub(otherBody.pos).magnitude
    if (dist >= range)
      return

    bodies.push(body)
  })
  return bodies
}
