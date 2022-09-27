import { max } from '@benzed/math'
import { DEFAULT_MAX_MB } from './constants'

import { BodyJson, SimulationSettings } from './simulation'

import { SimulationFork } from './simulation-fork'

/*** Settings ***/

interface SimulationTimelineSettings extends SimulationSettings {

    readonly maxCacheMemory: number

}

/*** Main ***/

/**
 * Caches data created from a forked simulation into a timeline
 */
class SimulationTimeline extends SimulationFork implements SimulationTimelineSettings {

    // Cache
    private readonly _timeline: (readonly BodyJson[])[] = []

    public readonly maxCacheMemory: number

    private readonly _usedCacheMemory = 0
    public get usedCacheMemory() {
        return this._usedCacheMemory
    }

    // State 
    private readonly _firstTick = 0
    public get firstTick() {
        return this._firstTick
    }

    private _tick = 0
    public get tick(): number {
        return this._tick
    }
    public set tick(value: number) {

        const state = this._timeline.at(value - this._firstTick)
        if (state)
            this._applyBodyJson(state)

        else if (value !== this._firstTick)
            throw new Error(
                `Tick ${value} is not in range: ${this._firstTick} - ${this.lastTick}`
            )

        this._tick = value
    }

    public get lastTick() {
        return this._firstTick + max(this._timeline.length - 1, 0)
    }

    public setTick(tick: number) {
        this.tick = tick
    }

    // Construction

    public constructor (settings?: Partial<SimulationTimelineSettings>) {

        const {
            maxCacheMemory = DEFAULT_MAX_MB,
            ...rest
        } = settings ?? {}

        super(rest)

        this.maxCacheMemory = maxCacheMemory

        this._addListener(
            'tick',
            state => void this._timeline.push(state),
            { internal: true }
        )
    }

    // Methods

    public startAtTick(tick: number) {
        this.tick = tick
        this.run()
    }




}

/*** Exports ***/

export default SimulationTimeline

export {
    SimulationTimeline
}