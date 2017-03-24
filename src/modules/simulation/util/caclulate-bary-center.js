export default function calcBaryCenter(a, b) {

  const relative = a.pos.sub(b.pos)
  const distance = relative.magnitude
  const baryRadius = distance / (1 + a.mass / b.mass)

  return relative
    .normalize()
    .imult(baryRadius)
    .iadd(b.pos)
}
