import { NO_PARENT } from '../body'
import { sqrt, min, floor, Vector } from 'math-plus'

import Body from './body'

// This module doesn't need to export a class.
// It will only ever be required by a newly instanced child process.
// a web worker or a node fork. A child process will only ever require it
// once, so it doesn't need to be instancable.

// if someone wishes to run multiple simulations at once, they'll be invoking
// multiple forks or workers, and everything will be dandy.

/******************************************************************************/
// Const
/******************************************************************************/

const DELTA = 1 / 60 // 60 ticks represents 1 second

/******************************************************************************/
// Config
/******************************************************************************/

const isWebWorker = typeof self === 'object'
if (isWebWorker)
  self.onmessage = msg => receiveStream(msg.data)
else
  process.on('message', receiveStream)

const sendToParent = isWebWorker
  ? ::self.postMessage
  : ::process.send

let g
let physicsSteps
let realMassThreshold
let realBodiesMin
let nextAssignId
let sendInterval = 0

const bodies = {
  all: []
}

/******************************************************************************/
// I/O
/******************************************************************************/

function receiveStream ({ init, stream }) {

  g = init.g
  physicsSteps = init.physicsSteps
  realMassThreshold = init.realMassThreshold
  realBodiesMin = init.realBodiesMin

  bodies.all.length = 0

  let i = 0

  nextAssignId = stream[i++] // First item in stream is last assigned id

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

  if (bodies.all.length === 0)
    return

  tick()

}

function sendStream () {

  if (++sendInterval < physicsSteps)
    return

  const { all } = bodies

  sendInterval = 0

  const data = [
    nextAssignId
  ]

  for (const body of all)
    data.push(
      body.id,
      body.mass,
      body.pos.x, body.pos.y,
      body.vel.x, body.vel.y,
      body.parent ? body.parent.id : NO_PARENT
    )

  sendToParent(data)
}

/******************************************************************************/
// Tick
/******************************************************************************/

function tick () {

  applyForces()

  sendStream()

  setTimeout(tick, 0)

}

function applyForces () {

  for (const body of bodies.all) {
    const { force, vel, pos } = body

    force.imult(DELTA).idiv(physicsSteps)

    vel.iadd(vel.add(force)).imult(0.5)
    pos.iadd(vel)
  }

}

/******************************************************************************/
// Helper
/******************************************************************************/

const byMass = (a, b) => a.mass > b.mass
  ? -1 : a.mass < b.mass
  ? 1 : 0

const last = arr => arr[arr.length - 1]
