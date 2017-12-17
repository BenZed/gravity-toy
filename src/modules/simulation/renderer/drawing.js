import { Vector, PI, max, min, cbrt, clamp } from 'math-plus'
import { WeightedColorizer } from '../util'
import { RADIUS_MIN } from '../constants'

/******************************************************************************/
// Helpers
/******************************************************************************/

// This contains a whole bunch of draw helpers so they don't have to be placed
// renderer class page

const DOPPLER_MAX_VEL = 30
const DOPPLER_MAX_DIST = 400000

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

  if (options.bodyColorBy === 'mass' || !options.referenceFrame)
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

function drawBodyParentLine (ctx, renderer, child, bodies, g) {

  const { options, camera, canvas } = renderer

  const parent = bodies[child.linkId]
  if (!parent || child.mass >= parent.mass)
    return

  const relSpeed = child.vel.sub(parent.vel).magnitude
  if (relSpeed > escapeSpeed(child, parent, g))
    return

  const from = camera.worldToCanvas(parent.pos, canvas)
  const to = camera.worldToCanvas(child.pos, canvas)

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  detailStroke(ctx, options)
}

/******************************************************************************/
// Exports
/******************************************************************************/

export function clearCanvas (ctx, renderer) {

  const { canvas } = renderer

  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

export function drawBodies (ctx, renderer, simulation, speed) {

  const bodiesById = {}
  const bodiesByMass = []

  for (const body of simulation.livingBodies()) {
    bodiesById[body.id] = body
    bodiesByMass.push(body) // TODO use sorted array
  }
  bodiesByMass.sort()

  if (renderer.options.relations) for (const body of bodiesByMass)
    drawBodyParentLine(ctx, renderer, body, bodiesById, simulation.g)

  for (const body of bodiesByMass)
    drawBody(ctx, renderer, body, speed)

}
