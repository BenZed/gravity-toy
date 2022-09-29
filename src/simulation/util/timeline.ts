import SortedArray from '@benzed/array/sorted-array'
import { $$copy, $$equals, copy, CopyComparable, equals } from '@benzed/immutable'
import { Constructor } from '@benzed/is'

/*** TODO ***/

// Move this to somewhere in the @benzed/* namespace

/*** Types ***/

type TickIndex = number

type TickData<T> = Partial<T>

type RawTickData<T> = Array<TickData<T>>

type KeyTickData<T> = SortedArray<{ valueOf(): TickIndex, tickIndex: TickIndex, tickData: TickData<T> }>

type Cache<T> = {
    rawTickData: RawTickData<T>,
    keyedTickDatas: KeyTickData<T>[]
}

type CacheTickDataPayload<T> = [raw: TickData<T>, ...key: TickData<T>[]]
type ToCacheTickDataPayload<T> = (input: Readonly<T>) => CacheTickDataPayload<T>

/*** Helper ***/

function $$copyTimelineState<T extends {
    constructor: Constructor<any>,
    _state: any,
    state: any,
    _toCacheTickDataPayload: ToCacheTickDataPayload<any>
}>(this: T) {

    const TimelineLike = this.constructor

    const newTimeline = new TimelineLike()
    newTimeline._state = copy(this.state)
    newTimeline._toCacheTickDataPayload = this._toCacheTickDataPayload

    return newTimeline
}

/*** Template ***/

abstract class _TimelineLike<T> implements CopyComparable<_TimelineLike<T>> {

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

/*** Abstract ***/

abstract class _Timeline<T> extends _TimelineLike<T>{

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
        rawTickData: [],
        keyedTickDatas: []
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

        const [rawData, ...keyDatas] = this._toCacheTickDataPayload(state)

        this._cache.rawTickData.push(rawData)

        for (let i = 0; i < keyDatas.length; i++) {
            const keyData = keyDatas[i]

            let keyTickData = this._cache.keyedTickDatas.at(i)
            if (!keyTickData) {
                keyTickData = new SortedArray()
                this._cache.keyedTickDatas[i] = keyTickData
            }

            const tickIndexValue = {
                tickData: keyData as TickData<T>,
                tickIndex: birthTickIndex,
                valueOf: this.valueOf
            }

            const prevKeyIndex = keyTickData.closestIndexOf(tickIndexValue)
            const prevKeyData = keyTickData[prevKeyIndex]
            if (!equals(keyData, prevKeyData))
                keyTickData.push(tickIndexValue)
        }
    }

    public applyStateAtTick(tickIndex: TickIndex) {

        if (tickIndex < this._firstTickIndex || tickIndex > this._lastTickIndex)
            throw new Error(`${tickIndex} out of range.`)

        this._state = this.getStateAtTick(tickIndex)
        this._tickIndex = tickIndex
    }

    public hasStateAtTick(tickIndex: TickIndex): boolean {
        return !this.getStateAtTick(tickIndex)
    }

    public getStateAtTick(tickIndex: TickIndex): T | null {

        const { rawTickData, keyedTickDatas } = this._cache

        const rawState = rawTickData.at(tickIndex - this._firstTickIndex)
        if (!rawState)
            return null

        const tickIndexValue = {
            tickIndex,
            valueOf: this.valueOf,
            tickData: {} as unknown as TickData<T>
        }

        const keyedState = {} as TickData<T>

        for (const keyedTickData of keyedTickDatas) {
            const { tickData } = keyedTickData[keyedTickData.closestIndexOf(tickIndexValue)]

            for (const p in tickData) {
                const property = p as keyof TickData<T>

                keyedState[property] = tickData[property]
            }
        }

        return { ...rawState, ...keyedState } as T
    }

    public clearStatesBeforeTick(tickIndex: TickIndex): void { /* Not Yet Implementeed */ }

    public clearStatesAfterTick(tickIndex: TickIndex): void {/* Not Yet Implementeed */ }

    // 

    protected abstract _toCacheTickDataPayload(input: T): CacheTickDataPayload<T>

    public [$$copy] = $$copyTimelineState

}

/*** Main ***/

class Timeline<T> extends _Timeline<T> {

    public constructor (
        protected _toCacheTickDataPayload: ToCacheTickDataPayload<T>
    ) {
        super()
    }

}

/*** MultiTimeline ***/

abstract class _MultiTimeline<T extends { id: number | string }> extends _TimelineLike<readonly T[]> {

    public get firstTickIndex() {
        return this._firstCache?.firstTickIndex ?? 0
    }
    public get tickIndex(): TickIndex {
        return this._firstCache?.tickIndex ?? 0
    }
    public get lastTickIndex() {
        return this._firstCache?.lastTickIndex ?? 0
    }

    // Cache

    private get _firstCache() {
        for (const cache of this._cacheMap.values())
            return cache

        return null
    }

    private readonly _cacheMap: Map<T['id'], Timeline<T>> = new Map()

    // State
    private _state: readonly T[] = []
    public get state(): readonly T[] {
        return this._state
    }

    public pushState(states: readonly T[]) {

        for (const state of states) {
            let timeline = this._cacheMap.get(state.id)
            if (!timeline) {
                timeline = new Timeline(this._toCacheTickDataPayload)
                this._cacheMap.set(state.id, timeline)
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
        for (const [id, timeline] of this._cacheMap) {
            const state = timeline.getStateAtTick(tickIndex)
            if (state)
                states.push({ ...state, id } as T)
        }
        return states
    }

    public clearStatesBeforeTick(tickIndex: TickIndex): void { /* Not Yet Implementeed */ }

    public clearStatesAfterTick(tickIndex: TickIndex): void {/* Not Yet Implementeed */ }

    // 

    protected abstract _toCacheTickDataPayload(input: T): CacheTickDataPayload<T>

    public [$$copy] = $$copyTimelineState

}

class MultiTimeline<T extends { id: string | number }> extends _MultiTimeline<T> {

    public constructor (
        protected _toCacheTickDataPayload: (input: Readonly<T>) => CacheTickDataPayload<T>
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
    TickData,
    CacheTickDataPayload
}