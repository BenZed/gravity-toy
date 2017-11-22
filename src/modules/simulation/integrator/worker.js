import { DEFAULT_PHYSICS, NO_LINK } from '../constants'
import { min, Vector } from 'math-plus'

import Body from './body'
import Partition from './partition'

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

const physics = {
  ...DEFAULT_PHYSICS
}

// for broad phase collision detection
const partitions = {

  all: [],

  place (body) {
    body.calculateBounds()
    body.partition = null

    for (const partition of this.all)
      if (partition.fits(body))
        break

    if (!body.partition) {
      body.partition = new Partition(body)
      this.all.push(body.partition)
    }

  }

}

const bodies = {

  nextAssignId: 0,
  sendInterval: 0,

  living: [],
  real: [],
  psuedo: [],
  destroyed: [],
  created: [],

  sort () {

    const { living, real, psuedo, destroyed } = this

    real.length = 0
    psuedo.length = 0

    if (living.length === 0)
      return

    // largest at 0, smallest at last
    living.sort(byMass)

    const minRealIndex = min(physics.realBodiesMin, living.length)

    for (let i = 0; i < living.length; i++) {
      const body = living[i]

      // If we encounter a destroyed body, then all future bodies will also be
      // destroyed, and they shouldn't be added to the real or psuedo arrays
      if (body.mass <= 0)
        break

      // if we havent gotten to the minRealIndex yet, then this is considered
      // a real body. If we have, then this body's mass must be under the
      // realMassThreshold
      body.real = i < minRealIndex || body.mass >= physics.realMassThreshold
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
// I/O
/******************************************************************************/

function receiveStream ({ init, stream }) {

  for (const key in init)
    physics[key] = init[key]

  bodies.living.length = 0

  let i = 0

  bodies.nextAssignId = stream[i++] // First item in stream is last assigned id

  while (i < stream.length) {
    const id = stream[i++]
    const mass = stream[i++]
    const posX = stream[i++]
    const posY = stream[i++]
    const velX = stream[i++]
    const velY = stream[i++]

    const pos = new Vector(posX, posY)
    const vel = new Vector(velX, velY)

    bodies.living.push(new Body(id, mass, pos, vel))
  }

  if (bodies.living.length > 0) {
    bodies.sort()
    tick()
  }

}

function sendStream () {

  if (++bodies.sendInterval < physics.physicsSteps)
    return

  bodies.sendInterval = 0

  if (!sendToParent)
    return

  const { living, destroyed, created } = bodies

  const data = [
    bodies.nextAssignId,
    destroyed.map(idOfBody),
    created.map(idOfBody)
  ]

  destroyed.length = 0
  created.length = 0

  for (const body of living)
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

  collisionDetection()

  calculateForces()

  applyForces()

  sendStream()

  if (queueNextTick)
    setTimeout(tick, NEXT_TICK_DELAY)

}

function applyForces () {
  for (const body of bodies.living) {
    const { force, vel, pos } = body

    force.imult(DELTA).idiv(physics.physicsSteps)

    vel.iadd(vel.add(force)).imult(0.5)
    pos.iadd(vel)
  }
}

function calculateForces () {

  for (const body of bodies.living)
    body.psuedoMass = 0

  for (const body of bodies.psuedo)
    body.calculatePsuedoMass(bodies, physics)

  for (const body of bodies.psuedo)
    body.calculateForces(bodies, physics)

  for (const body of bodies.real)
    body.calculateForces(bodies, physics)

}

function collisionDetection () {

  let collisions = 0

  // broad phase
  partitions.all.length = 0
  for (const body of bodies.living)
    partitions.place(body)

  // narow phase
  for (const body of bodies.living)
    collisions += body.detectCollisions()

  if (collisions > 0)
    bodies.sort()

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

export { physics, bodies, partitions, tick }
