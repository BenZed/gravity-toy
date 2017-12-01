import React from 'react'
import styled from 'styled-components'
import addEventListener from 'add-event-listener'
import { Renderer, Simulation } from 'modules/simulation'
import { clamp, Vector, random } from 'math-plus'

/******************************************************************************/
// TEMPORARY TODO Remove
/******************************************************************************/

function addSomeBodiesForShitsAndGiggles (sim) {

  const props = []
  for (let i = 0; i < 1000; i++)
    props.push({
      mass: random(50, 150, 0.125),
      pos: new Vector(
        random(0, innerWidth),
        random(0, innerHeight)
      ),
      vel: Vector.zero
    })

  sim.createBodies(props)

}

/******************************************************************************/
// Sub Components
/******************************************************************************/

const Canvas = styled.canvas`
  position: fixed;
  top: 0;
  left: 0;
`

const Title = styled.h1`
  font-family: 'Arial Black';
  margin: 0.25em;
`

/******************************************************************************/
// Main Component
/******************************************************************************/

class GravityToy extends React.Component {

  state = {
    speed: 1
  }

  componentDidMount () {

    this.renderer = new Renderer(this.canvas)
    this.simulation = new Simulation({
      physicsSteps: 1
    })
    addSomeBodiesForShitsAndGiggles(this.simulation)
    this.simulation.run()

    this.simulation.on('cache-full', this.cacheFull)

    addEventListener(window, 'resize', this.resize)
    this.interval = requestAnimationFrame(this.update)

    this.resize()
  }

  update = () => {

    const { simulation, renderer } = this
    const { speed } = this.state

    simulation.currentTick = clamp(
      simulation.currentTick + speed,
      simulation.firstTick,
      simulation.lastTick
    )

    renderer.render(simulation)

    requestAnimationFrame(this.update)
  }

  cacheFull = () => {
    console.error('CACHE IS FULL')
  }

  resize = () => {
    this.canvas.height = innerHeight
    this.canvas.width = innerWidth
  }

  innerRef = ref => {
    this.canvas = ref
  }

  render () {

    const { innerRef } = this

    const handlers = { innerRef }

    return [
      <Title key='title'>Gravity Toy</Title>,
      <Canvas key='canvas' { ...handlers} />
    ]

  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default GravityToy
