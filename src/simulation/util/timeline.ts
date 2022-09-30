import SortedArray from '@benzed/array/sorted-array'
import { $$copy, $$equals, copy, CopyComparable, equals } from '@benzed/immutable'

/*** Types ***/

type TickIndex = number

type State<T> = Partial<T>

/**
 * Raw states are data that changes every tick.
 */
type RawStates<T> = Array<State<T>>

/**
 * Keyed states are data that does not change every tick.
 */
type KeyedStates<T> = SortedArray<{ valueOf(): TickIndex, tickIndex: TickIndex, state: State<T> }>

type Cache<T> = {
    rawStates: RawStates<T>,
    keyedStates: KeyedStates<T>[]
}

/**
 * An array of objects containing values that should
 * be keyed seperately.
 * 
 * Given a Vector { x: number, y: number }
 * ```ts 
 * 
 * // assuming only x has changed since last tick
 * const { x, y } = vector
 * 
 * // creates a new key state containing x and y, despite
 * // that y is the same value
 * const vp1: KeyedStatePayload<Vector> = [{x, y}] 
 * 
 * // only creates a new keystate for x
 * const vp2: KeyedStatePayload<Vector> = [{x}, {y}]
 * 
 * ```
 */
type KeyedStatePayload<T> = State<T>[]

/*** Base ***/

abstract class _TimelineLike<T extends object> implements CopyComparable<_TimelineLike<T>> {

    // Tick 

    public abstract get firstTickIndex(): TickIndex
    public abstract get tickIndex(): TickIndex
    public abstract get lastTickIndex(): TickIndex

    public valueOf() {
        return this.tickIndex
    }

    // State 

    public abstract get state(): T

    public abstract pushState(state: Readonly<T>): void
    public abstract applyStateAtTick(tickIndex: TickIndex): void

    public abstract hasStateAtTick(tickIndex: TickIndex): boolean
    public abstract getStateAtTick(tickIndex: TickIndex): T | null

    public abstract clearStatesBeforeTick(tickIndex: TickIndex): void
    public abstract clearStatesAfterTick(tickIndex: TickIndex): void

    public abstract [$$copy](): this

    public [$$equals](other: unknown): other is this {
        const ThisTimeline = this.constructor as new () => this

        return other instanceof ThisTimeline && equals(this.state, other.state)
    }
}

/*** Timeline ***/

abstract class _Timeline<T extends object> extends _TimelineLike<T>{

    // Tick 

    protected _firstTickIndex = 0
    public get firstTickIndex() {
        return this._firstTickIndex
    }

    protected _tickIndex = 0
    public get tickIndex(): TickIndex {
        return this._tickIndex
    }

    protected _lastTickIndex = 0
    public get lastTickIndex() {
        return this._lastTickIndex
    }

    private readonly _cache: Cache<T> = {
        rawStates: [],
        keyedStates: []
    }

    // State

    private _state: T | null = null
    public get state(): Readonly<T> {
        if (!this._state)
            throw new Error('Timeline empty.')

        return this._state
    }

    public pushState(state: Readonly<T>) {

        const birthTickIndex = this._lastTickIndex++

        const [...keyedStates] = this._toKeyedStatePayload?.(state) ?? []

        const rawState: T = { ...state }

        for (let i = 0; i < keyedStates.length; i++) {
            const keyedState = keyedStates[i]

            // Any state that is not keyed is raw,
            // so we remove any properties we find in 
            // keyed state, leaving only properties
            // that update every tick.
            for (const property in keyedState)
                delete rawState[property]

            let keyTickData = this._cache.keyedStates.at(i)
            if (!keyTickData) {
                keyTickData = new SortedArray()
                this._cache.keyedStates[i] = keyTickData
            }

            const tickIndexValue = {
                state: keyedState as State<T>,
                tickIndex: birthTickIndex,
                valueOf: this.valueOf
            }

            const prevKeyIndex = keyTickData.closestIndexOf(tickIndexValue)
            const prevKeyData = keyTickData[prevKeyIndex]
            if (!equals(keyedState, prevKeyData))
                keyTickData.push(tickIndexValue)
        }

        // Only push rawState array if there are keys remaining.
        const numRawKeys = Object.keys(rawState).length
        if (numRawKeys > 0)
            this._cache.rawStates.push(rawState)
        else if (this._cache.rawStates.length !== 0)
            throw new Error(
                'Timeline raw state consumption must be consistent. ' +
                'Raw data must be pushed every tick or not at all.'
            )
    }

    public applyStateAtTick(tickIndex: TickIndex) {
        this._state = this.getStateAtTick(tickIndex)
        this._tickIndex = tickIndex
    }

    public hasStateAtTick(tickIndex: TickIndex): boolean {
        return !this.getStateAtTick(tickIndex)
    }

    public getStateAtTick(tickIndex: TickIndex): T | null {

        if (tickIndex < this._firstTickIndex || tickIndex > this._lastTickIndex)
            throw new Error(`${tickIndex} out of range.`)

        const { rawStates, keyedStates } = this._cache

        const rawState = rawStates.at(tickIndex - this._firstTickIndex)
        //    ^ rawState would only be undefined if these timeline doesn't
        //      have any properties that are updated every tick.

        const keyedState: State<T> = {}

        const sortableTickIndex = {
            tickIndex,
            valueOf: this.valueOf,
            state: keyedState
        }

        for (const keyedTickData of keyedStates) {
            const { state: lastKeyedState } = keyedTickData[keyedTickData.closestIndexOf(sortableTickIndex)]

            for (const p in lastKeyedState) {
                const property = p as keyof T

                keyedState[property] = lastKeyedState[property]
            }
        }

        return { ...rawState, ...keyedState } as T
    }

    public clearStatesBeforeTick(tickIndex: TickIndex): void { /* Not Yet Implementeed */ }

    public clearStatesAfterTick(tickIndex: TickIndex): void {/* Not Yet Implementeed */ }

    // Copyable implementation

    public [$$copy]() {

        const TimelineLike = this.constructor as new () => this

        const newTimeline = new TimelineLike()
        newTimeline._state = copy(this.state)
        newTimeline._toKeyedStatePayload = this._toKeyedStatePayload

        return newTimeline
    }

    // 

    protected abstract _toKeyedStatePayload?: (input: T) => KeyedStatePayload<T>

}

/*** Main ***/

class Timeline<T extends object> extends _Timeline<T> {

    public constructor (
        protected _toKeyedStatePayload?: (state: T) => KeyedStatePayload<T>
    ) {
        super()
    }

}

/*** MultiTimeline ***/

abstract class _MultiTimeline<T extends { id: number | string }> extends _TimelineLike<readonly T[]> {

    public get firstTickIndex() {
        return this._getTickIndex('firstTickIndex')
    }
    public get tickIndex(): TickIndex {
        return this._getTickIndex('tickIndex')
    }
    public get lastTickIndex() {
        return this._getTickIndex('lastTickIndex')
    }

    private _getTickIndex(key: 'firstTickIndex' | 'tickIndex' | 'lastTickIndex') {
        for (const cache of this._cache.values())
            // return the tick index of the first timeline in the cache 
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

    public applyStateAtTick(tickIndex: TickIndex) {
        this._state = this.getStateAtTick(tickIndex)
    }

    public hasStateAtTick(tickIndex: number): boolean {
        return this.getStateAtTick(tickIndex).length > 0
    }

    public getStateAtTick(tickIndex: TickIndex): T[] {
        const states: T[] = []

        for (const [id, timeline] of this._cache) {
            const state = timeline.getStateAtTick(tickIndex)
            if (state)
                states.push({ ...state, id } as T)
        }

        return states
    }

    public clearStatesBeforeTick(tickIndex: TickIndex): void { /* Not Yet Implementeed */ }

    public clearStatesAfterTick(tickIndex: TickIndex): void {/* Not Yet Implementeed */ }

    // 

    protected abstract _toKeyedStatePayload?: (input: Omit<T, 'id'>) => KeyedStatePayload<T>

    public [$$copy] = _Timeline.prototype[$$copy] as unknown as () => this

}

class MultiTimeline<T extends { id: string | number }> extends _MultiTimeline<T> {

    public constructor (
        protected _toKeyedStatePayload?: (state: Omit<T, 'id'>) => KeyedStatePayload<T>
    ) {
        super()
    }

}

/*** Exports ***/

export default MultiTimeline

export {
    Timeline,
    _Timeline,

    MultiTimeline,
    _MultiTimeline,

    TickIndex,

    State,
    KeyedStatePayload
}