
import { DEFAULT_MAX_MB } from './constants'

import { BodyJson, SimulationJson, SimulationSettings } from './simulation'

import { SimulationFork } from './simulation-fork'
import { MultiTimeline, Tick } from './util'

/*** Types ***/

interface SimulationTimelineSettings extends SimulationSettings {

    readonly maxCacheMemory: number

}

/*** Main ***/

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
    public get firstTickIndex() {
        return this._timeline.firstIndex
    }

    public get tickIndex(): Tick {
        return this._timeline.index
    }
    public set tickIndex(value: Tick) {
        this.applyStateAtTick(value)
    }

    public get lastTickIndex() {
        return this._timeline.index
    }

    public applyStateAtTick(tickIndex: Tick) {
        this._timeline.applyStateAtIndex(tickIndex)
        this._applyBodyJson(this._timeline.state)
    }

    public getStateAtTick(tickIndex: Tick): BodyJson[] {
        return this._timeline.getStateAtIndex(tickIndex)
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
    public runAtTick(tickIndex: Tick) {
        this.applyStateAtTick(tickIndex)
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

/*** Exports ***/

export default SimulationTimeline

export {
    SimulationTimeline,
    SimulationTimelineSettings
}