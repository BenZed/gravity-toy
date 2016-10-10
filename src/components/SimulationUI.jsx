import React from 'react'

import { Vector, Simulation, SimulationCanvasDraw, clamp } from '../modules/simulation'
import Timeline from './Timeline'
import Mousetrap from 'mousetrap'

export default class extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      //bodies: [],
      cached: 0,
      cachedMax: 100,
      playhead: 0
    }

    this.setTiming = this.setTiming.bind(this)
    this.setPlayhead = this.setPlayhead.bind(this)
    this.setPlayDelta = this.setPlayDelta.bind(this)
    this.handleCameraMove = this.handleCameraMove.bind(this)
  }

  onResize() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  setTiming() {
    this.setState({
      cached: this.simulation.cacheSize,
      cachedMax: this.simulation.maxCacheSize,
      playhead: this.draw.tick
    })
  }

  setPlayhead(e) {

    const x = e.clientX - e.currentTarget.offsetLeft
    const xMax = e.currentTarget.offsetWidth

    const targetTick = Math.min(x / xMax * this.simulation.maxCacheSize, this.simulation.cacheSize - 1)

    this.draw.tick = Math.floor(targetTick)
  }

  setPlayDelta(e) {
    let value = e.code === 'ArrowRight' ? 1 : -1

    if (this.draw.tickDelta + value === 0)
      value *= 2

    this.draw.tickDelta = clamp(this.draw.tickDelta + value, -5, 5)
  }

  handleCameraMove(e) {
    e.preventDefault()

    const delta = new Vector(e.deltaX, e.deltaY)

    if (!e.shiftKey) {
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

    onresize = this.onResize.bind(this)
    onresize()

    Mousetrap.bind(['left', 'right'], this.setPlayDelta)

    this.simulation = new Simulation()
    this.draw = new SimulationCanvasDraw(this.simulation, this.canvas)

    this.simulation.start()
    this.simulation.on('interval-complete', this.setTiming)

    const randMass = () => 125 + Math.random() * 2675
    const randPos = () => new Vector(Math.random() * this.canvas.width, Math.random() * this.canvas.height)
    const randVel = () => new Vector(Math.random() * 2, Math.random() * 2)
    const addedPos = n => new Vector(n * 100, n * 200)

    for (let i = 0; i < 100; i++)
      setTimeout(() => this.simulation.createBody(randMass(), randPos(), undefined, this.draw.tick), i * 50)

  }

  render() {

    const { cached, cachedMax, playhead } = this.state

    return <div id='gravity-toy-root'>
      <Timeline cached={cached} cachedMax={cachedMax} onClick={this.setPlayhead} playhead={playhead}/>
      <h1>Gravity Toy</h1>
      <canvas ref={canvas => this.canvas = canvas} onWheel={this.handleCameraMove}/>
    </div>
  }

}
