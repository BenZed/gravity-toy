import { $$copy } from '@benzed/immutable'
import { KeyedStatePayload, Tick, Timeline, _TimelineLike } from './timeline'

/*** MultiTimeline ***/

abstract class _MultiTimeline<T extends { id: number | string }> extends _TimelineLike<readonly T[]> {

    public get firstTick() {
        return this._getFirstCacheProperty('firstTick')
    }
    public get tick(): Tick {
        return this._getFirstCacheProperty('tick')
    }
    public get lastTick() {
        return this._getFirstCacheProperty('lastTick')
    }

    public get numStates() {
        return this._getFirstCacheProperty('numStates')
    }

    private _getFirstCacheProperty(key: 'firstTick' | 'tick' | 'lastTick' | 'numStates') {
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

    public pushState(states: readonly T[]) {

        for (const state of states) {
            let timeline = this._cache.get(state.id)
            if (!timeline) {
                timeline = new Timeline<Omit<T, 'id'>>(this._toKeyedStatePayload)
                this._cache.set(state.id, timeline)
            }

            timeline.pushState(state)
        }
    }

    public applyStateAtTick(tick: Tick) {
        this._state = this.getStateAtTick(tick)
    }

    public hasStateAtTick(tick: number): boolean {
        return this.getStateAtTick(tick).length > 0
    }

    public getStateAtTick(tick: Tick): T[] {
        const states: T[] = []

        for (const [id, timeline] of this._cache) {
            const state = timeline.getStateAtTick(tick)
            if (state)
                states.push({ ...state, id } as T)
        }

        return states
    }

    public clearStatesBeforeTick(tick: Tick): void { /* Not Yet Implementeed */ }

    public clearStatesAfterTick(tick: Tick): void {/* Not Yet Implementeed */ }

    // 

    protected abstract _toKeyedStatePayload?: (input: Omit<T, 'id'>) => KeyedStatePayload<T>

    public [$$copy](): this {
        throw new Error('Not yet implemented.')
    }

}

/*** MultiTimline ***/

class MultiTimeline<T extends { id: string | number }> extends _MultiTimeline<T> {

    public constructor (
        protected _toKeyedStatePayload?: (state: Omit<T, 'id'>) => KeyedStatePayload<T>
    ) {
        super()
    }

}

/*** Exports ***/

export default _MultiTimeline

export {
    _MultiTimeline,
    MultiTimeline
}