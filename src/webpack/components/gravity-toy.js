import React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import Timeline from './timeline'
import Controls from './controls'

import { Renderer, Simulation } from '../../simulation'
import { randomVector } from '../../simulation/util'

// import CameraController from '../modules/camera-controller'
import { CameraMove } from '../actions'

import addEventListener, { removeEventListener } from 'add-event-listener'
import { Vector, random, round, clamp, abs, min, max } from '@benzed/math'

import defaultTheme from '../util/theme'

/******************************************************************************/
// Constants
/******************************************************************************/

const SAVE_KEY = 'simulation-saved'
const SAVE_INTERVAL = 5 * 1000 // 5 seconds
const SAVE_MAX_SIZE = 1024 * 1024 // 1 mb

const MAX_SPEED = 2 ** 10

const DEFAULT_BODIES = {

  count: 512,
  speed: 0.5,
  radius: 600,

  MASS: {
    min: 1,
    max: 10,
    superSizeProbability: 0.01,
    superSizeMassMultiplier: 20
  }

}

/******************************************************************************/
// Temporary TODO Remove
/******************************************************************************/

function createDefaultBodies (sim) {

  const props = []
  const center = new Vector(innerWidth / 2, innerHeight / 2)

  const { radius, speed, count, MASS } = DEFAULT_BODIES

  for (let i = 0; i < count; i++) {

    const pos = randomVector(radius).iadd(center)
    const vel = randomVector(speed)
    let mass = random(MASS.min, MASS.max)
    if (random() < MASS.superSizeProbability)
      mass *= MASS.superSizeMassMultiplier

    props.push({
      mass,
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
  const { camera } = toy.renderer

  try {

    const saved = window.localStorage.getItem(SAVE_KEY)
    const json = JSON.parse(saved)
    if (!json)
      throw new Error('No saved simulation.')

    toy.simulation = Simulation.fromJSON(json)
    const { x, y, zoom, referenceFrameIndex } = json.camera

    const center = new Vector(x, y)

    camera.current.pos.set(center)
    camera.target.pos.set(center)
    camera.target.zoom = zoom

    if (referenceFrameIndex >= 0)
      camera.referenceFrame = toy.simulation.toArray()[referenceFrameIndex]

  } catch (err) {
    // Just create the default if there is any error
    console.error(err.message)

    toy.simulation = new Simulation({
      minRealBodies: 256,
      realMassThreshold: 10,
      g: 32
    })

    const center = new Vector(innerWidth / 2, innerHeight / 2)

    createDefaultBodies(toy.simulation)

    camera.current.pos.set(center)
    camera.target.pos.set(center)

  }

  toy.simulation.on('cache-full', () => console.log('cache full'))
  this.saveInterval = setInterval(toy.saveSimulation, SAVE_INTERVAL)
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
    scrubbing: false,

    zoom: 1,

    currentTick: null,
    lastTick: null,
    firstTick: null,
    cacheSize: null,

    action: null
  }

  componentDidMount () {

    this::setupRenderer()
    this::setupSimulation()

    addEventListener(window, 'resize', this.onResize)
    addEventListener(window, 'deviceorientation', this.onResize)
    addEventListener(window, 'keydown', this.onKeyDown)

    this.onResize()

    this.simulation.run()
    this.setState({
      action: new CameraMove(this)
    })

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

  setCurrentTick = tick => {
    const { simulation } = this
    simulation.setCurrentTick(tick)
  }

  setScrubbing = scrubbing => {
    this.setState({ scrubbing })
  }

  clearBeforeTick = tick => {
    const { simulation } = this

    simulation.clearBeforeTick(tick)
  }

  setSpeed = speed => {

    speed = speed
      ::clamp(-MAX_SPEED, MAX_SPEED)
      ::round()

    // setting the speed should unpause the simulation
    this.setState({ speed, pause: false })
  }

  incrementSpeed = (reverse = false) => {

    let { speed } = this.state
    const { currentTick, firstTick, lastTick, pause } = this.state

    const isSameDir = reverse === (speed < 0)
    const isAtOne = abs(speed) === 1

    // if you're moving fast at the end of the simulation, we dont want to have
    // to press the reverse key a bunch of times
    if ((reverse && currentTick === lastTick) || (!reverse && currentTick === firstTick))
      speed = reverse ? -1 : 1

    // if we're incrementing speed while paused, we don't want to change the magnitude
    // only the direction

    else
      speed = isSameDir
        ? pause
          ? speed
          : speed * 2
        : isAtOne
          ? speed * -1
          : speed / 2

    this.setSpeed(speed)
  }

  decrementSpeed () {
    return this.incrementSpeed(true)
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

  saveSimulation = () => {

    const { simulation, renderer: { camera } } = this

    try {

      const json = simulation.toJSON()

      const frame = camera.referenceFrame

      const referenceFrameIndex = frame && frame.exists
        ? json.bodies.reduce((index, body, i) =>
          body.id === frame.id ? i : index
        , -1)
        : -1

      for (const body of json.bodies)
      // Save space in localStorage by not keeping the body.id
        delete body.id

      json.camera = {
        referenceFrameIndex,
        x: camera.target.relPos.x,
        y: camera.target.relPos.y,
        zoom: camera.target.zoom
      }

      const str = JSON.stringify(json)
      const size = (str.length * 4)
      if (size > SAVE_MAX_SIZE)
        throw new Error('Simulation too large.')

      window.localStorage.setItem(SAVE_KEY, str)

    } catch (err) {
      console.error('Could not save simulation', err.message)
    }

  }

  updateSimulation = timeStamp => {

    const { simulation, renderer } = this
    const { action, pause, scrubbing } = this.state

    const speed = pause || scrubbing ? 0 : this.state.speed

    simulation.setCurrentTick(simulation.currentTick + speed)

    const { zoom } = renderer.camera.target
    const { currentTick, lastTick, firstTick } = simulation

    const atLeastOneFrameCached = lastTick > 0

    const cacheSize = simulation.usedCacheMemory / simulation.maxCacheMemory

    if (atLeastOneFrameCached)
      this.setState({
        cacheSize,
        currentTick,
        lastTick: scrubbing ? this.state.lastTick : lastTick,
        firstTick,
        zoom
      })
    else
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

  ref = ref => {
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

      case 'Escape':
        // destroy save
        window.localStorage.removeItem(SAVE_KEY)
        // reload
        setTimeout(() => location.reload(), 100)
        break

      // Move up
      case 'w':
        target.pos.y -= zoomInc
        break

      // Move left
      case 'a':
        target.pos.x -= zoomInc
        break

      // Move down
      case 's':
        target.pos.y += zoomInc
        break

      // Move right
      case 'd':
        target.pos.x += zoomInc
        break

      // time speed negative
      case 'j':
      case 'ArrowLeft':
        this.decrementSpeed()
        break

      // pause
      case 'k':
      case ' ':
        this.setPause()
        break

      // time speed positive
      case 'l':
      case 'ArrowRight':
        this.incrementSpeed()
        break

      case '=':
      case 'ArrowUp':
        this.addZoom(-INC)
        break

      // Zoom Out
      case '-':
      case 'ArrowDown':
        this.addZoom(INC)
        break

      case 'Home':
      case 'Enter':
      case 'h':
        // Set Focus to Largest Body
        if (!camera.referenceFrame)
          this.selectBiggestBodyAsReferenceFrame()
        // Or if a body is already focused, center it
        else {
          target.pos.set(Vector.zero)
          target.zoom = 1
        }
        break

      case 'Backspace':
        // Clear Focus
        if (camera.referenceFrame)
          camera.referenceFrame = null
        // Or if focus is already cleared, zoom out to everything
        else
          this.viewAllBodies()
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

    const {
      state, ref, onWheel,
      setCurrentTick, clearBeforeTick,
      setSpeed, addZoom, setScrubbing
    } = this

    const {
      action, zoom, speed, pause, ...tick
    } = state

    const onTouchStart = action && action.start
    const onTouchMove = action && action.update
    const onTouchEnd = action && action.end

    const timeline = { ...tick, setCurrentTick, clearBeforeTick, setScrubbing }
    const canvas = { ref, onWheel, onTouchStart, onTouchMove, onTouchEnd }
    const controls = { zoom, speed, setSpeed, addZoom }

    return [
      <Controls key='controls' {...controls}/>,
      <Canvas key='canvas' {...canvas} />,
      <Timeline key='timeline' {...timeline}/>
    ]
  }

}

const GravityToyThemed = ({ theme = defaultTheme, ...props }) =>
  <ThemeProvider theme={theme}>
    <GravityToy {...props}/>
  </ThemeProvider>

/******************************************************************************/
// Exports
/******************************************************************************/

export default GravityToyThemed
