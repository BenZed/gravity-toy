import is from 'is-explicit'
import { sqrt, Vector } from 'math-plus'

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

const send = isWebWorker
  ? self.send.bind(self)
  : process.send.bind(process)

/******************************************************************************/
// Data
/******************************************************************************/

const bodies = [] // { real: [], psuedo: [] }

let g,
  delta,
  running = false,

  applyForces

/******************************************************************************/
// Messaging
/******************************************************************************/

const MESSAGES = {

  initialize(init) {

    if (is(applyForces))
      throw new Error('Can only initialize once.')

    g = init.g
    delta = init.delta

    const algorithm = init.algorithm || 'velocity-verlet'

    if (!ALGORITHMS[algorithm])
      throw new Error('Invalid algorithm: ' + algorithm)

    applyForces = ALGORITHMS[algorithm]

  },

  start() {
    if (running)
      return

    running = true

    scheduleTick()
  },

  stop() {
    if (!running)
      return

    running = false
  },

  'set-bodies'(data) {

    bodies.length = 0

    while (data.bodies.length) {

      const [id, mass, x, y, vx, vy] = data.bodies.splice(0, 6)

      bodies.push({
        id,
        mass,
        force: Vector.zero,
        pos: new Vector(x,y),
        vel: new Vector(vx,vy)
      })

    }

    sortBodies()
  }
}

function receiveMessage({name, ...data}) {

  const message = MESSAGES[name]

  if (is(message, Function))
    message(data)

  else throw new Error(`Unrecognized message: ${name}`)

}

function sendBodies() {

  const data = []

  for (const body of bodies)
    data.push(body.id, body.mass,
      body.pos.x, body.pos.y,
      body.vel.x, body.vel.y)

  send(data)
}

/******************************************************************************/
// Physics
/******************************************************************************/

//This loop inside this function is called a lot throughout
//a single tick, so there are some manual inlining and optimizations
//I've made. I dunno if they make a difference in the
//grand scheme of things, but it helps my OCD
function calculateForces(body) {

  // Relative position vector between two bodies.
  // Declared outside of the while loop to save
  // garbage collections on Vector objects
  const relative = Vector.zero

  // Reset force
  body.force.x = 0
  body.force.y = 0

  for (const other of bodies) {

    if (body.id === other.id)
      continue

    //inlining otherBody.pos.sub(body.pos)
    relative.x = other.pos.x - body.pos.x
    relative.y = other.pos.y - body.pos.y

    const distSqr = relative.sqrMagnitude

    //inlining relative.magnitude
    const dist = sqrt(distSqr)

    if (/*hasCollided*/false) { //eslint-disable-line no-constant-condition
      collide(body, other)
      continue
    }

    const G = g * other.mass / distSqr

    //inlining with squared distances
    body.force.x += G * relative.x / dist
    body.force.y += G * relative.y / dist

  }
}

function collide(a,b) {

}

const ALGORITHMS = {

  rk4(body) {
    throw new Error('4kr not yet supported')
  },

  euler(body) {

    body.vel
      .iadd(body.force.imult(delta * 0.001))

    body.pos
      .iadd(body.vel)
  },

  'velocity-verlet'(body) {

    body.vel
      .iadd(body.force.imult(delta * 0.001))
      .imult(0.5)

    body.pos
      .iadd(body.vel)
  }

}

/******************************************************************************/
// Tick
/******************************************************************************/

function sortBodies() {



}

function tick() {

  if (!running)
    return

  for (const body of bodies)
    calculateForces(body)

  for (const body of bodies)
    applyForces(body)

  if (bodies.length)
    sendBodies()

  scheduleTick()

}

function scheduleTick() {

  setTimeout(tick, 0)

}
