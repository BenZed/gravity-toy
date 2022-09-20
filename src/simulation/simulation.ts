import is from '@benzed/is'
import { min, clamp, V2 as Vector } from '@benzed/math'

import { EventEmitter } from '@benzed/util'

import {
    CACHED_VALUES_PER_TICK,
    DEFAULT_PHYSICS,
    DEFAULT_MAX_MB,
    NUMBER_SIZE,
    ONE_MB,
    Physics
} from './constants'

import Body, { BodyProps } from './body'
import Integrator from './integrator'
import { FromWorkerData } from './integrator/worker'

/*** Types ***/

interface SimulationEvents {
    'tick': [number]
    'cache-full': [number]
}

interface SimulationCache {

    usedBytes: number
    maxBytes: number
    nextAssignId: number
    readonly bodies: Map<number, Body>

}

interface SimulationTick {
    current: number
    first: number
    last: number
}

interface SimulationSettings extends Physics {
    maxCacheMemory: number
}

/*** Helper ***/

function idArrayCheck(haystack: number[], needle: number) {

    if (haystack.length === 0)
        return true

    for (let i = 0; i < haystack.length; i++)
        if (haystack[i] === needle) {
            haystack.splice(i, 1) // remove from array to speed it up
            return true
        }

    return false
}


/*** Main ***/

class Simulation extends EventEmitter<SimulationEvents> {

    static fromJSON(json: any) {
        if (typeof json === 'string')
            json = JSON.parse(json)

        const { bodies, ...init } = json

        const sim = new Simulation(init)

        const props = bodies.map((body: Body) => {
            const prop = {
                pos: Vector.from(body.pos),
                vel: Vector.from(body.vel),
                mass: body.mass
            }
            return prop
        })

        sim.createBodies(props)

        return sim
    }

    public readonly g: number
    public readonly _integrator: Integrator
    public readonly _cache: SimulationCache
    public readonly _tick: SimulationTick = {
        current: 0,
        first: 0,
        last: 0
    }

    public constructor (settings: Partial<SimulationSettings> = {}) {

        super()

        if (!is.plainObject(settings))
            throw new TypeError('settings must be a plain object')

        const {
            g,
            physicsSteps,
            realMassThreshold,
            realBodiesMin,
            maxCacheMemory = DEFAULT_MAX_MB
        } = { ...DEFAULT_PHYSICS, ...settings }

        if (!is.number(maxCacheMemory) || maxCacheMemory <= 0)
            throw new Error('maxCacheMemory must be above zero')

        const integratorSettings = {
            onTick: this._writeTick.bind(this),
            g,
            physicsSteps,
            realMassThreshold,
            realBodiesMin
        }

        this._cache = {
            usedBytes: 0,
            maxBytes: maxCacheMemory * ONE_MB,
            nextAssignId: 0,
            bodies: new Map()
        }

        this.g = g
        this._integrator = new Integrator(integratorSettings)
    }

    public get currentTick(): number {
        return this._tick.current
    }

    set currentTick(value) {
        this.setCurrentTick(value, false)
    }

    public setCurrentTick(tick: number, autoClamp = true) {

        if (autoClamp)
            tick = clamp(tick, this.firstTick, this.lastTick)

        this.assertTick(tick)

        const bodies = this._cache

        for (const body of bodies.bodies.values())
            this._setBodyValuesFromCache(body, tick)

        this._tick.current = tick
    }

    private _setBodyValuesFromCache(body: Body, tick: number) {

        const { data } = body['_cache']

        let index = body.getTickDataIndex(tick)

        body.mass = data[index++] || 0
        body.pos.x = data[index++]
        body.pos.y = data[index++]
        body.vel.x = data[index++]
        body.vel.y = data[index++]
        body.linkId = data[index++]

    }

    public get firstTick(): number {
        return this._tick.first
    }

    public get lastTick(): number {
        return this._tick.last
    }

    get running() {
        return !!this._integrator.worker
    }

    get usedCacheMemory() {
        return this._cache.usedBytes / ONE_MB
    }

    get maxCacheMemory() {
        return this._cache.maxBytes / ONE_MB
    }

    public assertTick(tick: number) {

        const { firstTick, lastTick } = this

        if (!is.number(tick))
            throw new TypeError('tick should be a number.')

        if (tick < firstTick || (tick > lastTick))
            throw new RangeError(`${tick} is out of range, ${firstTick} to ${lastTick}`)

    }

    public run(tick = this.currentTick) {

        this.assertTick(tick)

        if (tick < this.lastTick)
            this.clearAfterTick(tick)

        const bodies = this._cache

        const stream = [
            // The integrator expects the first value in the stream array to last id
            // assigned to a new body
            bodies.nextAssignId
        ]

        for (const body of bodies.bodies.values()) {
            const cache = body['_cache']
            if (tick < cache.birthTick || (cache.deathTick > -1 && tick >= cache.deathTick))
                continue

            stream.push(body.id)

            // If this is the current tick, we want to take the values to
            // send to the integrator from the body's current values, not
            // not the cache. This way, if changes have been made, they'll
            // be reflected in the integration results
            if (tick === this.currentTick)
                stream.push(
                    body.mass,
                    body.pos.x,
                    body.pos.y,
                    body.vel.x,
                    body.vel.y
                )
            else {
                // Otherwise, we want to take the values from the cache.
                let index = body.getTickDataIndex(tick)
                stream.push(
                    cache.data[index++], // mass
                    cache.data[index++], // posX
                    cache.data[index++], // posY
                    cache.data[index++], // velX
                    cache.data[index++] /// velY
                )
            }
        }

        // If the only thing in the simulation is the last assigned id, then there must
        // not be any bodies.
        if (stream.length <= 1)
            throw new Error(`Cannot start simulation. No bodies exist at tick ${tick}.`)

        if (bodies.usedBytes === bodies.maxBytes)
            throw new Error(`Cannot start simulation. Cache memory (${this.maxCacheMemory}mb) is full.`)

        this._integrator.start(stream)
    }

    public runUntil(
        condition: (...args: any[]) => boolean,
        startTick = this.currentTick,
        description = 'until condition met'
    ) {
        this.assertTick(startTick)

        let resolver: (lastTick: number) => void
        let rejecter: (lastTick: number) => void

        return new Promise((resolve, reject) => {

            resolver = lastTick => {
                if (condition(lastTick))
                    resolve(lastTick)
            }

            rejecter = lastTick => {
                reject(new Error(`Could not run ${description}. Cache memory used up on tick ${lastTick}`))
            }

            this.on('tick', resolver)
            this.once('cache-full', rejecter)

            this.run(startTick)

        }).then(lastTick => {
            this.removeListener('tick', resolver)
            this.removeListener('cache-full', rejecter)

            this.stop()

            return lastTick
        })
    }


    public runForNumTicks(totalTicks: number, startTick = this.currentTick) {
        if (totalTicks <= 0)
            throw new Error('totalTicks must be a number above zero.')

        let ticks = 0

        const condition = () =>
            ++ticks >= totalTicks

        const description = `for ${totalTicks} ticks`

        return this.runUntil(condition, startTick, description)
    }


    public runForOneTick(startTick = this.currentTick) {
        const description = 'for one tick'

        const oneTick = () => true

        return this.runUntil(oneTick, startTick, description)
    }

    public stop() {
        this._integrator.stop()
    }

    public createBodies(props: Partial<BodyProps> | Partial<BodyProps>[], tick = this.currentTick): Body[] {

        if (!is.array(props))
            props = [props]

        const cache = this._cache
        const created: Body[] = []

        for (const prop of props) {

            const id = cache.nextAssignId++
            const body = new Body(prop, tick, id)
            cache.bodies.set(id, body)

            // If we're not on the tick that we're adding the body
            // to, it's current values should be changed.
            this._setBodyValuesFromCache(body, this.currentTick)

            created.push(body)
        }

        if (this.running)
            this.run(tick)

        else if (tick < this.lastTick)
            this.clearAfterTick(tick)

        return created
    }

    public clearAfterTick(tick = this.currentTick) {
        this.assertTick(tick)

        if (tick < this.currentTick)
            this.setCurrentTick(tick)

        this._tick.last = tick

        const bodies = this._cache
        for (const body of bodies.bodies.values()) {
            const cache = body['_cache']

            if (tick < cache.birthTick) {
                bodies.bodies.delete(body.id)
                continue
            }

            if (tick < cache.deathTick)
                cache.deathTick = -1

            const index = body.getTickDataIndex(tick) + CACHED_VALUES_PER_TICK
            const { data } = cache

            data.length = min(index, data.length)
        }
        this._updateUsedBytes()

    }

    public clearBeforeTick(tick = this.currentTick) {
        this.assertTick(tick)

        if (tick > this.currentTick)
            this.setCurrentTick(tick)

        this._tick.first = tick

        const bodies = this._cache
        for (const body of bodies.bodies.values()) {
            const cache = body['_cache']

            if (cache.deathTick > -1 && tick >= cache.deathTick) {
                bodies.bodies.delete(body.id)
                continue
            }

            if (tick > cache.birthTick) {
                const delta = tick - cache.birthTick
                const length = delta * CACHED_VALUES_PER_TICK

                cache.data.splice(0, length)
                cache.birthTick = tick
            }
        }
        this._updateUsedBytes()
    }

    public body(id: number) {
        return this._cache.bodies.get(id) ?? null
    }

    [Symbol.iterator]() {
        return this._cache.bodies.values()
    }

    public * bodies(ids: number[] = []) {

        if (is.defined(ids) && !is.array(ids))
            ids = [ids]

        ids = [...ids] // idArrayCheck mutates the array, so we'll prevent side effects

        for (const body of this)
            if (idArrayCheck(ids, body.id))
                yield body
    }

    public get numBodies() {
        return this._cache.bodies.size
    }

    public * livingBodies() {
        for (const body of this)
            if (body.exists)
                yield body
    }

    public numLivingBodies() {
        let count = 0
        for (const body of this)
            if (body.exists)
                count++

        return count
    }

    /*** Conversion ***/

    public toArray(ids: number[]) {
        return [...this.bodies(ids)]
    }

    public toJSON() {

        const {
            g, maxCacheMemory
        } = this

        const {
            physicsSteps, realMassThreshold, realBodiesMin
        } = this._integrator.physics

        const bodies = []
        for (const body of this.livingBodies()) {

            const { pos, vel, mass, id } = body

            bodies.push({
                id,
                pos: { x: pos.x, y: pos.y },
                vel: { x: vel.x, y: vel.y },
                mass
            })
        }

        return {
            bodies,
            g,
            physicsSteps,
            realMassThreshold,
            realBodiesMin,
            maxCacheMemory
        }
    }

    /*** Helper ***/

    private _updateUsedBytes() {
        const cache = this._cache

        let allocations = 0
        for (const body of cache.bodies.values())
            allocations += body['_cache'].data.length

        cache.usedBytes = min(cache.maxBytes, allocations * NUMBER_SIZE)
    }

    private _writeTick(data: FromWorkerData) {

        if (!this.running)
            return

        const bodies = this._cache
        const tick = this._tick

        tick.last++

        bodies.nextAssignId = data.nextAssignId

        for (const { id, mergeId } of data.destroyed) {
            const body = bodies.bodies.get(id) as Body
            body.mergeId = mergeId

            const cache = body['_cache']
            cache.deathTick = tick.last
        }

        for (const id of data.created) {
            const body = new Body({}, tick.last, id)

            // ignore initial values as they will be defined by the stream
            body['_cache'].data.length = 0

            bodies.bodies.set(id, body)
        }

        const { stream } = data
        let i = 0
        while (i < stream.length) {
            const id = stream[i++]
            const body = bodies.bodies.get(id) as Body

            const cache = body['_cache']
            cache.data.push(
                stream[i++], // mass
                stream[i++], // posX
                stream[i++], // posY
                stream[i++], // velX
                stream[i++], // velY
                stream[i++] // linkId
            )
        }

        this.emit('tick', tick.last)

        this._updateUsedBytes()
        if (bodies.usedBytes === bodies.maxBytes) {
            this.stop()
            this.emit('cache-full', tick.last)
        }
    }

}

/*** Exports ***/

export default Simulation

export {
    Simulation,
    SimulationSettings
}