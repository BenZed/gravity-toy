import { StateTree, state, action } from '@benzed/state-tree'
import { Simulation, Renderer } from '../simulation'
import { randomVector } from '../simulation/util'

import { Vector, random } from '@benzed/math'

/******************************************************************************/
// Data
/******************************************************************************/

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

const CONTEXT_INTERVAL = 150 // ms

const $$mrs = Symbol('mutable-runtime-state')

/******************************************************************************/
// Helper
/******************************************************************************/

class DefaultSimulation extends Simulation {

  constructor () {

    super({
      minRealBodies: 256,
      realMassThreshold: 10,
      g: 32
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
// Main
/******************************************************************************/

class GravityToyStateTree extends StateTree {

  @state
  time = {
    total: 0,
    delta: 0
  }

  @state
  speed = 1

  simulation = null
  renderer = null

  renderIntervalId = null
  uiIntervalId = null;

  [$$mrs] = {
    time: {
      total: 0,
      delta: 0
    }
  }

  start () {
    this.simulation.run()

    this.renderIntervalId = requestAnimationFrame(this.updateRender)
    this.uiIntervalId = setInterval(this.updateUi, CONTEXT_INTERVAL)
  }

  end () {
    this.simulation.stop()
    cancelAnimationFrame(this.renderIntervalId)
    clearInterval(this.uiIntervalId)
  }

  // update the state tree by copying the mutable runtime state
  @action
  updateUi = () => ({ ...this.state, ...this[$$mrs] })

  // Update the render visible on the canvas
  updateRender = timeTotal => {

    const { renderer, simulation, [$$mrs]: mrs } = this

    mrs.time.delta = timeTotal - mrs.time.total
    mrs.time.total = timeTotal

    simulation.setCurrentTick(simulation.currentTick + this.speed)

    // TODO add hooks for components to be able to add things to render

    renderer.options.speed = this.speed
    renderer.render(simulation)

    requestAnimationFrame(this.updateRender)
  }

  constructor (...args) {
    super(...args)

    this.simulation = new DefaultSimulation()
    this.renderer = new Renderer()

    const largest = [ ...this.simulation.bodies() ].reduce((big, body) => big.mass > body.mass
      ? big
      : body, { mass: -Infinity })

    this.renderer.camera.referenceFrame = largest
    this.renderer.camera.target.pos.set(Vector.zero)

  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default GravityToyStateTree
