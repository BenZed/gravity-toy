import SortedArray from '@benzed/array/sorted-array'
import { equals } from '@benzed/immutable'

/*** TODO ***/

// Move this to somewhere in the @benzed/* namespace

/*** Types ***/

type TickIndex = number

type TickData<T> = Partial<T>

type RawTickData<T> = Array<TickData<T>>

type SortedTickData<T> = SortedArray<{ valueOf(): TickIndex, tickIndex: TickIndex, tickData: TickData<T> }>

type Cache<T> = {
    rawTickData: RawTickData<T>,
    sortedTickDatas: SortedTickData<T>[]
}

type CacheTickDataPayload<T> = [raw: TickData<T>, ...key: TickData<T>[]]

/*** Template ***/

abstract class _TimelineTemplate<T> {

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

}

/*** Abstract ***/

abstract class _Timeline<T> extends _TimelineTemplate<T>{

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
        sortedTickDatas: []
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

            let keyTickData = this._cache.sortedTickDatas.at(i)
            if (!keyTickData) {
                keyTickData = new SortedArray()
                this._cache.sortedTickDatas[i] = keyTickData
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

        const { rawTickData, sortedTickDatas } = this._cache

        const rawState = rawTickData.at(tickIndex - this._firstTickIndex)
        if (!rawState)
            return null

        const tickIndexValue = {
            tickIndex,
            valueOf: this.valueOf,
            tickData: {} as unknown as TickData<T>
        }

        const state = {} as TickData<T>

        for (const sortedTickData of sortedTickDatas) {
            const { tickData } = sortedTickData[sortedTickData.closestIndexOf(tickIndexValue)]

            for (const key in tickData) {
                const tickDataKey = key as keyof TickData<T>

                state[tickDataKey] = tickData[tickDataKey]
            }
        }

        return { ...rawState, ...state } as T
    }

    public clearStatesBeforeTick(tickIndex: TickIndex): void { /* Not Yet Implementeed */ }

    public clearStatesAfterTick(tickIndex: TickIndex): void {/* Not Yet Implementeed */ }

    // 

    protected abstract _toCacheTickDataPayload(input: T): CacheTickDataPayload<T>

}

/*** Main ***/

class Timeline<T> extends _Timeline<T> {

    public constructor (
        protected _toCacheTickDataPayload: (input: Readonly<T>) => CacheTickDataPayload<T>
    ) {
        super()
    }

}

/*** MultiTimeline ***/

abstract class _MultiTimeline<T extends { id: number | string }> extends _TimelineTemplate<readonly T[]> {

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