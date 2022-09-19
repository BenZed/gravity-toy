import { floor, V2 } from "@benzed/math"
import { CACHED_VALUES_PER_TICK, NO_LINK } from './constants'
import { radiusFromMass } from "./util"

/*** Main ***/

interface BodyCache {
    readonly birthTick: number
    deathTick: number
    readonly data: number[]
}

/*** Main ***/

class Body {

    public mass: number

    public get radius(): number {
        return radiusFromMass(this)
    }

    public pos: V2
    public vel: V2

    public constructor (
        data: {
            mass: number,
            pos?: V2
            vel?: V2
        },
        tick: number,
        id: number) {

        const { mass, pos = V2.ZERO, vel = V2.ZERO } = data

        this.mass = mass
        this.pos = pos
        this.vel = vel
        this.id = id
        this._cache = {
            birthTick: tick,
            deathTick: NO_LINK,
            data: [mass, pos.x, pos.y, vel.x, vel.y, NO_LINK]
        }
    }


    public get exists(): boolean {
        return this.mass > 0
    }


    public linkId: number = NO_LINK
    public mergeId: number = NO_LINK
    public readonly id: number

    private _cache: BodyCache
    public getTickDataIndex(tick: number) {
        return (floor(tick) - this._cache.birthTick) * CACHED_VALUES_PER_TICK
    }

    public valueOf(): number {
        return this.mass
    }


}

/*** Exports ***/

export default Body

export {
    Body
}