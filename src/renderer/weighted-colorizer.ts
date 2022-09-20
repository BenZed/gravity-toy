import colorInterpolate from 'color-interpolate'

import { lerp } from '@benzed/math'
import is from '@benzed/is'

/*** Types ***/

type WeightedColorizer = (value: number) => string

/*** Helper ***/

function isOrderedFiniteArray(values: unknown): values is number[] {

    if (!is.array(values) || !values.every(is.number))
        return false

    let previous = -Infinity

    for (const value of values) {
        if (!isFinite(value) || previous >= value)
            return false

        previous = value
    }

    return true
}

/*** Main ***/

function createWeightedColorizer(colors: string[], values: number[]): WeightedColorizer {

    if (!isOrderedFiniteArray(values))
        throw new Error('values must be an ordered array of numbers.')

    const interpolator = colorInterpolate(colors)
    const maxValueIndex = values.length - 1

    return value => {

        let i = 0
        let pointer = 0
        while (i < maxValueIndex) {

            const valueFrom = values[i]
            const valueTo = values[i + 1]
            const pointFrom = i / maxValueIndex
            const pointTo = (i + 1) / maxValueIndex

            if (value >= valueFrom && value <= valueTo) {
                const valueFactor = (value - valueFrom) / (valueTo - valueFrom)
                pointer = lerp(pointFrom, pointTo, valueFactor)
                break
            }

            if (value < valueFrom)
                break

            pointer = pointTo
            i++
        }

        return interpolator(pointer)
    }
}

/*** Exports ***/

export default createWeightedColorizer