import { BodyJson } from './simulation'
import { SimulationFork } from './simulation-fork'

/**
 * Caches data created from a forked simulation into a timeline
 */
class SimulationTimeline extends SimulationFork {

    private readonly _timeline: (readonly BodyJson[])[] = []

    // State 

    private _tick = 0

    public get tick(): number {
        return this._tick
    }

    public set tick(value: number) {

        const state = this._timeline.at(value)
        if (state)
            this._applyBodyJson(state)

        else if (value !== 0)
            throw new Error(
                `Tick ${value} is not in range: 0 - ${this._timeline.length - 1}`
            )

        this._tick = value
    }

    // Override

    protected override _onChildProcess(state: readonly BodyJson[]): void {
        this._timeline.push(state)
    }

}

/*** Exports ***/

export default SimulationTimeline

export {
    SimulationTimeline
}