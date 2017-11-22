
/******************************************************************************/
// Seperated Constants Module
/******************************************************************************/

// I typically export constants from modules that they are cheifly related.
// In this case, however, worker.js is running in a different process, and I
// Don't want it to have to run a bunch of code it doesn't need.

export const DEFAULT_PHYSICS = Object.freeze({

  // Gravitational Constant
  g: 1,

  // Higher steps mean more calculation time, but more precision
  physicsSteps: 4,

  // As a lossy optimization, bodies below a certain mass threshold can be considered
  // pseudo bodies and excluded from the primary integration loop. This speeds
  // up the simulation at a cost of realism. 0 means disabled.
  realMassThreshold: 0,

  // There must be at least this many real bodies before bodies under the aforementioned
  // mass threshold are considered psuedo
  realBodiesMin: Infinity

})

// megabytes
export const DEFAULT_MAX_MB = 256

// bytes
export const ONE_MB = 1024 ** 2

// size of a javascript number value, in bytes
export const NUMBER_SIZE = 8

// A link is a body id. A body's "link" is simply the body that the body is
// Most attracted to. "Parent" would be a misnomber, becase a large body could
// have a smaller body that is exerting more force on it than any other body.
// If a body was just created, it will have no link for it's initial tick, so
// It gets this value as it'd "linkId"
export const NO_LINK = -1

// Each body stores 6 numbers per tick: posX, posY, velX, velY, mass, parentIndex.
// Mass and parentIndex may be able to be optimized in the future, because they
// don't change every tick.
export const CACHED_VALUES_PER_TICK = 6

// Arbitrary minimum mass for a body
export const MASS_MIN = 50

// Arbitrary unit, but works for pixels
export const RADIUS_MIN = 0.5

// Scaler for increase in radius in relationship to mass
export const RADIUS_FACTOR = 0.25
