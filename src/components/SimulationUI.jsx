import React from 'react'
import { Simulation, Renderer } from '../modules'
import { Vector, clamp, min, random } from 'math-plus'

export default class SimulationUI extends React.Component {

  componentDidMount() {

    this.simulation = new Simulation({ physicsSteps: 1, g: 0.1})
    this.renderer = new Renderer(this.simulation, this.canvas)

    onresize = this.onWindowResize
    onresize()
    /******************************************************************************/
    // test bullshit
    /******************************************************************************/
    const props = []

    const w = innerWidth * 0.5, h = innerHeight * 0.5, s = 3

    for (let i = 0; i < 20000; i++)
      props.push({
        mass: random(50,150),
        pos: new Vector(random(-w,w), random(-h,h)),
        vel: new Vector(random(-s,s), random(-s,s))
      })
    this.simulation.createBodies(props)
    this.simulation.start()
    setInterval(() => {
      this.simulation.tick = clamp(this.simulation.tick + 1, 0, this.simulation.maxTick)
      this.renderer.render()
    }, 30)
  }

  render() {

    return <div>
      <canvas ref={ref => this.canvas = ref} />
    </div>

  }

  onWindowResize = () => {
    this.canvas.width = innerWidth
    this.canvas.height = innerHeight
  }

}
