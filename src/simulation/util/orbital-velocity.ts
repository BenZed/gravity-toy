import { V2, sqrt, V2Json } from '@benzed/math'

import { DEFAULT_PHYSICS } from '../constants'

//// Main ////

function orbitalVelocity(
    child: { pos: V2Json } | V2Json,
    parent: { pos: V2Json, vel: V2Json, mass: number },
    g = DEFAULT_PHYSICS.g
) {

    const pos = 'pos' in child ? child.pos : child

    const relative = V2.from(pos).sub(parent.pos)
    const dist = relative.magnitude

    // I'm not sure why I have to divide by 10. According to Google
    // this equation should work without it
    const speed = sqrt(g * parent.mass / dist) * 0.1

    return relative
        .perpendicular()
        .mult(speed)
        .add(parent.vel)

}

//// Exports ////

export default orbitalVelocity

export {
    orbitalVelocity
}