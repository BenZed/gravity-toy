import React from 'react'
import styled from 'styled-components'
import addEventListener from 'add-event-listener'
import { Renderer, Simulation } from 'modules/simulation'
import { clamp, Vector, random } from 'math-plus'

import SortedArray from 'modules/simulation/util/sorted-array'

/******************************************************************************/
// TEMPORARY TODO Remove
/******************************************************************************/

const props = []

function addSomeBodiesForShitsAndGiggles (sim) {
  if (props.length === 0) for (let i = 0; i < 5000; i++)
    props.push({
      mass: random(50, 150),
      pos: new Vector(
        random(0, innerWidth),
        random(0, innerHeight)
      ),
      vel: new Vector(
        random(-1, 1),
        random(-1, 1)
      )
    })

  sim.createBodies(props)

}

async function tryFindBodiesMovingWayToFast (sim, rend) {

  await sim.runForNumTicks(10)

  sim.currentTick = 10
  rend.render(sim)

  const fast = [ ...sim.bodies() ].filter(b => b.vel.magnitude > 5)

  sim.currentTick = 0
  rend.render(sim)

  const props = fast.map(f =>
  `{
    mass: ${f.mass},
    pos: new Vector(${f.pos.x}, ${f.pos.y})
  }`)

  console.log(props.join(', '))
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

    this.simulation = new Simulation({
      physicsSteps: 1,
      g: 1
    })
    addSomeBodiesForShitsAndGiggles(this.simulation)
    this.renderer = new Renderer(this.canvas)

    this.simulation.on('cache-full', this.cacheFull)

    addEventListener(window, 'resize', this.resize)
    addEventListener(window, 'keypress', this.onKeyDown)
    this.interval = requestAnimationFrame(this.update)

    this.resize()
    this.simulation.run()

    // tryFindBodiesMovingWayToFast(this.simulation, this.renderer)
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

  onKeyDown = async ({ key }) => {

    let delta = 0
    if (key === 'a')
      delta = -1
    else if (key === 'd')
      delta = 1

    const { simulation: sim, renderer } = this

    let tick = sim.currentTick + delta
    if (tick < sim.firstTick)
      tick = sim.firstTick

    if (tick > sim.lastTick && sim.running)
      return

    if (tick > sim.lastTick)
      await sim.runUntil(() => sim.lastTick >= tick)
    sim.currentTick = tick
    renderer.render(sim)

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
