
/*** Simulation Constants ***/

export interface Physics {

    /**
     * Gravitational Constant. Higher values, faster bodies.
     */
    g: number

    /**
     * Higher steps mean more calclation time, but more precision.
     */
    physicsSteps: number

    /**
     * As a lossy optimization, bodies below a certain mass threshold can be considered
     * seudo bodies and excluded from the primary integration loop. This speeds 
     * up the simulation at a cost of accuracy.
     */
    realMassThreshold: number,

    /**
     * There must be at least this many real bodies before bodies under the aforementioned
     * mass threshold are considered psuedo. Infinity means disabled.
     **/
    realBodiesMin: number

}

export const DEFAULT_PHYSICS = {


    g: 100,

    physicsSteps: 1,

    realMassThreshold: 10,

    realBodiesMin: Infinity

} as const

export const DEFAULT_MAX_MB = 256 // mb

export const ONE_MB = 1024 ** 2 // bytes

// size of a javascript number value, in bytes
export const NUMBER_SIZE = 8

// A link is a body id. A body's "link" is simply the body that it is
// Most attracted to. "Parent" would be a misnomer, becase a large body could
// have a smaller body that is exerting more force on it than any other body.
// If a body was just created, it will have no link for it's initial tick, so
// It gets this value as it's "linkId"
export const NO_LINK = -1

// Each body stores 6 numbers per tick: posX, posY, velX, velY, mass, linkId.
// Mass and linkId may be able to be optimized in the future, because they
// don't change every tick
export const CACHED_VALUES_PER_TICK = 6

// Arbitrary minimum mass for a body
export const MASS_MIN = 1

// If the min radius of a body is 1, then the min diameter would be 2, so 2 pixels
export const RADIUS_MIN = 1

// Arbitrary scaler for increase in radius in relationship to mass
export const RADIUS_FACTOR = 1

// 60 ticks equals one second
export const TICK_DURATION = 1 / 60
