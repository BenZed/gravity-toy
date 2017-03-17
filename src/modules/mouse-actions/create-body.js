import MouseAction from './base'
import { radiusFromMass } from '../simulation/util'
import { abs, round, Vector, clamp } from 'math-plus'
import { MASS_MIN } from '../simulation/body'

const MASS_MAX = 10000000

export default class CreateBody extends MouseAction {

  speed = 0

  mass = 1000
  vel = Vector.zero
  drawEnd = Vector.zero

  down() {
    this.speed = this.ui.state.speed
    this.ui.setState({ speed: 0 })

  }

  up() {

    const { shift } = this.ui.state
    const pos = this.global.origin
    this.ui.simulation.createBody({ mass: this.mass, pos, vel: this.vel })
    this.ui.setState({ speed: this.speed })

  }

  hold() {
    const { local, gobal, ctx } = this

    const { shift } = this.ui.state

    if (shift) {
      this.mass = abs(this.global.end.sub(this.global.origin).magnitude ** 2) * this.scale
      this.mass = clamp(this.mass, MASS_MIN, MASS_MAX)
    } else {
      this.vel = this.global.end.sub(this.global.origin).idiv(100).imult(this.ui.renderer.camera.scale)
      this.drawEnd = local.end.copy()
    }

    const radius = radiusFromMass(this.mass) / this.scale

    ctx.fillStyle = ctx.strokeStyle = 'rgba(255,255,255,0.5)'

    ctx.beginPath()
    ctx.arc(local.origin.x, local.origin.y, radius, 0, 2 * Math.PI)
    ctx.fill()

    ctx.moveTo(local.origin.x, local.origin.y)
    ctx.lineTo(this.drawEnd.x , this.drawEnd.y)
    ctx.stroke()

    ctx.font='12px Arial'
    const offset = -(radius + 10)

    ctx.fillText(`MASS: ${round(this.mass)}`, local.origin.x - offset, local.origin.y + 2.5)
    if (this.drawEnd.sub(this.local.origin).magnitude > radius + 10)
      ctx.fillText(`SPEED: ${round(this.vel.magnitude)}px/s`, this.drawEnd.x + 15, this.drawEnd.y + 2.5)

  }

}
