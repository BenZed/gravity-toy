import React from 'react'
import styled from 'styled-components'

import Timeline from './Timeline'
import Controls from './Controls'

import { Renderer, Simulation } from 'modules/simulation'
// import CameraController from '../modules/camera-controller'
import { CameraMove } from '../actions'
import TouchEmulator from 'hammer-touchemulator'

import addEventListener, { removeEventListener } from 'add-event-listener'
import { Vector, random, cos, sqrt, sin, min, floor, PI } from 'math-plus'
import { radiusFromMass } from 'modules/simulation/util'

import isMobile from '../modules/is-mobile'
import is from 'is-explicit'

/******************************************************************************/
// Setup Touch
/******************************************************************************/

TouchEmulator()

TouchEmulator.template = () => {} // Do not visualize touch

/******************************************************************************/
// Temporary TODO Remove
/******************************************************************************/

function orbitalVelocity (bodyOrPos, parent, g) {

  const pos = is(bodyOrPos, Vector) ? bodyOrPos : bodyOrPos.pos

  const relative = pos.sub(parent.pos)
  const dist = relative.magnitude

  // I'm not sure why I have to divide by 10. According to Google
  // this equation should work without it
  const speed = sqrt(g * parent.mass / dist) * 0.1

  return relative
    .iperpendicular()
    .imult(speed)
    .iadd(parent.vel)

}

function escapeSpeed (child, parent, g) {
  const relative = child.pos.sub(parent.pos)
  return g * parent.mass * child.mass / relative.sqrMagnitude
}

function randomVector (radius) {

  const angle = random() * 2 * PI
  const rRadiusSqr = random() * radius * radius
  const rRadius = sqrt(rRadiusSqr)

  return new Vector(rRadius * cos(angle), rRadius * sin(angle))
}

function addSomeBodiesForShitsAndGiggles (sim) {

  const big = {
    mass: 10000,
    pos: new Vector(innerWidth * 0.5, innerHeight * 0.5)
  }

  const props = [ big ]

  for (let i = 0; i < 10; i++) {

    const dist = radiusFromMass(big.mass) * 200
    const pos = randomVector(dist).iadd(big.pos)
    const vel = orbitalVelocity(pos, big, sim.g)

    props.push({
      mass: random(100, 500),
      pos,
      vel
    })
  }

  for (let i = 0; i < 90; i++) {

    const parent = props::random()

    const dist = radiusFromMass(parent.mass) * 20
    const pos = randomVector(dist).iadd(parent.pos)
    const vel = orbitalVelocity(pos, parent, sim.g)

    props.push({
      mass: random(1, 10),
      pos,
      vel
    })
  }

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
  toy.renderer.camera.target.zoom = 1

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

  setCurrentTime = time => {
    const { simulation } = this

    const tick = floor(time / 100 * simulation.lastTick)

    simulation.setCurrentTick(tick)
  }

  setSpeed = speed => {
    this.setState({ speed })
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

  wheelZoom = e => {

    const { ZOOM_FACTOR, ZOOM_MAX_SPEED } = CameraMove
    const { camera } = this.renderer

    const dist = e.deltaY * 0.25
    const speed = min(camera.current.zoom, ZOOM_MAX_SPEED) * ZOOM_FACTOR
    const delta = dist * speed

    camera.target.zoom += delta
  }

  render () {

    const { innerRef, setCurrentTime, setSpeed, state } = this

    const { action } = state

    const start = action && action.start
    const update = action && action.update
    const end = action && action.end

    const timeline = { ...state, setCurrentTime, setSpeed }

    return [
      <Controls key='controls'/>,
      <Canvas key='canvas' innerRef={innerRef} onWheel={this.wheelZoom} onTouchStart={start} onTouchMove={update} onTouchEnd={end}/>,
      <Timeline key='timeline' {...timeline}/>
    ]
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default GravityToy
