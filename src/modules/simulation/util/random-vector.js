import { Vector, random, cos, sin, PI } from 'math-plus'

export default function randomVec (maxR = 1, minR = 0) {
  const angle = random() * 2 * PI
  let radius
  do
    radius = minR + random() * maxR
  while (radius > maxR || radius < minR)

  const x = radius * cos(angle)
  const y = radius * sin(angle)

  return new Vector(x, y)
}
