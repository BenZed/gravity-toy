import { isNumber } from '@benzed/is'
import { cbrt } from '@benzed/math'
import { MASS_MIN, RADIUS_MIN, RADIUS_FACTOR } from '../constants'

//// Exports ////

export function radiusFromMass(input: number | { mass: number }) {

    const mass = isNumber(input) ? input : input.mass

    return RADIUS_MIN + cbrt(mass - MASS_MIN) * RADIUS_FACTOR

}

export function massFromRadius(input: number | { radius: number }) {

    const radius = isNumber(input) ? input : input.radius

    return ((radius - RADIUS_MIN) / RADIUS_FACTOR) ** 3 + MASS_MIN

}

