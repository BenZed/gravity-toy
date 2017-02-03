import Vector from './vector'

import { lerp, clamp } from './helper'

const { max, min, floor, round, abs, sign, sqrt, PI } = Math

export const DrawTypes = {
  SELECTED: 'SELECTED',
  ON: 'ON',
  OFF: 'OFF'
}

const OptionDefaults = {

  grid: true,

  trails: DrawTypes.ON,
  predictions: DrawTypes.OFF,
  parents: DrawTypes.SELECTED,

  names: DrawTypes.ON,
  nameFont: '12px Helvetica',
  nameColor: 'white',
  nameRadiusThreshold: 10,

  gridColor: [140,180,180],
  gridWidth: 1,

  selectionColor: 'rgba(255,255,85,0.5)',
  trailColor: [0,0,255],
  predictionColor: [0,255,0],
  trailLength: 100,
  predictionLength: 50,

  trailStep: 1,
  trailWidth: 0.5,

  minZoom: 0.1,
  maxZoom: 250
}

const BodyOptionDefaults = {
  trails: false,
  predictions: false,
  selected: false,
  name: null
}

const CAMERA_LERP_FACTOR = 5,

  MIN_DRAW_RADIUS = 0.5,

  MAX_TIME_DIALATION = 48,
  BLUR_FACTOR = 0.5,

  TRAIL_FADE_START = 30

import colorLerp from 'color-interpolate'
import is from 'is-explicit'

function weightedColorLerp(colors, values) {

  if (!is(colors, Array) || !is(values, Array))
    throw new Error('weighted colorizer requires two arrays')

  const map = colorLerp(colors)
  const maxValueIndex = values.length - 1

  return value => {

    let pointer = 0

    for (let i = 0; i < maxValueIndex; i++) {
      const valueFrom = values[i]
      const valueTo = values[i + 1]
      const pointFrom = i / maxValueIndex
      const pointTo = (i + 1) / maxValueIndex

      if (value < valueFrom)
        break

      if (value >= valueFrom && value <= valueTo) {
        const valueFactor = (value - valueFrom) / (valueTo - valueFrom)
        pointer = lerp(pointFrom, pointTo, valueFactor)
        break
      }

      pointer = pointTo
    }

    return map(pointer)

  }
}

const colorOfMass = weightedColorLerp(
  ['#444', 'white', 'magenta', 'yellow', 'orange', 'red', '#420300'],
  [0, 10000, 30000, 100000, 1000000, 10000000, 100000000])


/******************************************************************************/
// Camera Classes
/******************************************************************************/

const _focusBody = Symbol('focus-body'),
  _current = Symbol('current'),
  _canvasCenter = Symbol('canvas-center')

class CameraCoords {
  constructor() {
    this.pos = Vector.zero
    this.scale = 1
  }
}

class Camera {

  constructor(canvas) {

    this.canvas = canvas
    this.target = new CameraCoords()

    this.target.scale = 2
    // this.target.pos.x = canvas.width * 0.5
    // this.target.pos.y = canvas.height * 0.5

    this[_current] = new CameraCoords()
    this[_focusBody] = null
    this.vel = Vector.zero

    this.update = this.update.bind(this)
  }

  get focusBody() {
    return this[_focusBody]
  }

  set focusBody(body) {
    if (this[_focusBody])
      this.target.pos.iadd(this[_focusBody].pos)

    if (body)
      this.target.pos.isub(body.pos)

    this[_focusBody] = body
  }

  get [_canvasCenter]() {
    const { width, height } = this.canvas
    return new Vector(width * 0.5, height * 0.5)
  }

  worldToCanvas(point) {
    return point
      .sub(this[_current].pos)
      .idiv(this[_current].scale)
      .iadd(this[_canvasCenter])
  }

  canvasToWorld(point) {
    return point
      .sub(this[_canvasCenter])
      .imult(this[_current].scale)
      .iadd(this[_current].pos)
  }

  update(deltaTime, draw) {

    const focusBodyStats = this.focusBody ? this.focusBody.statsAtTick(draw.tick) : null
    const oldPos = this[_current].pos.copy()
    const targetPos = focusBodyStats ? this.target.pos.add(focusBodyStats.pos) : this.target.pos

    //new position
    this[_current].pos.ilerp(targetPos, deltaTime * CAMERA_LERP_FACTOR)

    //speed is new position minus old
    this.vel = oldPos.isub(this[_current].pos).idiv(min(draw.tickDelta, MAX_TIME_DIALATION))

    if (focusBodyStats)
      this.vel.iadd(focusBodyStats.vel)

    //apply scale
    this.target.scale = clamp(this.target.scale, draw.options.minZoom, draw.options.maxZoom)
    this[_current].scale = lerp(this[_current].scale, this.target.scale, deltaTime * CAMERA_LERP_FACTOR)

  }

}

/******************************************************************************/
// SimulationCanvasDraw Class
/******************************************************************************/

//symbols for 'private' members
const _drawStart = Symbol('draw-start'),
  _drawBody = Symbol('draw-body'),
  _drawComplete = Symbol('draw-complete'),
  _drawGrid = Symbol('draw-grid'),
  _drawTrails = Symbol('draw-trails'),
  _setBodyDrawOptions = Symbol('set-body-draw-options')

export default class SimulationCanvasDraw {

  constructor(simulation, canvas, options = {}) {

    Object.defineProperty(this, 'canvas', { value: canvas })
    Object.defineProperty(this, 'context', { value: canvas.getContext('2d') })
    Object.defineProperty(this, 'camera', { value: new Camera(canvas) })
    Object.defineProperty(this, 'simulation', { value: simulation })
    Object.defineProperty(this, 'tick', { value: 0, writable: true })
    Object.defineProperty(this, 'tickDelta', { value: 1, writable: true })

    this.options = Object.assign({}, options, OptionDefaults)

    this.simulation.on('interval-start', this[_drawStart])
    this.simulation.on('interval-complete', this[_drawComplete])
    this.simulation.on('body-create', this[_setBodyDrawOptions])
  }

  [_drawStart] = () => {
    //clear the canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

    if (this.options.grid)
      this[_drawGrid]()
  }

  [_drawGrid]() {

    if (!this.options.grid)
      return

    const color = this.options.gridColor

    //draw a grid
    const current = this.camera[_current]
    const opacity = lerp(0.0, 0.125, current.scale ** 0.5 / OptionDefaults.maxZoom ** 0.5)
    this.context.lineWidth = this.options.gridWidth
    this.context.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${opacity})`

    const xLineDelta = this.canvas.width / current.scale
    const xOff = (-current.pos.x / current.scale + this.canvas.width * 0.5) % xLineDelta

    let x = 0
    while (x < this.canvas.width) {
      this.context.beginPath()
      this.context.moveTo(x + xOff, 0)
      this.context.lineTo(x + xOff, this.canvas.height)
      this.context.stroke()
      x += xLineDelta
    }

    const yLineDelta = this.canvas.height / current.scale
    const yOff = (-current.pos.y / current.scale + this.canvas.height * 0.5) % yLineDelta

    let y = 0
    while (y < this.canvas.height * 1) {
      this.context.beginPath()
      this.context.moveTo(0, y + yOff)
      this.context.lineTo(this.canvas.width, y + yOff)
      this.context.stroke()
      y += yLineDelta
    }
  }

  [_drawBody] = body => {
    const stats = body.statsAtTick(this.tick)

    //body doesn't exist at this.ticks
    if (!stats)
      return

    const camera = this.camera, current = camera[_current]

    //position and size of body in relation to camera
    const ar = stats.radius // actual radius
    const radius = ar / current.scale
    const pos = this.camera.worldToCanvas(stats.pos)

    //time dialation will warp the body more if the simulation is being viewed
    //at faster than 1x
    const timeDialation = min(abs(this.tickDelta), MAX_TIME_DIALATION)

    //velocity in relation to camera
    const vel = stats.vel.mult(timeDialation).isub(camera.vel).idiv(current.scale)

    const speed = vel.magnitude

    const overflow = speed + radius * 2
    const visible = !(pos.x < -overflow || pos.x > this.canvas.width + overflow || pos.y < -overflow || pos.y > this.canvas.height + overflow)
    if (!visible)
      return

    //blurRadius will warp the body from a circle to an ellipse if it is moving fasting enough
    let blurRadius = speed * BLUR_FACTOR

    //circularize if speed is too slow
    blurRadius = blurRadius < radius || this.tickDelta === 0 ? radius : blurRadius

    //angle of the ellipse
    const angle = (vel.angle - 90) * PI / 180

    this.context.fillStyle = colorOfMass(stats.mass)

    this.context.beginPath()

    //ellipse is draw with minum radii so we can still see bodies if they're too
    //small or if we're zoomed too far out
    this.context.ellipse(pos.x, pos.y,
      max(radius, MIN_DRAW_RADIUS),
      max(blurRadius, MIN_DRAW_RADIUS),
      angle, 0, 2 * PI)

    this.context.closePath()
    this.context.fill()

  }

  [_drawTrails] = (body, back) => {
    const focusBody = this.camera.focusBody
    if (focusBody === body)
      return

    let drawTick = this.tick
    let pos

    const fOrg = focusBody ? focusBody.posAtTick(drawTick) : null
    const scale = max(this.camera[_current].scale, 1)

    const step = floor(this.options.trailStep * scale)
    drawTick -= drawTick % step

    let length = back ? body.startTick : body.endTick || this.simulation.cachedTicks
    length = min(abs(drawTick - length), (back ? this.options.trailLength : this.options.predictionLength) * scale )
    length = floor(length / step)

    const style = back ? this.options.trailColor : this.options.predictionColor
    this.context.beginPath()
    this.context.strokeStyle = `rgba(${style},1)`
    this.context.lineWidth = this.options.trailWidth

    const fadeStart = floor(TRAIL_FADE_START / sqrt(scale))

    while (length > 0) {

      pos = body.posAtTick(drawTick)
      drawTick += back ? -step : step
      length -= 1

      if (!pos)
        continue

      if (focusBody) {
        const fPos = focusBody.posAtTick(drawTick)

        if (fPos)
          pos.isub(fPos).iadd(fOrg)
      }

      pos = this.camera.worldToCanvas(pos)

      const visible = !(pos.x < 0 || pos.x > this.canvas.width || pos.y < 0 || pos.y > this.canvas.height)
      if (visible) {
        this.context.lineTo(pos.x, pos.y)

        if (length >= fadeStart)
          continue

        this.context.strokeStyle = `rgba(${style},${length/fadeStart})`
        this.context.stroke()
        this.context.beginPath()
      }
      this.context.moveTo(pos.x, pos.y)

    }

    this.context.stroke()

  }

  [_drawComplete] = deltaTime => {

    //draw all the bodies
    this.simulation.forEachBody(body => {
      if (this.options.trails === DrawTypes.ON)
        this[_drawTrails](body, true)

      if (this.options.predictions === DrawTypes.ON)
        this[_drawTrails](body, false)
    })
    this.simulation.forEachBody(this[_drawBody])

    this.camera.update(deltaTime, this)

    //this prevents us from trying to draw a tick that hasn't finished calculating
    //yet, in the event the simulation is large and moving very slowly
    const nextTick = clamp(this.tick + this.tickDelta, 0, this.simulation.cachedTicks - 1)

    //if the next tick isn't what we're expecting it to be, we reduce the playback
    //speed to 1 or -1 in case we're playing back faster
    if (nextTick !== this.tick + this.tickDelta)
      this.tickDelta = sign(this.tickDelta)

    this.tick = nextTick
  }

  [_setBodyDrawOptions] = body => {
    for (const i in BodyOptionDefaults)
      body[i] = i in body ? body[i] : BodyOptionDefaults[i]
  }

}
