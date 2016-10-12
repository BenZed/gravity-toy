//Math helpers
export function clamp(num, min, max) {
  return num < min ? min : num > max ? max : num
}

export function lerp(from, to, delta, clamped = true) {
  delta = clamped ? clamp(delta, 0, 1) : delta

  return from + delta * (to - from)
}

//Class helpers
export function getProtectedSymbol(obj, key) {
  //get the symbols on the provided object that specically point to the provided key
  return Object.getOwnPropertySymbols(obj)
    .filter(symbol => obj[symbol] === key)[0]

}

export function constProperty(obj, key, value) {
  Object.defineProperty(obj, key, { value })
}

export function writableProperty(obj, key, value) {
  Object.define(obj, key, { value, writable: true})
}
