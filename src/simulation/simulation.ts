
import { isFinite, isNaN } from '@benzed/is'
import { max, V2, V2Json } from '@benzed/math'
import { EventEmitter } from '@benzed/util'

import { DEFAULT_PHYSICS, PhysicsSettings } from './constants'

/*** Types ***/

interface BodyJson {

    readonly id: number

    readonly pos: V2Json
    readonly vel: V2Json
    mass: number

}

interface SimulationJson extends PhysicsSettings {
    readonly bodies: readonly BodyJson[]
}

interface SimulationSettings extends SimulationJson {
    readonly maxListeners: number
}

interface SimulationEvents {

    [key: string]: any[]
    /**
     * Emitted for each iteration on the simulation.
     */
    'tick': [SimulationJson['bodies']],

    /**
     * Emitted when there is an error during the simulation.
     * The simulation will also be stopped.
     */
    'tick-error': [Error]
}

type BodyData = Partial<Omit<BodyJson, 'id'>>

/*** Main ***/

/**
 * Simulation base class. Responsible for body CRUD, iteration, serialization.
 */
abstract class Simulation<B extends BodyJson> extends EventEmitter<SimulationEvents> implements SimulationJson {

    // State

    protected readonly _bodies: Map<number, B> = new Map()

    public get bodies(): readonly B[] {
        return [...this]
    }

    public readonly g: SimulationJson['g']
    public readonly physicsSteps: SimulationJson['physicsSteps']
    public readonly realMassThreshold: SimulationJson['realMassThreshold']
    public readonly realBodiesMin: SimulationJson['realBodiesMin']

    private _bodyId = 0

    // Constructor

    public constructor (settings?: Partial<SimulationSettings>) {

        const { bodies, g, physicsSteps, realMassThreshold, realBodiesMin, maxListeners } =
            { ...DEFAULT_PHYSICS, ...settings }

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
    public abstract get isRunning(): boolean

    /**
     * Starts the simulation. While the simulation is running,
     * it will emit 'tick' events for each phsyics update. 
     * Simulation will run until it encounters and error or
     * is manually stopped.
     */
    public abstract run(): void

    /**
     * Starts the simulations, runs it for the specified number
     * of ticks or until it encounters an error.
     */
    public async runForNumTicks(ticks: number): Promise<void> {
        let target = 0
        return this.runUntil(() => target++ >= ticks)
    }

    /**
     * Runs the simulation for one tick.
     */
    public runForOneTick() {
        return this.runForNumTicks(1)
    }

    /**
     * Runs the simulation until a specified condition
     */
    public runUntil(condition: (bodies: SimulationJson['bodies']) => boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            const checkCondition = (input: Error | SimulationJson['bodies']) => {

                let isError = 'message' in input && 'name' in input
                if (!this.isRunning && !isError) {
                    input = new Error('Simulation has been stopped.')
                    isError = true
                }

                if (!isError && !condition(input as SimulationJson['bodies']))
                    return

                this._removeListener('tick', checkCondition)
                this._removeListener('tick-error', checkCondition)

                if (isError)
                    reject(input)
                else
                    resolve()

                this.stop()

            }

            this._addListener('tick', checkCondition, { internal: true })
            this._addListener('tick-error', checkCondition, { internal: true })

            this.run()
        })
    }

    public abstract stop(): void

    // Body CRUD interface

    public addBodies(data: BodyData[]): B[] {
        return data.map(datum => this.addBody(datum))
    }

    public addBody(data: BodyData): B {

        const id = this._bodyId++

        return this._upsertBody({ id, ...data }, true)
    }

    public updateBody(id: number, data: BodyData): B {

        if (!this.hasBody(id))
            throw new Error(`No body with id ${id}`)

        return this._upsertBody({ id, ...data }, true)
    }

    public removeBody(id: number): B {

        const body = this.getBody(id)
        if (!body)
            throw new Error(`No body with id ${id}`)

        this._deleteBody(id, true)

        return body
    }

    public getBody(id: number): B | null {
        return this._bodies.get(id) ?? null
    }

    public hasBody(id: number): boolean {
        return this._bodies.has(id)
    }

    // Iteration

    public *[Symbol.iterator]() {
        for (const body of this._bodies.values())
            yield body
    }

    public * ids() {
        yield* this._bodies.keys()
    }

    // Helper

    /**
     * Should be called on every update when the simulation is running. 
     * Receives the previous state of the simulation, and it should call
     * the 'emit' event with the next state of the simulation.
     */
    protected abstract _update(bodies: SimulationJson['bodies']): void

    /**
     * Return a body given it's state, in json. 
     */
    protected abstract _createBody(json: BodyJson): B

    /**
     * Apply a given simulation state to the current simulation.
     */
    protected _applyBodyJson(bodies: SimulationJson['bodies']): void {

        //
        const survivorIds = bodies.map(body => this._upsertBody(body, false).id)

        // Keep id in sync with the new state
        this._bodyId = survivorIds.reduce((a, b) => max(a, b), 0)

        // remove destroyed bodies
        for (const id of [...this.ids()]) {
            if (!survivorIds.includes(id))
                this._deleteBody(id, false)
        }

        this._restart()
    }

    protected _assertBodyJsonValid(jsons: SimulationJson['bodies']): void {

        const usedIds: number[] = []

        for (const { id } of jsons) {

            if (isNaN(id) || !isFinite(id) || id < 0)
                throw new Error(`State corrupt: "${id}" is not a valid id.`)

            else if (usedIds.includes(id))
                throw new Error(`State corrupt: "${id}" is used multiple times as an id.`)

            usedIds.push(id)

            // TODO Assert Valid Masses
            // TODO Assert Valid Vectors
        }
    }

    protected _upsertBody(data: BodyData & { id: number }, restart: boolean): B {

        let body = this._bodies.get(data.id)

        if (!body) {

            const {
                id,
                pos = V2.ZERO,
                vel = V2.ZERO,
                mass = 1
            } = data

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

            if (data.mass !== undefined)
                body.mass = data.mass
        }

        if (restart)
            this._restart()

        return body
    }

    protected _deleteBody(id: number, restart: boolean): void {
        this._bodies.delete(id)

        if (restart)
            this._restart()
    }

    private _restart() {
        if (this.isRunning) {
            this.stop()
            this.run()
        }
    }

    // toJSON

    public toJSON(): SimulationJson {

        const { g, physicsSteps, realMassThreshold, realBodiesMin, bodies } = this

        return {
            g,
            physicsSteps,
            realMassThreshold,
            realBodiesMin,

            bodies
        }
    }
}

/*** Exports ***/

export {
    Simulation,
    SimulationJson,
    SimulationSettings,
    BodyJson,
    BodyData
}