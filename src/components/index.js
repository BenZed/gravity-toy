import React from 'react'
import { Simulation, Renderer } from '../modules'
import { Vector, clamp, min, sign,  random } from 'math-plus'
// import Mousetrap from 'mousetrap'
import Timeline from './Timeline'
import Buttons from './Buttons'

import { CreateBody } from '../modules/mouse-actions'

export default class SimulationUI extends React.Component {

  state = {

    alt: false,
    shift: false,

    mouse: {
      down: false,
      origin: Vector.zero,
      end: Vector.zero
    },

    action: null,

    speed: 1

  }

  componentDidMount() {

    this.simulation = new Simulation({ physicsSteps: 1, g: 0.1})
    this.renderer = new Renderer(this.simulation, this.canvas)

    this.actions = {
      body: new CreateBody(this)
    }

    onresize = this.resize
    onresize()

    onkeydown = this.keyDown //eslint-disable-line
    onkeyup = this.keyUp //eslint-disable-line

    this.interval = setInterval(this.update, 1000 / 40)
    this.simulation.start()
    this.setAction('body')

  }

  toWorld = vec => this.renderer.camera.toWorld(vec)

  update = () => {

    const { mouse, speed } = this.state

    this.simulation.tick = clamp(this.simulation.tick + speed, 0, this.simulation.maxTick)
    this.renderer.camera.update()
    this.renderer.render()

    if (this.action && mouse.down)
      this.action.hold()
  }

  setAction = action => {

    if (!this.actions[action])
      throw new Error(`${action} is not a valid action.`)

    this.action = this.actions[action]

    this.setState({ action })

  }
  //Events

  resize = () => {
    this.canvas.width = innerWidth
    this.canvas.height = innerHeight
  }

  down = e => {
    const { mouse } = this.state
    mouse.origin.x = mouse.end.x = e.clientX
    mouse.origin.y = mouse.end.y = e.clientY
    mouse.down = true

    if (this.action)
      this.action.down()

    this.setState({ mouse })
  }

  move = e => {
    const { mouse } = this.state
    if (!mouse.down)
      return

    mouse.end.x = e.clientX
    mouse.end.y = e.clientY

    this.setState({ mouse })
  }

  up = e => {
    const { mouse } = this.state

    mouse.end.x = e.clientX
    mouse.end.y = e.clientY
    mouse.down = false

    if (this.action)
      this.action.up()

    this.setState({ mouse })
  }

  touchLook = e => {

    e.stopPropagation()
    e.preventDefault()

    const delta = new Vector(e.deltaX, e.deltaY)

    const { shift } = this.state
    const { target } = this.renderer.camera

    if (shift) {

      const scale = min(target.scale, 50)
      const speed = scale * 0.001

      target.scale += delta.magnitude * speed * sign(delta.y)

    } else {

      const speed = target.scale * 0.2
      delta.imult(speed)

      target.pos.iadd(delta)

    }

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
  }

  render() {

    const { alt, shift, action, down } = this.state

    const keys = { alt, shift }

    return <div id='simulation-ui'>
      <Timeline disabled={down} {...keys} />
      <Buttons disabled={down} action={action} setAction={this.setAction} {...keys} />
      <canvas ref={ref => this.canvas = ref}
        onMouseDown={this.down}
        onMouseUp={this.up}
        onMouseMove={this.move}
        onMouseLeave={this.up}
        onWheel={this.touchLook}
      />
    </div>

  }

}
