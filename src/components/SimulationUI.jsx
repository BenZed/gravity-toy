import React from 'react'
import { Simulation, Renderer } from '../modules'
import { Vector, clamp, min, random } from 'math-plus'



export default class SimulationUI extends React.Component {

  componentDidMount() {

    this.simulation = new Simulation({ physicsSteps: 1, g: 0.5})
    this.renderer = new Renderer(this.simulation, this.canvas)

    onresize = this.onWindowResize
    onresize()
    /******************************************************************************/
    // test bullshit
    /******************************************************************************/
    const props = []

    for (let i = 0; i < 2000; i++)
      props.push({
        mass: random(50,99) + random() > 0.975 ? random(100, 1500) : 0,
        pos: new Vector(random(-1000,1000), random(-1000,1000))
      })
    this.simulation.createBodies(props)
    this.simulation.start()
    setInterval(() => {
      this.simulation.tick = clamp(this.simulation.tick + 1, 0, this.simulation.maxTick)
      this.renderer.render()
    }, 40)
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
