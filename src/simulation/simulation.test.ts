// import { BodyData } from './simulation'
// import { SimulationTimeline as GravityToy } from './simulation-timeline'
// import { V2 as Vector } from '@benzed/math'

// //// Helper ////

// function createBodyData(count = 1): Partial<BodyData>[] {
//     const data: Partial<BodyData>[] = []
//     let x = 0
//     let y = 0

//     for (let i = 0; i < count; i++)
//         data.push({
//             mass: 100,
//             pos: new Vector(x += 1, y += 1),
//             vel: new Vector(0.125, 0)
//         })

//     return data
// }

// //// Test ////

// describe('Simulation', () => {

//     it('is a class', () => {
//         expect(() => new GravityToy()).not.toThrow()
//         // @ts-expect-error no new keyword
//         expect(() => GravityToy()).toThrow('cannot be invoked without \'new\'')
//     })


//     describe('constructor()', () => {
//         describe('properties argument', () => {

//             it('props.g must be above zero', () => {
//                 expect(() => new GravityToy({ g: 0 })).toThrow('g must be above zero')
//                 expect(() => new GravityToy({ g: -1 })).toThrow('g must be above zero')
//             })

//             it('props.realBodiesMin must be above zero', () => {
//                 expect(() => new GravityToy({ realBodiesMin: -1 })).toThrow('realBodiesMin must not be negative')
//             })

//             it('props.realMassThreshold must be above zero', () => {
//                 expect(() => new GravityToy({ realMassThreshold: -1 })).toThrow('realMassThreshold must not be negative')
//             })

//             it('props.physicsSteps must be above zero', () => {
//                 expect(() => new GravityToy({ physicsSteps: 0 })).toThrow('physicsSteps must be above zero')
//                 expect(() => new GravityToy({ physicsSteps: -1 })).toThrow('physicsSteps must be above zero')
//             })

//             it('props.maxCacheMemory must be above zero', () => {
//                 expect(() => new GravityToy({ maxCacheMemory: 0 })).toThrow('maxCacheMemory must be above zero')
//                 expect(() => new GravityToy({ maxCacheMemory: -1 })).toThrow('maxCacheMemory must be above zero')
//             })

//         })

//     })

//     describe('Methods', () => {

//         let sim: GravityToy
//         beforeEach(() => {
//             sim = new GravityToy()
//         })

//         afterEach(() => {
//             if (sim.isRunning)
//                 sim.stop()
//         })

//         describe('run()', () => {

//             it('Starts the simulation', () => {
//                 sim.addBodies(createBodyData(1))
//                 sim.run()
//                 expect(sim).toHaveProperty('running', true)
//             })

//             it('throws if there are no bodies to simulate', () => {
//                 expect(() => sim.run()).toThrow('Cannot start simulation. No bodies exist')
//             })

//             it('invalidates cache after provided tick', async () => {
//                 sim.addBodies(createBodyData(1))
//                 await sim.runForNumTicks(10)
//                 sim.startAtTick(5)
//                 sim.stop()
//                 expect(sim).toHaveProperty('lastTick', 5)
//             })

//             it('throws if provided tick is out of range', () => {
//                 sim.addBodies(createBodyData(1))
//                 expect(() => sim.startAtTick(1)).toThrow(RangeError)
//             })

//             it('uses body current values if starting from current tick', async () => {
//                 const sim = new GravityToy({})
//                 const body = sim.addBody({
//                     mass: 100,
//                     vel: new Vector(0.0125, 0),
//                     pos: Vector.ZERO
//                 })

//                 body.pos.x = 10

//                 await sim.runForNumTicks(10)

//                 sim.tick = 1
//                 // Proves that body.pos.x = 10 was used instead of the originally cached 0
//                 expect(body.pos.x).toBeGreaterThan(10)

//                 body.pos.x = 1000
//                 sim.setTick(10)
//                 await sim.runForNumTicks(10)
//                 sim.tick = 20
//                 // Proves that body.pos.x = 1000 was not used because simulation wasn;t
//                 // started from currentTick
//                 expect(body.pos.x).toBeLessThan(1000)
//             })

//             it('throws if cache memory is full', async function () {

//                 const sim = new GravityToy({
//                     maxCacheMemory: 0.1
//                 })
//                 sim.addBodies(createBodyData(100))
//                 sim.run()
//                 await new Promise(resolve => sim.on('tick-error', resolve))

//                 expect(() => sim.startAtTick(sim.lastTick)).toThrow('Cannot start simulation. Cache memory')

//                 // Once cache is cleared, start should work again
//                 expect(() => sim.startAtTick(0)).not.toThrow()
//                 sim.stop()
//             }, 10000)

//         })

//         describe('runUntil()', () => {
//             it.todo('returns a promise that resolves when a condition is met')
//             it.todo('throws if condition is not a function')
//             it.todo('throws if cache fills before condition is met')
//             it.todo('optionally takes a start tick')
//             it.todo('throws if start tick is out of range')
//         })

//         describe('runForNumTicks()', () => {

//             it('starts the simulation for a fixed amount of ticks and then stops it', async () => {
//                 sim.addBodies(createBodyData(1))

//                 await sim.runForNumTicks(10)
//                 expect(sim).toHaveProperty('lastTick', 10)
//                 expect(sim).toHaveProperty('running', false)
//             })

//             it('returns a promise', () => {
//                 sim.addBodies(createBodyData(1))
//                 return expect(sim.runForNumTicks(1) instanceof Promise).toBe(true)
//             })

//             it('rejects if cache fills up before all ticks executed', async function () {
//                 const sim = new GravityToy({ maxCacheMemory: 0.1 })
//                 sim.addBodies(createBodyData(100))

//                 let err: Error | null = null
//                 try {
//                     await sim.runForNumTicks(10000)
//                 } catch (e) {
//                     err = e as Error
//                 }

//                 expect(err).toBeInstanceOf(Error)
//                 expect(err).toHaveProperty('message')
//                 return expect(err?.message.includes('Could not run for')).toBe(true)
//             }, 10000)

//             it('throws if totalTicks is below 0', () => {
//                 sim.addBodies(createBodyData(1))
//                 expect(() => sim.runForNumTicks(-1)).toThrow('totalTicks must be a number above zero')
//             })

//             it('optionally takes a startTick argument', async () => {
//                 sim.addBodies(createBodyData(1))
//                 await sim.runForNumTicks(10)
//                 const final = await sim.runForNumTicks(5, 2)
//                 expect(final).toEqual(7)
//             })

//             it('startTick throws if not in range', () => {
//                 expect(() => sim.runForNumTicks(10, 1)).toThrow(RangeError)
//             })

//             it('returns stopped tick index', async () => {
//                 sim.addBodies(createBodyData(1))
//                 const final = await sim.runForNumTicks(10)
//                 expect(final).toEqual(10)
//             })

//         })

//         describe('runForOneTick', () => {
//             it.todo('returns a promise that resolves when a single tick has been run')
//             it.todo('rejects if cache is full')
//             it.todo('optionally takes a start tick')
//             it.todo('throws if start tick is out of range')
//         })

//         describe('stop()', () => {

//             it('Stops the simulation', async () => {
//                 sim.addBodies(createBodyData(10))
//                 await sim.runForNumTicks(10)
//                 expect(sim).toHaveProperty('running', false)
//             })

//         })

//         describe('setCurrentTick()', () => {

//             it('sets the current tick', async () => {
//                 sim.addBodies(createBodyData(10))
//                 await sim.runForNumTicks(10)

//                 expect(sim).toHaveProperty('currentTick', 0)

//                 sim.setTick(10)
//                 expect(sim).toHaveProperty('currentTick', 10)

//             })

//             it('sets body properties to their values at that tick', async () => {
//                 const body = sim.addBody({
//                     mass: 1000,
//                     pos: new Vector(1, 1),
//                     vel: new Vector(0, 1)
//                 })

//                 const posY = body.pos.y

//                 await sim.runForNumTicks(10)
//                 sim.setTick(5)
//                 expect(body.pos.y).toBeGreaterThan(posY)
//             })

//             it('clips given tick to valid range', async () => {
//                 sim.addBodies(createBodyData(5))
//                 await sim.runForNumTicks(4)
//                 sim.setTick(5)
//                 expect(sim.tick).toEqual(4)
//             })

//             it('non existant bodies are given a 0 mass', async () => {
//                 sim.addBodies(createBodyData(1))
//                 await sim.runForNumTicks(10)

//                 const [body] = sim.addBodies(createBodyData(1), 5)

//                 sim.setTick(5)
//                 expect(body.mass).toEqual(100)

//                 sim.setTick(2)
//                 return expect(body.mass).toBe(0)
//             })

//         })

//         describe('addBodies()', () => {

//             it('Creates one or multiple bodies at a given tick index', () => {
//                 const [body] = sim.addBodies(createBodyData(1))
//                 return expect(body instanceof Body).toBe(true)
//             })

//             it('invalidates data after given tick', async () => {
//                 sim.setTick(0)
//                 sim.addBodies(createBodyData(1))
//                 await sim.runForNumTicks(10)

//                 expect(sim).toHaveProperty('lastTick', 10)

//                 sim.setTick(5)
//                 sim.addBodies(createBodyData(1))
//                 expect(sim).toHaveProperty('lastTick', 5)
//             })

//             it('ensures body current values are correct', async () => {
//                 sim.setTick(0)
//                 sim.addBodies(createBodyData(1))
//                 await sim.runForNumTicks(10)

//                 sim.setTick(5)
//                 const [body] = sim.addBodies(createBodyData(1))

//                 expect(sim.tick).toEqual(0)
//                 return expect(body.mass <= 0).toBe(false)
//             })

//             it('doesnt halt the simulation if it is running', () => {
//                 sim.setTick(0)
//                 sim.addBodies(createBodyData(1))
//                 sim.run()
//                 sim.setTick(0)
//                 sim.addBodies(createBodyData(2))
//                 expect(sim).toHaveProperty('isRunning', true)
//             })
//         })

//         describe('clearAfterTick()', () => {

//             it('invalidates the cache after given tick', async () => {
//                 const [body] = sim.addBodies(createBodyData(1))

//                 await sim.runForNumTicks(10)

//                 expect(body['_cache'].data).toHaveProperty('length', 66)
//                 expect(sim).toHaveProperty('lastTick', 10)

//                 sim.clearAfterTick(0)

//                 expect(sim).toHaveProperty('lastTick', 0)
//                 expect(body['_cache'].data).toHaveProperty('length', 6)

//             })

//             it('throws if provided tick is out of range', () => {
//                 expect(() => sim.clearAfterTick(1)).toThrow(RangeError)
//             })

//             it('deletes bodies that were created after the provided tick', async () => {
//                 sim.addBodies(createBodyData(1))
//                 await sim.runForNumTicks(10)

//                 sim.addBodies(createBodyData(1), 10)
//                 expect([...sim]).toHaveProperty('length', 2)

//                 sim.clearAfterTick(5)
//                 expect([...sim]).toHaveProperty('length', 1)
//             })

//             it('clears body._cache.deathTick if it is out of range', async () => {
//                 const [body] = sim.addBodies(createBodyData(1))
//                 await sim.runForNumTicks(10)

//                 // Fake death
//                 const cache = body['_cache']
//                 cache.deathTick = 5

//                 await sim.clearAfterTick(4)

//                 return expect(cache.deathTick).toBe(-1)
//             })

//             it('updates usedCacheMemory', async () => {
//                 const sim = new GravityToy({ maxCacheMemory: 0.1 })
//                 sim.addBodies(createBodyData(100))

//                 await sim.runForNumTicks(10)
//                 const used = sim.usedCacheMemory
//                 expect(used).toBeGreaterThan(0)

//                 sim.clearAfterTick(5)
//                 expect(used).toBeGreaterThan(sim.usedCacheMemory)
//             })

//         })

//         describe('clearBeforeTick()', () => {

//             it('invalidates the cache before a given tick', async () => {
//                 const [body] = sim.addBodies(createBodyData(1))

//                 await sim.runForNumTicks(10)

//                 expect(body['_cache'].data).toHaveProperty('length', 66)
//                 expect(sim).toHaveProperty('firstTick', 0)

//                 sim.clearBeforeTick(6)

//                 expect(sim).toHaveProperty('firstTick', 6)
//                 expect(body['_cache'].data).toHaveProperty('length', 30)
//             })

//             it('body._cache.data is spliced correctly and birthTick is set', async () => {
//                 const [body] = sim.addBodies(createBodyData(1))

//                 await sim.runForNumTicks(10)
//                 sim.setTick(10)

//                 const x = body.pos.x

//                 sim.setTick(0)
//                 sim.clearBeforeTick(5)

//                 sim.setTick(10)

//                 expect(body.pos.x).toEqual(x)
//                 expect(body['_cache'].birthTick).toEqual(5)
//             })

//             it('bodies killed before given tick are deleted', async () => {
//                 const [body] = sim.addBodies(createBodyData(1))

//                 await sim.runForNumTicks(10)

//                 const cache = body['_cache']
//                 cache.deathTick = 5

//                 sim.clearBeforeTick(5)

//                 expect([...sim]).toHaveLength(0)
//             })

//             it('sets current tick if it would be out of range', async () => {
//                 sim.addBodies(createBodyData(1))
//                 await sim.runForNumTicks(10)

//                 expect(sim).toHaveProperty('currentTick', 0)
//                 sim.clearBeforeTick(5)
//                 expect(sim).toHaveProperty('currentTick', 5)
//             })

//             it('throws if provided tick is out of range', () => {
//                 expect(() => sim.clearBeforeTick(1)).toThrow(RangeError)
//             })

//             it('updates usedCacheMemory', async () => {
//                 const sim = new GravityToy({ maxCacheMemory: 0.1 })
//                 sim.addBodies(createBodyData(100))

//                 await sim.runForNumTicks(10)
//                 const used = sim.usedCacheMemory
//                 expect(used).toBeGreaterThan(0)

//                 sim.clearBeforeTick(5)
//                 expect(used).toBeGreaterThan(sim.usedCacheMemory)
//             })
//         })

//         describe('toArray()', () => {

//             it.todo('returns bodies in simulation as an array')

//             it.todo('can take an id or array of ids as a filter')

//         })

//         describe('toJSON', () => {

//             let sim: GravityToy
//             let json: SimulationSettings
//             beforeAll(async () => {
//                 sim = new GravityToy()
//                 sim.addBodies(createBodyData(10))
//                 await sim.runForNumTicks(10)
//                 json = sim.toJSON()
//             })

//             it('returns simulation state as a serializable object', () => {
//                 expect(json).toHaveProperty('bodies')
//                 expect(json).toHaveProperty('g')
//                 expect(json).toHaveProperty('realBodiesMin')
//                 expect(json).toHaveProperty('realMassThreshold')
//                 expect(json).toHaveProperty('physicsSteps')
//                 expect(json).toHaveProperty('maxCacheMemory')
//             })

//         })

//         describe('static fromJSON', () => {

//             it.todo('creates simulation from serialized state')

//         })
//     })

//     describe('Properties', () => {

//         it('g', () => {
//             const STRONG_GRAVITY = 2
//             expect(new GravityToy({ g: STRONG_GRAVITY }))
//                 .toHaveProperty('g', STRONG_GRAVITY)
//         })

//         it('maxCacheMemory', () => {
//             const SMALL_SIM = 64
//             expect(new GravityToy({ maxCacheMemory: SMALL_SIM }))
//                 .toHaveProperty('maxCacheMemory', SMALL_SIM)
//         })

//         it('usedCacheMemory', () => {
//             expect(new GravityToy())
//                 .toHaveProperty('usedCacheMemory', 0)
//         })

//         describe('currentTick', () => {

//             it.todo('gets current tick')

//             it.todo('sets current tick')

//             it.todo('throws if out of range')

//         })

//         it('firstTick', () => {
//             expect(new GravityToy())
//                 .toHaveProperty('firstTick', 0)
//         })

//         it('lastTick', () => {
//             expect(new GravityToy())
//                 .toHaveProperty('lastTick', 0)
//         })

//         it('numBodies', () => {
//             expect(new GravityToy())
//                 .toHaveProperty('numBodies', 0)
//         })

//         it('running', () => {
//             expect(new GravityToy())
//                 .toHaveProperty('running', false)
//         })

//     })

//     describe('Events', () => {

//         describe('tick', () => {
//             it('emits when data received from integrator', async () => {
//                 const sim = new GravityToy()
//                 sim.addBody({ mass: 100 })

//                 let ticks = 0
//                 sim.on('tick', () => { ticks++ })
//                 await sim.runForNumTicks(10)

//                 expect(ticks).toEqual(10)
//             })
//             it('emits with body json', async () => {
//                 const sim = new GravityToy()
//                 sim.addBody({ mass: 100 })

//                 let lastTick
//                 sim.on('tick', lt => { lastTick = lt })
//                 await sim.runForNumTicks(10)
//                 await sim.runForNumTicks(5)

//                 expect(lastTick).toEqual(sim.lastTick)
//             })
//         })

//         describe('cache full', () => {

//             it('tick-error emits when cache is full', async function () {

//                 const sim = new GravityToy({
//                     maxCacheMemory: 0.1
//                 })

//                 sim.addBodies(createBodyData(100))

//                 await new Promise(resolve => {
//                     sim.once('tick-error', resolve)
//                     sim.run()
//                 })

//                 expect(sim.usedCacheMemory).toEqual(0.1)
//             }, 10000)
//         })
//     })

//     describe('Iterators', () => {

//         describe('Symbol.iterator', () => {

//             it('yields every body in simulation', () => {

//                 const sim = new GravityToy()
//                 const body = sim.addBody({
//                     mass: 100,
//                     pos: new Vector(10, 10)
//                 })

//                 for (const otherBody of sim)
//                     expect(body).toEqual(otherBody)

//             })

//         })

//         describe('* bodies()', () => {
//             it('same as Symbol.iterator', () => {
//                 const sim = new GravityToy()
//                 const body = sim.addBody({
//                     mass: 100,
//                     pos: new Vector(10, 10)
//                 })

//                 for (const otherBody of sim)
//                     expect(body).toEqual(otherBody)
//             })

//             it.todo('can optionally take an id')

//             it.todo('can optionally take an array of ids')

//         })

//     })
// })
