import colorInterpolate from 'color-interpolate'
import is from 'is-explicit'
import { lerp, cbrt } from 'math-plus'

export function isOrderedFiniteArray(values) {

  if (!is(values, Array))
    return false

  let previous = -Infinity

  for (const value of values) {
    if (!isFinite(value) || previous >= value)
      return false

    previous = value
  }

  return true
}

const RADIUS_MIN = 0.5 //pixels
const RADIUS_FACTOR = 0.5

export const MASS_MIN = 50

export function radiusFromMass(...args) {

  //why?
  //So that this function can be attached to an object that has mass
  //and used as a getter
  const mass = isFinite(args[0]) ? args[0] : this ? this.mass : MASS_MIN

  return RADIUS_MIN + cbrt(mass - MASS_MIN) * RADIUS_FACTOR

}

export function WeightedColorizer(colors, values) {

  if (this === undefined)
    //it doesn't actually, but fuck it. I'm enforcing self documenting code. Sue me.
    throw new Error('WeightedColorizer must be instanced.')

  if (!is(colors, Array) || !is(values, Array))
    throw new Error('WeightedColorizer requires an array of colors and an array of values.')

  if (!isOrderedFiniteArray(values))
    throw new Error('values must be an ordered array of numbers.')

  const interpolator = colorInterpolate(colors)
  const maxValueIndex = values.length - 1

  return value => {

    let i = 0, pointer = 0
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
