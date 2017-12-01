import { Vector, PI } from 'math-plus'

/******************************************************************************/
// Draw Helpers
/******************************************************************************/

// This contains a whole bunch of draw helpers so they don't have to be placed
// renderer class page

/******************************************************************************/
// Helpers
/******************************************************************************/

function drawBody (ctx, body) {

  const { radius, pos } = body

  ctx.beginPath()
  ctx.arc(pos.x, pos.y, radius, 0, 2 * PI)
  ctx.closePath()

  ctx.fillStyle = 'white'
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
