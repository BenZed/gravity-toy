import { V2, PI, log10, max, min, clamp, floor, sign, abs, sqrt } from '@benzed/math'

import { Body, Simulation } from '../old/simulation'

import { RADIUS_MIN } from '../simulation/constants'
import Renderer, { RendererOptions } from './renderer'
import createWeightedColorizer from './weighted-colorizer'

/*** Constants ***/

// TODO Right now this is for drawing the grid only.
// It should come from the simulation.
const LARGEST_SAFE_AXIS = 99999999.99999999

const MAX_TOP_LEFT = new V2(-LARGEST_SAFE_AXIS, -LARGEST_SAFE_AXIS)
const MAX_BOT_RIGHT = new V2(LARGEST_SAFE_AXIS, LARGEST_SAFE_AXIS)

// This contains a whole bunch of draw helpers so they don't have to be placed
// renderer class page

const DOPPLER_MAX_VEL = 30
const DOPPLER_MAX_DIST = 400000
const MAX_SPEED_DISTORTION = 6 // from renderer speed specifically, not body velocity
const GRID_OPACITY_MAX = 0.5
const TRAIL_OPACITY_MAX = 0.5
const TRAIL_FADE_FACTOR = 0.33 // %, the last 33% of the trail will fade
const NO_DASH: number[] = []

const dopplerColor = createWeightedColorizer(
    ['blue', 'cyan', 'white', 'orange', 'red'],
    [-DOPPLER_MAX_VEL, -DOPPLER_MAX_VEL / 3, 0, DOPPLER_MAX_VEL / 3, DOPPLER_MAX_VEL]
)

const massColor = createWeightedColorizer(
    ['grey', 'white', 'white', 'fuchsia', 'gold', 'firebrick'],
    [0, 50, 1000, 10000, 100000, 1000000]
)

/*** Helper ***/

function escapeSpeed(child: Body, parent: Body, g: number) {
    const relative = child.pos.sub(parent.pos)
    return g * parent.mass * child.mass / relative.sqrMagnitude
}

function baryCenter(a: Body, b: Body): V2 {

    const small = a.mass > b.mass ? b : a
    const big = small === a ? b : a

    const relative = big.pos.sub(small.pos)
    const distance = relative.magnitude
    const baryRadius = distance / (1 + small.mass / big.mass)

    return relative
        .copy()
        .normalize()
        .mult(baryRadius)
        .add(small.pos)
}

const numDigits = (n: number) =>
    // No fucking idea. Found it on the internet
    (log10((n ^ (n >> 31)) - (n >> 31)) | 0) + 1


/*** Colors ***/

function colorByMass(ctx: CanvasRenderingContext2D, body: Body) {
    ctx.fillStyle = ctx.strokeStyle = massColor(body.mass)
}

function colorByDoppler(
    ctx: CanvasRenderingContext2D,
    body: Body,
    referencePos: V2,
    relativeVel: V2
) {

    const relativePos = body.pos.sub(referencePos)
    const dist = relativePos.magnitude
    const speed = relativeVel.magnitude

    const direction = V2.dot(relativePos, relativeVel)
    const distanceFactor = clamp(dist / DOPPLER_MAX_DIST)

    const intensity = distanceFactor * DOPPLER_MAX_VEL + ((1 - distanceFactor) * speed)

    ctx.fillStyle = ctx.strokeStyle = dopplerColor(direction * intensity)

}

const pointIsVisible = (point: V2, radius = 1, canvas: HTMLCanvasElement) =>
    point.x + radius > 0 &&
    point.x - radius < canvas.width &&
    point.y + radius > 0 &&
    point.y - radius < canvas.height


/*** Drawing ***/

function createCirclePath(ctx: CanvasRenderingContext2D, pos: V2, r1: number, r2 = r1, angle = 0) {
    ctx.beginPath()
    ctx.ellipse(
        pos.x, pos.y, r1, r2, angle, 0, 2 * PI
    )
    ctx.closePath()
}

function drawBody(ctx: CanvasRenderingContext2D, renderer: Renderer, body: Body) {

    const { radius, pos, vel } = body
    const { camera, canvas, options, speed } = renderer
    const frame = camera.referenceFrame

    const relativeVel = frame
        ? vel.sub(frame.vel)
        : vel

    const viewVel = relativeVel.div(camera.current.zoom)
    const viewRadius = max(radius / camera.current.zoom, RADIUS_MIN)
    const viewPos = camera.worldToCanvas(pos, canvas)

    if (!pointIsVisible(viewPos, viewRadius, canvas))
        return

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

function detailStroke(ctx: CanvasRenderingContext2D, options: RendererOptions) {
    ctx.strokeStyle = options.detailsColor
    ctx.setLineDash(options.detailsDash)
    ctx.globalAlpha = 1
    ctx.stroke()
}

function drawReferenceFrameOutline(ctx: CanvasRenderingContext2D, options: RendererOptions, viewPos: V2, viewRadius: number) {
    const ringRadius = viewRadius + options.detailsPad

    createCirclePath(ctx, viewPos, ringRadius)
    detailStroke(ctx, options)
}

function drawBodyParentLine(
    ctx: CanvasRenderingContext2D,
    renderer: Renderer,
    child: Body,
    simulation: Simulation
) {

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

function getGridZoomData(zoom: number) {

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


function drawGrid(ctx: CanvasRenderingContext2D, renderer: Renderer) {

    const { camera, canvas, options } = renderer
    const { current } = camera
    const { zoom } = current
    const { width, height } = canvas

    ctx.strokeStyle = options.detailsColor
    ctx.setLineDash(NO_DASH)
    ctx.lineWidth = 1

    const data = getGridZoomData(zoom)

    const canvasHalfWorldSize = new V2(width, height).mult(zoom * 0.5)
    const worldTL = current.pos.copy().sub(canvasHalfWorldSize)
    worldTL.x = max(worldTL.x, MAX_TOP_LEFT.x)
    worldTL.y = max(worldTL.y, MAX_TOP_LEFT.y)

    const worldBR = current.pos.copy().add(canvasHalfWorldSize)
    worldTL.x = min(worldBR.x, MAX_BOT_RIGHT.x)
    worldTL.y = min(worldBR.y, MAX_BOT_RIGHT.y)

    const worldSnapTL = new V2(
        floor(worldTL.x, canvas.width * data.increment),
        floor(worldTL.y, canvas.height * data.increment)
    )

    drawGridLines(ctx, renderer, worldSnapTL, worldBR, true, data)
    drawGridLines(ctx, renderer, worldSnapTL, worldBR, false, data)
}

function drawGridLines(
    ctx: CanvasRenderingContext2D,
    rend: Renderer,
    from: V2,
    to: V2,
    horizontal: boolean,
    data: ReturnType<typeof getGridZoomData>
) {
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

function drawGridLine(
    ctx: CanvasRenderingContext2D,
    renderer: Renderer,
    start: number,
    limitTL: V2,
    limitBR: V2,
    horizontal: boolean,
    opac = 0.25
) {

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

const getTrailWorldPositionAtTick = (body: Body, tick: number) => {
    const bCache = body['_cache']

    const index = body.getTickDataIndex(tick)
    const mass = bCache.data[index]
    if (!mass || mass === 0)
        return null

    const worldPoint = new V2(
        bCache.data[index + 1],
        bCache.data[index + 2]
    )

    return worldPoint
}

function drawTrails(ctx: CanvasRenderingContext2D, renderer: Renderer, body: Body, simulation: Simulation) {

    const { options, camera, canvas } = renderer

    const rBody = camera.referenceFrame
    if (body === rBody || !rBody)
        return

    const bCache = rBody['_cache']

    const zoomF = sqrt(camera.current.zoom)

    let numTicks = abs(options.trailLength * zoomF)
    const step = floor(options.trailStep * zoomF)
    const direction = sign(options.trailLength)

    ctx.lineWidth = 1
    ctx.globalAlpha = 1
    ctx.setLineDash(direction > 0 ? options.detailsDash : [])
    ctx.fillStyle = ctx.strokeStyle = options.trailColor

    let tick = simulation.currentTick
    // prevents jittering caused by step
    tick -= tick % step

    // clamp numTicks
    if (direction > 0 && bCache.deathTick !== null && bCache.deathTick - tick < numTicks)
        numTicks = bCache.deathTick - tick
    else if (direction < 0 && tick - bCache.birthTick < numTicks)
        numTicks = tick - bCache.birthTick

    let lastPoint = null

    for (let i = 0; i < numTicks; i += step, tick += direction * step) {

        const firstDrawnTickForExistingBody = i === 0 && body.exists
        const worldPoint = firstDrawnTickForExistingBody
            // ensures trail starts at body, as a result of correcting for jitter
            ? body.pos.copy()
            : getTrailWorldPositionAtTick(body, tick)

        if (!worldPoint)
            if (lastPoint)
                break
            else
                continue

        const rWorldPoint = firstDrawnTickForExistingBody
            ? null
            : rBody && getTrailWorldPositionAtTick(rBody, tick)
        if (rWorldPoint)
            worldPoint
                .sub(rWorldPoint)
                .add(rBody.pos)

        const canvasPoint = camera.worldToCanvas(worldPoint, canvas)

        if (lastPoint && (pointIsVisible(lastPoint, 1, canvas) || pointIsVisible(canvasPoint, 1, canvas))) {
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

function getTrailOpacity(index: number, length: number) {

    const fadeMultiplier = 1 / TRAIL_FADE_FACTOR
    const maxIndex = length - 1

    const progress = index / maxIndex

    return min((1 - progress) * fadeMultiplier, 1) * TRAIL_OPACITY_MAX
}

function ensureLivingReferenceFrame({ camera }: Renderer, simulation: Simulation) {

    while (
        camera.referenceFrame &&
        !camera.referenceFrame.exists
    )
        camera.referenceFrame = simulation.body(camera.referenceFrame.mergeId)

}

/*** Exports ***/

export function clearCanvas(ctx: CanvasRenderingContext2D, renderer: Renderer) {

    const { canvas } = renderer

    ctx.clearRect(0, 0, canvas.width, canvas.height)

}

export function drawBodies(ctx: CanvasRenderingContext2D, renderer: Renderer, simulation: Simulation) {

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

    // const bodiesByMass = new SortedArray(...simulation.livingBodies())
    for (const body of simulation.livingBodies())
        drawBody(ctx, renderer, body)

}
