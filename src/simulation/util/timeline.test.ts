import { V2Json } from '@benzed/math'
import { Timeline } from './timeline'

it('Caches timeline data', () => {

    interface V3Json extends V2Json {
        z: number
    }

    const vectorTimeline = new Timeline<V3Json>(({ x, y, z }) => [{ x }, { y }, { z }])

    vectorTimeline.pushState({ x: 0, y: 0, z: 0 })

})