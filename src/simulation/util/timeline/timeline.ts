import { Sortable, SortedArray } from '@benzed/array'
import { $$copy, $$equals, copy, CopyComparable, equals } from '@benzed/immutable'
import { max  } from '@benzed/math'

//// Types ////

type Tick = number

/**
 * State
 */
type State<T> = Partial<T>

/**
 * KeyedState
 */
type KeyedState<T> = { valueOf(): Tick, tick: Tick, state: State<T> }

/**
 * Raw states are data that changes every tick.
 */
type RawStates<T> = Array<State<T>>

/**
 * Keyed states are data that does not change every tick.
 */
type KeyedStates<T> = SortedArray<KeyedState<T> >

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

//// Util ////

/**
 * KeyedState ValueOf
 */
function valueOf(this: { tick: number }) {
    return this.tick
}

function getClosestKeyState<T extends object>(
    states: KeyedStates<T>, 
    tick: Tick
): [state: KeyedState<T>, tick: Tick] {

    _ensureSortedArrayMethodsHack(states)

    const closestIndex = states.closestIndexOf({ valueOf, tick, state: null as unknown as T })

    return [
        states[closestIndex],
        closestIndex
    ]
}

/**
 * Sorted Array is classed as an Array due to the limitations of the engine
 * the compiler is targeting. 
 * I'll have to find away around that, or use a newer target.
 */
function _ensureSortedArrayMethodsHack<
    T extends Sortable
>(arr: SortedArray<T>): void {

    const proto = SortedArray.prototype

    // @ts-expect-error hack
    arr._getIndexViaBinarySearch = proto._getIndexViaBinarySearch
    arr.closestIndexOf = proto.closestIndexOf
    arr.copy = proto.copy
}


//// _TimelineLike ////

abstract class _TimelineLike<T extends object>  implements CopyComparable<_TimelineLike<T>>, Iterable<T>  {

    // Iterable 

    public * ticks(): Generator<number> {
        const { firstTick, lastTick } = this

        if (this.stateCount > 0)
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

    // Tick 

    public abstract get firstTick(): Tick
    public abstract get tick(): Tick
    public abstract get lastTick(): Tick

    public valueOf = valueOf

    // State 

    public abstract get state(): T
    public abstract get stateCount(): number
    public abstract get rawStateCount(): number 
    public abstract get keyStateCounts(): number[]

    public abstract pushState(state: Readonly<T>): void
    public abstract hasState(tick: Tick): boolean
    public abstract getState(tick: Tick): T | null

    public abstract applyState(tick: Tick): T
    public applyLastState(): T {
        return this.applyState(this.lastTick)
    }
    public applyFirstState(): T {
        return this.applyState(this.firstTick)
    }

    public abstract clearStatesFrom(tick: Tick): void
    public abstract clearStatesBefore(tick: Tick): void
    public clearStates(): void {
        this.clearStatesFrom(this.firstTick)
    }
    public setState(tick: Tick, state: Readonly<T>): void {
        this.clearStatesFrom(tick)
        this.pushState(state)
    }

    // CopyComparable 

    public abstract [$$copy](): this

    public [$$equals](other: unknown): other is this {
        const ThisTimeline = this.constructor as new () => this

        return (
            other instanceof ThisTimeline &&
            equals(this.firstTick, other.firstTick) &&
            equals(this.tick, other.tick) &&
            equals(this.lastTick, other.lastTick) &&
            equals(this.state, other.state)
        )
    }
}

//// _Timeline ////

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

    // State

    public get stateCount(): Tick {
        return this._state
            ? this._lastTick - this._firstTick + 1
            : 0
    }

    public get rawStateCount(): number {
        return this
            ._cache
            .rawStates
            .length
    }

    public get keyStateCounts(): number[] {
        return this
            ._cache
            .keyedStates
            .map(keyState => keyState.length)
    }


    private _state: T | null = null
    public get state(): Readonly<T> {
        this._assertNotEmpty(this._state)
        return this._state
    }

    public pushState(state: Readonly<T>): void {

        const isEmpty = !this._state
        if (isEmpty)
            this._state = state
        else
            this._lastTick++

        const tick = this._lastTick

        const rawState: T = { ...state }
        const keyStates = this._toKeyedStatePayload?.(state) ?? []

        for (let i = 0; i < keyStates.length; i++) {
            const keyState = keyStates[i]

            // Any state that is not keyed is raw,
            // so we remove any properties we find in 
            // keyed state, leaving only properties
            // that update every tick.
            for (const property in keyState)
                delete rawState[property]

            let keyedStates = this._cache.keyedStates.at(i)
            if (!keyedStates) {
                keyedStates = new SortedArray()

                this._cache.keyedStates[i] = keyedStates
            }

            const [prevKeyState] = getClosestKeyState(keyedStates, tick)

            if (!equals(keyState, prevKeyState?.state))
                keyedStates.push({
                    state: keyState,
                    tick,
                    valueOf
                })
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

    public hasState(tick: Tick): boolean {
        return (
            tick >= this._firstTick &&
            tick <= this._lastTick
        ) && this.stateCount > 0
    }

    public getState(tick: Tick): T | null {

        if (!this.hasState(tick))
            return null

        const { rawStates, keyedStates: allKeyedStates } = this._cache

        const rawState = rawStates.at(tick - this._firstTick) ?? null
        //    ^ rawState would only be undefined if these timeline doesn't
        //      have any properties that are updated every tick.

        let keyedState: State<T> | null = null

        for (const keyedStates of allKeyedStates) {

            const [{state: lastKeyedState}] = getClosestKeyState(keyedStates, tick)

            for (const p in lastKeyedState) {
                const property = p as keyof T

                if (!keyedState)
                    keyedState = {}

                keyedState[property] = lastKeyedState[property]
            }
        }

        return { ...rawState, ...keyedState } as T
    }

    public applyState(tick: Tick): Readonly<T> {

        this._assertNotEmpty(this._state)
        this._assertTick(tick)

        this._state = this.getState(tick)
        this._tick = tick
        return this._state as T
    }

    public clearStatesFrom(tick: Tick): void {
        
        this._assertTick(tick)

        const { rawStates, keyedStates: allKeyedStates } = this._cache

        // Clear raw states, if they exist
        if (rawStates.length > 0)
            rawStates.length = tick - this._firstTick

        // Clear key states
        for (const keyedStates of allKeyedStates) {

            const [closest, index] = getClosestKeyState(keyedStates, tick)

            keyedStates.length = closest.tick === tick 
                ? index 
                : index + 1
        }

        // Set last tick
        this._lastTick = max(tick - 1, this._firstTick)
        if (this._lastTick === this._firstTick)
            this._state = null
    }

    public clearStatesBefore(tick: Tick): void { 

        this._assertTick(tick)

        const { rawStates, keyedStates: allKeyedStates } = this._cache

        // Clear raw states, if they exist
        if (rawStates.length > 0)
            rawStates.splice(0, tick - this._firstTick)

        // Clear key states
        for (const keyedStates of allKeyedStates) {

            const [keyedState, closestIndex] = getClosestKeyState(keyedStates, tick)

            // the first key state tick should not be lower than this._firstTick
            keyedState.tick = tick 
            keyedStates.splice(0, closestIndex)
        }

        this._firstTick = tick
    }

    // CopyComparable

    public [$$copy](): this {

        const TimelineLike = this.constructor as new () => this
    
        const newTimeline = new TimelineLike()
        newTimeline._toKeyedStatePayload = this._toKeyedStatePayload
    
        newTimeline._cache.rawStates = [...this._cache.rawStates]
        newTimeline._cache.keyedStates = [...this._cache.keyedStates.map(copy)]

        newTimeline._firstTick = this._tick
        newTimeline._tick = this._tick
        newTimeline._lastTick = this._lastTick

        newTimeline._state = this._state

        return newTimeline
    }

    // Helper

    private readonly _cache: Cache<T> = {
        rawStates: [],
        keyedStates: []
    }

    protected abstract _toKeyedStatePayload?: (input: T) => KeyedStatePayload<T>

    protected _assertNotEmpty(state: T | null): asserts state is T {
        if (!state)
            throw new Error('Timeline is empty.')
    }

    protected _assertTick(tick: Tick): void {
        if (!this.hasState(tick))
            throw new Error(`${tick} out of range: ${this._firstTick} - ${this._lastTick}`)
    }

}

//// Timeline ////

class Timeline<T extends object> extends _Timeline<T> {

    public constructor (
        protected _toKeyedStatePayload?: (state: Readonly<T>) => KeyedStatePayload<T>
    ) {
        super()
    }

}

//// Exports ////

export {

    Timeline,
    _Timeline,
    _TimelineLike,

    Tick,
    State,

    KeyedStatePayload
}