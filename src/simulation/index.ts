import { V2, V2Json } from '@benzed/math'

import { BodyDataWithId } from './body'
import {
    SimulationTimelineSettings,
    SimulationTimeline
} from './simulation-timeline'

//// Types ////

type GravityToySettings = SimulationTimelineSettings

//// Help ////

class Body implements BodyDataWithId {
    public constructor(
        public id = 0,
        public pos: V2Json = V2.ZERO,
        public vel: V2Json = V2.ZERO,
        public mass = 1
    ) {}
}

class GravityToy extends SimulationTimeline<Body> {
    public constructor(settings: GravityToySettings) {
        super(settings)
    }

    protected _createBody(json: BodyDataWithId): Body {
        return new Body(json.id, json.pos, json.vel, json.mass)
    }
}

//// Exports ////

export default GravityToy

export { GravityToy, GravityToySettings, Body }
