import React from 'react'
import { Simulation } from '../modules'
import { Vector, clamp, min, random } from 'math-plus'

export default class SimulationUI extends React.Component {

  componentDidMount() {
    this.simulation = new Simulation()

    const props = []

    for (let i = 0; i < 100; i++)
      props.push({
        mass: random(800,1000,0.125),
        pos: new Vector(random(-500,500), random(-500,500))
      })
    const bodies = this.simulation.createBodies(props)

    this.simulation.start()
    const interval = setInterval(() => {
      this.simulation.tick = clamp(this.simulation.tick + 1, 0, this.simulation.maxTick)

      if (this.simulation.numBodies < 10) {
        clearInterval(interval)
        this.simulation.stop()
        console.log(bodies.filter(body => body.exists))
        console.log(this.simulation.tick / 25, this.simulation.maxTick / 25)
      }
    }, 40)
  }

  render() {

    return <div>
      <canvas ref={ref => this.dom = ref} />
    </div>

  }

}
