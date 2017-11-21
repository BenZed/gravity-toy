import { expect } from 'chai'
import Simulation from '../lib'
import { Body, CACHE } from '../lib/body'
import { Vector } from 'math-plus'
import * as worker from '../lib/integrator/worker'

// eslint-disable-next-line no-unused-vars
/* global describe it before after beforeEach afterEach */

describe.only('Integration', function () {

  this.slow(1000)

  describe('physics behaviours', () => {

    let sim
    beforeEach(() => {
      sim = new Simulation()
    })

    afterEach(() => {
      if (sim && sim.running)
        sim.stop()
    })

    it('real bodies are attracted to each other', async () => {

      const smallInitialPos = new Vector(50, 0)
      const bigInitialPos = new Vector(0, 0)

      const [ small, big ] = sim.createBodies([
        { mass: 100, pos: smallInitialPos.copy() },
        { mass: 1000, pos: bigInitialPos.copy() }
      ])

      await sim.runForNumTicks(10)

      sim.currentTick = 10

      expect(small.pos.x).to.be.below(smallInitialPos.x)
      expect(big.pos.x).to.be.above(bigInitialPos.x)

    })

    // to write this tests, we'll need to add something to the worker.js page
    it('pseudo bodies are not attracted to each other')

    it('real bodies are not attracted to pseudo bodies')

    it('psuedo bodies must be under the props.realMassThreshold')

    it('there must be at least props.realBodiesMin before any pseudo bodies are made')

    it('real bodies inherit the mass of their pseudo bodies')

  })

})
