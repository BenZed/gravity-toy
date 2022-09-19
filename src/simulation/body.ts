import { floor, V2 } from '@benzed/math'
import is from '@benzed/is'

import { CACHED_VALUES_PER_TICK, MASS_MIN, NO_LINK } from './constants'
import { radiusFromMass } from './util'

/*** Main ***/

interface BodyCache {
    birthTick: number
    deathTick: number
    readonly data: number[]
}

interface BodyProps {
    mass: number,
    pos: V2
    vel: V2
}



/*** Main ***/

class Body {

    static validateProps(input: unknown): BodyProps {

        if (!is.plainObject(input))
            throw new Error('BodyProps must be an object')

        const {
            mass = MASS_MIN,
            vel = V2.ZERO,
            pos = V2.ZERO
        } = input as Partial<BodyProps>

        if (!is(pos, V2))
            throw new Error('pos must be a V2')

        if (!is(vel, V2))
            throw new Error('vel must be a V2')

        if (mass < MASS_MIN)
            throw new Error(`mass must be a number above or equal to ${MASS_MIN}`)


        return { mass, vel, pos }
    }

    public mass: number

    public get radius(): number {
        return radiusFromMass(this)
    }

    public pos: V2
    public vel: V2

    public constructor (
        data: Partial<BodyProps>,
        tick: number,
        id: number) {

        const {
            mass = MASS_MIN,
            pos = V2.ZERO,
            vel = V2.ZERO
        } = data

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

    private readonly _cache: BodyCache
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
    Body,
    BodyProps
}