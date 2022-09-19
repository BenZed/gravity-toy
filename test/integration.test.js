import is from 'is-explicit'
import { expect } from 'chai'

import Simulation from '../lib'
// import { Body, CACHE } from '../lib/body'
import PhysicsBody from '../lib/integrator/body'

import { Vector } from '@benzed/math'
import * as worker from '../lib/integrator/worker'
import { MASS_MIN, DEFAULT_PHYSICS } from '../lib/constants'

import { massFromRadius } from '../lib/util'

// eslint-disable-next-line no-unused-vars
/* global describe it before after beforeEach afterEach */

/******************************************************************************/
// Similar api as simulation, doesnt cache data or use a child process
/******************************************************************************/

class TestSimulation {

  constructor (physics = DEFAULT_PHYSICS) {
    this.g = physics.g

    for (const key in physics)
      worker.physics[key] = physics[key]

    worker.bodies.living.length = 0
    worker.bodies.created.length = 0
    worker.bodies.destroyed.length = 0
    worker.bodies.nextAssignId = 0
    for (const key in worker.bodies.overlaps)
      delete worker.bodies.overlaps[key]
  }

  createBodies(props) {
    if (!is(props, Array)) props = [props]

    const created = props.map(({ mass = MASS_MIN, pos = Vector.zero, vel = Vector.zero }) => {

      const id = worker.bodies.nextAssignId++
      const body = new PhysicsBody(id, mass, pos, vel)

      return body
    })

    worker.bodies.setBodies(created, worker.physics)

    return created
  }

  runUntil(condition, doEveryTick = () => { }) {
    if (worker.bodies.living.length === 0)
      throw new Error('Cannot start without any bodies.')

    worker.bodies.sort(worker.physics)

    return new Promise(resolve => {
      const interval = setInterval(() => {

        worker.tick(false)
        doEveryTick()

        if (condition()) {
          clearInterval(interval)
          resolve()
        }

      }, 1)
    })
  }

  runForNumTicks(totalTicks, doEveryTick) {
    let ticks = 0
    const totalTicksAdjusted = totalTicks * worker.physics.physicsSteps
    const condition = () => ++ticks >= totalTicksAdjusted

    return this.runUntil(condition, doEveryTick)
  }

  runForOneTick(doEveryTick) {
    return this.runUntil(() => true, doEveryTick)
  }

}

/******************************************************************************/
// Tests
/******************************************************************************/

describe('Integration', function () {

  this.slow(1000)

  describe('meta', () => {

    it('TestSimulation gives same results as Simulation', async function () {
      this.slow(2000)

      const smallAndBig = () => {
        return [{
          mass: 500,
          pos: new Vector(0, 50)
        }, {
          mass: 1000,
          pos: new Vector(0, 0)
        }]
      }

      let g = 0.5
      for (const physicsSteps of [1, 2, 4, 8]) {

        const rSim = new Simulation({ g, physicsSteps })
        const tSim = new TestSimulation({ g, physicsSteps })

        const [rSmall, rBig] = rSim.createBodies(smallAndBig())
        const [tSmall, tBig] = tSim.createBodies(smallAndBig())

        expect(rSmall.pos).to.deep.equal(tSmall.pos)
        expect(rBig.pos).to.deep.equal(tBig.pos)

        await rSim.runForNumTicks(5)
        rSim.currentTick = 5

        await tSim.runForNumTicks(5)

        expect(rSmall.pos).to.deep.equal(tSmall.pos)
        expect(rSmall.vel).to.deep.equal(tSmall.vel)
        expect(rBig.pos).to.deep.equal(tBig.pos)
        expect(rBig.vel).to.deep.equal(tBig.vel)

        g += 0.25
      }
    })

    it('instancing TestSimulation resets worker state', () => {
      const sim1 = new TestSimulation()
      sim1.createBodies({ mass: 100 })

      expect(worker.bodies.living).to.have.length(1)

      // eslint-disable-next-line no-new
      new TestSimulation()

      expect(worker.bodies.living).to.have.length(0)
    })

    it('propeties fed to TestSimulation set worker.physics', () => {
      const config = {
        g: 2,
        physicsSteps: 1,
        realBodiesMin: 1000,
        realMassThreshold: 125
      }

      // eslint-disable-next-line no-new
      new TestSimulation(config)

      for (const key in config)
        expect(worker.physics[key]).to.equal(config[key])
    })
  })

  describe('sorting', () => {

    it('psuedo bodies must be under the props.realMassThreshold', () => {
      for (const threshold of [100, 200, 300]) {
        const sim = new TestSimulation({
          realBodiesMin: 0,
          realMassThreshold: threshold
        })

        const bodies = sim.createBodies([{ mass: 100 }, { mass: 200 }, { mass: 300 }])
        worker.bodies.sort(worker.physics)
        const numRealBodiesShouldBe = 4 - threshold / 100 // circumstantial
        expect(bodies.filter(body => body.real)).to.have.length(numRealBodiesShouldBe)
      }
    })

    it('there must be at least props.realBodiesMin before any pseudo bodies are made', () => {
      for (const count of [4, 8, 12]) {
        const sim = new TestSimulation({
          realBodiesMin: count,
          realMassThreshold: 100
        })
        const bodies = sim.createBodies(Array(15).fill({ mass: 99 }))
        worker.bodies.sort(worker.physics)
        expect(bodies.filter(body => body.real)).to.have.length(count)
      }
    })
  })

  describe('attraction', () => {

    it('real bodies are attracted to each other', async () => {
      const sim = new TestSimulation()
      const [small, big] = sim.createBodies([
        { mass: 100, pos: new Vector(0, 0) },
        { mass: 1000, pos: new Vector(50, 0) }
      ])

      await sim.runForNumTicks(10)

      // If real bodies weren't attracted to each other, they wouldn't have moved
      expect(small.pos.x).to.be.above(0)
      expect(big.pos.x).to.be.below(50)
    })

    it('real bodies are not attracted to pseudo bodies', async () => {
      const sim = new TestSimulation({
        physicsSteps: 1,
        realBodiesMin: 1,
        realMassThreshold: 100
      })

      const [psuedo, real] = sim.createBodies([
        { mass: 99, pos: Vector.zero },
        { mass: 100, pos: new Vector(50, 0) }
      ])

      worker.bodies.sort(worker.physics)

      expect(psuedo).to.have.property('real', false)
      expect(real).to.have.property('real', true)

      await sim.runForNumTicks(5)

      // If psuedo bodies weren't attracted to real bodies, it wouldn't have
      // moved at all
      expect(psuedo.pos.x).to.be.above(0)
    })

    it('pseudo bodies are not attracted to each other', async () => {
      const sim = new TestSimulation({
        physicsSteps: 1,
        realBodiesMin: 0,
        realMassThreshold: 100
      })

      const [p1, p2] = sim.createBodies([
        { mass: 99, pos: Vector.zero },
        { mass: 99, pos: new Vector(10, 0) }
      ])

      worker.bodies.sort(worker.physics)

      expect(p1).to.have.property('real', false)
      expect(p2).to.have.property('real', false)

      await sim.runForNumTicks(5)

      // If psuedo bodies were attracted to each other, they would have moved
      expect(p1.pos.x).to.equal(0)
      expect(p2.pos.x).to.equal(10)

    })

    it('pseudo bodies are attracted to real bodies', async () => {
      const sim = new TestSimulation({
        physicsSteps: 1,
        realBodiesMin: 0,
        realMassThreshold: 100
      })

      const [psuedo, real] = sim.createBodies([
        { mass: 99, pos: new Vector(50, 0) },
        { mass: 1000, pos: new Vector(0, 0) }
      ])

      worker.bodies.sort(worker.physics)

      expect(psuedo).to.have.property('real', false)
      expect(real).to.have.property('real', true)

      await sim.runForNumTicks(10)

      // Psuedo body should have moved toward real body
      expect(psuedo.pos.x).to.be.below(50)

      // Real body should not have moved
      expect(real.pos.x).to.be.equal(0)

    })

    it('real bodies inherit the mass of pseudo bodies linked to them', async () => {
      const sim = new TestSimulation({
        realBodiesMin: 0,
        realMassThreshold: 101,
        physicsSteps: 1
      })

      const [p1, p2, p3, r1] = sim.createBodies([
        { mass: 100, pos: new Vector(50, 50) },
        { mass: 100, pos: new Vector(50, 0) },
        { mass: 100, pos: new Vector(0, 50) },
        { mass: 1000, pos: new Vector(0, 0) }
      ])

      worker.bodies.sort(worker.physics)
      expect(p1).to.have.property('real', false)
      expect(p2).to.have.property('real', false)
      expect(p3).to.have.property('real', false)
      expect(r1).to.have.property('real', true)

      await sim.runForNumTicks(1)

      expect(p1.link).to.be.equal(r1)
      expect(p2.link).to.be.equal(r1)
      expect(p3.link).to.be.equal(r1)
      expect(r1.link).to.be.equal(null)

      const totalMass = worker.bodies.living.reduce((m, b) => m + b.mass, 0)
      const realMass = worker.bodies.real.reduce((m, b) => m + b.mass + b.massFromPsuedoBodies, 0)

      expect(realMass).to.be.equal(totalMass)
    })
  })

  describe('collision detection', () => {

    // These could probably be organized better
    describe('broad phase', () => {

      describe('body.bounds.refresh', () => {

        it('describes a bounding box around a body accounting for radius and velocity', () => {

          const sim = new TestSimulation({ physicsSteps: 1 })

          const [body] = sim.createBodies({
            mass: massFromRadius(1),
            pos: new Vector(0, 0),
            vel: new Vector(0, 0)
          })

          body.bounds.refresh()
          expect(body.bounds.l.value).to.equal(-1)
          expect(body.bounds.t.value).to.equal(-1)
          expect(body.bounds.r.value).to.equal(1)
          expect(body.bounds.b.value).to.equal(1)

          body.vel.x = 1
          body.vel.y = 1
          body.bounds.refresh()

          expect(body.bounds.l.value).to.equal(-2)
          expect(body.bounds.t.value).to.equal(-2)
          expect(body.bounds.r.value).to.equal(1)
          expect(body.bounds.b.value).to.equal(1)

          body.pos.x = 10
          body.pos.y = 10
          body.vel.x = -1
          body.vel.y = 1
          body.bounds.refresh()

          expect(body.bounds.l.value).to.equal(9)
          expect(body.bounds.t.value).to.equal(8)
          expect(body.bounds.r.value).to.equal(12)
          expect(body.bounds.b.value).to.equal(11)

          body.vel.x = 1
          body.vel.y = -1
          body.bounds.refresh()

          expect(body.bounds.l.value).to.equal(8)
          expect(body.bounds.t.value).to.equal(9)
          expect(body.bounds.r.value).to.equal(11)
          expect(body.bounds.b.value).to.equal(12)
        })
      })

      describe('bodies.overlaps', () => {

        let sim, b1, b2
        const tests = {}
        before(async () => {

          sim = new TestSimulation({
            physicsSteps: 1
          });

          ([b1, b2] = sim.createBodies([
            { mass: 1000, pos: new Vector(0, 0), vel: new Vector(40, 40) },
            { mass: 1000, pos: new Vector(25, 0), vel: new Vector(40, 40) }
          ]))

          await sim.runForOneTick()

          tests.b1OverlapB2 = b1.bounds.overlap(b2.bounds)
          tests.b1b2PairInOverlapsObj = { ...worker.bodies.overlaps }

          b1.vel.x = b2.vel.x
          b1.vel.y = 10
          b2.vel.y = -10

          await sim.runForNumTicks(5)

          tests.b1OverlapB2Stop = b1.bounds.overlap(b2.bounds)
          tests.b1b2PairNotInOverlapsObj = { ...worker.bodies.overlaps }
        })

        it('bodies with overlapping bounds are placed in an "overlaps" object', () => {
          expect(tests.b1OverlapB2).to.be.equal(true)
          expect(tests.b1b2PairInOverlapsObj).to.have.property(`${b1.id}-${b2.id}`)
        })

        it('overlapping pairs are removed when bounds stop overlapping', () => {
          expect(tests.b1OverlapB2Stop).to.be.equal(false)
          expect(tests.b1b2PairNotInOverlapsObj).to.not.have.property(`${b1.id}-${b2.id}`)

        })

        it('bodies starting in overlapping positions are considered', async () => {

          const sim = new TestSimulation({
            physicsSteps: 1
          })

          // These props were curated from randomly generated bodies in a test
          // bed.
          const [small, big] = sim.createBodies([{
            mass: 135.5901425892382,
            pos: new Vector(740.66514718532036, 345.91316877961964)
          }, {
            mass: 136.06562760166597,
            pos: new Vector(739.64049275300404, 348.45004395745675)
          }])

          await sim.runForNumTicks(10)

          // The props given describe bodies so close together they should
          // have merged, not flung apart.

          expect(big.vel.magnitude).to.be.below(1) // should actually be very close to zero
          expect(small.mass).to.be.equal(0)

        })
      })
    })

    describe('narrow phase', () => {
      describe('bodies register collisions on intersect courses', () => {
        const sizes = ['big', 'medium', 'small']
        const speeds = ['fast', 'slow']

        for (const speed1 of speeds)
          for (const size1 of sizes)
            for (const speed2 of speeds)
              for (const size2 of sizes)
                it(`${speed1} ${size1} vs ${speed2} ${size2}`)
      })

      describe('on body destroyed', () => {

        let big, small
        before(async () => {

          const sim = new TestSimulation();

          [big, small] = sim.createBodies([{
            mass: 1000
          }, {
            mass: 500,
            pos: new Vector(20, 0)
          }])

          await sim.runUntil(() => big.mass === 0 || small.mass === 0)
        })

        it('larger of two bodies is kept, smaller is destroyed', () => {
          expect(small.mass).to.be.equal(0)
        })

        it('larger absorbs mass of smaller', () => {
          expect(big.mass).to.be.equal(1500)
        })

        it('larger position and velocity is effected by impact')

        it('destroyed body edges are removed from boundsX and boundsY lists')

        it('all overlaps are removed when body is destroyed')

      })

    })
  })
})
