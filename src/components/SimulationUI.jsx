import React from 'react'

import { Simulation, SimulationCanvasDraw, Vector, clamp } from '../modules/simulation'
import Mousetrap from 'mousetrap'

import Timeline from './Timeline'


const Speeds = [-1000, -500, -200, -100, -70, -30, -10, -4, -2, -1, 1, 2, 4, 10, 30, 70, 100, 200, 500, 1000]

export default class SimulationUI extends React.Component {

  static propTypes = {
    simulation: React.PropTypes.instanceOf(Simulation).isRequired,
    id: React.PropTypes.string.isRequired,
    title: React.PropTypes.string.isRequired
  }

  static defaultProps = {
    get simulation() { return new Simulation() },
    id: 'simulation-ui',
    title: 'Simulation UI'
  }

  state = {
    //bodies: [],
    cached: 0,
    cachedMax: 100,
    playhead: 0

  }

  receiveSimulationData = () => {
    this.setState({
      cached: this.props.simulation.cachedTicks,
      cachedMax: this.props.simulation.maxCacheTicks,
      secondsMax: this.props.simulation.maxCacheSeconds,
      playhead: this.draw.tick
    })
  }

  onWindowResize = () => {
    this.canvas.width = innerWidth
    this.canvas.height = innerHeight
  }

  setPlayhead = e => {

    const x = e.clientX - e.currentTarget.offsetLeft
    const xMax = e.currentTarget.offsetWidth

    const simulation = this.props.simulation

    const targetTick = Math.min(x / xMax * simulation.maxCacheTicks, simulation.cachedTicks - 1)

    this.draw.tick = Math.floor(targetTick)
  }

  setSpeed = e => {

    const delta = e.code === 'ArrowRight' ? 1 : -1
    const newIndex = clamp(Speeds.indexOf(this.draw.tickDelta) + delta, 0, Speeds.length - 1)

    this.draw.tickDelta = Speeds[newIndex]

  }

  handleCameraMove = e => {
    e.preventDefault()

    const delta = new Vector(e.deltaX, e.deltaY)

    if (e.shiftKey) {
      const scale = Math.min(this.draw.camera.target.scale, 50)
      const zoomSpeed = scale * 0.001
      const sign = delta.y > 0 ? 1 : -1

      this.draw.camera.target.scale += delta.magnitude * zoomSpeed * sign

    } else {

      const translateSpeed = this.draw.camera.target.scale * 0.2
      delta.imult(translateSpeed)

      this.draw.camera.target.pos.iadd(delta)
    }
  }

  componentDidMount() {

    this.createEventHandlers()
    this.createCanvasDraw()
    this.createKeyboardShortcuts()
    this.createTestBodies()

    this.props.simulation.start()

  }

  createEventHandlers() {
    onresize = this.onWindowResize
    onresize()

    this.props.simulation.on('interval-complete', this.receiveSimulationData)

  }

  createCanvasDraw() {
    this.draw = new SimulationCanvasDraw(this.props.simulation, this.canvas)
  }

  createKeyboardShortcuts() {
    Mousetrap.bind(['left', 'right'], this.setSpeed)
  }

  createTestBodies() {
    const simulation = this.props.simulation

    const randMass = () => 125 + Math.random() > 0.50 ? Math.random() * 19875 : Math.random() * 1875
    const randPos = () => new Vector(Math.random() * innerWidth, Math.random() * innerHeight)
    const randVel = (n = 2) => new Vector(-n * 0.5 + Math.random() * n, -n * 0.5 + Math.random() * n)
    const addedPos = n => new Vector(n * 100, n * 200)

    for (let i = 0; i < 100; i++)
      simulation.createBody(randMass(), randPos(), randVel(3), this.draw.tick)
    // for (let i = 0; i < 100; i++)
    //   setTimeout(() => simulation.createBody(randMass(), randPos(), undefined, this.draw.tick), i * 50)

  }

  render() {

    const { id, title, ...other } = this.props
    const { cached, cachedMax, secondsMax, playhead } = this.state

    delete other.simulation

    return <div id={id} {...other}>
      <Timeline cached={cached} cachedMax={cachedMax} secondsMax={secondsMax} onClick={this.setPlayhead} playhead={playhead}/>
      <h1>{title}</h1>
      <canvas ref={canvas => this.canvas = canvas} onWheel={this.handleCameraMove}/>
    </div>
  }

}
