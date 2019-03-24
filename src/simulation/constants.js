/******************************************************************************/
// Simulation Constnats
/******************************************************************************/

export const DEFAULT_PHYSICS = Object.freeze({

  // Gravitational Constant, completely arbitrary value. This number was chosen
  // because it makes bodies move quickly at zoom x1
  g: 256,

  // Higher steps mean more calculation time, but more precision
  physicsSteps: 3,

  // As a lossy optimization, bodies below a certain mass threshold can be considered
  // pseudo bodies and excluded from the primary integration loop. This speeds
  // up the simulation at a cost of realism.
  realMassThreshold: 10,

  // There must be at least this many real bodies before bodies under the aforementioned
  // mass threshold are considered psuedo. Infinity means disabled.
  realBodiesMin: Infinity

})

// megabytes
export const DEFAULT_MAX_MB = 256

// bytes
export const ONE_MB = 1024 ** 2

// size of a javascript number value, in bytes
export const NUMBER_SIZE = 8

// A link is a body id. A body's "link" is simply the body that it is
// Most attracted to. "Parent" would be a misnomer, becase a large body could
// have a smaller body that is exerting more force on it than any other body.
// If a body was just created, it will have no link for it's initial tick, so
// It gets this value as it's "linkId"
export const NO_LINK = -1

// Each body stores 6 numbers per tick: posX, posY, velX, velY, mass, parentIndex.
// Mass may be able to be optimized in the future, because it doesn't change
// every tick.
export const CACHED_VALUES_PER_TICK = 6

// Arbitrary minimum mass for a body
export const MASS_MIN = 1

// If the min radius of a body is 1, then the min diameter would be 2, so 2 pixels
export const RADIUS_MIN = 1

// Arbitrary scaler for increase in radius in relationship to mass
export const RADIUS_FACTOR = 1

// 60 ticks equals one second
export const TICK_DURATION = 1 / 60

/******************************************************************************/
// Rendering Constnats
/******************************************************************************/

export const DEFAULT_RENDERING = Object.freeze({

  bodyColorBy: 'doppler', // or 'mass'

  minZoom: 1,
  maxZoom: 100000,

  grid: true,
  relations: false,

  // length of trail showing where body has been, in ticks.
  // 0 - off
  // positive values for future trails, negative values for past trails
  trailLength: -600,
  trailStep: 2,
  trailColor: '#c96af2',

  // Color of detail elements, such as grids, relations, reference circle
  detailsColor: 'rgba(81, 214, 83, 0.5)',
  detailsDash: [3, 3],
  detailsPad: 3 // pixels

})
