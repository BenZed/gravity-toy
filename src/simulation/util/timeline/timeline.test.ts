import { copy, equals } from '@benzed/immutable'
import { beforeAll, describe, it, expect } from '@jest/globals'
import { Timeline } from './index'

//// Types

interface State {
    a: number
    b: number
    c: number
}

//// State

let timeline: Timeline<State>

const input = [
    { a: 0, b: 0, c: 0 },
    { a: 1, b: 0, c: 1 },
    { a: 2, b: 0, c: 2 },
    { a: 3, b: 0, c: 2 }
]

//// Tests

beforeAll(() => {
    timeline = new Timeline<State>(({ b, c }) => [{ b }, { c }])

    for (const state of input) timeline.pushState(state)
})

describe('construct', () => {
    const emptyTimeline = new Timeline()

    it('state throws before any states are added', () => {
        expect(() => emptyTimeline.state).toThrow('Timeline is empty.')
    })

    for (const field of [
        'firstTick',
        'tick',
        'lastTick',
        'stateCount'
    ] as (keyof Timeline<any>)[])
        it(`${field.toString()} is initially 0`, () => {
            expect(emptyTimeline[field]).toBe(0)
        })
})

describe('CopyCompare', () => {
    it('implements CopyCompare', () => {
        const timelineClone = copy(timeline)
        expect(timelineClone).toEqual(timeline)
        expect(timelineClone).not.toBe(timeline)
        expect(equals(timelineClone, timeline)).toBe(true)
    })
})

describe('iterable', () => {
    it('[...this] iterates states', () => {
        const states = [...timeline]
        expect(states).toHaveLength(input.length)
        expect(states).toEqual(input)
    })

    it('[...this.ticks()] iterates ticks', () => {
        const ticks = [...timeline.ticks()]
        expect(ticks).toHaveLength(input.length)
        expect(ticks).toEqual(input.map((_, i) => i))
    })
})

describe('.state', () => {
    it('this.state matches state at current tick', () => {
        expect(timeline.tick).toBe(0)
        expect(timeline.state).toEqual(input[0])
    })
})

describe('pushState()', () => {
    it('updates stateCount', () => {
        expect(timeline.stateCount).toEqual(input.length)
    })

    it('updates lastTick', () => {
        expect(timeline.lastTick).toEqual(input.length - 1)
    })

    it('splits data into key & raw states states', () => {
        const [k1, k2] = timeline.keyStateCounts

        expect(timeline.rawStateCount).toEqual(input.length)

        expect(k1).toEqual(1)
        expect(k2).toEqual(3)
    })
})

describe('hasState()', () => {
    it('returns true if state exists at index', () => {
        expect(timeline.hasState(0)).toEqual(true)
    })

    it('returns false otherwise', () => {
        expect(timeline.hasState(-1)).toEqual(false)
        expect(timeline.hasState(4)).toEqual(false)
    })
})

describe('getState()', () => {
    it('gets state at tick', () => {
        for (const tick of timeline.ticks())
            expect(timeline.getState(tick)).toEqual(input[tick])
    })

    it('gets null for states at invalid indexes', () => {
        expect(timeline.getState(-1)).toEqual(null)
        expect(timeline.getState(input.length)).toEqual(null)
    })
})

describe('applyState()', () => {
    it('sets the current state', () => {
        expect(copy(timeline).applyState(1)).toEqual(input[1])
    })

    it('throws an error trying to apply non-existant states', () => {
        const emptyTimeline = new Timeline()

        expect(() => emptyTimeline.applyState(0)).toThrow('Timeline is empty')
        expect(() => copy(timeline).applyState(4)).toThrow(
            '4 out of range: 0 - 3'
        )
    })

    it('applyLastState() is applyState(this.lastTick)', () => {
        expect(copy(timeline).applyLastState()).toEqual(input.at(-1))
    })

    it('applyFirstState() is applyState(this.firstTick)', () => {
        expect(copy(timeline).applyFirstState()).toEqual(input.at(0))
    })
})

describe('clearStatesFrom()', () => {
    let timelineCopy: Timeline<State>
    beforeAll(() => {
        timelineCopy = copy(timeline)
        timelineCopy.clearStatesFrom(2)
    })

    it('throws if out of range', () => {
        expect(() => timeline.clearStatesFrom(5)).toThrow('out of range')
    })

    it('clears all states form provided tick forward', () => {
        expect([...timelineCopy]).toEqual(input.slice(0, 2))
    })

    it('sets last tick', () => {
        expect(timelineCopy.lastTick).toBe(1)
    })

    it('clears raw states', () => {
        expect(timelineCopy.rawStateCount).toEqual(2)
    })

    it('clears keyframe states', () => {
        const [b, c] = timelineCopy.keyStateCounts

        expect(b).toEqual(1)
        expect(c).toEqual(2)
    })

    it('handles clearing timeline', () => {
        const timelineClear = copy(timeline)
        timelineClear.clearStatesFrom(timelineClear.firstTick)

        expect(timelineClear.lastTick).toEqual(timelineClear.firstTick)
        expect(timelineClear.keyStateCounts).toEqual([0, 0])
        expect(timelineClear.hasState(0)).toEqual(false)
        expect([...timelineClear.states()]).toEqual([])
        expect(() => timelineClear.state).toThrow('Timeline is empty')
    })
})

describe('clearStatesBefore', () => {
    let timelineCopy: Timeline<State>
    beforeAll(() => {
        timelineCopy = copy(timeline)
        timelineCopy.clearStatesBefore(2)
    })

    it('throws if out of range', () => {
        expect(() => timeline.clearStatesFrom(5)).toThrow('out of range')
    })

    it('clears all states before provided tick', () => {
        expect([...timelineCopy]).toEqual(input.slice(2))
    })

    it('sets last tick', () => {
        expect(timelineCopy.firstTick).toBe(2)
    })

    it('clears raw states', () => {
        expect(timelineCopy.rawStateCount).toEqual(2)
    })

    it('has correct state count', () => {
        expect(timelineCopy.stateCount).toEqual(2)
    })

    it('clears keyframe states', () => {
        const [b, c] = timelineCopy.keyStateCounts

        expect(b).toEqual(1)
        expect(c).toEqual(1)
    })

    it('does nothing if given first tick', () => {
        const timeline2 = copy(timeline)
        timeline2.clearStatesBefore(0)

        expect(timeline2).toEqual(timeline)
    })
})
