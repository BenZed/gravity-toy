import MouseAction from './base'
import { massFromRadius, radiusFromMass } from '../simulation/util'
import { Vector, abs, max, min, sqrt, cbrt, random } from 'math-plus'
import { MASS_MIN } from '../simulation/body'

const MAX_SINGLE_BODY_MASS =    2000000
const MAX_DISC_RADIUS =            500
const MAX_NEBULAE_RADIUS =         5000

function textFromRadius(radius) {
  const mass = massFromRadius(radius)

  // return round(mass)
  return mass < 500
    ? 'asteroid'
    : mass < 10000
    ? 'planetoid'
    : mass < 70000
    ? 'planet'
    : mass < MAX_SINGLE_BODY_MASS
    ? 'star'
    : radius < MAX_DISC_RADIUS
    ? 'proto-disc'
    : radius < MAX_NEBULAE_RADIUS
    ? 'nebulae'
    : radius < MAX_NEBULAE_RADIUS * 5
    ? 'system'
    : radius < MAX_NEBULAE_RADIUS * 20
    ? 'system with black hole'
    : radius < MAX_NEBULAE_RADIUS * 40
    ? 'system with supermassive black hole'
    : 'quasar'
}

const randomVector = magnitude =>
  (new Vector(random(-1,1), random(-1,1)))
    .inormalize()
    .imult(random(0, magnitude))

function createNebulae(sim, pos, radius, mass) {

  const props = []

  while (mass > 0) {

    const rMass = random(MASS_MIN, 100, 0.125)
    mass -= rMass
    props.push({
      mass: rMass,
      pos: pos.add(randomVector(radius)),
      vel: randomVector(0.5)
    })

  }

  console.log(props.length)

  sim.createBodies(props)

}

export default class Create extends MouseAction {

  speed = 0

  radius = 0.25
  deltaRadius = 0

  vel = Vector.zero
  point = Vector.zero

  shift = false

  get validatedRadius() {
    const radius = abs(this.radius + this.deltaRadius)
    return max(0.25, radius)
  }

  cancel() {
    this.ui.setState({ speed: this.speed })
  }

  down() {
    this.speed = this.ui.state.speed
    this.ui.setState({ speed: 0 })
    this.point = this.global.end.copy()
  }

  up() {

    const pos = this.global.start
    const radius = this.validatedRadius
    const mass = max(MASS_MIN, massFromRadius(radius))

    if (mass < MAX_SINGLE_BODY_MASS)
      this.ui.simulation.createBody({ mass, pos, vel: this.vel })
    else if (radius < MAX_DISC_RADIUS)
      console.log('create a protodisc')
    else if (radius < MAX_NEBULAE_RADIUS)
      createNebulae(this.ui.simulation, pos, radius, cbrt(mass) * 15)
    else
      console.log('create a system')

    this.ui.setState({ speed: this.speed })

  }

  draw() {
    const { local, ctx, scale } = this
    const radius = this.validatedRadius
    const drawRadius = radius / scale
    const drawingSingleBody = massFromRadius(radius) <= MAX_SINGLE_BODY_MASS
    const opacity = drawingSingleBody ? 0.5 : 0.2
    ctx.fillStyle = ctx.strokeStyle = `rgba(255,255,255,${opacity})`
    ctx.setLineDash(drawingSingleBody ? [] : [5,15])

    ctx.beginPath()
    ctx.arc(local.start.x, local.start.y, drawRadius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()

    ctx.font='12px Arial'
    const offset = -(drawRadius + 10)

    ctx.fillText(textFromRadius(radius), local.start.x - offset, local.start.y + 2.5)
    // if (this.drawEnd.sub(this.local.start).magnitude > radius + 10)
    //   ctx.fillText(`SPEED: ${round(this.vel.magnitude)}px/s`, this.drawEnd.x + 15, this.drawEnd.y + 2.5)

  }

  hold() {

    const { global } = this
    const { shift } = this.ui.state

    if (shift && !this.shift)
      this.point = global.end.copy()

    if (shift) {
      const oDelta = global.end.sub(global.start).magnitude
      const mDelta = this.point.sub(global.start).magnitude

      this.deltaRadius = (oDelta - mDelta) * 0.3

    }

    if (!shift && this.shift) {
      this.radius += this.deltaRadius
      this.deltaRadius = 0
    }

    this.shift = shift
    this.draw()
  }

}
