import { $$copy } from '@benzed/immutable'
import { KeyedStatePayload, Tick, Timeline, _TimelineLike } from './timeline'

//// MultiTimeline ////

abstract class _MultiTimeline<
    T extends { id: number | string }
> extends _TimelineLike<readonly T[]> {
    get firstTick(): Tick {
        return this._firstCache.firstTick
    }
    get tick(): Tick {
        return this._firstCache.tick
    }
    get lastTick(): Tick {
        return this._firstCache.lastTick
    }

    get stateCount(): number {
        return this._firstCache.stateCount
    }
    get rawStateCount(): number {
        return this._firstCache.rawStateCount
    }
    get keyStateCounts(): number[] {
        return this._firstCache.keyStateCounts
    }

    // Cache

    private readonly _cache: Map<T['id'], Timeline<Omit<T, 'id'>>> = new Map()

    private get _firstCache(): Timeline<Omit<T, 'id'>> {
        const [cache] = this._cache.values()
        return cache
    }

    // State
    private _state: T[] = []
    get state(): readonly T[] {
        return this._state
    }

    pushState(states: readonly T[]): void {
        for (const state of states) {
            let timeline = this._cache.get(state.id)
            if (!timeline) {
                timeline = new Timeline<Omit<T, 'id'>>(
                    this._toKeyedStatePayload
                )
                this._cache.set(state.id, timeline)
            }

            timeline.pushState(state)
        }
    }

    applyState(tick: Tick): T[] {
        this._state = this.getState(tick)
        return this._state
    }

    hasState(tick: number): boolean {
        return this.getState(tick).length > 0
    }

    getState(tick: Tick): T[] {
        const states: T[] = []

        for (const [id, timeline] of this._cache) {
            const state = timeline.getState(tick)
            if (state) states.push({ ...state, id } as T)
        }

        return states
    }

    clearStatesBefore(_tick: Tick): void {
        /* Not Yet Implemented */
    }

    clearStatesFrom(_tick: Tick): void {
        /* Not Yet Implemented */
    }

    //

    protected abstract _toKeyedStatePayload?: (
        input: Omit<T, 'id'>
    ) => KeyedStatePayload<T>;

    [$$copy](): this {
        throw new Error('Not yet implemented.')
    }
}

//// MultiTimeline ////

class MultiTimeline<
    T extends { id: string | number }
> extends _MultiTimeline<T> {
    constructor(
        protected _toKeyedStatePayload?: (
            state: Omit<T, 'id'>
        ) => KeyedStatePayload<T>
    ) {
        super()
    }
}

//// Exports ////

export default _MultiTimeline

export { _MultiTimeline, MultiTimeline }
