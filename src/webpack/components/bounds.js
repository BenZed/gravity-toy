
/******************************************************************************/
// Classes
/******************************************************************************/

class Edge {

  index = -1
  value = 0
  lastValue = 0

  constructor (body, isX, isMin) {
    this.body = body
    this.isX = isX
    this.isMin = isMin
    this.value = isMin ? -Infinity : Infinity
  }

  refresh () {
    const { body, isX, isMin } = this

    const vel = isX ? body.vel.x : body.vel.y

    const axis = isX ? body.pos.x : body.pos.y
    const radius = isMin ? -body.radius : body.radius
    const shift = (isMin && vel > 0) || (!isMin && vel < 0) ? -vel : 0

    this.value = axis + radius + shift
  }

  valueOf () {
    return this.value
  }
}

class Bounds {

  l = null
  r = null
  t = null
  b = null

  constructor (body) {
    this.body = body
    this.l = new Edge(body, true, true)
    this.r = new Edge(body, true, false)
    this.t = new Edge(body, false, true)
    this.b = new Edge(body, false, false)
  }

  overlap (other) {

    if (this.l > other.r || other.l > this.r)
      return false

    if (this.t > other.b || other.t > this.b)
      return false

    return true
  }

  refresh () {
    this.l.refresh()
    this.r.refresh()
    this.t.refresh()
    this.b.refresh()
  }
}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Bounds

export { Bounds, Edge }
