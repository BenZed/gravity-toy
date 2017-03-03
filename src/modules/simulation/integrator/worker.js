import is from 'is-explicit'
import { sqrt, min, floor, round, random, Vector } from 'math-plus'
import { radiusFromMass } from '../helper'
import now from 'performance-now'

/******************************************************************************/
// Temp testing timer class
/******************************************************************************/
//TODO remove test code

class Timer {

  delta = 0
  fort = false //factor of real time

  start = () => this.delta = now()

  end(msg = 'ms') {
    const total = now() - this.delta

    const value = this.fort ? total / 40 : total

    const rounded = round(value * 100) / 100

    const log = `${rounded} ${this.fort ? 'x' : 'ms'} ${msg}`
    console.log(log)
  }
}

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

const DELTA = 1 / 25 //25 ticks represents 1 second

//state
const bodies = { all: [], real: [], psuedo: [], destroyed: [] }
let running = false, sendInc

//config
let g = 1, physicsSteps = 1, psuedoMassThreshold = 100, realBodiesMin = 100

/******************************************************************************/
// Messaging
/******************************************************************************/

const MESSAGES = {

  initialize(init) {

    if (isFinite(init.g) && init.g > 0)
      g = init.g

    if (isFinite(init.physicsSteps) && init.physicsSteps >= 1)
      physicsSteps = floor(init.physicsSteps)

    if (isFinite(init.realBodiesMin) && init.realBodiesMin > 0)
      realBodiesMin = floor(init.realBodiesMin)

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

const t = new Timer
t.fort = true
t.start()
let sent = 0

function sendData() {

  const { all, destroyed } = bodies

  if (++sendInc < physicsSteps)
    return

  t.end(bodies.all.length)
  t.start()

  sendInc = 0
  sent++

  if (all.length + destroyed.length === 0)
    return

  const data = [ destroyed ]

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
// Body
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

  buildCollider() {

  }

  //This loop inside this function is called a lot throughout
  //a single tick, so there are some manual inlining and optimizations
  //I've made. I dunno if they make any real difference in the
  //grand scheme of things, but it helps my OCD
  detectCollisions() {

    // Relative position vector between two bodies.
    // Declared outside of the while loop to save
    // garbage collections on Vector objects
    const relative = Vector.zero

    let collisions = 0

    if (this.mass > 0) for (const body of bodies.real) {

      if (this === body || body.mass <= 0)
        continue

      //inlining otherBody.pos.sub(body.pos)
      relative.x = body.pos.x - this.pos.x
      relative.y = body.pos.y - this.pos.y

      const distSqr = relative.sqrMagnitude

      //inlining relative.magnitude
      const dist = sqrt(distSqr)

      if (dist < this.radius + body.radius) {
        ++collisions

        collide(this, body)
      }

      if (this.mass <= 0)
        break

    }

    return collisions
  }

  //This loop inside this function is called a lot throughout
  //a single tick, so there are some manual inlining and optimizations
  //I've made. I dunno if they make any real difference in the
  //grand scheme of things, but it helps my OCD
  calculateForces() {

    // Relative position vector between two bodies.
    // Declared outside of the while loop to save
    // garbage collections on Vector objects
    const relative = Vector.zero

    // Reset forces
    this.force.x = 0
    this.force.y = 0
    this.parent = null

    let parentPull = -Infinity

    for (const body of bodies.real) {

      if (this === body)
        continue

      //inlining bodythis.pos.sub(this.pos)
      relative.x = body.pos.x - this.pos.x
      relative.y = body.pos.y - this.pos.y

      const distSqr = relative.sqrMagnitude

      //inlining relative.magnitude
      const dist = sqrt(distSqr)

      const mass = body.mass + body.psuedoMass

      const pull = g * mass / distSqr

      if (parentPull < pull) {
        parentPull = pull
        this.parent = body
      }

      //inlining this.force.iadd(relative.mult(pull).div(dist))
      this.force.x += relative.x * pull / dist
      this.force.y += relative.y * pull / dist

    }

    if (!this.real)
      this.parent.psuedoMass += this.mass

  }

  applyForces() {

    const { force, vel, pos } = this

    force.imult(DELTA / physicsSteps)

    vel.iadd(vel.add(force)).imult(0.5)
    pos.iadd(vel)

  }
}

/******************************************************************************/
// collide
/******************************************************************************/

function collide(...args) {

  const [big, small] = args.sort(byMass)

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

/******************************************************************************/
// Tick
/******************************************************************************/

const byMass = (a,b) => a.mass > b.mass
  ? -1 : a.mass < b.mass
  ?  1 : 0

const last = arr => arr[arr.length - 1]

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

  while (last(all).mass <= 0) {
    const { id } = all.pop()
    destroyed.push(id)
  }

}

function detectCollisions() {
  //collision handling
  let collisions = 0

  for (const body of bodies.all)
    body.buildCollider()

  for (const body of bodies.all)
    collisions += body.detectCollisions()

  if (collisions > 0)
    sortBodies()
}

function calculateForces() {

  for (const body of bodies.all)
    body.psuedoMass = 0

  //force handling
  for (const body of bodies.psuedo)
    body.calculateForces()

  for (const body of bodies.real)
    body.calculateForces()

}

function applyForces() {

  for (const body of bodies.all)
    body.applyForces()

}

function tick() {

  if (!running)
    return

  detectCollisions()

  calculateForces()

  applyForces()

  sendData()

  scheduleTick()
}

function scheduleTick() {
  if (sent <= 1000)
    setTimeout(tick, 0)
}

/******************************************************************************/
//TODO remove test code
/******************************************************************************/

if (isTesting) {

  MESSAGES['initialize']({ physicsSteps: 8, realBodiesMin: 10 })

  const data = { bodies: [] }

  for (let i = 0; i < 100; i++) {

    const big = random() <= 0.05
    const mass = random(20, big ? 5000 : 50, 0.125)
    const x = random(-1000,1000,0.125)
    const y = random(-1000,1000,0.125)

    data.bodies.push(i, mass, x, y, 0, 0)
  }

  MESSAGES['set-bodies'](data)
  MESSAGES['start']()

}
