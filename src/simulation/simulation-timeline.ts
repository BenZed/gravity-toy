
import { DEFAULT_MAX_MB } from './constants'

import { BodyJson, SimulationJson, SimulationSettings } from './simulation'

import { SimulationFork } from './simulation-fork'
import { MultiTimeline, TickIndex } from './util'

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
    private readonly _timeline = new MultiTimeline<BodyJson>(({ pos, vel, mass }) => [{ pos, vel }, { mass }])

    public readonly maxCacheMemory: number

    private readonly _usedCacheMemory = 0
    public get usedCacheMemory() {
        return this._usedCacheMemory
    }

    // State 
    public get firstTickIndex() {
        return this._timeline.firstTickIndex
    }

    public get tickIndex(): TickIndex {
        return this._timeline.tickIndex
    }
    public set tickIndex(value: TickIndex) {
        this.applyStateAtTick(value)
    }

    public get lastTickIndex() {
        return this._timeline.tickIndex
    }

    public applyStateAtTick(tickIndex: TickIndex) {
        this._timeline.applyStateAtTick(tickIndex)
        this._applyBodyJson(this._timeline.state)
    }

    public getStateAtTick(tickIndex: TickIndex): BodyJson[] {
        return this._timeline.getStateAtTick(tickIndex)
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
    public runAtTick(tickIndex: TickIndex) {
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