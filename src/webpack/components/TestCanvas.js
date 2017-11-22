import React from 'react'
import styled from 'styled-components'
import { Vector, min, max } from 'math-plus'

const Canvas = styled.canvas``

export default class TestCanvas extends React.Component {

  componentDidMount () {
    window.onresize = this.resize
    this.resize()
    this.canvas::main()
  }

  resize = () => {
    this.canvas.width = innerWidth
    this.canvas.height = innerHeight
  }

  next = () => {
    this.canvas::main()
  }

  render () {

    return <Canvas onClick={this.next} innerRef={dom => { this.canvas = dom }} />
  }

}

/******************************************************************************/
// Simulation Helper
/******************************************************************************/

class Edge {

  constructor (body, isX, isMin) {
    this.body = body
    this.isX = isX
    this.isMin = isMin
    this.refresh()
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

class Body {

  edges = {
    l: null,
    r: null,
    t: null,
    b: null
  }

  constructor (pos = Vector.zero, vel = Vector.zero, radius = 1) {
    this.pos = pos
    this.vel = vel
    this.radius = radius
    this.edges.l = new Edge(this, true, true)
    this.edges.r = new Edge(this, true, false)
    this.edges.t = new Edge(this, false, true)
    this.edges.b = new Edge(this, false, false)
  }

  refreshEdges () {
    this.edges.l.refresh()
    this.edges.r.refresh()
    this.edges.t.refresh()
    this.edges.b.refresh()
  }

}

/******************************************************************************/
// Drawing
/******************************************************************************/

function circle (x, y, r, style = 'white') {
  const ctx = this
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 2 * Math.PI)
  ctx.fillStyle = style
  ctx.fill()
}

function rect (x, y, w, h, color = 'white') {
  const ctx = this
  ctx.rect(x, y, w, h)
  ctx.fillStyle = color
  ctx.fill()
}

function body (body) {
  const ctx = this

  ctx::circle(
    body.pos.x - body.vel.x,
    body.pos.y - body.vel.y,
    body.radius,
    'rgba(255,125,125,0.5)'
  )

  ctx::rect(
    body.edges.l.value,
    body.edges.t.value,
    body.edges.r.value - body.edges.l.value,
    body.edges.b.value - body.edges.t.value,
    'rgba(255,125,125,0.25)'
  )
  ctx::circle(body.pos.x, body.pos.y, body.radius, 'white')
}

function id (body) {
  const ctx = this
  if (body.id) {
    ctx.fillStyle = 'black'
    ctx.textAlign = 'center'
    ctx.fillText(body.id, body.pos.x, body.pos.y + 4)
  }
}

/******************************************************************************/
// Main
/******************************************************************************/

const bodies = Array(100).fill(true).map((v, i) => {

  const body = new Body()
  body.id = i + 1
  body.radius = 5 + Math.random() * 20
  const r = body.radius
  const r2 = r * 2
  body.pos.x = r + (Math.random() * (innerWidth - r2))
  body.pos.y = r + (Math.random() * (innerHeight - r2))

  return body
})

const biggest = bodies.reduce((a, b) => a.radius > b.radius ? a : b).radius

bodies.forEach(body => {
  const delta = biggest - body.radius
  body.vel.x = delta - (Math.random() * delta * 2)
  body.vel.y = delta - (Math.random() * delta * 2)
  body.refreshEdges()
})
/******************************************************************************/
// Broad Phase
/******************************************************************************/

function edgesOverlap (e1, e2) {

  if (e1.l > e2.r || e2.l > e1.r)
    return false

  if (e1.b < e2.t || e2.b < e1.t)
    return false

  return true
}

const broadphase = {

  edgesX: [],
  edgesY: [],

  start (bodies) {
    bodies.forEach(body => { this.edgesX.push(body.edges.l, body.edges.r) })
    bodies.forEach(body => { this.edgesY.push(body.edges.t, body.edges.b) })
  },

  update (ctx) {
    for (const body of bodies)
      body.refreshEdges()

    console.clear()

    insertionSort(this.edgesX)
    for (let i = 0; i < this.edgesX.length; i++)
      this.edgesX[i].index = i

    for (const body of bodies) {
      for (let i = body.edges.l.index + 1; i < body.edges.r.index; i++) {
        const edge = this.edgesX[i]
        if (edge.body !== body && edgesOverlap(edge.body.edges, body.edges)) {
          const l = min(body.edges.l, edge.body.edges.l)
          const t = min(body.edges.t, edge.body.edges.t)
          const r = max(body.edges.r, edge.body.edges.r)
          const b = max(body.edges.b, edge.body.edges.b)

          const w = r - l
          const h = b - t
          ctx::rect(l, t, w, h, `rgba(125,255,125,0.1)`)
        }
      }
    }
  }
}

broadphase.start(bodies)

/******************************************************************************/
// Main
/******************************************************************************/

function main () {
  const ctx = this.getContext('2d')

  ctx::rect(0, 0, innerWidth, innerHeight, 'black')
  bodies.forEach(ctx::body)
  bodies.forEach(ctx::id)
  broadphase.update(ctx)
  bodies.forEach(body => {
    body.pos.iadd(body.vel)
    if (body.pos.x < 0)
      body.pos.x = innerWidth

    if (body.pos.x > innerWidth)
      body.pos.x = 0

    if (body.pos.y < 0)
      body.pos.y = innerHeight

    if (body.pos.y > innerHeight)
      body.pos.y = 0

    body.refreshEdges()
  })

}

/******************************************************************************/
// Helper
/******************************************************************************/

function insertionSort (arr) {

  const { length } = arr

  for (let i = 1; i < length; i++) {

    const value = arr[i]

    let j
    for (j = i - 1; j >= 0 && arr[j] > value; j--)
      arr[j + 1] = arr[j]

    arr[j + 1] = value
  }

  return arr
}
