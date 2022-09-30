import { copy, equals } from '@benzed/immutable'
import { V2Json } from '@benzed/math'
import { Timeline } from './timeline'

interface V3Json extends V2Json {
    z: number
}

let vectorTimeline: Timeline<V3Json>

const vectorTimelineInput = [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: 2 },
    { x: 1, y: 0, z: 2 }
]
beforeAll(() => {

    vectorTimeline = new Timeline<V3Json>(({ x, y, z }) => [{ x }, { y }, { z }])

    for (const input of vectorTimelineInput)
        vectorTimeline.pushState(input)

})

it('Caches timeline data', () => {
    expect(vectorTimeline.numStates).toEqual(4)
    expect(vectorTimeline.firstTick).toEqual(0)
})

it('Splits data into key states', () => {

    const [x, y, z] = vectorTimeline.getKeyStateCounts()

    expect(x).toEqual(2)
    expect(y).toEqual(1)
    expect(z).toEqual(3)

})

it('V3Json has no raw states, as all properties are consumed by key states', () => {
    expect(vectorTimeline.getRawStateCount()).toEqual(0)
})

it('current state matches state at index', () => {
    expect(vectorTimeline.tick).toBe(0)
    expect(vectorTimeline.state).toEqual({ x: 0, y: 0, z: 0 })
})

it('states match at other tick indexes', () => {
    expect(vectorTimeline.getStateAtTick(0)).toEqual({ x: 0, y: 0, z: 0 })
    expect(vectorTimeline.getStateAtTick(1)).toEqual({ x: 0, y: 0, z: 1 })
    expect(vectorTimeline.getStateAtTick(2)).toEqual({ x: 0, y: 0, z: 2 })
    expect(vectorTimeline.getStateAtTick(3)).toEqual({ x: 1, y: 0, z: 2 })
})

it('throws an error trying to get non-existant states', () => {

    const emptyTimeline = new Timeline()

    expect(() => emptyTimeline.applyStateAtTick(0)).toThrow('Timeline is empty')
    expect(() => vectorTimeline.applyStateAtTick(4)).toThrow('4 out of range: 0 - 3')
})

it('is iterable', () => {

    const states = [...vectorTimeline]

    expect(states).toHaveLength(4)
    expect(states).toEqual(vectorTimelineInput)
})

it('gets state at tick', () => {
    for (const index of vectorTimeline.ticks())
        expect(vectorTimeline.getStateAtTick(index)).toEqual(vectorTimelineInput[index])
})

it('gets null for states at invalid indexes', () => {
    expect(vectorTimeline.getStateAtTick(-1)).toEqual(null)
    expect(vectorTimeline.getStateAtTick(5)).toEqual(null)
})

it('has state at index', () => {
    expect(vectorTimeline.hasStateAtTick(-1)).toEqual(false)
    expect(vectorTimeline.hasStateAtTick(0)).toEqual(true)
    expect(vectorTimeline.hasStateAtTick(4)).toEqual(false)
})

it('implments CopyCompare', () => {
    const vectorTimelineClone = copy(vectorTimeline)
    expect(vectorTimelineClone).toEqual(vectorTimeline)
    expect(equals(vectorTimelineClone, vectorTimeline)).toBe(true)
})