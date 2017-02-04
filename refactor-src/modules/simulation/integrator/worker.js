import is from 'is-explicit'
import now from 'performance-now'
import { max, Vector } from 'math-plus'

/******************************************************************************/
// Worker
/******************************************************************************/

// This module doesn't need to export a class.
// It will only ever be required by a newly instanced child process.
// a web worker or a node fork. A child process will only ever require it
// once, so it doesn't need to be instancable.

// if someone wishes to run multiple simulations at once, they'll be invoking
// multiple forks or workers, and everything will be dandy.

const isWebWorker = typeof self === 'object'

if (isWebWorker)
  self.onmessage = receiveMessage
else
  process.on('message', receiveMessage)

const sendBodies = isWebWorker
  ? bodies => self.send(bodies)
  : bodies => process.send(bodies)

/******************************************************************************/
// Data
/******************************************************************************/

let g,
  delta,
  bodies,
  running = false

const MIN_TICK_DELTA = 5

/******************************************************************************/
// Messages
/******************************************************************************/

const MESSAGES = {

  initialize(...args) {

    if (is(bodies, Array))
      throw new Error('Can only initialize once.')

    if (!is(sendBodies, Function))
      throw new Error('Ensure that sendMessage is set.');

    [g, delta] = args
    bodies = []
  },

  start() {
    if (running)
      return

    running = true

    tick()
  },

  stop() {
    if (!running)
      return

    running = false
  },

  'set-bodies'(arr) {
    bodies = arr
  },

  'update-body'(id) {

  }

}

function receiveMessage({name, ...data}) {

  const message = MESSAGES[name]

  if (is(message, Function))
    message(data)

  else throw new Error(`Unrecognized message: ${name}`)

}

/******************************************************************************/
// Integration Methods
/******************************************************************************/

function integrateForces(body) {

}

function applyForces(body) {

}

function tick() {

  const tickStart = now()

  const numBodies = bodies.length

  let i = numBodies
  while (i)
    integrateForces(bodies[--i])

  i = numBodies
  while (i)
    applyForces(bodies[--i])

  sendBodies(bodies)

  if (running && numBodies)
    scheduleNextTick(tickStart)

}

function scheduleNextTick(start) {

  const delta = now() - start

  const delay = max(MIN_TICK_DELTA - delta, 0)

  setTimeout(tick, delay)

}
