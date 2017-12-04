import React from 'react'
import styled from 'styled-components'
import addEventListener from 'add-event-listener'
import { Renderer, Simulation } from 'modules/simulation'
import { clamp, Vector, random } from 'math-plus'

import Timeline from './Timeline'
import SortedArray from 'modules/simulation/util/sorted-array'

/******************************************************************************/
// TEMPORARY TODO Remove
/******************************************************************************/

function addSomeBodiesForShitsAndGiggles (sim) {

  const props = []

  for (let i = 0; i < 3990; i++)
    props.push({
      mass: random(1, 10),
      pos: new Vector(
        random(0, innerWidth),
        random(0, innerHeight)
      ),
      vel: new Vector(
        random(-1, 1),
        random(-1, 1)
      )
    })

  for (let i = 0; i < 10; i++)
    props.push({
      mass: random(1, 1000),
      pos: new Vector(
        random(0, innerWidth),
        random(0, innerHeight)
      ),
      vel: new Vector(
        random(-1, 1),
        random(-1, 1)
      )
    })

  props.push({
    mass: 1000000,
    pos: new Vector(innerWidth * 100, innerHeight * 0.5)
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
    speed: 1,
    currentTime: 0,
    maxTime: Infinity
  }

  componentDidMount () {

    this.simulation = new Simulation({
      minRealBodies: 256,
      realMassThreshold: 10
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

    if (simulation.lastTick > 0) {
      const maxTime = simulation.usedCacheMemory / simulation.maxCacheMemory * 100
      const currentTime = simulation.currentTick / simulation.lastTick * 100
      this.setState({ maxTime, currentTime })
    }

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

  // onKeyDown = async ({ key }) => {
  //
  //   let delta = 0
  //   if (key === 'a')
  //     delta = -1
  //   else if (key === 'd')
  //     delta = 1
  //
  //   const { simulation: sim, renderer } = this
  //
  //   let tick = sim.currentTick + delta
  //   if (tick < sim.firstTick)
  //     tick = sim.firstTick
  //
  //   if (tick > sim.lastTick && sim.running)
  //     return
  //
  //   if (tick > sim.lastTick)
  //     await sim.runUntil(() => sim.lastTick >= tick)
  //   sim.currentTick = tick
  //   renderer.render(sim)
  //
  // }

  render () {

    const { innerRef, state } = this
    const handlers = { innerRef }

    return [
      <Title key='title'>Gravity Toy</Title>,
      <Canvas key='canvas' { ...handlers} />,
      <Timeline key='timeline' {...state}/>
    ]
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default GravityToy
