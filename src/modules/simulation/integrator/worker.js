import is from 'is-explicit'
import { sqrt, min, floor, Vector } from 'math-plus'
import { radiusFromMass, MASS_MIN } from '../util'

// This module doesn't need to export a class.
// It will only ever be required by a newly instanced child process.
// a web worker or a node fork. A child process will only ever require it
// once, so it doesn't need to be instancable.

// if someone wishes to run multiple simulations at once, they'll be invoking
// multiple forks or workers, and everything will be dandy.

/******************************************************************************/
// Const & Config
/******************************************************************************/

const isWebWorker = typeof self === 'object'
if (isWebWorker)
  self.onmessage = receiveMessage
else
  process.on('message', receiveMessage)

const send = isWebWorker
  ? self.postMessage.bind(self)
  : process.send.bind(process)

const DELTA = 1 / 25 //25 ticks represents 1 second

let g,
  physicsSteps,
  realMassThreshold,
  realBodiesMin

/******************************************************************************/
// Helper
/******************************************************************************/

const byMass = (a,b) => a.mass > b.mass
  ? -1 : a.mass < b.mass
  ?  1 : 0

const last = arr => arr[arr.length - 1]

const isWholeNumber = num => isFinite(num) && floor(num) === num

/******************************************************************************/
// Runtime & State
/******************************************************************************/

const bodies = {

  all: [],
  real: [],
  psuedo: [],
  destroyed: [],

  sort() {

    const { all, real, psuedo, destroyed } = this

    real.length = psuedo.length = 0

    if (all.length === 0)
      return

    all.sort(byMass)

    const minReal = min(realBodiesMin, all.length)

    for (let i = 0; i < all.length; i++) {
      const body = all[i]

      body.real = i < minReal || body.mass > realMassThreshold

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

}

const spatial = {

  RESOLUTION: 5,

  hash: {},

  place(body) {

    body.cells.length = 0

    const { hash } = this

    const inc = min(this.RESOLUTION, body.radius)
    for (let x = body.pos.x - body.radius; x <= body.pos.x + body.radius; x += inc ) {
      for (let y = body.pos.y - body.radius; y <= body.pos.y + body.radius; y += inc ) {

        const key = `${floor(x / this.RESOLUTION)},${floor(y / this.RESOLUTION)}`
        if (!hash[key])
          hash[key] = []

        if (!hash[key].includes(body))
          hash[key].push(body)

        if (!body.cells.includes(hash[key]))
          body.cells.push(hash[key])
      }
    }

  },

  clear() {
    const { hash } = this

    for (const i in hash)
      hash[i].length = 0
  },

  prune() {
    const { hash } = this

    for (const i in hash)
      if (hash[i].length === 0)
        delete hash[i]
  }
}

let running = false, sendInc

/******************************************************************************/
// Messaging
/******************************************************************************/

const MESSAGES = {

  initialize(data) {
    [g, physicsSteps, realMassThreshold, realBodiesMin] = data

    if (!isFinite(g) || g <= 0)
      throw new Error('g must be a number above zero.')

    if (!isWholeNumber(physicsSteps) || physicsSteps <= 0)
      throw new Error('physicsSteps must be a whole number above zero.')

    if (!isFinite(realMassThreshold) || realMassThreshold < MASS_MIN)
      throw new Error(`realMassThreshold must be a number equal or above ${MASS_MIN}`)

    if (!isWholeNumber(realBodiesMin) || realBodiesMin <= 0)
      throw new Error('realMassThreshold must be a whole number above zero.')

  },

  start() {
    if (!is(g, Number))
      throw new Error('Must initialize before starting.')

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

    while (data.length) {

      data.pop() //this popped value would be the parent id, but we don't need it
      const vy = data.pop()
      const vx = data.pop()
      const y = data.pop()
      const x = data.pop()
      const mass = data.pop()
      const id = data.pop()

      bodies.all.push(new Body(id, mass, x, y, vx, vy))

    }

    bodies.sort()
  }
}

function receiveMessage(msg) {

  const [name, data] = isWebWorker ? msg.data : [msg.name, msg.data]

  const message = MESSAGES[name]

  if (is(message, Function))
    message(data)

  else throw new Error(`Unrecognized message: ${name}`)

}

function sendData() {

  const { all, destroyed } = bodies

  if (++sendInc < physicsSteps)
    return

  sendInc = 0

  if (all.length + destroyed.length === 0)
    return

  const data = [ destroyed ]

  destroyed.length = 0

  for (const body of all) {
    data.push(
      body.id, body.mass,
      body.pos.x, body.pos.y,
      body.vel.x, body.vel.y,
      body.parent ? body.parent.id : -1
    )
  }

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

  cells = []

  constructor(id, mass, x, y, vx, vy) {

    this.id = id
    this.mass = mass
    this.pos = new Vector(x,y)
    this.vel = new Vector(vx,vy)
    this.radius = radiusFromMass(mass)

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

    for (const cell of this.cells) for (const body of cell) {

      if (this.mass <= 0)
        break

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

    }

    return collisions
  }

  calculateParentPsuedoMass() {
    this.calculateForces(true)
  }

  //This loop inside this function is called a lot throughout
  //a single tick, so there are some manual inlining and optimizations
  //I've made. I dunno if they make any real difference in the
  //grand scheme of things, but it helps my OCD
  calculateForces(psuedoMassOnly = false) {

    // Relative position vector between two bodies.
    // Declared outside of the while loop to save
    // garbage collections on Vector objects
    const relative = Vector.zero

    // Reset forces
    if (!psuedoMassOnly) {
      this.force.x = 0
      this.force.y = 0
    }

    this.parent = null

    let parentPull = -Infinity

    for (const body of bodies.real) {

      if (this === body)
        continue

      //inlining body.pos.sub(this.pos)
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

      if (!psuedoMassOnly)
        this.force.iadd(relative.imult(pull).idiv(dist))

    }

    if (!this.real && psuedoMassOnly)
      this.parent.psuedoMass += this.mass

  }

  applyForces() {

    const { force, vel, pos } = this

    force.imult(DELTA).idiv(physicsSteps)

    vel.iadd(vel.add(force)).imult(0.5)
    pos.iadd(vel)

  }
}

/******************************************************************************/
// Tick
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

function detectCollisions() {
  let collisions = 0

  spatial.clear()

  //broad phase
  for (const body of bodies.all)
    spatial.place(body)

  for (const body of bodies.all)
    collisions += body.detectCollisions()

  if (collisions > 0)
    bodies.sort()

  spatial.prune()
}

function calculateForces() {

  for (const body of bodies.all)
    body.psuedoMass = 0

  for (const body of bodies.psuedo)
    body.calculateParentPsuedoMass()

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
  setTimeout(tick, 0)
}
