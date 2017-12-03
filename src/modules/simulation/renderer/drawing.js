import { Vector, PI, max } from 'math-plus'
import { WeightedColorizer } from '../util'

/******************************************************************************/
// Draw Helpers
/******************************************************************************/

// This contains a whole bunch of draw helpers so they don't have to be placed
// renderer class page

const stress = new WeightedColorizer(
  [ 'blue', 'cyan', 'white', 'orange', 'red' ],
  [ -30, 0, 30 ]
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
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

export function drawBodies (ctx, simulation) {

  for (const body of simulation.livingBodies())
    drawBody(ctx, body)

}
