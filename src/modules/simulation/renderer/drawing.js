import { Vector, PI, log10, max, clamp } from 'math-plus'
import { WeightedColorizer } from '../util'
import { RADIUS_MIN } from '../constants'

/******************************************************************************/
// Helpers
/******************************************************************************/

// This contains a whole bunch of draw helpers so they don't have to be placed
// renderer class page

const DOPPLER_MAX_VEL = 30
const DOPPLER_MAX_DIST = 400000
const GRID_OPACITY_MAX = 0.5

const dopplerColor = new WeightedColorizer(
  [ 'blue', 'cyan', 'white', 'orange', 'red' ],
  [ -DOPPLER_MAX_VEL, -DOPPLER_MAX_VEL / 3, 0, DOPPLER_MAX_VEL / 3, DOPPLER_MAX_VEL ]
)

const massColor = new WeightedColorizer(
  ['grey', 'white', 'white', 'fuchsia', 'gold', 'firebrick'],
  [0, 50, 1000, 10000, 100000, 1000000]
)

// TODO Move this
function escapeSpeed (child, parent, g) {
  const relative = child.pos.sub(parent.pos)
  return g * parent.mass * child.mass / relative.sqrMagnitude
}

function numDigits (n) {
  // No fucking idea. Found it on the internet
  return (log10((n ^ (n >> 31)) - (n >> 31)) | 0) + 1
}

/******************************************************************************/
// Colors
/******************************************************************************/

function colorByMass (ctx, body) {
  ctx.fillStyle = massColor(body.mass)
}

function colorByDoppler (ctx, body, camera, relativeVel) {
  if (body === camera.referenceFrame) {
    ctx.fillStyle = 'white'
    return
  }

  const relativePos = body.pos.sub(camera.referenceFrame.pos)
  const dist = relativePos.magnitude
  const speed = relativeVel.magnitude

  const direction = Vector.dot(relativeVel, relativePos)

  const distanceFactor = clamp(dist / DOPPLER_MAX_DIST)

  const intensity = distanceFactor * DOPPLER_MAX_VEL + ((1 - distanceFactor) * speed)

  ctx.fillStyle = dopplerColor(direction * intensity)

}

/******************************************************************************/
// Drawing
/******************************************************************************/

function createCirclePath (ctx, pos, r1, r2 = r1, angle = 0) {
  ctx.beginPath()
  ctx.ellipse(
    pos.x, pos.y, r1, r2, angle, 0, 2 * PI
  )
  ctx.closePath()
}

function drawBody (ctx, renderer, body, speedOfPlayback) {

  const { radius, pos, vel } = body
  const { camera, canvas, options } = renderer

  const relativeVel = camera.referenceFrame
    ? vel.sub(camera.referenceFrame.vel)
    : vel

  const viewVel = relativeVel.div(camera.current.zoom)
  const viewRadius = max(radius / camera.current.zoom, RADIUS_MIN)
  const viewPos = camera.worldToCanvas(pos, canvas)

  // Clamped so that there is no speed distortion on paused simulations
  const speedOfBody = viewVel.magnitude * clamp(speedOfPlayback)
  const speedDistortionRadius = max(speedOfBody, viewRadius)
  const speedDistortionAngle = viewVel.angle * PI / 180

  createCirclePath(ctx, viewPos, speedDistortionRadius, viewRadius, speedDistortionAngle)

  if (options.bodyColorBy === 'mass' || !camera.referenceFrame)
    colorByMass(ctx, body)

  else if (options.bodyColorBy === 'doppler')
    colorByDoppler(ctx, body, camera, relativeVel)

  // slightly fade bodies that would be too small to see
  const sizeFade = ((radius / camera.current.zoom) / RADIUS_MIN)
  ctx.globalAlpha = clamp(sizeFade, 0.5, 1)
  ctx.fill()
  ctx.globalAlpha = 1

  // Draw reference ring
  if (body === camera.referenceFrame)
    drawReferenceFrameOutline(ctx, options, viewPos, viewRadius)
}

function detailStroke (ctx, options) {
  ctx.strokeStyle = options.detailsColor
  ctx.setLineDash(options.detailsDash)

  ctx.stroke()
}

function drawReferenceFrameOutline (ctx, options, viewPos, viewRadius) {
  const ringRadius = viewRadius + options.detailsPad

  createCirclePath(ctx, viewPos, ringRadius)
  detailStroke(ctx, options)
}

function drawBodyParentLine (ctx, renderer, child, simulation) {

  const { options, camera, canvas } = renderer

  const parent = simulation.body(child.linkId)
  if (!parent || child.mass >= parent.mass)
    return

  const relSpeed = child.vel.sub(parent.vel).magnitude
  if (relSpeed > escapeSpeed(child, parent, simulation.g))
    return

  const from = camera.worldToCanvas(parent.pos, canvas)
  const to = camera.worldToCanvas(child.pos, canvas)

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  detailStroke(ctx, options)
}

function drawGrid (ctx, renderer) {

  const { camera, canvas, options } = renderer
  const { current, target, referenceFrame: body } = camera

  const coord = body || current

  ctx.strokeStyle = options.detailsColor
  ctx.setLineDash([])
  ctx.lineWidth = 1

  const pos = camera.worldToCanvas(coord.pos, canvas)

  const xDiff = canvas.width / current.zoom
  const yDiff = canvas.height / current.zoom
  const xDiffHalf = xDiff * 0.5
  const yDiffHalf = yDiff * 0.5

  const horizontal = true
  const vertical = false

  const levels = numDigits(target.zoom)
  const levelCurrent = 10 ** levels
  const levelPrev = levelCurrent / 10

  const increment = max(levelPrev / 10, 1)
  const opacityFactor = clamp(1 - (current.zoom - levelPrev) / (levelCurrent - levelPrev))

  for (let count = 0; count < current.zoom * 0.5; count += increment) {

    const xRight = pos.x + xDiffHalf + count * xDiff
    const xLeft = pos.x - xDiffHalf + count * -xDiff
    const yUp = pos.y + yDiffHalf + count * yDiff
    const yDown = pos.y - yDiffHalf + count * -yDiff

    let opacity = GRID_OPACITY_MAX
    if (count % levelCurrent !== 0 && count % levelPrev !== 0)
      opacity *= opacityFactor

    drawGridLine(ctx, renderer, xRight, horizontal, opacity)
    drawGridLine(ctx, renderer, xLeft, horizontal, opacity)
    drawGridLine(ctx, renderer, yUp, vertical, opacity)
    drawGridLine(ctx, renderer, yDown, vertical, opacity)
  }

  ctx.globalAlpha = 1
}

function drawGridLine (ctx, renderer, start, horizontal, opac = 0.25) {

  const { canvas } = renderer

  const x = horizontal ? start : 0
  const y = horizontal ? 0 : start

  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(
    horizontal ? x : x + canvas.width,
    horizontal ? y + canvas.height : y
  )

  ctx.globalAlpha = opac
  ctx.stroke()

}

function ensureLivingReferenceFrame ({ camera }, simulation) {

  while (camera.referenceFrame && !camera.referenceFrame.exists)
    camera.referenceFrame = simulation.body(camera.referenceFrame.mergeId)

}
/******************************************************************************/
// Exports
/******************************************************************************/

export function clearCanvas (ctx, renderer) {

  const { canvas } = renderer

  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

export function drawBodies (ctx, renderer, simulation, speed) {

  const bodiesByMass = [ ...simulation.livingBodies() ]
  bodiesByMass.sort()

  ensureLivingReferenceFrame(renderer, simulation)

  if (renderer.options.grid)
    drawGrid(ctx, renderer)

  if (renderer.options.relations) for (const body of bodiesByMass)
    drawBodyParentLine(ctx, renderer, body, simulation)

  for (const body of bodiesByMass)
    drawBody(ctx, renderer, body, speed)

}
