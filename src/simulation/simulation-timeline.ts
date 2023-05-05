
import { DEFAULT_MAX_MB } from './constants'

import { BodyJson, SimulationJson, SimulationSettings } from './simulation'

import { SimulationFork } from './simulation-fork'
import { MultiTimeline, Tick } from './util'

//// Types ////

interface SimulationTimelineSettings extends SimulationSettings {
    readonly maxCacheMemory: number
}

//// Main ////

/**
 * Caches data created from a forked simulation into a timeline
 */
abstract class SimulationTimeline<B extends BodyJson> extends SimulationFork<B> implements SimulationTimelineSettings {

    // Cache
    private readonly _timeline = new MultiTimeline<BodyJson>(({ mass }) => [{ mass }])

    public readonly maxCacheMemory: number

    private readonly _usedCacheMemory = 0
    public get usedCacheMemory() {
        return this._usedCacheMemory
    }

    // State 
    public get firstTick() {
        return this._timeline.firstTick
    }

    public get tick(): Tick {
        return this._timeline.tick
    }
    public set tick(tick: Tick) {
        this.applyState(tick)
    }

    public get lastTick() {
        return this._timeline.lastTick
    }

    public applyState(tick: Tick) {
        this._timeline.applyState(tick)
        this._applyBodyJson(this._timeline.state)
    }

    public getState(tick: Tick): BodyJson[] {
        return this._timeline.getState(tick)
    }

    // Construction

    public constructor (settings?: Partial<SimulationTimelineSettings>) {

        const {
            maxCacheMemory = DEFAULT_MAX_MB,
            ...rest
        } = settings ?? {}

        super(rest)

        this.maxCacheMemory = maxCacheMemory
    }

    // Methods

    /**
     * Runs the simulation from a given tick in the cache.
     */
    public runAtTick(tick: Tick) {
        this.applyState(tick)
        this.run()
    }

    // Implementation

    protected _update(state: SimulationJson['bodies']) {

        const tooMucMemoryBeingUsed = false // TODO 
        if (tooMucMemoryBeingUsed) {
            this.emit('tick-error', new Error('Cache is full.'))
            this.stop()

        } else {
            this._timeline.pushState(state)
            this.emit('tick', state)
        }
    }
}

//// Exports ////

export default SimulationTimeline

export {
    SimulationTimeline,
    SimulationTimelineSettings
}