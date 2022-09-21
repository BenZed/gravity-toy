import { V2 } from '@benzed/math'
import { Renderer as GravityToyRenderer } from '../renderer'
import { Simulation as GravityToy } from '../simulation'

/*** Main ***/

function setupGravityToy(
    toy: GravityToy,
    rend: GravityToyRenderer
): void {

    const bodies = toy.createBodies([{
        pos: V2.ZERO, vel: V2.RIGHT.mult(100), mass: 1000
    }, {
        pos: V2.ZERO, vel: V2.ZERO, mass: 100
    }, {
        pos: V2.ZERO, vel: V2.UP.mult(100), mass: 100
    }])

    // rend.camera.referenceFrame = bodies.at(- 1) ?? null
    rend.camera.target.pos = V2.ZERO
    rend.camera.target.zoom = 1
}

/*** Exports ***/

export default setupGravityToy

export {
    setupGravityToy
}