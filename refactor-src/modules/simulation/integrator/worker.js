import is from 'is-explicit'
import { sqrt, min, random, Vector } from 'math-plus'
import { radiusFromMass } from '../helper'

/******************************************************************************/
// Worker
/******************************************************************************/

// This module doesn't need to export a class.
// It will only ever be required by a newly instanced child process.
// a web worker or a node fork. A child process will only ever require it
// once, so it doesn't need to be instancable.

// if someone wishes to run multiple simulations at once, they'll be invoking
// multiple forks or workers, and everything will be dandy.

const isTesting = typeof process === 'object' && process.send === undefined

const isWebWorker = typeof self === 'object'
if (isWebWorker)
  self.onmessage = receiveMessage
else
  process.on('message', receiveMessage)

const send = isWebWorker
  ? self.send.bind(self)
  : isTesting
    ? () => {}
    : process.send.bind(process)

/******************************************************************************/
// Data
/******************************************************************************/

const TIME_DELTA = 1 / 25 //50 ticks represents 1 second

//state
const bodies = { all: [], real: [], psuedo: [], destroyed: [] }
let running = false, delta

//config
let g = 1,
  steps = 4

const psuedoMassThreshold = 100,
  realBodiesMin = 100

/******************************************************************************/
// Messaging
/******************************************************************************/

const MESSAGES = {

  initialize(init) {

    if (isFinite(init.g) && init.g > 0)
      g = init.g

    if (isFinite(init.eulerSteps) && init.eulerSteps > 0)
      steps = init.eulerSteps

    delta = TIME_DELTA / steps

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

    bodies.all.length = 0

    while (data.bodies.length) {

      const vy = data.bodies.pop()
      const vx = data.bodies.pop()
      const y = data.bodies.pop()
      const x = data.bodies.pop()
      const mass = data.bodies.pop()
      const id = data.bodies.pop()

      bodies.all.push(new Body(id, mass, x, y, vx, vy))

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

function sendData() {

  const { all, destroyed } = bodies

  const data = [ ...destroyed ]

  destroyed.length = 0

  for (const body of all)
    data.push(
      body.id, body.mass,
      body.pos.x, body.pos.y,
      body.vel.x, body.vel.y,
      body.parent ? body.parent.id : -1
    )

  send(data)
}

/******************************************************************************/
// Physics
/******************************************************************************/

class Body {

  real = null
  psuedoMass = 0
  parent = null

  force = Vector.zero

  constructor(id, mass, x, y, vx, vy) {

    this.id = id
    this.mass = mass
    this.pos = new Vector(x,y)
    this.vel = new Vector(vx,vy)
    this.radius = radiusFromMass(mass)

  }

}

//This loop inside this function is called a lot throughout
//a single tick, so there are some manual inlining and optimizations
//I've made. I dunno if they make any real difference in the
//grand scheme of things, but it helps my OCD
function checkForCollisions(body) {

  // Relative position vector between two bodies.
  // Declared outside of the while loop to save
  // garbage collections on Vector objects
  const relative = Vector.zero

  let collisions = 0

  if (body.mass > 0) for (const other of bodies.real) {

    if (body === other || other.mass <= 0)
      continue

    //inlining otherBody.pos.sub(body.pos)
    relative.x = other.pos.x - body.pos.x
    relative.y = other.pos.y - body.pos.y

    const distSqr = relative.sqrMagnitude

    //inlining relative.magnitude
    const dist = sqrt(distSqr)

    if (dist < body.radius + other.radius) {
      collisions ++
      collide(body, other)
    }

    if (body.mass <= 0)
      break

  }

  return collisions
}

function collide(...args) {

  const [big, small] = args.sort(byMass)

  if (!big.real && !small.real)
    psuedoCollisions++

  const totalMass = big.mass + small.mass
  big.pos
    .imult(big.mass)
    .iadd(small.pos.mult(small.mass))
    .idiv(totalMass)

  big.vel
    .imult(big.mass)
    .iadd(small.vel.mult(small.mass))
    .idiv(totalMass)

  small.mass = 0

  big.mass = totalMass
  big.radius = radiusFromMass(totalMass)

}

//This loop inside this function is called a lot throughout
//a single tick, so there are some manual inlining and optimizations
//I've made. I dunno if they make any real difference in the
//grand scheme of things, but it helps my OCD
function calculateForces(body) {

  // Relative position vector between two bodies.
  // Declared outside of the while loop to save
  // garbage collections on Vector objects
  const relative = Vector.zero

  // Reset forces
  body.force.x = 0
  body.force.y = 0
  body.parent = null

  let parentPull = -Infinity

  for (const other of bodies.real) {

    if (body === other)
      continue

    //inlining otherBody.pos.sub(body.pos)
    relative.x = other.pos.x - body.pos.x
    relative.y = other.pos.y - body.pos.y

    const distSqr = relative.sqrMagnitude

    //inlining relative.magnitude
    const dist = sqrt(distSqr)

    const mass = other.mass + other.psuedoMass

    const pull = g * mass / distSqr

    if (parentPull < pull) {
      parentPull = pull
      body.parent = other
    }

    //inlining body.force.iadd(relative.mult(pull).div(dist))
    body.force.x += relative.x * pull / dist
    body.force.y += relative.y * pull / dist

  }

  if (!body.real)
    body.parent.psuedoMass += body.mass

}

function applyForces(body) {

  body.force.imult(delta)

  for (let i = 0; i < steps; ++i) {

    body.vel.iadd(body.force)

    body.pos.iadd(body.vel)

  }

}

/******************************************************************************/
// Tick
/******************************************************************************/

const byMass = (a,b) => a.mass > b.mass ? -1 : a.mass < b.mass ? 1 : 0

function sortBodies() {

  const { all, real, psuedo, destroyed } = bodies

  real.length = psuedo.length = 0
  all.sort(byMass)

  const minReal = min(realBodiesMin, all.length)

  for (let i = 0; i < all.length; i++) {
    const body = all[i]

    body.real = i < minReal || body.mass > psuedoMassThreshold

    if (body.real)
      real.push(body)
    else
      psuedo.push(body)

  }

  while (all[all.length - 1].mass <= 0)
    destroyed.push(all.pop().id)

}

import now from 'performance-now'

class Timer {

  delta = 0

  start = () => this.delta = now()

  end(msg) { console.log(now() - this.delta, msg)}
}


let psuedoCollisions = 0, totalCollisions = 0
const t = new Timer

function tick() {

  if (!running)
    return

  //collision handling
  let collisions = 0

  t.start()

  for (const body of bodies.all)
    collisions += checkForCollisions(body)

  if (collisions > 0)
    sortBodies()
  if (collisions > 0)
    totalCollisions += collisions

  t.end(`collision detection ${psuedoCollisions}/${totalCollisions} = ${psuedoCollisions/totalCollisions}%`)

  for (const body of bodies.all)
    body.psuedoMass = 0

  //force handling
  for (const body of bodies.psuedo)
    calculateForces(body)

  for (const body of bodies.real)
    calculateForces(body)

  for (const body of bodies.all)
    applyForces(body)

  //finish
  if (bodies.all.length > 0)
    sendData()

  scheduleTick()

}

function scheduleTick() {
  // setTimeout(tick, 0)

  setTimeout(() => {

    if (bodies.all.length > 10)
      tick()

  }, 0)

}

/******************************************************************************/
// Testing
/******************************************************************************/
if (isTesting) {

  MESSAGES['initialize']({})

  const data = { bodies: [] }

  for (let i = 0; i < 2000; i++) {

    const big = random() <= 0.05
    const mass = random(20, big ? 5000 : 50, 0.125)
    const x = random(-400,400,0.125)
    const y = random(-400,400,0.125)

    data.bodies.push(i, mass, x, y, 0, 0)
  }

  MESSAGES['set-bodies'](data)
  MESSAGES['start']()

}
