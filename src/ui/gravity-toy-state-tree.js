import { StateTree, state, action } from '@benzed/state-tree'
import { Simulation, Renderer } from '../simulation'
import { randomVector } from '../simulation/util'
import { DEFAULT_RENDERING_OPTIONS } from '../simulation/renderer/renderer'

import { Vector, abs, round, clamp, random } from '@benzed/math'
import { copy, set, get } from '@benzed/immutable'

import { MAX_SPEED, DEFAULT_BODIES } from './constants'

/******************************************************************************/
// Data
/******************************************************************************/

const CONTEXT_INTERVAL = 150 // ms

const NUM_DELTA_TICKS = 12

const $$mrs = Symbol('mutable-runtime-state')

/******************************************************************************/
// Helper
/******************************************************************************/

class DefaultSimulation extends Simulation {

  constructor () {

    super({
      minRealBodies: 256
    })

    const bodies = []
    const center = new Vector(innerWidth / 2, innerHeight / 2)

    const { radius, speed, count, MASS } = DEFAULT_BODIES

    for (let i = 0; i < count; i++) {

      const pos = randomVector(radius).iadd(center)
      const vel = randomVector(speed)

      let mass = random(MASS.min, MASS.max)
      if (random() < MASS.superSizeProbability)
        mass *= MASS.superSizeMassMultiplier

      bodies.push({
        mass,
        pos,
        vel
      })
    }

    this.createBodies(bodies)

  }
}

/******************************************************************************/
//
/******************************************************************************/

// I know this is such a specific application of the reduce method, but
// I feel like I write this function a LOT. TODO add to @benzed/array?
const average = array => {
  let total = 0
  for (const value of array)
    total += value

  return total / array.length
}

/******************************************************************************/
// Main
/******************************************************************************/

class GravityToyStateTree extends StateTree {

  @state
  time = {
    total: 0,
    delta: 0
  }

  @state
  targetSpeed = 1 // desired speed

  @state
  actualSpeed = 1

  @state
  paused = false

  @action('targetSpeed')
  setTargetSpeed = targetSpeed => targetSpeed::round()::clamp(-MAX_SPEED, MAX_SPEED)

  incrementTargetSpeed = (reverse = false) => {

    let { targetSpeed } = this
    const { paused } = this
    const { currentTick, firstTick, lastTick } = this.simulationState

    const isSameDir = reverse === (targetSpeed < 0)
    const isAtOne = abs(targetSpeed) === 1

    // if you're moving fast at the end of the simulation, we dont want to have
    // to press the reverse key a bunch of times
    if ((reverse && currentTick === lastTick) || (!reverse && currentTick === firstTick))
      targetSpeed = reverse ? -1 : 1

    // if we're incrementing speed while paused, we don't want to change the magnitude
    // only the direction

    else
      targetSpeed = isSameDir
        ? paused
          ? targetSpeed
          : targetSpeed * 2
        : isAtOne
          ? targetSpeed * -1
          : targetSpeed / 2

    this.setTargetSpeed(targetSpeed)
  }

  @state
  renderOptions = copy(DEFAULT_RENDERING_OPTIONS)

  @state
  simulationState = {
    firstTick: 0,
    lastTick: 0,
    currentTick: 0,
    running: false,
    usedCacheMemory: 0
  }

  renderer = null
  simulation = null

  _uiIntervalId = null
  _renderIntervalId = null
  _deltaTicks = [];

  [$$mrs] = {
    time: {
      total: 0,
      delta: 0
    },
    actualSpeed: 0,
    simulationState: {
      firstTick: 0,
      lastTick: 0,
      currentTick: 0,
      running: false,
      usedCacheMemory: 0,
      maxCacheMemory: 0
    }
  }

  start () {
    this.simulation.run()

    this._renderIntervalId = requestAnimationFrame(this.updateRender)
    this._uiIntervalId = setInterval(this.updateUi, CONTEXT_INTERVAL)
  }

  end () {
    this.simulation.stop()
    cancelAnimationFrame(this.renderIntervalId)
    clearInterval(this.uiIntervalId)
  }

  // update the state tree by copying the mutable runtime state
  @action
  updateUi = () => {
    return { ...this.state, ...this[$$mrs] }
  }

  // Update the render visible on the canvas
  updateRender = timeTotal => {

    const { renderer, simulation, [$$mrs]: mrs } = this

    const initialTick = simulation.currentTick

    simulation.setCurrentTick(initialTick + this.targetSpeed)
    renderer.render(simulation)

    // fill deltatick array
    const deltaTick = simulation.currentTick - initialTick
    this._deltaTicks.push(deltaTick)
    while (this._deltaTicks.length > NUM_DELTA_TICKS)
      this._deltaTicks.shift()

    // update mutable runtime state
    mrs.time.delta = timeTotal - mrs.time.total
    mrs.time.total = timeTotal
    for (const key in mrs.simulationState)
      mrs.simulationState[key] = simulation[key]

    // set renderer speed, pretty much only effects body speed distortion. I
    // realize this is applying the render speed of the previous frame to the next
    // but at 60 frames per second, the error isn't noticable
    this.renderer.speed = deltaTick

    // if deltaTick === this.targetSpeed, playback is most likely normalized.
    // it's more accurate to return the targetSpeed rather than calculating
    // the average of all past deltaTicks, this way there will not be a lag
    // in the ui as the _deltaTicks array fills up.
    mrs.actualSpeed = deltaTick === this.targetSpeed
      ? deltaTick
      : average(this._deltaTicks)

    // queue next frame
    requestAnimationFrame(this.updateRender)
  }

  constructor (...args) {
    super(...args)

    // Sync options in renderer with options in state
    this.subscribe((toy, listenPath, changePath) => {
      const equivalentChangePath = changePath.slice(1)
      const equivalentValue = get.mut(toy, changePath)

      set.mut(toy.renderer.options, equivalentChangePath, equivalentValue)
    }, 'renderOptions')

    this.simulation = new DefaultSimulation()
    this.renderer = new Renderer()

    // Center camera on largest body TODO this should go elsewhere
    const largest = [ ...this.simulation.bodies() ].reduce((big, body) => big.mass > body.mass
      ? big
      : body, { mass: -Infinity })

    this.renderer.camera.referenceFrame = largest
    this.renderer.camera.target.pos.set(Vector.zero)

    setTimeout(() => {
      this.setState(false, ['renderOptions', 'grid'], 'disableGrid')
    }, 500)

  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default GravityToyStateTree
