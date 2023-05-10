import { BodyDataWithId } from './body'
import { DEFAULT_MAX_MB } from './constants'

import { SimulationData, SimulationSettings } from './simulation'

import { SimulationFork } from './simulation-fork'
import { Tick, MultiTimeline } from './util'

//// Types ////

interface SimulationTimelineSettings extends SimulationSettings {
    readonly maxCacheMemory: number
}

//// Main ////

/**
 * Caches data created from a forked simulation into a timeline
 */
abstract class SimulationTimeline<B extends BodyDataWithId>
    extends SimulationFork<B>
    implements SimulationTimelineSettings
{
    readonly maxCacheMemory: number

    private readonly _usedCacheMemory = 0
    get usedCacheMemory() {
        return this._usedCacheMemory
    }

    // State
    get firstTick() {
        return this._timeline.firstTick
    }

    get tick(): Tick {
        return this._timeline.tick
    }
    set tick(tick: Tick) {
        this.applyState(tick)
    }

    get lastTick() {
        return this._timeline.lastTick
    }

    applyState(tick: Tick) {
        this._timeline.applyState(tick)
        this._applyBodyJson(this._timeline.state)
    }

    getState(tick: Tick): BodyDataWithId[] {
        return this._timeline.getState(tick)
    }

    // Construction

    constructor(settings?: Partial<SimulationTimelineSettings>) {
        const { maxCacheMemory = DEFAULT_MAX_MB, ...rest } = settings ?? {}

        super(rest)

        this.maxCacheMemory = maxCacheMemory
    }

    // Methods

    /**
     * Runs the simulation from a given tick in the cache.
     */
    runAtTick(tick: Tick) {
        this.applyState(tick)
        this.run()
    }

    // Implementation

    protected _update(state: SimulationData['bodies']) {
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

export { SimulationTimeline, SimulationTimelineSettings }
