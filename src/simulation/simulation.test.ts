import Simulation, { Simulation as Simulation2 } from './simulation'
import { Body } from './body'
import { V2 as Vector } from '@benzed/math'

// eslint-disable-next-line no-unused-vars
/* global describe it before after beforeEach afterEach */

function bodies(count = 1): Partial<Body>[] {
  const props: Partial<Body>[] = []
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
    expect(() => new Simulation()).toThrow()
    // @ts-expect-error
    expect(() => Simulation()).toThrow(`cannot be invoked without 'new'`)
  })

  it('has a default and named module export', () =>
    expect(Simulation === Simulation2).toBe(true)
  )

  describe('constructor()', () => {
    describe('properties argument', () => {

      it('must be an object', () => {
        // eslint-disable-next-line new-parens
        for (const bad of ['weee', 1, [], true, Symbol('sym'), new Date(), new function () { }])
          expect(() => new Simulation(bad)).toThrow(TypeError)

        expect(() => new Simulation({})).not.toThrow(TypeError)
      })

      it('props.g must be above zero', () => {
        expect(() => new Simulation({ g: 0 })).toThrow('g must be above zero')
        expect(() => new Simulation({ g: -1 })).toThrow('g must be above zero')
      })

      it('props.realBodiesMin must be above zero', () => {
        expect(() => new Simulation({ realBodiesMin: -1 })).toThrow('realBodiesMin must not be negative')
      })

      it('props.realMassThreshold must be above zero', () => {
        expect(() => new Simulation({ realMassThreshold: -1 })).toThrow('realMassThreshold must not be negative')
      })

      it('props.physicsSteps must be above zero', () => {
        expect(() => new Simulation({ physicsSteps: 0 })).toThrow('physicsSteps must be above zero')
        expect(() => new Simulation({ physicsSteps: -1 })).toThrow('physicsSteps must be above zero')
      })

      it('props.maxCacheMemory must be above zero', () => {
        expect(() => new Simulation({ maxCacheMemory: 0 })).toThrow('maxCacheMemory must be above zero')
        expect(() => new Simulation({ maxCacheMemory: -1 })).toThrow('maxCacheMemory must be above zero')
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
        expect(sim).toHaveProperty('running', true)
      })

      it('throws if there are no bodies to simulate', () => {
        expect(() => sim.run()).toThrow('Cannot start simulation. No bodies exist')
      })

      it('invalidates cache after provided tick', async () => {
        sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)
        sim.run(5)
        sim.stop()
        expect(sim).toHaveProperty('lastTick', 5)
      })

      it('throws if provided tick is out of range', () => {
        sim.createBodies(bodies(1))
        expect(() => sim.run(1)).toThrow(RangeError)
      })

      it('uses body current values if starting from current tick', async () => {
        const sim = new Simulation()
        const [body] = sim.createBodies({
          mass: 100,
          vel: new Vector(0.0125, 0),
          pos: Vector.zero
        })

        body.pos.x = 10

        await sim.runForNumTicks(10)

        sim.currentTick = 1
        // Proves that body.pos.x = 10 was used instead of the originally cached 0
        expect(body.pos.x).toBeGreaterThan(10)

        body.pos.x = 1000
        await sim.runForNumTicks(10, 10)
        sim.currentTick = 20
        // Proves that body.pos.x = 1000 was not used because simulation wasn;t
        // started from currentTick
        expect(body.pos.x).to.be.below(1000)
      })

      it('throws if cache memory is full', async function () {

        this.timeout(10000)
        const sim = new Simulation({
          maxCacheMemory: 0.1
        })
        sim.createBodies(bodies(100))
        sim.run()
        await new Promise(resolve => sim.on('cache-full', resolve))

        expect(() => sim.run(sim.lastTick)).toThrow('Cannot start simulation. Cache memory')

        // Once cache is cleared, start should work again
        expect(() => sim.run(0)).not.toThrow()
        sim.stop()
      })

    })

    describe('runUntil()', () => {
      it.todo('returns a promise that resolves when a condition is met')
      it.todo('throws if condition is not a function')
      it.todo('throws if cache fills before condition is met')
      it.todo('optionally takes a start tick')
      it.todo('throws if start tick is out of range')
    })

    describe('runForNumTicks()', () => {

      it('starts the simulation for a fixed amount of ticks and then stops it', async () => {
        sim.createBodies(bodies(1))

        await sim.runForNumTicks(10)
        expect(sim).toHaveProperty('lastTick', 10)
        expect(sim).toHaveProperty('running', false)
      })

      it('returns a promise', () => {
        sim.createBodies(bodies(1))
        return expect(sim.runForNumTicks(1) instanceof Promise).toBe(true)
      })

      it('rejects if cache fills up before all ticks executed', async function () {
        this.timeout(10000)
        const sim = new Simulation({ maxCacheMemory: 0.1 })
        sim.createBodies(bodies(100))

        let err
        try {
          await sim.runForNumTicks(10000)
        } catch (e) {
          err = e
        }

        expect(err).toBeInstanceof(Error)
        expect(err).toHaveProperty('message')
        return expect(err.message.includes('Could not run for')).toBe(true)
      })

      it('throws if totalTicks is not provided or invalid', () => {
        sim.createBodies(bodies(1))
        expect(() => sim.runForNumTicks()).toThrow('totalTicks must be a number above zero')
      })

      it('optionally takes a startTick argument', async () => {
        sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)
        const final = await sim.runForNumTicks(5, 2)
        expect(final).toEqual(7)
      })

      it('startTick throws if not in range', () => {
        expect(() => sim.runForNumTicks(10, 1)).toThrow(RangeError)
      })

      it('returns stopped tick index', async () => {
        sim.createBodies(bodies(1))
        const final = await sim.runForNumTicks(10)
        expect(final).toEqual(10)
      })

    })

    describe('runForOneTick', () => {
      it('returns a promise that resolves when a single tick has been run')
      it('rejects if cache is full')
      it('optionally takes a start tick')
      it('throws if start tick is out of range')
    })

    describe('stop()', () => {

      it('Stops the simulation', async () => {
        sim.createBodies(bodies(10))
        await sim.runForNumTicks(10)
        expect(sim).toHaveProperty('running', false)
      })

    })

    describe('setCurrentTick()', () => {

      it('sets the current tick', async () => {
        sim.createBodies(bodies(10))
        await sim.runForNumTicks(10)

        expect(sim).toHaveProperty('currentTick', 0)

        sim.setCurrentTick(10)
        expect(sim).toHaveProperty('currentTick', 10)

      })

      it('sets body properties to their values at that tick', async () => {
        const [body] = sim.createBodies({
          mass: 1000,
          pos: new Vector(1, 1),
          vel: new Vector(0, 1)
        })

        const posY = body.pos.y

        await sim.runForNumTicks(10)
        sim.setCurrentTick(5)
        expect(body.pos.y).toBeGreaterThan(posY)
      })

      it('clips given tick to valid range', async () => {
        sim.createBodies(bodies(5))
        await sim.runForNumTicks(4)
        sim.setCurrentTick(5)
        expect(sim.currentTick).toEqual(4)
      })

      it('non existant bodies are given a null mass', async () => {
        sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)

        const [body] = sim.createBodies(bodies(1), 5)

        sim.setCurrentTick(5)
        expect(body.mass).toEqual(100)

        sim.setCurrentTick(2)
        return expect(body.mass).toBeNull()
      })

    })

    describe('createBodies()', () => {

      it('Creates one or multiple bodies at a given tick index', () => {
        const [body] = sim.createBodies(bodies(1))
        return expect(body instanceof Body).toBe(true)
      })

      it('invalidates data after given tick', async () => {
        sim.createBodies(bodies(1), 0)
        await sim.runForNumTicks(10)

        expect(sim).toHaveProperty('lastTick', 10)

        sim.createBodies(bodies(1), 5)
        expect(sim).toHaveProperty('lastTick', 5)
      })

      it('ensures body current values are correct', async () => {
        sim.createBodies(bodies(1), 0)
        await sim.runForNumTicks(10)

        const [body] = sim.createBodies(bodies(1), 5)

        expect(sim.currentTick).toEqual(0)
        return expect(body.exists).toBe(false)
      })

      it('doesnt halt the simulation if it is running', () => {
        sim.createBodies(bodies(1), 0)
        sim.run()
        sim.createBodies(bodies(2), 0)
        expect(sim).toHaveProperty('running', true)
      })
    })

    describe('numLivingBodies()', () => {

      it('returns the number of living bodies at current tick', async () => {
        sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)
        sim.createBodies(bodies(1), 5)

        sim.currentTick = 5
        expect(sim.numLivingBodies()).toEqual(2)

        sim.currentTick = 2
        expect(sim.numLivingBodies()).toEqual(1)
      })
    })

    describe('clearAfterTick()', () => {

      it('invalidates the cache after given tick', async () => {
        const [body] = sim.createBodies(bodies(1))

        await sim.runForNumTicks(10)

        expect(body.cache.data).toHaveProperty('length', 66)
        expect(sim).toHaveProperty('lastTick', 10)

        sim.clearAfterTick(0)

        expect(sim).toHaveProperty('lastTick', 0)
        expect(body.cache.data).toHaveProperty('length', 6)

      })

      it('throws if provided tick is out of range', () => {
        expect(() => sim.clearAfterTick(1)).toThrow(RangeError)
      })

      it('deletes bodies that were created after the provided tick', async () => {
        sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)

        sim.createBodies(bodies(1), 10)
        expect([...sim]).toHaveProperty('length', 2)

        sim.clearAfterTick(5)
        expect([...sim]).toHaveProperty('length', 1)
      })

      it('clears body._cache.deathTick if it is out of range', async () => {
        const [body] = sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)

        // Fake death
        const cache = body['_cache']
        cache.deathTick = 5

        await sim.clearAfterTick(4)

        return expect(cache.deathTick).toBeNull()
      })

      it('updates usedCacheMemory', async () => {
        const sim = new Simulation({ maxCacheMemory: 0.1 })
        sim.createBodies(bodies(100))

        await sim.runForNumTicks(10)
        const used = sim.usedCacheMemory
        expect(used).toBeGreaterThan(0)

        sim.clearAfterTick(5)
        expect(used).toBeGreaterThan(sim.usedCacheMemory)
      })

    })

    describe('clearBeforeTick()', () => {

      it('invalidates the cache before a given tick', async () => {
        const [body] = sim.createBodies(bodies(1))

        await sim.runForNumTicks(10)

        expect(body._cache.data).toHaveProperty('length', 66)
        expect(sim).toHaveProperty('firstTick', 0)

        sim.clearBeforeTick(6)

        expect(sim).toHaveProperty('firstTick', 6)
        expect(body._cache.data).toHaveProperty('length', 30)
      })

      it('body._cache.data is spliced correctly and birthTick is set', async () => {
        const [body] = sim.createBodies(bodies(1))

        await sim.runForNumTicks(10)
        sim.setCurrentTick(10)

        const x = body.pos.x

        sim.setCurrentTick(0)
        sim.clearBeforeTick(5)

        sim.setCurrentTick(10)

        expect(body.pos.x).toEqual(x)
        expect(body._cache.birthTick).toEqual(5)
      })

      it('bodies killed before given tick are deleted', async () => {
        const [body] = sim.createBodies(bodies(1))

        await sim.runForNumTicks(10)

        const cache = body._cache
        cache.deathTick = 5

        sim.clearBeforeTick(5)

        expect([...sim]).toHaveLength(0)
      })

      it('sets current tick if it would be out of range', async () => {
        sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)

        expect(sim).toHaveProperty('currentTick', 0)
        sim.clearBeforeTick(5)
        expect(sim).toHaveProperty('currentTick', 5)
      })

      it('throws if provided tick is out of range', () => {
        expect(() => sim.clearBeforeTick(1)).toThrow(RangeError)
      })

      it('updates usedCacheMemory', async () => {
        const sim = new Simulation({ maxCacheMemory: 0.1 })
        sim.createBodies(bodies(100))

        await sim.runForNumTicks(10)
        const used = sim.usedCacheMemory
        expect(used).toBeGreaterThan(0)

        sim.clearBeforeTick(5)
        expect(used).toBeGreaterThan(sim.usedCacheMemory)
      })
    })

    describe('toArray()', () => {

      it('returns bodies in simulation as an array')

      it('can take an id or array of ids as a filter')

    })

    describe('toJSON', () => {

      let sim, json
      beforeAll(async () => {
        sim = new Simulation()
        sim.createBodies(bodies(10))
        await sim.runForNumTicks(10)
        json = sim.toJSON()
      })

      it('returns simulation state as a serializable object', () => {
        expect(json).toHaveProperty('bodies')
        expect(json).toHaveProperty('g')
        expect(json).toHaveProperty('realBodiesMin')
        expect(json).toHaveProperty('realMassThreshold')
        expect(json).toHaveProperty('physicsSteps')
        expect(json).toHaveProperty('maxCacheMemory')
      })

    })

    describe('static fromJSON', () => {

      it('creates simulation from serialized state')

    })
  })

  describe('Properties', () => {

    it('g', () => {
      const STRONG_GRAVITY = 2
      expect(new Simulation({ g: STRONG_GRAVITY }))
        .toHaveProperty('g', STRONG_GRAVITY)
    })

    it('maxCacheMemory', () => {
      const SMALL_SIM = 64
      expect(new Simulation({ maxCacheMemory: SMALL_SIM }))
        .toHaveProperty('maxCacheMemory', SMALL_SIM)
    })

    it('usedCacheMemory', () => {
      expect(new Simulation())
        .toHaveProperty('usedCacheMemory', 0)
    })

    describe('currentTick', () => {

      it.todo('gets current tick')

      it.todo('sets current tick')

      it.todo('throws if out of range')

    })

    it('firstTick', () => {
      expect(new Simulation())
        .toHaveProperty('firstTick', 0)
    })

    it('lastTick', () => {
      expect(new Simulation())
        .toHaveProperty('lastTick', 0)
    })

    it('numBodies', () => {
      expect(new Simulation())
        .toHaveProperty('numBodies', 0)
    })

    it('running', () => {
      expect(new Simulation())
        .toHaveProperty('running', false)
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

        expect(ticks).toEqual(10)
      })
      it('emits with tick number', async () => {
        const sim = new Simulation()
        sim.createBodies({ mass: 100 })

        let lastTick
        sim.on('tick', lt => { lastTick = lt })
        await sim.runForNumTicks(10)
        await sim.runForNumTicks(5)

        expect(lastTick).toEqual(sim.lastTick)
      })
    })

    describe('cache-full', () => {

      it('emits when cache memory is used up', async function () {
        this.timeout(10000)

        const sim = new Simulation({
          maxCacheMemory: 0.1
        })

        sim.createBodies(bodies(100))

        await new Promise(resolve => {
          sim.once('cache-full', resolve)
          sim.run()
        })

        expect(sim.usedCacheMemory).toEqual(0.1)
      })
    })
  })

  describe('Iterators', () => {

    describe('Symbol.iterator', () => {

      it('yields every body in simulation', () => {

        const sim = new Simulation()
        const [body] = sim.createBodies({
          mass: 100,
          pos: new Vector(10, 10)
        })

        for (const otherBody of sim)
          expect(body).toEqual(otherBody)

      })

    })

    describe('* bodies()', () => {
      it('same as Symbol.iterator', () => {
        const sim = new Simulation()
        const [body] = sim.createBodies({
          mass: 100,
          pos: new Vector(10, 10)
        })

        for (const otherBody of sim.bodies())
          expect(body).toEqual(otherBody)
      })

      it('can optionally take an id')

      it('can optionally take an array of ids')

    })

    describe('* livingBodies()', () => {
      it('yields every body alive at current tick', async () => {
        const sim = new Simulation()

        const [body] = sim.createBodies(bodies(1))
        await sim.runForNumTicks(10)

        sim.createBodies(bodies(1), 5)

        for (const otherBody of sim.livingBodies())
          expect(body).toEqual(otherBody)

        sim.currentTick = 5

        expect([...sim.livingBodies()]).toHaveLength(2)
      })
    })
  })
})
