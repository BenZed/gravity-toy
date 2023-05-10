import { SortedArray } from '@benzed/array'
import { $$copy, $$equals, copy, equals } from '@benzed/immutable'
import { max } from '@benzed/math'

//// Types ////

type Tick = number

type State<T> = Partial<T>

/**
 * State at a given Tick
 */
type KeyedState<T> = { valueOf(): Tick; tick: Tick; state: State<T> }

/**
 * Raw states are data that changes every tick.
 */
type RawStates<T> = Array<State<T>>

/**
 * Keyed states are data that does not change every tick.
 */
type KeyedStates<T> = SortedArray<KeyedState<T>>

type Cache<T> = {
    rawStates: RawStates<T>
    keyedStates: KeyedStates<T>[]
}

/**
 * An array of objects containing values that should
 * be keyed separately.
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
 * // only creates a new key-state for x
 * const vp2: KeyedStatePayload<Vector> = [{x}, {y}]
 *
 * ```
 */
type KeyedStatePayload<T> = State<T>[]

//// _Timeline ////

abstract class _Timeline<T extends object> {
    // Tick

    protected _firstTick = 0
    get firstTick(): Tick {
        return this._firstTick
    }

    protected _tick = 0
    get tick(): Tick {
        return this._tick
    }

    protected _lastTick = 0
    get lastTick(): Tick {
        return this._lastTick
    }

    // State

    get stateCount(): Tick {
        return this._state ? this._lastTick - this._firstTick + 1 : 0
    }

    get rawStateCount(): number {
        return this._cache.rawStates.length
    }

    get keyStateCounts(): number[] {
        return this._cache.keyedStates.map(keyState => keyState.length)
    }

    private _state: T | null = null
    get state(): Readonly<T> {
        this._assertNotEmpty(this._state)
        return this._state
    }

    // State

    pushState(state: Readonly<T>): void {
        const isEmpty = !this._state
        if (isEmpty) this._state = state
        else this._lastTick++

        const tick = this._lastTick

        const rawState: T = { ...state }
        const keyStates = this._toKeyedStatePayload?.(state) ?? []

        for (let i = 0; i < keyStates.length; i++) {
            const keyState = keyStates[i]

            // Any state that is not keyed is raw,
            // so we remove any properties we find in
            // keyed state, leaving only properties
            // that update every tick.
            for (const property in keyState) delete rawState[property]

            let keyedStates = this._cache.keyedStates.at(i)
            if (!keyedStates) {
                keyedStates = new SortedArray()

                this._cache.keyedStates[i] = keyedStates
            }

            const [prevKeyState] = this._getClosestKeyState(keyedStates, tick)

            if (!equals(keyState, prevKeyState?.state))
                keyedStates.push({
                    state: keyState,
                    tick,
                    valueOf() {
                        return this.tick
                    }
                })
        }

        // Only push rawState array if there are keys remaining.
        const numRawKeys = Object.keys(rawState).length
        if (numRawKeys > 0) this._cache.rawStates.push(rawState)
        else if (this._cache.rawStates.length !== 0) {
            throw new Error(
                'Timeline raw state consumption must be consistent. ' +
                    'Raw data must be pushed every tick or not at all.'
            )
        }
    }

    hasState(tick: Tick): boolean {
        return (
            tick >= this._firstTick &&
            tick <= this._lastTick &&
            this.stateCount > 0
        )
    }

    getState(tick: Tick): T | null {
        if (!this.hasState(tick)) return null

        const { rawStates, keyedStates: allKeyedStates } = this._cache

        const rawState = rawStates.at(tick - this._firstTick) ?? null
        //    ^ rawState would only be undefined if these timeline doesn't
        //      have any properties that are updated every tick.

        let keyedState: State<T> | null = null

        for (const keyedStates of allKeyedStates) {
            const [{ state: lastKeyedState }] = this._getClosestKeyState(
                keyedStates,
                tick
            )

            for (const p in lastKeyedState) {
                const property = p as keyof T

                if (!keyedState) keyedState = {}

                keyedState[property] = lastKeyedState[property]
            }
        }

        return { ...rawState, ...keyedState } as T
    }

    applyState(tick: Tick): Readonly<T> {
        this._assertNotEmpty(this._state)
        this._assertTick(tick)

        this._state = this.getState(tick)
        this._tick = tick
        return this._state as T
    }
    applyLastState(): T {
        return this.applyState(this.lastTick)
    }
    applyFirstState(): T {
        return this.applyState(this.firstTick)
    }

    clearStatesFrom(tick: Tick): void {
        this._assertTick(tick)

        const { rawStates, keyedStates: allKeyedStates } = this._cache

        // Clear raw states, if they exist
        if (rawStates.length > 0) rawStates.length = tick - this._firstTick

        // Clear key states
        for (const keyedStates of allKeyedStates) {
            const [closest, index] = this._getClosestKeyState(keyedStates, tick)

            keyedStates.length = closest.tick === tick ? index : index + 1
        }

        // Set last tick
        this._lastTick = max(tick - 1, this._firstTick)
        if (this._lastTick === this._firstTick) this._state = null
    }

    clearStates(): void {
        this.clearStatesFrom(this.firstTick)
    }

    clearStatesBefore(tick: Tick): void {
        this._assertTick(tick)

        const { rawStates, keyedStates: allKeyedStates } = this._cache

        // Clear raw states, if they exist
        if (rawStates.length > 0) rawStates.splice(0, tick - this._firstTick)

        // Clear key states
        for (const keyedStates of allKeyedStates) {
            const [keyedState, closestIndex] = this._getClosestKeyState(
                keyedStates,
                tick
            )

            // the first key state tick should not be lower than this._firstTick
            keyedState.tick = tick
            keyedStates.splice(0, closestIndex)
        }

        this._firstTick = tick
    }

    setState(tick: Tick, state: Readonly<T>): void {
        this.clearStatesFrom(tick)
        this.pushState(state)
    }

    // Iterable

    *ticks(): Generator<number> {
        const { firstTick, lastTick } = this

        if (this.stateCount > 0)
            for (let i = firstTick; i <= lastTick; i++) yield i
    }

    *states(): Generator<T> {
        for (const tick of this.ticks()) yield this.getState(tick) as T
    }

    *[Symbol.iterator](): Generator<T> {
        yield* this.states()
    }

    // Helper

    protected _getClosestKeyState(
        states: KeyedStates<T>,
        tick: Tick
    ): [state: KeyedState<T>, tick: Tick] {
        // EnsureSortedArrayMethods
        {
            /**
             * TODO
             * Sorted Array is classed as an Array due to the limitations of the engine
             * the compiler is targeting.
             * I'll have to find away around that, or use a newer target.
             */
            // @ts-expect-error hack
            states._getIndexViaBinarySearch =
                // @ts-expect-error hack
                SortedArray.prototype._getIndexViaBinarySearch
            states.closestIndexOf = SortedArray.prototype.closestIndexOf
            states.copy = SortedArray.prototype.copy
        }

        const closestIndex = states.closestIndexOf({
            valueOf() {
                return this.tick
            },
            tick,
            state: null as unknown as T
        })

        return [states[closestIndex], closestIndex]
    }

    private readonly _cache: Cache<T> = {
        rawStates: [],
        keyedStates: []
    }

    protected abstract _toKeyedStatePayload?: (input: T) => KeyedStatePayload<T>

    protected _assertNotEmpty(state: T | null): asserts state is T {
        if (!state) throw new Error('Timeline is empty.')
    }

    protected _assertTick(tick: Tick): void {
        if (!this.hasState(tick))
            throw new Error(
                `${tick} out of range: ${this._firstTick} - ${this._lastTick}`
            )
    }

    // CopyComparable

    [$$equals](other: unknown): other is this {
        const ThisTimeline = this.constructor as new () => this

        return (
            other instanceof ThisTimeline &&
            equals(this.firstTick, other.firstTick) &&
            equals(this.tick, other.tick) &&
            equals(this.lastTick, other.lastTick) &&
            equals(this.state, other.state)
        )
    }

    [$$copy](): this {
        const TimelineLike = this.constructor as new () => this

        const timeline = new TimelineLike()
        timeline._toKeyedStatePayload = this._toKeyedStatePayload

        timeline._cache.rawStates = [...this._cache.rawStates]
        timeline._cache.keyedStates = [...this._cache.keyedStates.map(copy)]

        timeline._firstTick = this._tick
        timeline._tick = this._tick
        timeline._lastTick = this._lastTick

        timeline._state = this._state

        return timeline
    }
}

//// Timeline ////

class Timeline<T extends object> extends _Timeline<T> {
    constructor(
        protected _toKeyedStatePayload?: (
            state: Readonly<T>
        ) => KeyedStatePayload<T>
    ) {
        super()
    }
}

//// Exports ////

export { Timeline, _Timeline, Tick, State, KeyedStatePayload }
