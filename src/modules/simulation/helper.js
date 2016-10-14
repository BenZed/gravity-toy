const { sin, floor } = Math

//Body helpers
//Can receive either stats or body
export function getBaryCenter(a, b) {

  const relative = a.pos.sub(b.pos)
  const distance = relative.magnitude
  const baryRadius = distance / (1 + a.mass / b.mass)

  return relative
    .normalized()
    .mult(baryRadius)
    .add(b.pos)

}

//Math helpers
export function clamp(num, min, max) {
  return num < min ? min : num > max ? max : num
}

export function lerp(from, to, delta, clamped = true) {
  delta = clamped ? clamp(delta, 0, 1) : delta

  return from + delta * (to - from)
}

export function pseudoRandom(seed = defaultSeed++) {

  const n = sin(seed) * 10000 //10000 is the 'scatter coefficient'
  return n - floor(n)
}
let defaultSeed = 1

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
