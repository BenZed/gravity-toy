import { Sortable } from '@benzed/array'
import SortedArray from '@benzed/array/sorted-array'
import { $$copy, $$equals, CopyComparable, equals } from '@benzed/immutable'

/*** Types ***/

type Tick = number

type State<T> = Partial<T>

/**
 * Raw states are data that changes every tick.
 */
type RawStates<T> = Array<Readonly<State<T>>>

/**
 * Keyed states are data that does not change every tick.
 */
type KeyedStates<T> = SortedArray<{ valueOf(): Tick, tick: Tick, state: Readonly<State<T>> }>

type Cache<T> = {
    rawStates: RawStates<T>
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

/***  ***/

/**
 * Sorted Array is classed as an Array due to the limitations of the engine
 * the compiler is targeting. 
 * I'll have to find away around that, or use a newer target.
 */
function _getSortedArrayHack<T extends Sortable>(arr = new SortedArray<T>()): SortedArray<T> {

    // @ts-expect-error hack
    arr._getIndexViaBinarySearch = SortedArray.prototype._getIndexViaBinarySearch
    arr.closestIndexOf = SortedArray.prototype.closestIndexOf
    arr.copy = SortedArray.prototype.copy

    return arr
}

/*** _TimelineLike ***/

abstract class _TimelineLike<T extends object> implements CopyComparable<_TimelineLike<T>> {

    // Tick 

    public abstract get firstTick(): Tick
    public abstract get tick(): Tick
    public abstract get lastTick(): Tick

    public abstract get numStates(): number

    public valueOf(): Tick {
        return this.tick
    }

    // State 

    public abstract get state(): T

    public abstract pushState(state: Readonly<T>): void
    public abstract applyState(tick: Tick): T
    public applyLatestState(): T {
        return this.applyState(this.lastTick)
    }
    public applyFirstState(): T {
        return this.applyState(this.firstTick)
    }

    public abstract hasState(tick: Tick): boolean
    public abstract getState(tick: Tick): T | null
    public setState(tick: Tick, state: Readonly<T>): void {
        this.clearStates(tick)
        this.pushState(state)
    }

    public abstract clearPreviousStates(tick: Tick): void
    public abstract clearStates(tick: Tick): void

    // Copyable Implementation

    public abstract [$$copy](): this

    public [$$equals](other: unknown): other is this {
        const ThisTimeline = this.constructor as new () => this

        return (
            other instanceof ThisTimeline &&
            equals(this.state, other.state)
        )
    }

    // Iterable Implementation

    public * ticks(): Generator<number> {
        const { firstTick, lastTick } = this
        for (let i = firstTick; i <= lastTick; i++)
            yield i
    }

    public * states(): Generator<T> {
        for (const tick of this.ticks())
            yield this.getState(tick) as T
    }

    public *[Symbol.iterator](): Generator<T> {
        yield* this.states()
    }

}

/*** _Timeline ***/

abstract class _Timeline<T extends object> extends _TimelineLike<T>{

    // Tick 

    protected _firstTick = 0
    public get firstTick(): Tick {
        return this._firstTick
    }

    protected _tick = 0
    public get tick(): Tick {
        return this._tick
    }

    protected _lastTick = 0
    public get lastTick(): Tick {
        return this._lastTick
    }

    public get numStates(): Tick {
        return this._state
            ? this._lastTick - this._firstTick + 1
            : 0
    }

    private readonly _cache: Cache<T> = {
        rawStates: [],
        keyedStates: []
    }

    // State

    private _state: T | null = null
    public get state(): Readonly<T> {
        this._assertNotEmpty(this._state)
        return this._state
    }

    public pushState(state: Readonly<T>): void {

        const birthTick = this._lastTick

        const isEmpty = !this._state
        if (isEmpty)
            this._state = state
        else
            this._lastTick++

        const rawState: T = { ...state }
        const keyedStates = this._toKeyedStatePayload?.(state) ?? []

        for (let i = 0; i < keyedStates.length; i++) {
            const keyedState = keyedStates[i]

            // Any state that is not keyed is raw,
            // so we remove any properties we find in 
            // keyed state, leaving only properties
            // that update every tick.
            for (const property in keyedState)
                delete rawState[property]

            let keyStateData = this._cache.keyedStates.at(i)
            if (!keyStateData) {
                keyStateData = _getSortedArrayHack()

                this._cache.keyedStates[i] = keyStateData
            }

            const tickValue = {
                state: keyedState as State<T>,
                tick: birthTick,
                valueOf: this.valueOf
            }

            const prevKeyTick = _getSortedArrayHack(keyStateData).closestIndexOf(tickValue)
            const prevKeyState = keyStateData.at(prevKeyTick)?.state

            if (!equals(keyedState, prevKeyState))
                keyStateData.push(tickValue)
        }

        // Only push rawState array if there are keys remaining.
        const numRawKeys = Object.keys(rawState).length
        if (numRawKeys > 0)
            this._cache.rawStates.push(rawState)
        else if (this._cache.rawStates.length !== 0) {
            throw new Error(
                'Timeline raw state consumption must be consistent. ' +
                'Raw data must be pushed every tick or not at all.'
            )
        }
    }

    public applyState(tick: Tick): Readonly<T> {

        this._assertNotEmpty(this._state)
        this._assertTick(tick)

        this._state = this.getState(tick)
        this._tick = tick
        return this._state as T

    }

    public hasState(tick: Tick): boolean {
        return (
            tick >= this._firstTick &&
            tick <= this._lastTick
        )
    }

    public getState(tick: Tick): T | null {

        if (!this.hasState(tick))
            return null

        const { rawStates, keyedStates } = this._cache

        const rawState = rawStates.at(tick - this._firstTick) ?? null
        //    ^ rawState would only be undefined if these timeline doesn't
        //      have any properties that are updated every tick.

        let keyedState: State<T> | null = null

        const sortableStateTick = {
            tick,
            valueOf: this.valueOf,
            state: null as unknown as State<T>
        }

        for (const keyedStateData of keyedStates) {

            const { state: lastKeyedState } = keyedStateData[
                _getSortedArrayHack(keyedStateData)
                    .closestIndexOf(sortableStateTick)
            ]

            for (const p in lastKeyedState) {
                const property = p as keyof T

                if (!keyedState)
                    keyedState = {}

                keyedState[property] = lastKeyedState[property]
            }
        }

        return { ...rawState, ...keyedState } as T
    }

    public getRawStateCount(): number {
        return this
            ._cache
            .rawStates
            .length
    }

    public getKeyStateCounts(): number[] {
        return this
            ._cache
            .keyedStates
            .map(keyState => keyState.length)
    }

    public clearPreviousStates(tick: Tick): void { /* Not Yet Implementeed */ }

    public clearStates(tick: Tick): void {/* Not Yet Implementeed */ }

    // Helper

    protected abstract _toKeyedStatePayload?: (input: T) => KeyedStatePayload<T>

    protected _assertNotEmpty(state: T | null): asserts state is T {
        if (!state)
            throw new Error('Timeline is empty.')
    }

    protected _assertTick(tick: Tick): void {
        if (!this.hasState(tick))
            throw new Error(`${tick} out of range: ${this._firstTick} - ${this._lastTick}`)
    }

    // Copyable implementation

    public [$$copy](): this {

        const TimelineLike = this.constructor as new () => this

        const newTimeline = new TimelineLike()
        newTimeline._toKeyedStatePayload = this._toKeyedStatePayload

        newTimeline._cache.rawStates = [...this._cache.rawStates]
        newTimeline._cache.keyedStates = [...this._cache.keyedStates.map(k => k.copy())]
        newTimeline._firstTick = this._tick
        newTimeline._tick = this._tick
        newTimeline._lastTick = this._lastTick
        newTimeline._state = this._state

        return newTimeline
    }

}

/*** Timeline ***/

class Timeline<T extends object> extends _Timeline<T> {

    public constructor (
        protected _toKeyedStatePayload?: (state: T) => KeyedStatePayload<T>
    ) {
        super()
    }

}

/*** Exports ***/

export {

    Timeline,
    _Timeline,
    _TimelineLike,

    Tick,
    State,

    KeyedStatePayload
}