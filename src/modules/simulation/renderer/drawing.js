import { Vector, PI, max, min } from 'math-plus'
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

const colorBy = {
  stress
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

  ctx.fillStyle = colorBy.stress(speedDistortionRadius - radius)
  ctx.fill()
}

/******************************************************************************/
// Exports
/******************************************************************************/

export function clearCanvas (ctx, renderer) {

  const { canvas } = renderer

  // Erase Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

}

export function drawBodies (ctx, renderer, simulation) {

  for (const body of simulation.livingBodies())
    drawBody(ctx, renderer, body)

}
