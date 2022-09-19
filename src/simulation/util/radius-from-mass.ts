import { isNumber } from '@benzed/is'
import { cbrt } from '@benzed/math'

import type Body from '../body'

import { MASS_MIN, RADIUS_MIN, RADIUS_FACTOR } from '../constants'

/*** Exports ***/

export function radiusFromMass(bodyOrMass: number | Body) {

    const mass = isNumber(bodyOrMass) ? bodyOrMass : bodyOrMass.mass

    return RADIUS_MIN + cbrt(mass - MASS_MIN) * RADIUS_FACTOR

}

export function massFromRadius(bodyOrRadius: number | Body) {

    const radius = isNumber(bodyOrRadius) ? bodyOrRadius : bodyOrRadius.radius

    return ((radius - RADIUS_MIN) / RADIUS_FACTOR) ** 3 + MASS_MIN

}

