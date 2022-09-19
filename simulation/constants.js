"use strict";
/*** Simulation Constants ***/
Object.defineProperty(exports, "__esModule", { value: true });
exports.TICK_DURATION = exports.RADIUS_FACTOR = exports.RADIUS_MIN = exports.MASS_MIN = exports.CACHED_VALUES_PER_TICK = exports.NO_LINK = exports.NUMBER_SIZE = exports.ONE_MB = exports.DEFAULT_MAX_MB = exports.DEFAULT_PHYSICS = void 0;
exports.DEFAULT_PHYSICS = {
    g: 100,
    physicsSteps: 1,
    realMassThreshold: 10,
    realBodiesMin: Infinity
};
exports.DEFAULT_MAX_MB = 256; // mb
exports.ONE_MB = Math.pow(1024, 2); // bytes
// size of a javascript number value, in bytes
exports.NUMBER_SIZE = 8;
// A link is a body id. A body's "link" is simply the body that it is
// Most attracted to. "Parent" would be a misnomer, becase a large body could
// have a smaller body that is exerting more force on it than any other body.
// If a body was just created, it will have no link for it's initial tick, so
// It gets this value as it's "linkId"
exports.NO_LINK = -1;
// Each body stores 6 numbers per tick: posX, posY, velX, velY, mass, linkId.
// Mass and linkId may be able to be optimized in the future, because they
// don't change every tick
exports.CACHED_VALUES_PER_TICK = 6;
// Arbitrary minimum mass for a body
exports.MASS_MIN = 1;
// If the min radius of a body is 1, then the min diameter would be 2, so 2 pixels
exports.RADIUS_MIN = 1;
// Arbitrary scaler for increase in radius in relationship to mass
exports.RADIUS_FACTOR = 1;
// 60 ticks equals one second
exports.TICK_DURATION = 1 / 60;
