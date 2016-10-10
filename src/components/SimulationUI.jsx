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

    for (let i = 0; i < 250; i++)
      this.simulation.createBody(125 + Math.random() * 675,
          new Vector(Math.random() * this.canvas.width, Math.random() * this.canvas.height))

    console.log(this.simulation.maxCacheSeconds / 60)

  }

  render() {
    return <div>
      <h1>Gravity Toy</h1>
      <canvas ref={canvas => this.canvas = canvas} />
    </div>
  }

}
