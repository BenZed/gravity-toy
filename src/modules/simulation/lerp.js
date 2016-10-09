import clamp from './clamp'

export default function lerp(from, to, delta, clamped = true) {

  delta = clamped ? clamp(delta, 0, 1) : delta

  return from + delta * (to - from)

}
