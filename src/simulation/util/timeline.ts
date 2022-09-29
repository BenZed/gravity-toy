import SortedArray from '@benzed/array/sorted-array'
import { equals } from '@benzed/immutable'

/*** Types ***/

type TickIndex = number

type TickData<T> = Omit<Partial<T>, 'id'>

type RawTickData<T> = Array<TickData<T>>

type KeyTickData<T> = SortedArray<{ valueOf(): TickIndex, tickIndex: TickIndex, data: TickData<T> }>

type Cache<T> = {
    birthTickIndex: TickIndex,
    raw: RawTickData<T>,
    keys: KeyTickData<T>[]
}

type CacheTickDataPayload<T> = [raw: TickData<T>, ...key: TickData<T>[]]

type ToCacheTickDataPayload<T> = (input: Readonly<T>) => CacheTickDataPayload<T>

/*** Abstract ***/

abstract class TemplateTimeline<T extends { id: number | string }> {

    // Tick 

    private readonly _firstTickIndex = 0
    public get firstTickIndex() {
        return this._firstTickIndex
    }

    private _tickIndex = 0
    public get tickIndex(): TickIndex {
        return this._tickIndex
    }

    private _lastTickIndex = 0
    public get lastTickIndex() {
        return this._lastTickIndex
    }

    protected abstract _toCacheTickDataPayload(input: T): CacheTickDataPayload<T>

    // Cache

    private readonly _cache: Map<T['id'], Cache<T>> = new Map()

    // State
    private _state: readonly T[] = []
    public get state(): readonly T[] {
        return this._state
    }

    public applyStateAtTick(tickIndex: TickIndex) {
        this._state = this.getStateAtTick(tickIndex)
        this._tickIndex = tickIndex
    }

    public getStateAtTick(tickIndex: TickIndex): T[] {

        const state: T[] = []

        const tKey = {
            tickIndex,
            valueOf: this.valueOf,
            data: {} as unknown as TickData<T>
        }

        for (const [id, { birthTickIndex, raw, keys }] of this._cache) {

            const rawCache = raw.at(tickIndex - birthTickIndex)
            if (!rawCache) // Body destroyed or not born yet.
                continue

            const keyCaches = {} as TickData<T>

            for (const k1 of keys) {
                const datum = k1[k1.closestIndexOf(tKey)]

                for (const datumkey in datum.data) {
                    const k2 = datumkey as keyof TickData<T>
                    keyCaches[k2] = datum.data[k2]
                }
            }
            state.push({ ...rawCache, ...keyCaches, id } as T)
        }

        return state
    }

    public pushState(state: readonly T[]) {

        const birthTickIndex = this._lastTickIndex++

        for (const data of state) {
            const [rawData, ...keyDatas] = this._toCacheTickDataPayload(data)

            let cache = this._cache.get(data.id)
            if (!cache) {
                cache = {
                    birthTickIndex,
                    raw: [],
                    keys: []
                }
                this._cache.set(data.id, cache)
            }

            cache.raw.push(rawData)

            for (let i = 0; i < keyDatas.length; i++) {
                const keyData = keyDatas[i]

                let keyCache = cache.keys.at(i)
                if (!keyCache) {
                    keyCache = new SortedArray()
                    cache.keys[i] = keyCache
                }

                const key = {
                    data: keyData as TickData<T>,
                    tickIndex: birthTickIndex,
                    valueOf: this.valueOf
                }

                const prevKeyIndex = keyCache.closestIndexOf(key)
                const prevKeyData = keyCache[prevKeyIndex]
                if (!equals(keyData, prevKeyData))
                    keyCache.push(key)
            }
        }
    }

    public abstract clearStatesBeforeTick(tickIndex: TickIndex): void

    public abstract clearStatesAfterTick(tickIndex: TickIndex): void

    public valueOf() {
        return this.tickIndex
    }

}

/*** Main ***/

class Timeline<T extends { id: string | number }> extends TemplateTimeline<T> {

    public constructor (
        protected _toCacheTickDataPayload: ToCacheTickDataPayload<T>
    ) {
        super()
    }

}

/*** Exports ***/

export default Timeline

export {
    Timeline,
    TemplateTimeline,

    TickIndex,
    TickData,

    CacheTickDataPayload
}