import React from 'react'

import { Simulation, SimulationCanvasDraw, Vector } from '../modules/simulation'
import { clamp } from '../modules/simulation/helper'

// import Mousetrap from 'mousetrap'

import Timeline from './Timeline'

const Speeds = [-512,-256,-128,-64,-32,-16,-4,-2,-1,1,2,4,16,32,64,128,256,512]

export default class SimulationUI extends React.Component {

/******************************************************************************/
// Initializers
/******************************************************************************/

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


/******************************************************************************/
// Event Handlers
/******************************************************************************/

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
    const delta = e === 37 ? -1 : 1
    // const delta = e.code === 'ArrowRight' ? 1 : -1
    const newIndex = clamp(Speeds.indexOf(this.draw.tickDelta) + delta, 0, Speeds.length - 1)

    this.draw.tickDelta = Speeds[newIndex]

  }

  handleCameraMove = e => {
    e.preventDefault()

    const delta = new Vector(e.deltaX, e.deltaY)

    if (e.shiftKey) {
      const scale = Math.min(this.draw.camera.target.scale, 40)
      const zoomSpeed = scale * 0.001
      const sign = delta.y > 0 ? 1 : -1

      this.draw.camera.target.scale += delta.magnitude * zoomSpeed * sign

    } else {

      const translateSpeed = this.draw.camera.target.scale * 0.2
      delta.imult(translateSpeed)

      this.draw.camera.target.pos.iadd(delta)
    }
  }

  handlePress = e => {
    console.log('press')
  }

  handleMove = e => {
    console.log('move')
  }

  handleRelease = e => {
    console.log('release')
  }

/******************************************************************************/
// Helper
/******************************************************************************/

  createEventHandlers() {
    onresize = this.onWindowResize
    onresize()

    const { simulation } = this.props

    simulation.on('interval-complete', this.receiveSimulationData)

    setTimeout(() => {
      let bodies = []
      simulation.forEachBody(body => {
        bodies.push(body)
      })

      bodies.sort((a,b) => a.mass < b.mass ? 1 : a.mass > b.mass ? -1 : 0)

      let i = 0
      const shift = code => {
        i = code === 38 ? i - 1 : code === 40 ? i + 1 : i
        i = i < 0 ? bodies.length - 1 : i >= bodies.length ? 0 : i
      }

      window.addEventListener('keydown', e => {
        const k = i
        let body
        do {
          shift(e.keyCode)
          body = bodies[i]
        } while (!body || !body.exists)

        if (k == i)
          return

        this.draw.camera.focusBody = body
        this.draw.camera.target.pos = Vector.zero
      })

      window.addEventListener('keydown', e => {
        if (e.keyCode === 37 || e.keyCode === 39)
          this.setSpeed(e.keyCode)
      })


    }, 1000)

  }

  createCanvasDraw() {
    this.draw = new SimulationCanvasDraw(this.props.simulation, this.canvas)
  }

  createKeyboardShortcuts() {
    // Mousetrap.bind(['left', 'right'], this.setSpeed)
  }

/******************************************************************************/
// LifeCycle
/******************************************************************************/

  componentDidMount() {

    this.props.simulation.start()

    setTimeout(() => {

      this.createEventHandlers()
      this.createCanvasDraw()
      this.createKeyboardShortcuts()

    }, 1000)

  }

  render() {

    const { id, title, ...other } = this.props
    const { cached, cachedMax, secondsMax, playhead } = this.state

    delete other.simulation

    return <div id={id} {...other}>
      <Timeline cached={cached} cachedMax={cachedMax}
        secondsMax={secondsMax} playhead={playhead}
        onClick={this.setPlayhead} />
      <h1>{title || `${this.draw ? Math.round(this.draw.camera.target.scale * 100) / 100 : '1'}x`}</h1>
      <canvas ref={canvas => this.canvas = canvas}
        onWheel={this.handleCameraMove}
        onMouseDown={this.handlePress}
        onMouseMove={this.handleMove}
        onMouseUp={this.handleRelease}
      />
    </div>
  }

}
