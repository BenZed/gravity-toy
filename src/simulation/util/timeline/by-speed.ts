import { v2 } from '@benzed/math'
import type { BodyJson } from '../../body'

//// Exports ////

/**
 * .sort() method for bodies, by speed
 */
export const bySpeed = (a: BodyJson, b: BodyJson) => {

    const aSqrVel = v2(a.vel).sqrMagnitude
    const bSqrVel = v2(b.vel).sqrMagnitude

    return aSqrVel > bSqrVel
        ? -1
        : aSqrVel < bSqrVel
            ? 1
            : 0
}