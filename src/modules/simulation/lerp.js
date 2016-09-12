export default function lerp(from, to, delta, clamped = true) {

  delta = clamped ? Math.clamp01(delta) : delta

  return from + delta * (to - from)

}
