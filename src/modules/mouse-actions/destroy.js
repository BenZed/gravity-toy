import MouseAction from './base'
import { massFromRadius, radiusFromMass } from '../simulation/util'
import { Vector, abs, max, min, sqrt, round, cbrt, random } from 'math-plus'

export default class Create extends MouseAction {

  radius = 100

  active = false
  point = Vector.zero
  center = Vector.zero

  shift = false
  speed = 1

  down () {

    this.speed = this.ui.state.speed
    this.ui.setState({ speed: 0 })
    this.active = true

  }

  up () {

    for (const body of this.ui.simulation)
      if (body.markedForDeletion && body.exists)
        body.mass = 0

    this.ui.simulation.applyBodies()
    this.done()

  }

  done = () => {
    for (const body of this.ui.simulation)
      delete body.markedForDeletion

    this.active = false
    this.ui.setState({ speed: this.speed })
  }

  tick = () => {

    const { active, global, local, ctx, scale, radius } = this
    const { shift } = this.ui.state

    if (!this.shift && shift) {
      this.point = global.end.copy()
      this.center = local.end.copy()
    }

    if (shift)
      this.radius = global.end.sub(this.point).magnitude
    else
      this.center = local.end

    if (active) for (const body of this.ui.simulation)
      if (!body.markedForDeletion && body.pos.sub(shift ? this.point : global.end).magnitude < this.radius)
        body.markedForDeletion = true

    this.shift = shift

    const drawRadius = radius / scale
    const opacity = active ? 0.5 : 0.25
    ctx.fillStyle = ctx.strokeStyle = `rgba(255,125,125,${opacity})`
    ctx.setLineDash([20, 10])

    ctx.beginPath()
    ctx.arc(this.center.x, this.center.y, drawRadius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
    ctx.closePath()

  }

  hover = this.tick

  hold = this.tick

  cancel = this.done

}
