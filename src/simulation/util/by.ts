import { v2 } from '@benzed/math'
import type { BodyData } from '../body'

//// Exports ////

/**
 * .sort() method for bodies, by speed
 */
export const bySpeed = (a: BodyData, b: BodyData) => {
    const aSqrVel = v2(a.vel).sqrMagnitude
    const bSqrVel = v2(b.vel).sqrMagnitude

    return aSqrVel > bSqrVel ? -1 : aSqrVel < bSqrVel ? 1 : 0
}

export const byMass = (a: BodyData, b: BodyData) =>
    a.mass > b.mass ? -1 : a.mass < b.mass ? 1 : 0
