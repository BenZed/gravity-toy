import { V2, sqrt } from '@benzed/math'
import is from '@benzed/is'

import { DEFAULT_PHYSICS } from '../constants'
import Body from '../body'

/*** Main ***/

function orbitalVelocity(
    bodyOrPos: Body | V2,
    parent: Body,
    g = DEFAULT_PHYSICS.g
) {

    const pos = is(bodyOrPos, V2) ? bodyOrPos : bodyOrPos.pos

    const relative = pos.sub(parent.pos)
    const dist = relative.magnitude

    // I'm not sure why I have to divide by 10. According to Google
    // this equation should work without it
    const speed = sqrt(g * parent.mass / dist) * 0.1

    return relative
        .perpendicular()
        .mult(speed)
        .add(parent.vel)

}

/*** Exports ***/

export default orbitalVelocity

export {
    orbitalVelocity
}