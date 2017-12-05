import { Vector, PI, max } from 'math-plus'
import { WeightedColorizer } from '../util'

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

function drawBody (ctx, body) {

  const { radius, pos, vel } = body

  const speed = vel.magnitude
  const speedDistortionRadius = max(speed, radius)
  const speedDistortionAngle = vel.angle * PI / 180

  ctx.beginPath()
  ctx.ellipse(
    pos.x, pos.y, // position
    speedDistortionRadius,
    radius,
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

export function clearCanvas (ctx, canvas) {

  // Reset all transformations
  ctx.resetTransform()

  // Erase Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const zoom = 20

  // Center on view
  const viewWidth = canvas.width * zoom
  const viewHeight = canvas.height * zoom

  ctx.scale(1 / zoom, 1 / zoom)
  ctx.translate(
    viewWidth * 0.5 - canvas.width * 0.5,
    viewHeight * 0.5 - canvas.height * 0.5
  )

}

export function drawBodies (ctx, simulation) {

  for (const body of simulation.livingBodies())
    drawBody(ctx, body)

}
