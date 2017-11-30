import React from 'react'
import styled from 'styled-components'
import { Vector, min, max } from 'math-plus'
import { closestPointOnLine } from 'modules/simulation/util'
import Body from 'modules/simulation/integrator/body'

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

  render () {
    return <Canvas onMouseDown={this::down} onMouseUp={this::up} onMouseMove={this::move} innerRef={dom => { this.canvas = dom }} />
  }

}

/******************************************************************************/
// Drawing
/******************************************************************************/

function circle ({x, y}, r, style = 'white') {
  const ctx = this

  ctx.beginPath()
  ctx.arc(x, y, r, 0, 2 * Math.PI)
  ctx.fillStyle = style
  ctx.fill()
  ctx.closePath()

  return ctx
}

function rect ({x, y}, w, h, color = 'white') {
  const ctx = this
  ctx.rect(x, y, w, h)
  ctx.fillStyle = color
  ctx.fill()
  return ctx
}

function body (body) {
  const ctx = this

  ctx::circle(
    body.pos.sub(body.vel),
    body.radius,
    'rgba(255,125,125,0.5)'
  )::rect(
    {
      x: body.bounds.l.value,
      y: body.bounds.t.value
    },
    body.bounds.r - body.bounds.l,
    body.bounds.b - body.bounds.t,
    'rgba(255,125,125,0.25)'
  )::circle(body.pos, body.radius, 'white')

  return ctx
}

function id (body) {
  const ctx = this
  if (body.id) {
    ctx.fillStyle = 'black'
    ctx.textAlign = 'center'
    ctx.fillText(body.id, body.pos.x, body.pos.y + 4)
  }
  return ctx
}

function overlap (b1, b2) {
  const ctx = this
  const l = min(b1.bounds.l, b2.bounds.l)
  const t = min(b1.bounds.t, b2.bounds.t)
  const r = max(b1.bounds.r, b2.bounds.r)
  const b = max(b1.bounds.b, b2.bounds.b)

  const w = r - l
  const h = b - t

  ctx::rect({x: l, y: t}, w, h, `rgba(125,255,125,0.5)`)
  return ctx
}

function line ({ a, b }, color = 'white') {
  const ctx = this

  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)

  console.log(a, b)

  ctx.strokeStyle = color
  ctx.lineWidth = 4

  ctx.stroke()
  ctx.closePath()

  return ctx

}

/******************************************************************************/
// Main
/******************************************************************************/

let bx = 250
let by = 250

let vx = 500
let vy = 500

let _down = false

function move (e) {
  if (!_down)
    return

  if (e.shiftKey) {
    vx = bx - e.clientX
    vy = by - e.clientY
  } else {
    bx = e.clientX
    by = e.clientY
  }

  this.canvas::main()
}

function down () {
  _down = true
}

function up () {
  _down = false
}

const b1 = new Body(0, 1000, new Vector(bx, by), Vector.zero)
const b2 = new Body(0, 1000, new Vector(275, 250), new Vector(500, 500))

function main () {

  const ctx = this.getContext('2d')

  ctx::rect(Vector.zero, innerWidth, innerHeight, 'black')

  b1.pos.x = bx
  b1.pos.y = by
  b1.vel.x = vx
  b1.vel.y = vy

  b1.bounds.refresh()
  b2.bounds.refresh()

  ctx::body(b1)
     ::body(b2)

  if (b1.bounds.overlap(b2.bounds)) {

    const b1Fast = b1.vel.sqrMagnitude > b2.vel.sqrMagnitude
    const fast = b1Fast ? b1 : b2
    const slow = b1Fast ? b2 : b1

    let didCollide = false
    const vel = fast.vel.sub(slow.vel)

    if (vel.sqrMagnitude < 1)
      didCollide = fast.pos.sub(slow.pos).magnitude < fast.radius + slow.radius

    else {

      const c = closestPointOnLine(fast.pos.sub(vel), fast.pos, slow.pos)
      ctx::circle(c, slow.radius, `rgba(125, 125, 255, 0.5)`)

      didCollide = slow.pos.sub(c).magnitude < fast.radius + slow.radius

    }

    if (didCollide)
      ctx::circle(b2.pos.lerp(b1.pos, 0.5), b1.radius + b2.radius, 'rgba(125,255,125, 0.5)')
  }

}

/******************************************************************************/
// Helper
/******************************************************************************/
