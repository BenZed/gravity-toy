import React from 'react'
import styled from 'styled-components'
import { Vector, min, max } from 'math-plus'

import SortedArray from './sorted-array'
import { Bounds } from './bounds'
import IdMap from './id-map'

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

class Body {

  constructor (pos = Vector.zero, vel = Vector.zero, radius = 1) {
    this.pos = pos
    this.vel = vel
    this.radius = radius
    this.bounds = new Bounds(this)
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
  ctx.closePath()
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
    body.bounds.l.value,
    body.bounds.t.value,
    body.bounds.r - body.bounds.l,
    body.bounds.b - body.bounds.t,
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

function overlap (b1, b2) {
  const ctx = this
  const l = min(b1.bounds.l, b2.bounds.l)
  const t = min(b1.bounds.t, b2.bounds.t)
  const r = max(b1.bounds.r, b2.bounds.r)
  const b = max(b1.bounds.b, b2.bounds.b)

  const w = r - l
  const h = b - t

  ctx::rect(l, t, w, h, `rgba(125,255,125,0.125)`)
}

/******************************************************************************/
// Main
/******************************************************************************/

const bodies = Array(200).fill(true).map((v, i) => {

  const body = new Body()
  body.id = i + 1
  body.radius = 3 + Math.random() * 4
  const r = body.radius
  const r2 = r * 2
  body.pos.x = r + (Math.random() * (innerWidth - r2))
  body.pos.y = r + (Math.random() * (innerHeight - r2))

  return body
})

const biggest = bodies.reduce((a, b) => a.radius > b.radius ? a : b).radius

bodies.forEach(body => {
  const delta = (biggest - body.radius) * 4
  body.vel.x = delta - (Math.random() * delta * 2)
  body.vel.y = delta - (Math.random() * delta * 2)
  body.bounds.refresh()
})

/******************************************************************************/
// Broad Phase
/******************************************************************************/

class BroadPhase {

  bodies = null
  boundsX = new SortedArray()
  boundsY = new SortedArray()
  pairs = {}

  pairId (b1, b2) {
    const lo = b1.id < b2.id ? b1.id : b2.id
    const hi = lo === b1.id ? b2.id : b1.id
    return `${lo}-${hi}`
  }

  constructor (bodies) {
    for (const body of bodies)
      this.boundsX.push(body.bounds.l, body.bounds.r)
  }

  calcPairs () {
    this.pairs = {}
    let iter = 0
    for (const body of bodies) {
      body.bounds.refresh()
      iter++
    }

    this.boundsX.sort()

    for (let i = 0; i < this.boundsX.length; i++) {
      this.boundsX[i].index = i
      iter++
    }

    for (const b1 of bodies) {
      iter++
      for (let i = b1.bounds.l.index + 1; i < b1.bounds.r.index; i++) {
        iter++
        const b2 = this.boundsX[i].body
        if (b1.bounds.overlap(b2.bounds)) {
          const pairKey = this.pairId(b1, b2)
          if (!this.pairs[pairKey])
            this.pairs[pairKey] = { b1, b2 }
        }
      }
    }

    console.clear()
    console.log('iterations for this solve:', iter, Object.keys(this.pairs))
  }

  addBody (body) {
    body.bounds.refresh()

    const { l, r, t, b } = body.bounds

    this.boundsX.insert(l, r)
    this.boundsY.insert(t, b)

  }

}

const broadphase = new BroadPhase(bodies)

/******************************************************************************/
// Main
/******************************************************************************/

function main () {
  broadphase.calcPairs()
  const ctx = this.getContext('2d')

  ctx::rect(0, 0, innerWidth, innerHeight, 'black')
  bodies.forEach(ctx::body)
  bodies.forEach(ctx::id)

  for (const key in broadphase.pairs) {
    const { b1, b2 } = broadphase.pairs[key]
    ctx::overlap(b1, b2)
  }

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
  })

}

/******************************************************************************/
// Helper
/******************************************************************************/
