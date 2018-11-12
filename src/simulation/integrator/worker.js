import { DEFAULT_PHYSICS, NO_LINK } from '../constants'
import { Vector } from '@benzed/math'

import Body from './body'
import BodyManager from './body-manager'

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

const NEXT_TICK_DELAY = 0

const physics = {
  ...DEFAULT_PHYSICS
}

const bodies = new BodyManager()

/******************************************************************************/
// I/O
/******************************************************************************/

function receiveStream ({ init, stream }) {

  for (const key in init)
    physics[key] = init[key]

  const created = []

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

    created.push(new Body(id, mass, pos, vel))
  }

  if (created.length > 0) {
    bodies.setBodies(created, physics)
    tick()
  }
}

function sendStream () {

  if (++bodies.sendInterval < physics.physicsSteps)
    return

  bodies.sendInterval = 0

  if (!sendToParent)
    return

  const { living, destroyed, created, nextAssignId } = bodies

  const data = {
    nextAssignId,
    destroyed: [ ...destroyed.map(destroyedIds) ],
    created: [ ...created.map(idOfBody) ],
    stream: []
  }

  destroyed.length = 0
  created.length = 0

  for (const body of living)
    data.stream.push(
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

  // broad phase
  bodies.updateOverlaps()

  // narrow phase
  bodies.checkCollisions(physics)

  bodies.calculateForces(physics)
  bodies.applyForces(physics)

  sendStream()

  if (queueNextTick)
    setTimeout(tick, NEXT_TICK_DELAY)

}

/******************************************************************************/
// Helper
/******************************************************************************/

const destroyedIds = body => Object({ id: body.id, mergeId: body.merge.id })
const idOfBody = body => body.id

/******************************************************************************/
// Exports for testing
/******************************************************************************/

export { physics, bodies, tick }
