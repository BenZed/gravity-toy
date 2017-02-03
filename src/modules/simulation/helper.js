import Vector from './vector'
import is from 'is-explicit'

const { sin, cos, random, sqrt, PI } = Math

/******************************************************************************/
// Simulation Helpers
/******************************************************************************/

export function baryCenter(a, b) {

  const relative = a.pos.sub(b.pos)
  const distance = relative.magnitude
  const baryRadius = distance / (1 + a.mass / b.mass)

  return relative
    .normalized()
    .mult(baryRadius)
    .add(b.pos)
}

export function orbitalVelocity(bodyOrPos, parent, g) {

  const pos = is(bodyOrPos,Vector) ? bodyOrPos : bodyOrPos.pos

  const relative = pos.sub(parent.pos)
  const dist = relative.magnitude

  //I'm not sure why I have to divide by 10. According to Google
  //this equation should work without it
  const speed = sqrt(g * parent.mass / dist) * 0.1

  return relative
    .perpendicular(speed)

}

export function escapeSpeed(child, parent, g) {
  const relative = child.pos.sub(parent.pos)
  return g * parent.mass * child.mass / relative.sqrMagnitude
}

export function escaping(child, parent, g) {

  const escSpeed = escapeSpeed(child, parent, g)

  const relSpeed = child.vel
    .sub(parent.vel)
    .magnitude

  return relSpeed > escSpeed
}

/******************************************************************************/
// Math Helpers
/******************************************************************************/

export function clamp(num, min, max) {
  return num < min ? min : num > max ? max : num
}

export function lerp(from, to, delta, clamped = true) {
  delta = clamped ? clamp(delta, 0, 1) : delta

  return from + delta * (to - from)
}

/******************************************************************************/
// Random Helpers
/******************************************************************************/

export function randomVec(maxR = 1, minR = 0) {
  const angle = random() * 2 * PI
  let radius
  do {
    radius = minR + random() * maxR
  } while (radius > maxR || radius < minR)

  const x = radius * cos(angle)
  const y = radius * sin(angle)

  return new Vector(x,y)
}

export function randomRange(lo, hi) {
  return (hi - lo) * random() + lo
}

/******************************************************************************/
// Class Helpers
/******************************************************************************/

export function getProtectedSymbol(obj, key) {
  //get the symbols on the provided object that spefically point to the provided key
  return Object.getOwnPropertySymbols(obj)
    .filter(symbol => obj[symbol] === key)[0]
}

export function constProperty(obj, key, value) {
  Object.defineProperty(obj, key, { value })
}

export function writableProperty(obj, key, value) {
  Object.defineProperty(obj, key, { value, writable: true })
}
