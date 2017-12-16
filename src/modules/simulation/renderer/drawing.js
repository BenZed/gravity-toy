import { Vector, PI, max, lerp, clamp } from 'math-plus'
import { WeightedColorizer } from '../util'
import { RADIUS_MIN } from '../constants'

/******************************************************************************/
// Draw Helpers
/******************************************************************************/

// This contains a whole bunch of draw helpers so they don't have to be placed
// renderer class page

const stress = new WeightedColorizer(
  [ 'white', 'orange', 'red' ],
  [ 0, 30 ]
)

const doppler = new WeightedColorizer(
  [ 'blue', 'cyan', 'white', 'orange', 'red' ],
  [ -30, -10, 0, 10, 30 ]
)

const mass = new WeightedColorizer(
  ['grey', 'white', 'white', 'fuchsia', 'gold', 'firebrick'],
  [0, 50, 1000, 10000, 100000, 1000000]
)

const colorBy = {
  stress,
  doppler,
  mass
}

function dot (a, b) {

  const an = a.normalize()
  const bn = b.normalize()

  return an.x * bn.x + an.y * bn.y
}

/******************************************************************************/
// Helpers
/******************************************************************************/

function drawBody (ctx, renderer, body) {

  const { radius, pos, vel } = body
  const { camera, canvas } = renderer

  const relativeVel = camera.referenceFrame
    ? vel.sub(camera.referenceFrame.vel)
    : vel

  const viewVel = relativeVel.div(camera.current.zoom)
  const viewRadius = max(radius / camera.current.zoom, RADIUS_MIN)
  const viewPos = camera.worldToCanvas(pos, canvas)

  const speed = viewVel.magnitude
  const speedDistortionRadius = max(speed, viewRadius)
  const speedDistortionAngle = viewVel.angle * PI / 180

  ctx.beginPath()
  ctx.ellipse(
    viewPos.x, viewPos.y, // position
    speedDistortionRadius,
    viewRadius,
    speedDistortionAngle,
    0, 2 * PI
  )
  ctx.closePath()

  // ctx.fillStyle = colorBy.mass(body.mass)
  if (body === camera.referenceFrame)
    ctx.fillStyle = 'white'
  else if (camera.referenceFrame) {

    const relativePos = pos.sub(camera.referenceFrame.pos)
    const dist = relativePos.magnitude
    const speed = relativeVel.magnitude

    const _dot = dot(relativeVel, relativePos)

    const distanceFactor = clamp(dist / 400000)

    const intensity = distanceFactor * 30 + ((1 - distanceFactor) * speed)

    ctx.fillStyle = colorBy.doppler(_dot * intensity)
  } else
    ctx.fillStyle = colorBy.stress(speedDistortionRadius - radius)

  ctx.globalAlpha = ((radius / camera.current.zoom) / RADIUS_MIN)::clamp(0.5, 1)
  // console.log(ctx.globalAlpha)
  ctx.fill()

  // Draw reference ring
  if (body === camera.referenceFrame) {
    const ringRadius = viewRadius + 5
    ctx.beginPath()
    ctx.ellipse(
      viewPos.x, viewPos.y, // position
      ringRadius,
      ringRadius,
      0,
      0, 2 * PI
    )
    ctx.closePath()
    ctx.strokeStyle = 'lime'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 4])
    ctx.globalAlpha = 0.125
    ctx.stroke()
  }

  ctx.globalAlpha = 1

}

/******************************************************************************/
// Exports
/******************************************************************************/

export function clearCanvas (ctx, renderer) {

  const { canvas } = renderer

  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

export function drawBodies (ctx, renderer, simulation) {

  for (const body of simulation.livingBodies())
    drawBody(ctx, renderer, body)

}
