
import Simulation from '../simulation'
import PhysicsBody from './body'
import { BodyProps } from '../body'

import is from '@benzed/is'
import { V2 } from '@benzed/math'

import * as worker from './worker'
import { MASS_MIN, DEFAULT_PHYSICS, Physics } from '../constants'

import { massFromRadius } from '../util'

/**
 * Similar api as simulation, doesnt cache data or use a child process
 */

class TestSimulation {

    public g: number

    constructor (input: Partial<Physics>) {

        const physics = { ...DEFAULT_PHYSICS, ...input }

        this.g = physics.g

        for (const key in physics)
            worker.physics[key as keyof Physics] = physics[key as keyof Physics]

        worker.bodies.living.length = 0
        worker.bodies.created.length = 0
        worker.bodies.destroyed.length = 0
        worker.bodies.nextAssignId = 0

        for (const key in worker.bodies.overlaps)
            delete worker.bodies.overlaps[key as `${number}-${number}`]
    }

    public createBodies(props: Partial<BodyProps> | (Partial<BodyProps>)[]) {
        if (!is(props, Array))
            props = [props]


        const created = props.map(({ mass = MASS_MIN, pos = V2.ZERO, vel = V2.ZERO }) => {

            const id = worker.bodies.nextAssignId++
            const body = new PhysicsBody(id, mass, pos, vel)

            return body
        })

        worker.bodies.setBodies(created, worker.physics)

        return created
    }

    public runUntil(condition: () => boolean, doEveryTick: () => void = () => void 0) {
        if (worker.bodies.living.length === 0)
            throw new Error('Cannot start without any bodies.')

        worker.bodies.sort(worker.physics)

        return new Promise<void>(resolve => {
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

    public runForNumTicks(totalTicks: number, doEveryTick?: () => void) {
        let ticks = 0
        const totalTicksAdjusted = totalTicks * worker.physics.physicsSteps
        const condition = () => ++ticks >= totalTicksAdjusted

        return this.runUntil(condition, doEveryTick)
    }

    public runForOneTick(doEveryTick?: () => void) {
        return this.runUntil(() => true, doEveryTick)
    }

}

/*** Tests ***/

describe('Integration', function () {

    describe('meta', () => {

        it('TestSimulation gives same results as Simulation', async function () {

            const smallAndBig = () => {
                return [{
                    mass: 500,
                    pos: new V2(0, 50),
                }, {
                    mass: 1000,
                    pos: new V2(0, 0)
                }]
            }

            let g = 0.5
            for (const physicsSteps of [1, 2, 4, 8]) {

                const rSim = new Simulation({ g, physicsSteps })
                const tSim = new TestSimulation({ g, physicsSteps })

                const [rSmall, rBig] = rSim.createBodies(smallAndBig())
                const [tSmall, tBig] = tSim.createBodies(smallAndBig())

                expect(rSmall.pos).toEqual(tSmall.pos)
                expect(rBig.pos).toEqual(tBig.pos)

                await rSim.runForNumTicks(5)
                rSim.currentTick = 5

                await tSim.runForNumTicks(5)

                expect(rSmall.pos).toEqual(tSmall.pos)
                expect(rSmall.vel).toEqual(tSmall.vel)
                expect(rBig.pos).toEqual(tBig.pos)
                expect(rBig.vel).toEqual(tBig.vel)

                g += 0.25
            }
        }, 2000)

        it('instancing TestSimulation resets worker state', () => {
            const sim1 = new TestSimulation({})
            sim1.createBodies({ mass: 100 })

            expect(worker.bodies.living).toHaveLength(1)

            // eslint-disable-next-line no-new
            new TestSimulation({})

            expect(worker.bodies.living).toHaveLength(0)
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
                expect(worker.physics[key as keyof Physics]).toEqual(config[key as keyof Physics])
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
                expect(bodies.filter(body => body.real)).toHaveLength(numRealBodiesShouldBe)
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
                expect(bodies.filter(body => body.real)).toHaveLength(count)
            }
        })
    })

    describe('attraction', () => {

        it('real bodies are attracted to each other', async () => {
            const sim = new TestSimulation({})
            const [small, big] = sim.createBodies([
                { mass: 100, pos: new V2(0, 0) },
                { mass: 1000, pos: new V2(50, 0) }
            ])

            await sim.runForNumTicks(10)

            // If real bodies weren't attracted to each other, they wouldn't have moved
            expect(small.pos.x).toBeGreaterThan(0)
            expect(big.pos.x).toBeLessThan(50)
        })

        it('real bodies are not attracted to pseudo bodies', async () => {
            const sim = new TestSimulation({
                physicsSteps: 1,
                realBodiesMin: 1,
                realMassThreshold: 100
            })

            const [psuedo, real] = sim.createBodies([
                { mass: 99, pos: V2.ZERO },
                { mass: 100, pos: new V2(50, 0) }
            ])

            worker.bodies.sort(worker.physics)

            expect(psuedo).toHaveProperty('real', false)
            expect(real).toHaveProperty('real', true)

            await sim.runForNumTicks(5)

            // If psuedo bodies weren't attracted to real bodies, it wouldn't have
            // moved at all
            expect(psuedo.pos.x).toBeGreaterThan(0)
        })

        it('pseudo bodies are not attracted to each other', async () => {
            const sim = new TestSimulation({
                physicsSteps: 1,
                realBodiesMin: 0,
                realMassThreshold: 100
            })

            const [p1, p2] = sim.createBodies([
                { mass: 99, pos: V2.ZERO },
                { mass: 99, pos: new V2(20, 0) }
            ])

            worker.bodies.sort(worker.physics)

            expect(p1).toHaveProperty('real', false)
            expect(p2).toHaveProperty('real', false)

            await sim.runForOneTick()

            await sim.runForNumTicks(5)


            // If psuedo bodies were attracted to each other, they would have moved
            expect(p1.pos.x).toEqual(0)
            expect(p2.pos.x).toEqual(20)
        })

        it('pseudo bodies are attracted to real bodies', async () => {
            const sim = new TestSimulation({
                physicsSteps: 1,
                realBodiesMin: 0,
                realMassThreshold: 100
            })

            const [psuedo, real] = sim.createBodies([
                { mass: 99, pos: new V2(50, 0) },
                { mass: 1000, pos: new V2(0, 0) }
            ])

            worker.bodies.sort(worker.physics)

            expect(psuedo).toHaveProperty('real', false)
            expect(real).toHaveProperty('real', true)

            await sim.runForNumTicks(10)

            // Psuedo body should have moved toward real body
            expect(psuedo.pos.x).toBeLessThan(50)

            // Real body should not have moved
            expect(real.pos.x).toEqual(0)

        })

        it('real bodies inherit the mass of pseudo bodies linked to them', async () => {
            const sim = new TestSimulation({
                realBodiesMin: 0,
                realMassThreshold: 101,
                physicsSteps: 1
            })

            const [p1, p2, p3, r1] = sim.createBodies([
                { mass: 100, pos: new V2(50, 50) },
                { mass: 100, pos: new V2(50, 0) },
                { mass: 100, pos: new V2(0, 50) },
                { mass: 1000, pos: new V2(0, 0) }
            ])

            worker.bodies.sort(worker.physics)
            expect(p1).toHaveProperty('real', false)
            expect(p2).toHaveProperty('real', false)
            expect(p3).toHaveProperty('real', false)
            expect(r1).toHaveProperty('real', true)

            await sim.runForNumTicks(1)

            expect(p1.link).toEqual(r1)
            expect(p2.link).toEqual(r1)
            expect(p3.link).toEqual(r1)
            expect(r1.link).toEqual(null)

            const totalMass = worker.bodies.living.reduce((m, b) => m + b.mass, 0)
            const realMass = worker.bodies.real.reduce((m, b) => m + b.mass + b.massFromPsuedoBodies, 0)

            expect(realMass).toEqual(totalMass)
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
                        pos: new V2(0, 0),
                        vel: new V2(0, 0)
                    })

                    body.bounds.refresh()
                    expect(body.bounds.l.value).toEqual(-1)
                    expect(body.bounds.t.value).toEqual(-1)
                    expect(body.bounds.r.value).toEqual(1)
                    expect(body.bounds.b.value).toEqual(1)

                    body.vel.x = 1
                    body.vel.y = 1
                    body.bounds.refresh()

                    expect(body.bounds.l.value).toEqual(-2)
                    expect(body.bounds.t.value).toEqual(-2)
                    expect(body.bounds.r.value).toEqual(1)
                    expect(body.bounds.b.value).toEqual(1)

                    body.pos.x = 10
                    body.pos.y = 10
                    body.vel.x = -1
                    body.vel.y = 1
                    body.bounds.refresh()

                    expect(body.bounds.l.value).toEqual(9)
                    expect(body.bounds.t.value).toEqual(8)
                    expect(body.bounds.r.value).toEqual(12)
                    expect(body.bounds.b.value).toEqual(11)

                    body.vel.x = 1
                    body.vel.y = -1
                    body.bounds.refresh()

                    expect(body.bounds.l.value).toEqual(8)
                    expect(body.bounds.t.value).toEqual(9)
                    expect(body.bounds.r.value).toEqual(11)
                    expect(body.bounds.b.value).toEqual(12)
                })
            })

            describe('bodies.overlaps', () => {

                let sim: TestSimulation
                let b1: PhysicsBody
                let b2: PhysicsBody
                const tests: { [key: string]: unknown } = {}
                beforeAll(async () => {

                    sim = new TestSimulation({
                        physicsSteps: 1
                    });

                    ([b1, b2] = sim.createBodies([
                        { mass: 1000, pos: new V2(0, 0), vel: new V2(40, 40) },
                        { mass: 1000, pos: new V2(25, 0), vel: new V2(40, 40) }
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
                    expect(tests.b1OverlapB2).toEqual(true)
                    expect(tests.b1b2PairInOverlapsObj).toHaveProperty(`${b1.id}-${b2.id}`)
                })

                it('overlapping pairs are removed when bounds stop overlapping', () => {
                    expect(tests.b1OverlapB2Stop).toEqual(false)
                    expect(tests.b1b2PairNotInOverlapsObj).not.toHaveProperty(`${b1.id}-${b2.id}`)

                })

                it('bodies starting in overlapping positions are considered', async () => {

                    const sim = new TestSimulation({
                        physicsSteps: 1
                    })

                    // These props were curated from randomly generated bodies in a test
                    // bed.
                    const [small, big] = sim.createBodies([{
                        mass: 135.5901425892382,
                        pos: new V2(740.6651471853203, 345.9131687796196)
                    }, {
                        mass: 136.06562760166597,
                        pos: new V2(739.6404927530040, 348.4500439574567)
                    }])

                    await sim.runForNumTicks(10)

                    // The props given describe bodies so close together they should
                    // have merged, not flung apart.

                    expect(big.vel.magnitude).toBeLessThan(1) // should actually be very close to zero
                    expect(small.mass).toEqual(0)

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
                                it.todo(`${speed1} ${size1} vs ${speed2} ${size2}`)
            })

            describe('on body destroyed', () => {

                let big: PhysicsBody
                let small: PhysicsBody
                beforeAll(async () => {

                    const sim = new TestSimulation({});

                    [big, small] = sim.createBodies([{
                        mass: 1000
                    }, {
                        mass: 500,
                        pos: new V2(20, 0)
                    }])

                    await sim.runUntil(() => big.mass === 0 || small.mass === 0)
                })

                it('larger of two bodies is kept, smaller is destroyed', () => {
                    expect(small.mass).toEqual(0)
                })

                it('larger absorbs mass of smaller', () => {
                    expect(big.mass).toEqual(1500)
                })

                it.todo('larger position and velocity is effected by impact')

                it.todo('destroyed body edges are removed from boundsX and boundsY lists')

                it.todo('all overlaps are removed when body is destroyed')
            })
        })
    })
})