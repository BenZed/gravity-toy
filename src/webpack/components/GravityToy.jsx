import React from 'react'
import styled from 'styled-components'

import Timeline from './Timeline'
import Controls from './Controls'

import { Renderer, Simulation } from 'modules/simulation'
// import CameraController from '../modules/camera-controller'
import { CameraMove } from '../actions'
import TouchEmulator from 'hammer-touchemulator'

import addEventListener, { removeEventListener } from 'add-event-listener'
import { Vector, random, cos, round, sqrt, sin, min, max, floor, PI } from 'math-plus'

import { radiusFromMass } from 'modules/simulation/util'

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

function randomVector (radius) {

  const angle = random() * 2 * PI
  const rRadiusSqr = random() * radius * radius
  const rRadius = sqrt(rRadiusSqr)

  return new Vector(rRadius * cos(angle), rRadius * sin(angle))
}

function addSomeBodiesForShitsAndGiggles (sim) {

  const props = []
  const dist = min(innerWidth / 2, innerHeight / 2)
  const speed = 3

  for (let i = 0; i < 350; i++) {

    const pos = randomVector(dist).iadd(new Vector(innerWidth / 2, innerHeight / 2))
    const vel = randomVector(speed)

    props.push({
      mass: random(1, 100),
      pos,
      vel
    })
  }

  sim.createBodies(props)
}

/******************************************************************************/
// Styled Components
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
  toy.updateInterval = requestAnimationFrame(toy.updateSimulation)

}

/******************************************************************************/
// Main Component
/******************************************************************************/

class GravityToy extends React.Component {

  state = {
    speed: 1,
    pause: false,
    currentTime: 0,
    zoom: 1,
    maxTime: Infinity,
    action: null
  }

  componentDidMount () {

    this::setupSimulation()
    this::setupRenderer()

    addEventListener(window, 'resize', this.onResize)
    addEventListener(window, 'deviceorientation', this.onResize)
    addEventListener(window, 'keydown', this.onKeyDown)

    this.onResize()

    this.simulation.run()
    this.setState({
      action: new CameraMove(this)
    })
    this.renderer.camera.current.zoom = 10000
    this.selectBiggestBodyAsReferenceFrame()
    this.viewAllBodies()
  }

  componentWillUnmount () {

    cancelAnimationFrame(this.animate)

    this.simulation.stop()
    this.simulation.removeAllListeners('cache-full')

    removeEventListener(window, 'resize', this.onResize)
    removeEventListener(window, 'deviceorientation', this.onResize)
    removeEventListener(window, 'keydown', this.onKeyDown)

    this.renderer.canvas = null
    cancelAnimationFrame(this.updateInterval)

    this.cameraController.destroy()
  }

  setCurrentTime = time => {
    const { simulation } = this

    const tick = floor(time / 100 * simulation.lastTick)

    simulation.setCurrentTick(tick)
  }

  setSpeed = speed => {
    this.setState({ speed: round(speed) })
  }

  setPause = (pause = !this.state.pause) => {
    this.setState({ pause })
  }

  addZoom = rawDelta => {

    const { ZOOM_FACTOR, ZOOM_MAX_SPEED } = CameraMove
    const { camera } = this.renderer

    const dist = rawDelta * 0.25
    const speed = min(camera.current.zoom, ZOOM_MAX_SPEED) * ZOOM_FACTOR
    const delta = dist * speed

    camera.target.zoom += delta
  }

  updateSimulation = timeStamp => {

    const { simulation, renderer } = this
    const { action, pause } = this.state

    const speed = pause ? 0 : this.state.speed

    simulation.setCurrentTick(simulation.currentTick + speed)

    const zoom = renderer.camera.target.zoom
    if (simulation.lastTick > 0) {
      const maxTime = simulation.usedCacheMemory / simulation.maxCacheMemory * 100
      const currentTime = simulation.currentTick / simulation.lastTick * 100
      this.setState({ maxTime, currentTime, zoom })
    } else
      this.setState({ zoom })

    if (action && action.active && action.startTime === null)
      action.startTime = timeStamp

    renderer.render(simulation, speed)

    if (action && action.active) {
      action.currentTime = timeStamp
      action.onTick(timeStamp - action.startTime)
    }

    if (action)
      action.onDraw(renderer.canvas.getContext('2d'))

    requestAnimationFrame(this.updateSimulation)
  }

  innerRef = ref => {
    this.canvas = ref
  }

  onResize = () => {
    const { canvas } = this

    // setting a canvas dimension clears its content, even if it's the same value.
    // so we check that it's necessary first
    if (canvas.width !== innerWidth || canvas.height !== innerHeight) {
      canvas.width = innerWidth
      canvas.height = innerHeight
    }
  }

  onWheel = e => {
    e.stopPropagation()
    e.preventDefault()

    const { camera } = this.renderer

    if (e.shiftKey)
      this.addZoom(e.deltaY + e.deltaX)
    else {
      const delta = new Vector(e.deltaX, e.deltaY).imult(camera.current.zoom)
      this.renderer.camera.target.pos.iadd(delta)
    }
  }

  onKeyDown = e => {

    const { camera } = this.renderer
    const { target, current } = camera

    const INC = 100
    const zoomInc = INC * current.zoom

    switch (e.key) {

      case 'w':
        target.pos.y -= zoomInc
        break

      case 'a':
        target.pos.x -= zoomInc
        break

      case 's':
        target.pos.y += zoomInc
        break

      case 'd':
        target.pos.x += zoomInc
        break

      case 'j':
      case 'ArrowLeft':
        this.setSpeed(this.state.speed - 1)
        break

      case 'k':
      case ' ':
        this.setPause()
        break

      case 'l':
      case 'ArrowRight':
        this.setSpeed(this.state.speed + 1)
        break

      case '=':
      case 'ArrowUp':
        this.addZoom(-INC)
        break

      case 'Home':
      case 'Enter':
      case 'h':
        if (!camera.referenceFrame)
          this.selectBiggestBodyAsReferenceFrame()
        else {
          target.pos.set(camera.referenceFrame.pos)
          target.zoom = 1
        }
        break

      case 'Backspace':
      case 'Escape':
        if (camera.referenceFrame)
          camera.referenceFrame = null
        else
          this.viewAllBodies()
        break

      case '-':
      case 'ArrowDown':
        this.addZoom(INC)
        break
    }
  }

  selectBiggestBodyAsReferenceFrame () {

    const { simulation } = this
    const { camera } = this.renderer

    // Select the biggest body as a reference frame, otherwise
    const biggest = [ ...simulation.livingBodies() ]
      .reduce((b, c) => c.mass > b.mass ? c : b)
    camera.referenceFrame = biggest
  }

  viewAllBodies () {

    const { simulation, canvas } = this
    const { camera } = this.renderer
    const { target } = camera

    const center = Vector.zero

    const bodies = [ ...simulation.livingBodies() ]
    const topLeft = bodies[0].pos.copy()
    const botRight = topLeft.copy()

    for (const body of bodies) {
      center.iadd(body.pos)
      topLeft.x = min(topLeft.x, body.pos.x)
      topLeft.y = min(topLeft.y, body.pos.y)
      botRight.x = max(botRight.x, body.pos.x)
      botRight.y = max(botRight.y, body.pos.y)
    }
    center.idiv(bodies.length)
    target.pos.set(center)

    const width = botRight.x - topLeft.x
    const height = botRight.y - topLeft.y

    target.zoom = max(width / canvas.width, height / canvas.height)
  }

  render () {

    const { innerRef, onWheel, setCurrentTime, setSpeed, addZoom, state } = this

    const { action, zoom, speed, ...time } = state

    const onTouchStart = action && action.start
    const onTouchMove = action && action.update
    const onTouchEnd = action && action.end

    const timeline = { ...time, setCurrentTime }
    const canvas = { innerRef, onWheel, onTouchStart, onTouchMove, onTouchEnd }
    const controls = { zoom, speed, setSpeed, addZoom }

    return [
      <Controls key='controls' {...controls}/>,
      <Canvas key='canvas' {...canvas} />,
      <Timeline key='timeline' {...timeline}/>
    ]
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default GravityToy
