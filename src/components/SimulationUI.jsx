import React from 'react'

import { Simulation, SimulationCanvasDraw, Vector, clamp } from '../modules/simulation'
import Mousetrap from 'mousetrap'

import Timeline from './Timeline'

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
      cached: this.props.simulation.cacheSize,
      cachedMax: this.props.simulation.maxCacheSize,
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

    const targetTick = Math.min(x / xMax * simulation.maxCacheSize, simulation.cacheSize - 1)

    this.draw.tick = Math.floor(targetTick)
  }

  setPlayDelta = e => {
    let value = e.code === 'ArrowRight' ? 1 : -1

    if (this.draw.tickDelta + value === 0)
      value *= 2

    this.draw.tickDelta = clamp(this.draw.tickDelta + value, -5, 5)
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
    Mousetrap.bind(['left', 'right'], this.setPlayDelta)
  }

  createTestBodies() {
    const simulation = this.props.simulation

    const randMass = () => 125 + Math.random() * 2675
    const randPos = () => new Vector(Math.random() * innerWidth, Math.random() * innerHeight)
    const randVel = (n = 2) => new Vector(-n * 0.5 + Math.random() * n, -n * 0.5 + Math.random() * n)
    const addedPos = n => new Vector(n * 100, n * 200)

    for (let i = 0; i < 1000; i++)
      simulation.createBody(randMass(), randPos(), randVel(4), this.draw.tick)
    // for (let i = 0; i < 100; i++)
    //   setTimeout(() => simulation.createBody(randMass(), randPos(), undefined, this.draw.tick), i * 50)

  }

  render() {

    const { id, title, ...other } = this.props
    const { cached, cachedMax, playhead } = this.state

    delete other.simulation

    return <div id={id} {...other}>
      <Timeline cached={cached} cachedMax={cachedMax} onClick={this.setPlayhead} playhead={playhead}/>
      <h1>{title}</h1>
      <canvas ref={canvas => this.canvas = canvas} onWheel={this.handleCameraMove}/>
    </div>
  }

}
