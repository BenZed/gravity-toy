import { expect } from 'chai'
import Simulation, { Simulation as Simulation2 } from '../lib'
import { Body, CACHE } from '../lib/body'
import { Vector } from 'math-plus'

// eslint-disable-next-line no-unused-vars
/* global describe it before after beforeEach afterEach */

function bodies (count = 1) {
  const props = []
  let x = 0
  let y = 0

  for (let i = 0; i < count; i++)
    props.push({
      mass: 100,
      pos: new Vector(x += 1, y += 1),
      vel: new Vector(0.125, 0)
    })

  return props
}

describe('Simulation', function () {
  this.slow(1000)

  it('is a class', () => {
    expect(() => new Simulation()).to.not.throw()
    expect(() => Simulation()).to.throw(`cannot be invoked without 'new'`)
  })

  it('has a default and named module export', () =>
    expect(Simulation === Simulation2).to.be.true
  )

  describe('constructor()', () => {
    describe('properties argument', () => {

      it('must be an object', () => {
        // eslint-disable-next-line new-parens
        for (const bad of ['weee', 1, [], true, Symbol('sym'), new Date(), new function () {}])
          expect(() => new Simulation(bad)).to.throw(TypeError)

        expect(() => new Simulation({})).to.not.throw(TypeError)
      })

      it('props.g must be above zero', () => {
        expect(() => new Simulation({ g: 0 })).to.throw('g must be above zero')
        expect(() => new Simulation({ g: -1 })).to.throw('g must be above zero')
      })

      it('props.realBodiesMin must be above zero', () => {
        expect(() => new Simulation({ realBodiesMin: -1 })).to.throw('realBodiesMin must not be negative')
      })

      it('props.realMassThreshold must be above zero', () => {
        expect(() => new Simulation({ realMassThreshold: -1 })).to.throw('realMassThreshold must not be negative')
      })

      it('props.physicsSteps must be above zero', () => {
        expect(() => new Simulation({ physicsSteps: 0 })).to.throw('physicsSteps must be above zero')
        expect(() => new Simulation({ physicsSteps: -1 })).to.throw('physicsSteps must be above zero')
      })

      it('props.maxCacheMemory must be above zero', () => {
        expect(() => new Simulation({ maxCacheMemory: 0 })).to.throw('maxCacheMemory must be above zero')
        expect(() => new Simulation({ maxCacheMemory: -1 })).to.throw('maxCacheMemory must be above zero')
      })

    })

  })

  describe('Methods', () => {

    let sim
    beforeEach(() => {
      sim = new Simulation()
    })

    afterEach(() => {
      if (sim.running)
        sim.stop()
    })

    describe('run()', () => {

      it('Starts the simulation', () => {
        sim.createBodies(bodies(1))
        sim.run()
        expect(sim).to.have.property('running', true)
      })

      it('throws if there are no bodies to simulate', () => {
        expect(() => sim.run()).to.throw('Cannot start simulation. No bodies exist')
      })

      it('invalidates cache after provided tick', async () => {
        sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)
        sim.run(5)
        sim.stop()
        expect(sim).to.have.property('lastTick', 5)
      })

      it('throws if provided tick is out of range', () => {
        sim.createBodies(bodies(1))
        expect(() => sim.run(1)).to.throw(RangeError)
      })

      it('uses body current values if starting from current tick', async () => {
        const sim = new Simulation()
        const [ body ] = sim.createBodies({
          mass: 100,
          vel: new Vector(0.0125, 0),
          pos: Vector.zero
        })

        body.pos.x = 10

        await sim.runForNumTicks(10)

        sim.currentTick = 1
        // Proves that body.pos.x = 10 was used instead of the originally cached 0
        expect(body.pos.x).to.be.above(10)

        body.pos.x = 1000
        await sim.runForNumTicks(10, 10)
        sim.currentTick = 20
        // Proves that body.pos.x = 1000 was not used because simulation wasn;t
        // started from currentTick
        expect(body.pos.x).to.be.below(1000)
      })

      it('throws if cache memory is full', async () => {
        const sim = new Simulation({
          maxCacheMemory: 0.1
        })
        sim.createBodies(bodies(100))
        sim.run()
        await new Promise(resolve => {
          sim.on('cache-full', resolve)
        })
        expect(() => sim.run()).to.throw('Cannot start simulation. Cache memory')

        // Once cache is cleared, start should work again
        sim.clearAfterTick(0)
        expect(() => sim.run()).to.not.throw()
        sim.stop()
      })

    })

    describe('stop()', () => {

      it('Stops the simulation', async () => {
        sim.createBodies(bodies(10))
        await sim.runForNumTicks(10)
        expect(sim).to.have.property('running', false)
      })

    })

    describe('setCurrentTick()', () => {

      it('sets the current tick', async () => {
        sim.createBodies(bodies(10))
        await sim.runForNumTicks(10)

        expect(sim).to.have.property('currentTick', 0)

        sim.setCurrentTick(10)
        expect(sim).to.have.property('currentTick', 10)

      })

      it('sets body properties to their values at that tick', async () => {
        const [ body ] = sim.createBodies({
          mass: 1000,
          pos: new Vector(1, 1),
          vel: new Vector(0, 1)
        })

        const posY = body.pos.y

        await sim.runForNumTicks(10)
        sim.setCurrentTick(5)
        expect(body.pos.y).to.be.above(posY)
      })

      it('throws if provided tick is out of range', async () => {
        sim.createBodies(bodies(5))
        await sim.runForNumTicks(4)
        expect(() => sim.setCurrentTick(6)).to.throw(RangeError)
      })

      it('non existant bodies are given a null mass', async () => {

        sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)

        const [ body ] = sim.createBodies(bodies(1), 5)

        sim.setCurrentTick(2)
        return expect(body.mass).to.be.null
      })

    })

    describe('createBodies()', () => {

      it('Creates one or multiple bodies at a given tick index', () => {
        const [ body ] = sim.createBodies(bodies(1))
        return expect(body instanceof Body).to.be.true
      })

      it('invalidates data after given tick', async () => {
        sim.createBodies(bodies(1), 0)
        await sim.runForNumTicks(10)

        expect(sim).to.have.property('lastTick', 10)

        sim.createBodies(bodies(1), 5)
        expect(sim).to.have.property('lastTick', 5)
      })

      it('ensures body current values are correct', async () => {
        sim.createBodies(bodies(1), 0)
        await sim.runForNumTicks(10)

        const [ body ] = sim.createBodies(bodies(1), 5)

        expect(sim.currentTick).to.be.equal(0)
        return expect(body.exists).to.be.false
      })

      it('doesnt halt the simulation if it is running', () => {
        sim.createBodies(bodies(1), 0)
        sim.run()
        sim.createBodies(bodies(2), 0)
        expect(sim).to.have.property('running', true)
      })
    })

    describe('numLivingBodies()', () => {

      it('returns the number of living bodies at a given tick', async () => {
        sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)
        sim.createBodies(bodies(1), 5)

        expect(sim.numLivingBodies(0)).to.be.equal(1)
        expect(sim.numLivingBodies(5)).to.be.equal(2)
      })

      it('throws if provided tick is out of range', () => {
        expect(() => sim.numLivingBodies(5)).to.throw(RangeError)
      })
    })

    describe('clearAfterTick()', () => {

      it('invalidates the cache after given tick', async () => {
        const [ body ] = sim.createBodies(bodies(1))

        await sim.runForNumTicks(10)

        expect(body[CACHE].data).to.have.property('length', 66)
        expect(sim).to.have.property('lastTick', 10)

        sim.clearAfterTick(0)

        expect(sim).to.have.property('lastTick', 0)
        expect(body[CACHE].data).to.have.property('length', 6)

      })

      it('throws if provided tick is out of range', () => {
        expect(() => sim.clearAfterTick(1)).to.throw(RangeError)
      })

      it('deletes bodies that were created after the provided tick', async () => {
        sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)

        sim.createBodies(bodies(1), 10)
        expect([ ...sim ]).to.have.property('length', 2)

        sim.clearAfterTick(5)
        expect([ ...sim ]).to.have.property('length', 1)
      })

      it('clears body[CACHE].deathTick if it is out of range', async () => {
        const [ body ] = sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)

        // Fake death
        const cache = body[CACHE]
        cache.deathTick = 5

        await sim.clearAfterTick(4)

        return expect(cache.deathTick).to.be.null
      })

      it('updates usedCacheMemory', async () => {
        const sim = new Simulation({ maxCacheMemory: 0.1 })
        sim.createBodies(bodies(100))

        await sim.runForNumTicks(10)
        const used = sim.usedCacheMemory
        expect(used).to.be.above(0)

        sim.clearAfterTick(5)
        expect(used).to.be.above(sim.usedCacheMemory)
      })

    })

    describe('clearBeforeTick()', () => {

      it('invalidates the cache before a given tick', async () => {
        const [ body ] = sim.createBodies(bodies(1))

        await sim.runForNumTicks(10)

        expect(body[CACHE].data).to.have.property('length', 66)
        expect(sim).to.have.property('firstTick', 0)

        sim.clearBeforeTick(6)

        expect(sim).to.have.property('firstTick', 6)
        expect(body[CACHE].data).to.have.property('length', 30)
      })

      it('body[CACHE].data is spliced correctly and birthTick is set', async () => {
        const [ body ] = sim.createBodies(bodies(1))

        await sim.runForNumTicks(10)
        sim.setCurrentTick(10)

        const x = body.pos.x

        sim.setCurrentTick(0)
        sim.clearBeforeTick(5)

        sim.setCurrentTick(10)

        expect(body.pos.x).to.equal(x)
        expect(body[CACHE].birthTick).to.be.equal(5)
      })

      it('bodies killed before given tick are deleted', async () => {
        const [ body ] = sim.createBodies(bodies(1))

        await sim.runForNumTicks(10)

        const cache = body[CACHE]
        cache.deathTick = 5

        sim.clearBeforeTick(5)

        expect([...sim]).to.have.length(0)
      })

      it('sets current tick if it would be out of range', async () => {
        sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)

        expect(sim).to.have.property('currentTick', 0)
        sim.clearBeforeTick(5)
        expect(sim).to.have.property('currentTick', 5)
      })

      it('throws if provided tick is out of range', () => {
        expect(() => sim.clearBeforeTick(1)).to.throw(RangeError)
      })

      it('updates usedCacheMemory', async () => {
        const sim = new Simulation({ maxCacheMemory: 0.1 })
        sim.createBodies(bodies(100))

        await sim.runForNumTicks(10)
        const used = sim.usedCacheMemory
        expect(used).to.be.above(0)

        sim.clearBeforeTick(5)
        expect(used).to.be.above(sim.usedCacheMemory)
      })
    })

    describe('runForNumTicks()', () => {

      it('starts the simulation for a fixed amount of ticks and then stops it', async () => {
        sim.createBodies(bodies(1))

        await sim.runForNumTicks(10)
        expect(sim).to.have.property('lastTick', 10)
        expect(sim).to.have.property('running', false)
      })

      it('returns a promise', () => {
        sim.createBodies(bodies(1))
        return expect(sim.runForNumTicks(1) instanceof Promise).to.be.true
      })

      it('rejects if cache fills up before all ticks executed', async () => {
        const sim = new Simulation({ maxCacheMemory: 0.1 })
        sim.createBodies(bodies(100))

        let err
        try {
          await sim.runForNumTicks(1000)
        } catch (e) {
          err = e
        }

        expect(err).to.have.property('message')
        return expect(err.message.includes('Could not run for')).to.be.true
      })

      it('throws if totalTicks is not provided or invalid', () => {
        sim.createBodies(bodies(1))
        expect(() => sim.runForNumTicks()).to.throw('totalTicks must be a number above zero')
      })

      it('optionally takes a startTick argument', async () => {
        sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)
        const final = await sim.runForNumTicks(5, 2)
        expect(final).to.equal(7)
      })

      it('startTick throws if not in range', () => {
        expect(() => sim.runForNumTicks(10, 1)).to.throw(RangeError)
      })

      it('returns stopped tick index', async () => {
        sim.createBodies(bodies(1))
        const final = await sim.runForNumTicks(10)
        expect(final).to.equal(10)
      })

    })
  })

  describe('Properties', () => {

    it('g', () => {
      const STRONG_GRAVITY = 2
      expect(new Simulation({ g: STRONG_GRAVITY }))
        .to.have.property('g', STRONG_GRAVITY)
    })

    it('maxCacheMemory', () => {
      const SMALL_SIM = 64
      expect(new Simulation({ maxCacheMemory: SMALL_SIM }))
        .to.have.property('maxCacheMemory', SMALL_SIM)
    })

    it('usedCacheMemory', () => {
      expect(new Simulation())
        .to.have.property('usedCacheMemory', 0)
    })

    it('currentTick', () => {
      expect(new Simulation())
        .to.have.property('currentTick', 0)
    })

    it('firstTick', () => {
      expect(new Simulation())
        .to.have.property('firstTick', 0)
    })

    it('lastTick', () => {
      expect(new Simulation())
        .to.have.property('lastTick', 0)
    })

    it('numBodies', () => {
      expect(new Simulation())
        .to.have.property('numBodies', 0)
    })

    it('running', () => {
      expect(new Simulation())
        .to.have.property('running', false)
    })

  })

  describe('Events', () => {

    describe('tick', () => {
      it('emits when data received from integrator', async () => {
        const sim = new Simulation()
        sim.createBodies({ mass: 100 })

        let ticks = 0
        sim.on('tick', () => ticks++)
        await sim.runForNumTicks(10)

        expect(ticks).to.be.equal(10)
      })
      it('emits with tick number', async () => {
        const sim = new Simulation()
        sim.createBodies({ mass: 100 })

        let lastTick
        sim.on('tick', lt => { lastTick = lt })
        await sim.runForNumTicks(10)
        await sim.runForNumTicks(5)

        expect(lastTick).to.equal(sim.lastTick)
      })
    })

    describe('cache-full', () => {

      it('emits when cache memory is used up', async () => {

        const sim = new Simulation({
          maxCacheMemory: 0.1
        })

        sim.createBodies(bodies(100))

        await new Promise(resolve => {
          sim.once('cache-full', resolve)
          sim.run()
        })

        expect(sim.usedCacheMemory).to.equal(0.1)
      })

    })

  })

  describe('Iterators', () => {

    describe('Symbol.iterator', () => {

      it('yields every body in simulation', () => {

        const sim = new Simulation()
        const [ body ] = sim.createBodies({
          mass: 100,
          pos: new Vector(10, 10)
        })

        for (const otherBody of sim)
          expect(body).to.equal(otherBody)

      })

    })

    describe('* bodies()', () => {
      it('same as Symbol.iterator', () => {
        const sim = new Simulation()
        const [ body ] = sim.createBodies({
          mass: 100,
          pos: new Vector(10, 10)
        })

        for (const otherBody of sim.bodies())
          expect(body).to.equal(otherBody)
      })

      it('can optionally take an id')

      it('can optionally take an array of ids')

    })

    describe('* livingBodies()', () => {
      it('yields every body alive at tick', async () => {
        const sim = new Simulation()

        const [ body ] = sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)

        sim.createBodies(bodies(1), 5)

        for (const otherBody of sim.livingBodies())
          expect(body).to.be.equal(otherBody)

        sim.currentTick = 5

        expect([...sim.livingBodies()]).to.have.length(2)

      })

      it('throws if tick is out of range', () => {
        expect(() => {
          const sim = new Simulation()

          for (const body of sim.livingBodies(1))
            console.log(body)
        }).to.throw(RangeError)
      })
    })
  })
})
