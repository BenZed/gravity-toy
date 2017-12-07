import React from 'react'
import styled from 'styled-components'

import Timeline from './Timeline'

import { Renderer, Simulation } from 'modules/simulation'
import CameraController from '../modules/camera-controller'

import addEventListener, { removeEventListener } from 'add-event-listener'
import { clamp, Vector, random, cos, sqrt, sin, PI } from 'math-plus'

/******************************************************************************/
// Temporary TODO Remove
/******************************************************************************/

function randomPointInCircle (radius) {

  const angle = random() * 2 * PI
  const rRadiusSqr = random() * radius * radius
  const rRadius = sqrt(rRadiusSqr)

  return new Vector(rRadius * cos(angle), rRadius * sin(angle))
}

function addSomeBodiesForShitsAndGiggles (sim) {
  const speed = 1
  const spread = 4

  const big = {
    mass: 10000,
    pos: new Vector(innerWidth * 0.5, innerHeight * 0.5)
  }

  const fast = {
    mass: 100,
    pos: big.pos.sub(new Vector(2000, 2000)),
    vel: new Vector(100, 100)
  }

  const props = [ big, fast ]

  for (let i = 0; i < 100; i++)
    props.push({
      mass: random(1, 500),
      pos: randomPointInCircle(innerWidth * spread).iadd(big.pos),
      vel: new Vector(
        random(-speed, speed),
        random(-speed, speed)
      )
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
  font-family: 'Helvetica';
  margin: 0.25em;
`

/******************************************************************************/
// Setup
/******************************************************************************/

function setupSimulation () {

  const toy = this

  toy.simulation = new Simulation({
    minRealBodies: 256,
    realMassThreshold: 10
  })

  toy.simulation.on('cache-full', () => console.log('cache full'))
  addSomeBodiesForShitsAndGiggles(toy.simulation)
}

function setupRenderer () {

  const toy = this

  toy.renderer = new Renderer(toy.canvas)
  toy.animate = requestAnimationFrame(toy.update)

}

function setupCameraControls () {

  const toy = this

  toy.renderer.camera.referenceFrame = toy.simulation.toArray()[0]
  toy.renderer.camera.target.pos.imult(0)
  toy.renderer.camera.target.zoom = 3

  toy.cameraController = new CameraController(toy)

}

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

    this::setupSimulation()
    this::setupRenderer()
    this::setupCameraControls()

    addEventListener(window, 'resize', this.resize)
    addEventListener(window, 'deviceorientation', this.resize)
    this.resize()

    this.simulation.run()
  }

  componentWillUnmount () {

    cancelAnimationFrame(this.animate)

    this.simulation.stop()
    this.simulation.removeAllListeners('cache-full')

    removeEventListener(window, 'resize', this.resize)

    this.renderer.canvas = null
    cancelAnimationFrame(this.animate)

    this.cameraController.destroy()
  }

  resize = () => {
    const { canvas } = this

    // setting a canvas dimension clears its content, even if it's the same value.
    // so we check that it's necessary first
    if (canvas.width !== innerWidth && canvas.height !== innerHeight) {
      canvas.width = innerWidth
      canvas.height = innerHeight
    }
  }

  update = () => {

    const { simulation, renderer } = this
    const { speed } = this.state

    simulation.setCurrentTick(simulation.currentTick + speed)

    if (simulation.lastTick > 0) {
      const maxTime = simulation.usedCacheMemory / simulation.maxCacheMemory * 100
      const currentTime = simulation.currentTick / simulation.lastTick * 100
      this.setState({ maxTime, currentTime })
    }

    renderer.render(simulation)

    requestAnimationFrame(this.update)
  }

  innerRef = ref => {
    this.canvas = ref
  }

  render () {

    const { innerRef, state } = this

    return [
      <Title key='title'>Gravity Toy</Title>,
      <Canvas key='canvas' innerRef={innerRef} />,
      <Timeline key='timeline' {...state}/>
    ]
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default GravityToy
