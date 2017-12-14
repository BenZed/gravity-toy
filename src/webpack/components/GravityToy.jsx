import React from 'react'
import styled from 'styled-components'

import Timeline from './Timeline'

import { Renderer, Simulation } from 'modules/simulation'
// import CameraController from '../modules/camera-controller'
import { CameraMove } from '../actions'

import addEventListener, { removeEventListener } from 'add-event-listener'
import { Vector, random, cos, sqrt, sin, PI } from 'math-plus'

import isMobile from '../modules/is-mobile'

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
  const speed = 5
  const spread = 1

  const big = {
    mass: 20000,
    pos: new Vector(innerWidth * 0.5, innerHeight * 0.5)
  }

  const fast = {
    mass: 100,
    pos: big.pos.sub(new Vector(15000, 15000)),
    vel: new Vector(100, 100)
  }

  const props = [ big, fast ]

  for (let i = 0; i < (isMobile() ? 100 : 1000); i++)
    props.push({
      mass: random(10, 500),
      pos: randomPointInCircle(innerWidth * spread).iadd(big.pos),
      vel: new Vector(
        random(-speed, speed),
        random(-speed, speed)
      )
    })

  for (let i = 0; i < (isMobile() ? 250 : 5000); i++)
    props.push({
      mass: random(1, 10),
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

  // toy.cameraController = new CameraController(toy)

}

/******************************************************************************/
// Main Component
/******************************************************************************/

class GravityToy extends React.Component {

  state = {
    speed: 1,
    currentTime: 0,
    maxTime: Infinity,
    action: null
  }

  componentDidMount () {

    this::setupSimulation()
    this::setupRenderer()
    this::setupCameraControls()

    addEventListener(window, 'resize', this.resize)
    addEventListener(window, 'deviceorientation', this.resize)
    this.resize()

    this.simulation.run()
    this.setState({
      action: new CameraMove(this)
    })
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

  update = timeStamp => {

    const { simulation, renderer } = this
    const { speed, action } = this.state

    simulation.setCurrentTick(simulation.currentTick + speed)

    if (simulation.lastTick > 0) {
      const maxTime = simulation.usedCacheMemory / simulation.maxCacheMemory * 100
      const currentTime = simulation.currentTick / simulation.lastTick * 100
      this.setState({ maxTime, currentTime })
    }

    if (action && action.active && action.startTime === null)
      action.startTime = timeStamp

    if (action && action.active) {
      action.currentTime = timeStamp
      action.onTick(timeStamp - action.startTime)
    }

    renderer.render(simulation)
    if (action)
      action.onDraw(renderer.canvas.getContext('2d'))

    requestAnimationFrame(this.update)
  }

  innerRef = ref => {
    this.canvas = ref
  }

  render () {

    const { innerRef, state } = this

    const { action } = state

    const start = action && action.start
    const update = action && action.update
    const end = action && action.end

    return [
      <Title key='title'>Gravity Toy</Title>,
      <Canvas key='canvas' innerRef={innerRef} onTouchStart={start} onTouchMove={update} onTouchEnd={end}/>,
      <Timeline key='timeline' {...state}/>
    ]
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default GravityToy
