import React from 'react'

import { Simulation, SimulationCanvasDraw, Vector } from '../modules/simulation'
import { clamp } from '../modules/simulation/helper'

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

    this.props.simulation.start()

    setTimeout(() => {

      this.createEventHandlers()
      this.createCanvasDraw()
      this.createKeyboardShortcuts()

    }, 1000)


  }

  createEventHandlers() {
    onresize = this.onWindowResize
    onresize()

    const { simulation } = this.props

    simulation.on('interval-complete', this.receiveSimulationData)

    //for testing purposes, we're going to make the largest body the focusBody
    //and we're going to remove any object too far away from the largest body
    //this will only happen on the latest cached frame for now,
    simulation.on('interval-complete', () => {
      const MAX_DISTANCE_SQR = 100000 * 100000
      let largest = null

      simulation.forEachBody(body => {
        if (!body.exists)
          return

        if (largest === null || body.mass > largest.mass)
          largest = body

      })

      if (this.draw.camera.focusBody != largest)
        this.draw.camera.focusBody = largest

      simulation.forEachBody(body => {
        if (body === largest || !body.exists)
          return

        if (body.exists && body.pos.sub(largest.pos).sqrMagnitude > MAX_DISTANCE_SQR)
          body.mass = Math.floor(body.mass * 0.99)
      })

    })

  }

  createCanvasDraw() {
    this.draw = new SimulationCanvasDraw(this.props.simulation, this.canvas)
  }

  createKeyboardShortcuts() {
    Mousetrap.bind(['left', 'right'], this.setSpeed)
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
