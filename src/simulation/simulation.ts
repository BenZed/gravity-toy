
import { isFinite, isNaN } from '@benzed/is'
import { V2, V2Json } from '@benzed/math'

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

type BodyData = Partial<Omit<BodyJson, 'id'>>

/*** Main ***/

/**
 * Simulation base class. Responsible for body CRUD, iteration, serialization.
 */
abstract class Simulation<B extends BodyJson> implements SimulationJson {

    // State

    protected readonly _bodies: Map<number, B> = new Map()

    public get bodies(): readonly B[] {
        return [...this]
    }

    public readonly g: SimulationJson['g']
    public readonly physicsSteps: SimulationJson['physicsSteps']
    public readonly realMassThreshold: SimulationJson['realMassThreshold']
    public readonly realBodiesMin: SimulationJson['realBodiesMin']

    // Constructor

    public constructor (settings?: Partial<SimulationJson>) {

        const { bodies, g, physicsSteps, realMassThreshold, realBodiesMin } = { ...DEFAULT_PHYSICS, ...settings }

        this.g = g
        this.physicsSteps = physicsSteps
        this.realMassThreshold = realMassThreshold
        this.realBodiesMin = realBodiesMin

        if (bodies) {
            this._assertBodyJsonValid(bodies)
            this._applyBodyJson(bodies)
        }
    }

    // Interface

    public abstract get isRunning(): boolean

    public abstract start(): void

    public abstract stop(): void

    public addBody(data: BodyData): B {

        let id = 0
        while (this.hasBody(id))
            id++

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

        this._deleteBody(id)
        this._restart()

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

    protected abstract _createBody(json: BodyJson): B

    protected _applyBodyJson(jsons: SimulationJson['bodies']): void {

        const survivorIds = jsons.map(json => this._upsertBody(json, false).id)

        // remove destroyed bodies

        for (const id of [...this.ids()]) {
            if (!survivorIds.includes(id))
                this._deleteBody(id)
        }
    }

    protected _assertBodyJsonValid(jsons: SimulationJson['bodies']): void {

        const usedIds: number[] = []

        for (const { id } of jsons) {

            if (isNaN(id) || !isFinite(id) || id < 0)
                throw new Error(`State corrupt: "${id}" is not a valid id.`)

            else if (usedIds.includes(id))
                throw new Error(`State corrupt: "${id}" is used multiple times as an id.`)

            usedIds.push(id)
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

            this._bodies.set(id, body)

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

    protected _deleteBody(id: number): void {
        this._bodies.delete(id)
    }

    private _restart() {
        if (this.isRunning) {
            this.start()
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
    BodyJson,
    BodyData
}