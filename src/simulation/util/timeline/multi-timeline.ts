import { $$copy } from '@benzed/immutable'
import { KeyedStatePayload, Tick, Timeline, _TimelineLike } from './timeline'

//// MultiTimeline ////

abstract class _MultiTimeline<T extends { id: number | string }>
    extends _TimelineLike<readonly T[]> {

    public get firstTick(): Tick {
        return this._getFirstCacheProperty('firstTick')
    }
    public get tick(): Tick {
        return this._getFirstCacheProperty('tick')
    }
    public get lastTick(): Tick {
        return this._getFirstCacheProperty('lastTick')
    }

    public get stateCount(): number {
        return this._getFirstCacheProperty('numStates')
    }

    private _getFirstCacheProperty(
        key: 'firstTick' | 'tick' | 'lastTick' | 'numStates'
    ): Tick {
        for (const cache of this._cache.values())
            // return the key value of the first timeline in the cache 
            // as they'll all be synced anyway
            return cache[key]

        return 0 // no timelines in the cache
    }

    // Cache 

    private readonly _cache: Map<T['id'], Timeline<Omit<T, 'id'>>> = new Map()

    // State
    private _state: T[] = []
    public get state(): readonly T[] {
        return this._state
    }

    public pushState(states: readonly T[]): void {

        for (const state of states) {
            let timeline = this._cache.get(state.id)
            if (!timeline) {
                timeline = new Timeline<Omit<T, 'id'>>(this._toKeyedStatePayload)
                this._cache.set(state.id, timeline)
            }

            timeline.pushState(state)
        }
    }

    public applyState(tick: Tick): T[] {
        this._state = this.getState(tick)
        return this._state
    }

    public hasState(tick: number): boolean {
        return this.getState(tick).length > 0
    }

    public getState(tick: Tick): T[] {
        const states: T[] = []

        for (const [id, timeline] of this._cache) {
            const state = timeline.getState(tick)
            if (state)
                states.push({ ...state, id } as T)
        }

        return states
    }

    public clearStatesBefore(tick: Tick): void { /* Not Yet Implementeed */ }

    public clearStatesFrom(tick: Tick): void {/* Not Yet Implementeed */ }

    // 

    protected abstract _toKeyedStatePayload?: (input: Omit<T, 'id'>) => KeyedStatePayload<T>

    public [$$copy](): this {
        throw new Error('Not yet implemented.')
    }

}

//// MultiTimeline ////

class MultiTimeline<T extends { id: string | number }> extends _MultiTimeline<T> {

    public constructor (
        protected _toKeyedStatePayload?: (state: Omit<T, 'id'>) => KeyedStatePayload<T>
    ) {
        super()
    }

}

//// Exports ////

export default _MultiTimeline

export {
    _MultiTimeline,
    MultiTimeline
}