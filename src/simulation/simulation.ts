import { isFinite, isNaN } from '@benzed/is'
import { max, V2 } from '@benzed/math'
import { EventEmitter } from '@benzed/util'

import { DEFAULT_PHYSICS } from './constants'
import { BodyData, BodyDataWithId } from './body'

//// Types ////

interface PhysicsSettings {
    /**
     * Gravitational Constant. Higher values, faster bodies.
     */
    readonly g: number

    /**
     * Higher steps mean more calculation time, but more precision.
     */
    readonly physicsSteps: number

    /**
     * As a lossy optimization, bodies below a certain mass threshold can be considered
     * pseudo bodies and excluded from the primary integration loop. This speeds
     * up the simulation at a cost of accuracy.
     */
    readonly realMassThreshold: number

    /**
     * There must be at least this many real bodies before bodies under the aforementioned
     * mass threshold are considered pseudo. Infinity means disabled.
     **/
    readonly realBodiesMin: number
}

interface SimulationData extends PhysicsSettings {
    readonly bodies: readonly BodyDataWithId[]
}

interface SimulationSettings extends SimulationData {
    readonly maxListeners: number
}

type SimulationEvents = {
    /**
     * Emitted for each iteration on the simulation.
     */
    tick: [SimulationData['bodies']]

    /**
     * Emitted when there is an error during the simulation.
     * The simulation will also be stopped.
     */
    'tick-error': [Error]
}

//// Main ////

/**
 * Simulation base class. Responsible for body CRUD, iteration, serialization.
 */
abstract class Simulation<B extends BodyDataWithId>
    extends EventEmitter<SimulationEvents>
    implements SimulationData
{
    // State

    protected readonly _bodies: Map<number, B> = new Map()

    get bodies(): readonly B[] {
        return [...this]
    }

    readonly g: SimulationData['g']
    readonly physicsSteps: SimulationData['physicsSteps']
    readonly realMassThreshold: SimulationData['realMassThreshold']
    readonly realBodiesMin: SimulationData['realBodiesMin']

    private _bodyId = 0

    // Constructor

    constructor(settings?: Partial<SimulationSettings>) {
        const {
            bodies,
            g,
            physicsSteps,
            realMassThreshold,
            realBodiesMin,
            maxListeners
        } = { ...DEFAULT_PHYSICS, ...settings }

        super(maxListeners)

        this.g = g
        this.physicsSteps = physicsSteps
        this.realMassThreshold = realMassThreshold
        this.realBodiesMin = realBodiesMin

        if (bodies) {
            this._assertBodyJsonValid(bodies)
            this._applyBodyJson(bodies)
        }
    }

    // Run Interface

    /**
     * Returns true if the simulation is running.
     */
    abstract get isRunning(): boolean

    /**
     * Starts the simulation. While the simulation is running,
     * it will emit 'tick' events for each physics update.
     * Simulation will run until it encounters and error or
     * is manually stopped.
     */
    abstract run(): void

    /**
     * Starts the simulations, runs it for the specified number
     * of ticks or until it encounters an error.
     */
    async runForNumTicks(ticks: number): Promise<void> {
        let target = 0
        return this.runUntil(() => target++ >= ticks)
    }

    /**
     * Runs the simulation for one tick.
     */
    runForOneTick() {
        return this.runForNumTicks(1)
    }

    /**
     * Runs the simulation until a specified condition
     */
    runUntil(
        condition: (bodies: SimulationData['bodies']) => boolean
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const checkCondition = (
                input: Error | SimulationData['bodies']
            ) => {
                let isError = 'message' in input && 'name' in input
                if (!this.isRunning && !isError) {
                    input = new Error('Simulation has been stopped.')
                    isError = true
                }

                if (!isError && !condition(input as SimulationData['bodies']))
                    return

                this._removeListener('tick', checkCondition)
                this._removeListener('tick-error', checkCondition)

                if (isError) reject(input)
                else resolve()

                this.stop()
            }

            this._addListener('tick', checkCondition, { internal: true })
            this._addListener('tick-error', checkCondition, { internal: true })

            this.run()
        })
    }

    abstract stop(): void

    // Body CRUD interface

    addBodies(data: BodyData[]): B[] {
        return data.map(datum => this.addBody(datum))
    }

    addBody(data: BodyData): B {
        const id = this._bodyId++

        return this._upsertBody({ id, ...data }, true)
    }

    updateBody(id: number, data: BodyData): B {
        if (!this.hasBody(id)) throw new Error(`No body with id ${id}`)

        return this._upsertBody({ id, ...data }, true)
    }

    removeBody(id: number): B {
        const body = this.getBody(id)
        if (!body) throw new Error(`No body with id ${id}`)

        this._deleteBody(id, true)

        return body
    }

    getBody(id: number): B | null {
        return this._bodies.get(id) ?? null
    }

    hasBody(id: number): boolean {
        return this._bodies.has(id)
    }

    // Iteration

    *[Symbol.iterator]() {
        for (const body of this._bodies.values()) yield body
    }

    *ids() {
        yield* this._bodies.keys()
    }

    // Helper

    /**
     * Should be called on every update when the simulation is running.
     * Receives the previous state of the simulation, and it should call
     * the 'emit' event with the next state of the simulation.
     */
    protected abstract _update(bodies: SimulationData['bodies']): void

    /**
     * Return a body given it's state, in json.
     */
    protected abstract _createBody(json: BodyDataWithId): B

    /**
     * Apply a given simulation state to the current simulation.
     */
    protected _applyBodyJson(bodies: SimulationData['bodies']): void {
        //
        const survivorIds = bodies.map(body => this._upsertBody(body, false).id)

        // Keep id in sync with the new state
        this._bodyId = survivorIds.reduce((a, b) => max(a, b), 0)

        // remove destroyed bodies
        for (const id of [...this.ids()]) {
            if (!survivorIds.includes(id)) this._deleteBody(id, false)
        }

        this._restart()
    }

    protected _assertBodyJsonValid(bodies: SimulationData['bodies']): void {
        const usedIds: number[] = []

        for (const { id } of bodies) {
            if (isNaN(id) || !isFinite(id) || id < 0)
                throw new Error(`State corrupt: "${id}" is not a valid id.`)
            else if (usedIds.includes(id))
                throw new Error(
                    `State corrupt: "${id}" is used multiple times as an id.`
                )

            usedIds.push(id)

            // TODO Assert Valid Masses
            // TODO Assert Valid Vectors
        }
    }

    protected _upsertBody(
        data: BodyData & { id: number },
        restart: boolean
    ): B {
        let body = this._bodies.get(data.id)

        if (!body) {
            const { id, pos = V2.ZERO, vel = V2.ZERO, mass = 1 } = data

            body = this._createBody({ id, pos, vel, mass })

            this._bodies.set(body.id, body)
        } else {
            if (data.pos !== undefined) {
                body.pos.x = data.pos.x
                body.pos.y = data.pos.y
            }

            if (data.vel !== undefined) {
                body.vel.x = data.vel.x
                body.vel.y = data.vel.y
            }

            if (data.mass !== undefined) body.mass = data.mass
        }

        if (restart) this._restart()

        return body
    }

    protected _deleteBody(id: number, restart: boolean): void {
        this._bodies.delete(id)

        if (restart) this._restart()
    }

    private _restart() {
        if (this.isRunning) {
            this.stop()
            this.run()
        }
    }

    // toJSON

    toJSON(): SimulationData {
        const { g, physicsSteps, realMassThreshold, realBodiesMin, bodies } =
            this

        return {
            g,
            physicsSteps,
            realMassThreshold,
            realBodiesMin,

            bodies
        }
    }
}

//// Exports ////

export {
    Simulation,
    SimulationData,
    SimulationSettings,
    PhysicsSettings,
    BodyData
}