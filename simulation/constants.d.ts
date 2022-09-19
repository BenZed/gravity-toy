/*** Simulation Constants ***/
export interface Physics {
    /**
     * Gravitational Constant. Higher values, faster bodies.
     */
    g: number;
    /**
     * Higher steps mean more calclation time, but more precision.
     */
    physicsSteps: number;
    /**
     * As a lossy optimization, bodies below a certain mass threshold can be considered
     * seudo bodies and excluded from the primary integration loop. This speeds
     * up the simulation at a cost of accuracy.
     */
    realMassThreshold: number;
    /**
     * There must be at least this many real bodies before bodies under the aforementioned
     * mass threshold are considered psuedo. Infinity means disabled.
     **/
    realBodiesMin: number;
}
export declare const DEFAULT_PHYSICS: {
    readonly g: 100;
    readonly physicsSteps: 1;
    readonly realMassThreshold: 10;
    readonly realBodiesMin: number;
};
export declare const DEFAULT_MAX_MB = 256;
export declare const ONE_MB: number;
export declare const NUMBER_SIZE = 8;
export declare const NO_LINK = -1;
export declare const CACHED_VALUES_PER_TICK = 6;
export declare const MASS_MIN = 1;
export declare const RADIUS_MIN = 1;
export declare const RADIUS_FACTOR = 1;
export declare const TICK_DURATION: number;
