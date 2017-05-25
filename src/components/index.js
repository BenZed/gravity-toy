import React from 'react'
import { Simulation, Renderer } from '../modules'
import { Vector, clamp, min, sign } from 'math-plus'
// import Mousetrap from 'mousetrap'
import Timeline from './Timeline'
import Buttons from './Buttons'

import { Create, Destroy } from '../modules/mouse-actions'

export default class SimulationUI extends React.Component {

  state = {

    alt: false,
    shift: false,

    mouse: {
      down: false,
      start: Vector.zero,
      end: Vector.zero
    },

    action: null,

    speed: 1

  }

  componentDidMount() {

    this.simulation = new Simulation({ physicsSteps: 1 })
    this.renderer = new Renderer(this.simulation, this.canvas)

    this.actions = {
      create: new Create(this),
      destroy: new Destroy(this)
    }

    onresize = this.resize
    onresize()

    onkeydown = this.keyDown //eslint-disable-line
    onkeyup = this.keyUp //eslint-disable-line

    this.interval = requestAnimationFrame(this.update)
    this.setAction('create')

  }

  toWorld = vec => this.renderer.camera.toWorld(vec)

  update = () => {

    const { mouse, speed } = this.state

    this.simulation.tick = clamp(this.simulation.tick + speed, 0, this.simulation.maxTick)
    this.renderer.render()

    if (!this.action)
      return

    if (mouse.down && !this.action.cancelled)
      this.action.hold()
    else
      this.action.hover()

    requestAnimationFrame(this.update)
  }

  setAction = action => {

    if (!this.actions[action])
      throw new Error(`${action} is not a valid action.`)

    this.action = this.actions[action]

    this.setState({ action })

  }

  cancelAction = () => {
    if (!this.action)
      return

    this.action.cancelled = true
    this.action.cancel()
  }
  //Events

  resize = () => {
    this.canvas.width = innerWidth
    this.canvas.height = innerHeight
  }

  mouseDown = e => {
    const { mouse } = this.state
    mouse.start.x = mouse.end.x = e.clientX
    mouse.start.y = mouse.end.y = e.clientY
    mouse.down = true

    if (this.action) {
      this.action.cancelled = false
      this.action.down()
    }

    this.setState({ mouse })
  }

  mouseMove = e => {
    const { mouse } = this.state

    mouse.end.x = e.clientX
    mouse.end.y = e.clientY

    this.setState({ mouse })
  }

  mouseUp = e => {
    const { mouse } = this.state

    mouse.end.x = e.clientX
    mouse.end.y = e.clientY
    mouse.down = false

    if (this.action && !this.action.cancelled)
      this.action.up()

    this.setState({ mouse })
  }

  keyDown = e => {

    if (e.code === 'ShiftLeft')
      this.setState({ shift: true })
    else if (e.code === 'AltLeft')
      this.setState({ alt: true })

  }

  keyUp = e =>  {

    if (e.code === 'ShiftLeft')
      this.setState({ shift: false })
    else if (e.code === 'AltLeft')
      this.setState({ alt: false })
    else if (e.code === 'Tab') {
      e.preventDefault()
      console.log('tab')
    }
    else if (e.code === 'Escape')
      this.cancelAction()
  }

  touchLook = e => {

    e.stopPropagation()
    e.preventDefault()

    const delta = new Vector(e.deltaX, e.deltaY)

    const { shift } = this.state
    const { target } = this.renderer.camera

    if (shift) {

      const scale = min(target.scale, 50)
      const speed = scale * 0.0002

      target.scale += delta.magnitude * speed * sign(delta.y)

    } else {

      const speed = target.scale * 0.2
      delta.imult(speed)

      target.pos.iadd(delta)

    }

  }

  render() {

    const { alt, shift, action, down } = this.state

    const keys = { alt, shift }

    return <div id='simulation-ui'>
      <Timeline disabled={down} {...keys} />
      <Buttons disabled={down} action={action} setAction={this.setAction} {...keys} />
      <canvas ref={ref => this.canvas = ref}
        onMouseDown={this.mouseDown}
        onMouseUp={this.mouseUp}
        onMouseMove={this.mouseMove}
        onMouseLeave={this.cancelAction}
        onWheel={this.touchLook}
      />
    </div>

  }

}
