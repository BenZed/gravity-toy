import colorInterpolate from 'color-interpolate'
import isOrderedFiniteArray from './is-ordered-finite-array'

import { lerp } from 'math-plus'
import is from 'is-explicit'

export default function WeightedColorizer (colors, values) {

  if (this === undefined)
    // it doesn't actually, but fuck it. I'm enforcing self documenting code. Sue me.
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
