import type { PhysicsSettings } from './simulation'

//// Simulation Constants ////

export const DEFAULT_PHYSICS: PhysicsSettings = {
    g: 100,

    physicsSteps: 4,

    realMassThreshold: 10,

    realBodiesMin: Infinity
}

export const DEFAULT_MAX_MB = 256 // MB

export const ONE_MB = 1024 ** 2 // Bytes

/**
 * Size of a number in JS, in bytes.
 */
export const NUMBER_SIZE = 8

/**
 * A body's link is it's
 */
export const NO_LINK = -1

/**
 * Each body stores 6 numbers per tick: posX, posY, velX, velY, mass, linkId.
 * Mass and linkId may be able to be optimized in the future, because they
 * don't change every tick
 */
export const CACHED_VALUES_PER_TICK = 6

/**
 * Arbitrary minimum mass for a body
 */
export const MASS_MIN = 1

/**
 * If the min radius of a body is 1, then the min diameter would be 2, so 2 pixels
 */
export const RADIUS_MIN = 1

/**
 * Arbitrary scaler for increase in radius in relationship to mass
 */
export const RADIUS_FACTOR = 1

export const RELATIVE_VELOCITY_EPSILON = 1

/**
 * Number of ticks to represent one second.
 */
export const TICK_DURATION = 1 / 60
