import { Vector } from '../lib'
import { pseudoRandom } from '../lib/helper'

export function randomVec(maxR = 1, minR = 0) {
  const angle = pseudoRandom() * 2 * Math.PI
  let radius
  do {
    radius = minR + pseudoRandom() * maxR
  } while (radius > maxR)

  const x = radius * Math.cos(angle)
  const y = radius * Math.sin(angle)

  return new Vector(x,y)
}

export function randomRange(lo, hi) {
  return (hi - lo) * pseudoRandom() + lo
}
