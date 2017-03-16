import React from 'react'
import { Simulation, Renderer } from '../modules'
import { Vector, clamp, random } from 'math-plus'
import Mousetrap from 'mousetrap'
import Timeline from './Timeline'
import Buttons from './Buttons'


export default class SimulationUI extends React.Component {

  state = {

    alt: false,
    shift: false,

    down: false,

    action: 'body'

  }

  componentDidMount() {

    this.simulation = new Simulation({ physicsSteps: 1, g: 0.1})
    this.renderer = new Renderer(this.simulation, this.canvas)

    onresize = this.onWindowResize
    onresize()

    Mousetrap.bind('alt', () => this.setState({ alt: true }), 'keydown')
    Mousetrap.bind('alt', () => this.setState({ alt: false }), 'keyup')

    Mousetrap.bind('shift', () => this.setState({ shift: true }), 'keydown')
    Mousetrap.bind('shift', () => this.setState({ shift: false }), 'keyup')

    Mousetrap.bind('tab', e => e.preventDefault() || console.log('tab'), 'keydown')

  }

  onWindowResize = () => {
    this.canvas.width = innerWidth
    this.canvas.height = innerHeight
  }

  setAction = action => this.setState({ action })

  down = e => {
    this.setState({ down: true })
    console.log('down for action ' + this.state.action)
  }

  move = e => {
    if (!this.state.down)
      return

    console.log('move for action ' + this.state.action)
  }

  up = e => {
    if (!this.state.down)
      return

    this.setState({ down: false })
    console.log('up for action ' + this.state.action)
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
      />
    </div>

  }

}
