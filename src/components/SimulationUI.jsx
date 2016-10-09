import React from 'react'

import { Vector, Simulation } from '../modules/simulation'

export default class extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      bodies: []
    }
    this.simulation = new Simulation()
  }

  componentDidMount() {
    this.simulation.start()
    this.simulation.createBody(200)
    this.simulation.createBody(200, new Vector(525,525))
    this.simulation.on('interval-complete', tick => console.log('cached ticks: ', tick))
    setTimeout(() => this.simulation.stop(), 1000)
  }

  render() {
    return <div>
      <h1>Gravity Toy</h1>
      <canvas ref={canvas => this.canvas = canvas} />
    </div>
  }

}
