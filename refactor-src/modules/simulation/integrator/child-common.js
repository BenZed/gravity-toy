import is from 'is-explicit'

/******************************************************************************/
// Child Process Inegration Functions
/******************************************************************************/

// This module doesn't need to export a class.
// It will only ever be required by a newly instanced child process.
// a web worker or a node fork. A child process will only ever require it
// once, so it doesn't need to be instancable.

// if someone wishes to run multiple simulations at once, they'll be invoking
// multiple forks or workers, and everything will be dandy.

/******************************************************************************/
// Data
/******************************************************************************/

let g,
  delta,
  bodies,
  scheduleNextTick,
  sendMessage,
  running = false

/******************************************************************************/
// Messages
/******************************************************************************/

const MESSAGES = {

  initialize(...args) {

    if (is(bodies, Array))
      throw new Error('Can only initialize once.')

    if (!is(scheduleNextTick, Function))
      throw new Error('Ensure that scheduleNextTick is set.')

    if (!is(sendMessage, Function))
      throw new Error('Ensure that sendMessage is set.');

    [g, delta] = args
    bodies = []
  },

  start() {
    if (running)
      return

    running = true

    scheduleNextTick(integrate)
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

/******************************************************************************/
// Integration Methods
/******************************************************************************/

function calculateForces(body) {

}

function applyForces(body) {

}

function integrate() {

  let i = bodies.length
  while (i)
    calculateForces(bodies[--i])

  i = bodies.length
  while (i)
    applyForces(bodies[--i])

  sendMessage({name: 'tick-complete', bodies})

  if (running)
    scheduleNextTick(integrate)

}

/******************************************************************************/
// initialization exports
/******************************************************************************/

export function setTickScheduler(func) {
  if (!is(func, Function))
    throw new Error('setTickScheduler must take function.')

  scheduleNextTick = func
}

export function setMessageSender(func) {
  if (!is(func, Function))
    throw new Error('setMessageSender must take function.')

  sendMessage = func
}

export function receiveMessage({name, ...data}) {

  const message = MESSAGES[name]

  if (is(message, Function))
    message(data)

  else throw new Error(`Unrecognized message: ${name}`)

}
