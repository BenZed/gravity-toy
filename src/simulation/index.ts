import { V2, V2Json } from '@benzed/math'
import { BodyJson } from './simulation'
import { SimulationTimelineSettings, SimulationTimeline } from './simulation-timeline'

//// Types ////

interface GravityToySettings extends SimulationTimelineSettings {

}

//// Help ////

class Body implements BodyJson {

    public constructor (
        public id = 0,
        public pos: V2Json = V2.ZERO,
        public vel: V2Json = V2.ZERO,
        public mass = 1
    ) { }
}

class GravityToy extends SimulationTimeline<Body> {

    public constructor (settings: GravityToySettings) {
        super(settings)
    }


    protected _createBody(json: BodyJson): Body {
        return new Body(json.id, json.pos, json.vel, json.mass)
    }
}

//// Exports ////

export default GravityToy

export {
    GravityToy,
    GravityToySettings,

    Body
}