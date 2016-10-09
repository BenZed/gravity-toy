import React from 'react'

import { Vector, Simulation, SimulationCanvasDraw } from '../modules/simulation'

export default class extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      bodies: []
    }
  }

  onResize() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  componentDidMount() {

    onresize = this.onResize.bind(this)
    onresize()

    this.simulation = new Simulation()
    this.draw = new SimulationCanvasDraw(this.simulation, this.canvas)

    this.simulation.start()
    this.simulation.createBody(2000, new Vector(250,250))
    this.simulation.createBody(2000, new Vector(300,300))

  }

  render() {
    return <div>
      <h1>Gravity Toy</h1>
      <canvas ref={canvas => this.canvas = canvas} />
    </div>
  }

}
