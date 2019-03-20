import { Vector, PI, log10, max, min, clamp, floor, sign, abs, cbrt } from '@benzed/math'
import { SortedArray } from '@benzed/array'

import { WeightedColorizer } from '../util'
import { RADIUS_MIN } from '../constants'
import { $$cache } from '../body'

/******************************************************************************/
// Helpers
/******************************************************************************/

// TODO Right now this is for drawing the grid only.
// It should come from the simulation.
const LARGEST_SAFE_AXIS = 99999999.999999999

const MAX_TOP_LEFT = new Vector(-LARGEST_SAFE_AXIS, -LARGEST_SAFE_AXIS)
const MAX_BOT_RIGHT = new Vector(LARGEST_SAFE_AXIS, LARGEST_SAFE_AXIS)

// This contains a whole bunch of draw helpers so they don't have to be placed
// renderer class page

const DOPPLER_MAX_VEL = 30
const DOPPLER_MAX_DIST = 400000
const MAX_SPEED_DISTORTION = 6 // from renderer speed specifically, not body velocity
const GRID_OPACITY_MAX = 0.5
const TRAIL_OPACITY_MAX = 0.5
const TRAIL_FADE_FACTOR = 0.33 // %, the last 33% of the trail will fade
const NO_DASH = []

const dopplerColor = new WeightedColorizer(
  [ 'blue', 'cyan', 'white', 'orange', 'red' ],
  [ -DOPPLER_MAX_VEL, -DOPPLER_MAX_VEL / 3, 0, DOPPLER_MAX_VEL / 3, DOPPLER_MAX_VEL ]
)

const massColor = new WeightedColorizer(
  ['grey', 'white', 'white', 'fuchsia', 'gold', 'firebrick'],
  [0, 50, 1000, 10000, 100000, 1000000]
)

// TODO Move these
function escapeSpeed (child, parent, g) {
  const relative = child.pos.sub(parent.pos)
  return g * parent.mass * child.mass / relative.sqrMagnitude
}

function baryCenter (a, b) {

  const small = a.mass > b.mass ? b : a
  const big = small === a ? b : a

  const relative = big.pos.sub(small.pos)
  const distance = relative.magnitude
  const baryRadius = distance / (1 + small.mass / big.mass)

  return relative
    .normalize()
    .imult(baryRadius)
    .iadd(small.pos)
}

const numDigits = n =>
  // No fucking idea. Found it on the internet
  (log10((n ^ (n >> 31)) - (n >> 31)) | 0) + 1

/******************************************************************************/
// Colors
/******************************************************************************/

function colorByMass (ctx, body) {
  ctx.fillStyle = ctx.strokeStyle = massColor(body.mass)
}

function colorByDoppler (ctx, body, referencePos, relativeVel) {

  const relativePos = body.pos.sub(referencePos)
  const dist = relativePos.magnitude
  const speed = relativeVel.magnitude

  const direction = Vector.dot(relativePos, relativeVel)
  const distanceFactor = clamp(dist / DOPPLER_MAX_DIST)

  const intensity = distanceFactor * DOPPLER_MAX_VEL + ((1 - distanceFactor) * speed)

  ctx.fillStyle = ctx.strokeStyle = dopplerColor(direction * intensity)

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

function drawBody (ctx, renderer, body) {

  const { radius, pos, vel } = body
  const { camera, canvas, options, speed } = renderer
  const frame = camera.referenceFrame

  const relativeVel = frame
    ? vel.sub(frame.vel)
    : vel

  const viewVel = relativeVel.div(camera.current.zoom)
  const viewRadius = max(radius / camera.current.zoom, RADIUS_MIN)
  const viewPos = camera.worldToCanvas(pos, canvas)

  const speedOfBody = viewVel.magnitude * clamp(abs(speed), 0, MAX_SPEED_DISTORTION)
  const speedDistortionRadius = max(speedOfBody, viewRadius)
  const speedDistortionAngle = viewVel.angle * PI / 180

  createCirclePath(ctx, viewPos, speedDistortionRadius, viewRadius, speedDistortionAngle)
  if (options.bodyColorBy === 'mass')
    colorByMass(ctx, body)

  else if (options.bodyColorBy === 'doppler')
    colorByDoppler(ctx, body, frame ? frame.pos : camera.current.pos, relativeVel)

  // slightly fade bodies that would be too small to see
  const sizeFade = ((radius / camera.current.zoom) / RADIUS_MIN)
  ctx.globalAlpha = clamp(sizeFade, 0.5, 1)
  ctx.fill()
  ctx.globalAlpha = 1

  // Draw reference ring
  if (body === frame)
    drawReferenceFrameOutline(ctx, options, viewPos, viewRadius)
}

function detailStroke (ctx, options) {
  ctx.strokeStyle = options.detailsColor
  ctx.setLineDash(options.detailsDash)
  ctx.globalAlpha = 1
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
  if (!parent)// || child.mass >= parent.mass)
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

  const bary = camera.worldToCanvas(baryCenter(parent, child), canvas)
  const off = options.detailsPad * 4

  ctx.beginPath()
  ctx.setLineDash(NO_DASH)

  ctx.moveTo(bary.x - off, bary.y)
  ctx.lineTo(bary.x + off, bary.y)
  ctx.moveTo(bary.x, bary.y + off)
  ctx.lineTo(bary.x, bary.y - off)

  ctx.stroke()
}

const getGridZoomData = zoom => {

  const levels = numDigits(zoom)
  const levelCurrent = 10 ** levels
  const levelPrev = levelCurrent / 10

  const increment = max(levelPrev / 10, 1)
  const opacityFactor = clamp(1 - (zoom - levelPrev) / (levelCurrent - levelPrev))

  return {
    levelCurrent,
    levelPrev,
    opacityFactor,
    increment
  }
}

function drawGrid (ctx, renderer) {

  const { camera, canvas, options } = renderer
  const { current } = camera
  const { zoom } = current
  const { width, height } = canvas

  ctx.strokeStyle = options.detailsColor
  ctx.setLineDash(NO_DASH)
  ctx.lineWidth = 1

  const data = getGridZoomData(zoom)

  const canvasHalfWorldSize = new Vector(width, height).imult(zoom * 0.5)
  const worldTL = current.pos.sub(canvasHalfWorldSize).imax(MAX_TOP_LEFT)
  const worldBR = current.pos.add(canvasHalfWorldSize).imin(MAX_BOT_RIGHT)
  const worldSnapTL = new Vector(
    floor(worldTL.x, canvas.width * data.increment),
    floor(worldTL.y, canvas.height * data.increment)
  )

  drawGridLines(ctx, renderer, worldSnapTL, worldBR, true, data)
  drawGridLines(ctx, renderer, worldSnapTL, worldBR, false, data)
}

const drawGridLines = (ctx, rend, from, to, horizontal, data) => {
  const current = from.copy()

  const axis = horizontal ? 'x' : 'y'
  const dimension = rend.canvas[horizontal ? 'width' : 'height']

  const delta = dimension * data.increment
  const limitTL = rend.camera.worldToCanvas(MAX_TOP_LEFT, rend.canvas)
  const limitBR = rend.camera.worldToCanvas(MAX_BOT_RIGHT, rend.canvas)

  while (current[axis] <= to[axis]) {

    let opacity = GRID_OPACITY_MAX

    const index = current[axis] / dimension
    if (index % data.levelCurrent !== 0 && index % data.levelPrev !== 0)
      opacity *= data.opacityFactor

    const world = rend.camera.referenceFrame
      ? current
        .add(rend.camera.referenceFrame.pos)
      : current

    const canvasPoint = rend.camera.worldToCanvas(world, rend.canvas)

    drawGridLine(ctx, rend, canvasPoint[axis], limitTL, limitBR, horizontal, opacity)

    current[axis] += delta
  }
}

function drawGridLine (ctx, renderer, start, limitTL, limitBR, horizontal, opac = 0.25) {

  const { canvas } = renderer

  const x = max(horizontal ? start : 0, limitTL.x)
  const y = max(horizontal ? 0 : start, limitTL.y)

  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(
    min(horizontal ? x : x + canvas.width, limitBR.x),
    min(horizontal ? y + canvas.height : y, limitBR.y)
  )

  ctx.globalAlpha = opac
  ctx.stroke()

}

const getTrailWorldPositionAtTick = (body, tick) => {
  const bCache = body[$$cache]

  const index = bCache.getTickDataIndex(tick)
  const mass = bCache.data[index]
  if (!mass || mass === 0)
    return null

  const worldPoint = new Vector(
    bCache.data[index + 1],
    bCache.data[index + 2]
  )

  return worldPoint
}

function drawTrails (ctx, renderer, body, simulation) {

  const { options, camera, canvas } = renderer

  const rBody = camera.referenceFrame
  if (body === rBody)
    return

  const bCache = rBody[$$cache]

  const zoomF = cbrt(camera.current.zoom)

  let numTicks = abs(options.trailLength * zoomF)
  const step = floor(options.trailStep * zoomF)
  const direction = sign(options.trailLength)

  ctx.lineWidth = 1
  ctx.globalAlpha = 1
  ctx.setLineDash(direction > 0 ? options.detailsDash : [])
  ctx.fillStyle = ctx.strokeStyle = options.trailColor

  let tick = simulation.currentTick
  // prevents jittering caused by step

  // clamp numTicks
  if (direction > 0 && bCache.deathTick !== null && bCache.deathTick - tick < numTicks)
    numTicks = bCache.deathTick - tick
  else if (direction < 0 && tick - bCache.birthTick < numTicks)
    numTicks = tick - bCache.birthTick

  tick -= tick % step

  let lastPoint = null
  for (let i = 0; i < numTicks; i += step, tick += direction * step) {

    const worldPoint = getTrailWorldPositionAtTick(body, tick)
    if (!worldPoint)
      if (lastPoint)
        break
      else
        continue

    const rWorldPoint = rBody && getTrailWorldPositionAtTick(rBody, tick)
    if (rWorldPoint)
      worldPoint
        .isub(rWorldPoint)
        .iadd(rBody.pos)

    const canvasPoint = camera.worldToCanvas(worldPoint, canvas)

    if (lastPoint) {
      ctx.beginPath()
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(canvasPoint.x, canvasPoint.y)
      ctx.globalAlpha = direction < 0
        ? getTrailOpacity(i, numTicks)
        : TRAIL_OPACITY_MAX
      ctx.stroke()
    }

    lastPoint = canvasPoint

  }

}

const getTrailOpacity = (index, length) => {

  const fadeMultiplier = 1 / TRAIL_FADE_FACTOR
  const maxIndex = length - 1

  const progress = index / maxIndex

  return min((1 - progress) * fadeMultiplier, 1) * TRAIL_OPACITY_MAX
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

export function drawBodies (ctx, renderer, simulation) {

  const bodiesByMass = new SortedArray(...simulation.livingBodies())

  ensureLivingReferenceFrame(renderer, simulation)

  if (renderer.options.grid)
    drawGrid(ctx, renderer)

  if (renderer.camera.referenceFrame && renderer.options.relations) {
    const body = renderer.camera.referenceFrame
    drawBodyParentLine(ctx, renderer, body, simulation)
  }

  if (renderer.options.trailLength !== 0)
    for (const body of simulation)
      drawTrails(ctx, renderer, body, simulation)

  for (const body of bodiesByMass) if (body.exists)
    drawBody(ctx, renderer, body)

}
