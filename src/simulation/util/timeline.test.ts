import { V2Json } from '@benzed/math'
import { MultiTimeline } from './timeline'

it('Caches timeline data', () => {

    interface Coords extends V2Json {
        id: string
        z: number
    }

    const vectorTimeline = new MultiTimeline<Coords>(({ x, y, z }) => [{ x, y }, { z }])

    vectorTimeline.pushState([{ id: 'ace', x: 0, y: 0, z: 0 }])

})