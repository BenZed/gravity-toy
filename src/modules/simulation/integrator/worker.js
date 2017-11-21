import { NO_LINK } from '../body'
import { DEFAULT_PROPS } from '../simulation'
import { min, Vector } from 'math-plus'

import Body from './body'

// This module doesn't need to export a class.
// It will only ever be required by a newly instanced child process.
// a web worker or a node fork. A child process will only ever require it
// once, so it doesn't need to be instancable.

// if someone wishes to run multiple simulations at once, they'll be invoking
// multiple forks or workers, and everything will be dandy.

/******************************************************************************/
// Setup
/******************************************************************************/

const isWebWorker = typeof self === 'object'
const isNodeFork = !isWebWorker && 'send' in process

if (isWebWorker)
  self.onmessage = msg => receiveStream(msg.data)
else if (isNodeFork)
  process.on('message', receiveStream)

const sendToParent = isWebWorker
  ? ::self.postMessage
  : isNodeFork
    ? ::process.send
    : null

/******************************************************************************/
// Data
/******************************************************************************/

const DELTA = 1 / 60 // 60 ticks represents 1 second

const NEXT_TICK_DELAY = 0

const world = {
  ...DEFAULT_PROPS,

  physicsStepCurrent: 0,
  nextAssignId: 0
}

const bodies = {

  all: [],
  real: [],
  psuedo: [],
  destroyed: [],
  created: [],

  sort () {

    const { all, real, psuedo, destroyed } = this

    real.length = 0
    psuedo.length = 0

    // largest at 0, smallest at last
    all.sort(byMass)

    const minRealIndex = min(world.realBodiesMin, all.length) - 1

    for (let i = 0; i < all.length; i++) {
      const body = all[i]

      // if we havent gotten to the minRealIndex yet, then this is considered
      // a real body. If we have, then this body's mass must be under the
      // realMassThreshold
      body.real = i < minRealIndex || body.mass > world.realMassThreshold

      if (body.real)
        real.push(body)
      else
        psuedo.push(body)
    }

    // destroyed bodies have zero mass and since we're sorted by mass they'll
    // all be at the end of the array. While there are still destroyed bodies at
    // the end of the all array, pop them and place them in the destroyed array
    while (last(all) && last(all).mass <= 0) {
      const body = all.pop()
      destroyed.push(body)
    }
  }
}

/******************************************************************************/
// I/O
/******************************************************************************/

function receiveStream ({ init, stream }) {

  for (const key in init)
    world[key] = init[key]

  bodies.all.length = 0

  let i = 0

  world.nextAssignId = stream[i++] // First item in stream is last assigned id

  while (i < stream.length) {
    const id = stream[i++]
    const mass = stream[i++]
    const posX = stream[i++]
    const posY = stream[i++]
    const velX = stream[i++]
    const velY = stream[i++]

    const pos = new Vector(posX, posY)
    const vel = new Vector(velX, velY)

    bodies.all.push(new Body(id, mass, pos, vel))
  }

  if (bodies.all.length > 0) {
    bodies.sort()
    tick()
  }

}

function sendStream () {

  if (++world.physicsStepCurrent < world.physicsSteps)
    return

  world.physicsStepCurrent = 0

  const { all, destroyed, created } = bodies

  const data = [
    world.nextAssignId,
    destroyed.map(idOfBody),
    created.map(idOfBody)
  ]

  destroyed.length = 0
  created.length = 0

  for (const body of all)
    data.push(
      body.id,
      body.mass,
      body.pos.x, body.pos.y,
      body.vel.x, body.vel.y,
      body.link ? body.link.id : NO_LINK
    )

  sendToParent(data)
}

/******************************************************************************/
// Tick
/******************************************************************************/

function tick (queueNextTick = true) {

  calculateForces()

  applyForces()

  if (sendToParent)
    sendStream()

  if (queueNextTick)
    setTimeout(tick, NEXT_TICK_DELAY)

}

function applyForces () {
  for (const body of bodies.all) {
    const { force, vel, pos } = body

    force.imult(DELTA).idiv(world.physicsSteps)

    vel.iadd(vel.add(force)).imult(0.5)
    pos.iadd(vel)
  }
}

function calculateForces () {

  for (const body of bodies.all)
    body.psuedoMass = 0

  for (const body of bodies.psuedo)
    body.calculatePsuedoMass(bodies, world)

  for (const body of bodies.psuedo)
    body.calculateForces(bodies, world)

  for (const body of bodies.real)
    body.calculateForces(bodies, world)

}

/******************************************************************************/
// Helper
/******************************************************************************/

const byMass = (a, b) => a.mass > b.mass
  ? -1 : a.mass < b.mass
  ? 1 : 0 // eslint-disable-line indent

const last = arr => arr[arr.length - 1]

const idOfBody = body => body.id

/******************************************************************************/
// Exports for testing
/******************************************************************************/

export { world, bodies, tick }
