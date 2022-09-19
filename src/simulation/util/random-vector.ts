import { random, sqrt, cos, sin, PI, V2 } from '@benzed/math'

/*** Main ***/

function randomVector(radius: number) {

    const angle = random(0, 2 * PI)
    const rRadiusSqr = random(radius ** 2)
    const rRadius = sqrt(rRadiusSqr)

    return new V2(rRadius * cos(angle), rRadius * sin(angle))
}

/*** Exports ***/

export default randomVector

export {
    randomVector
}
