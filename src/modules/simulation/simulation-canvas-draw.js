import Vector from './vector'
import lerp from './lerp'
import clamp from './clamp'

import is from 'is-explicit'

const OptionDefaults = {

  grid: true,
  parents: true,
  trails: true,
  trailLength: 120, //seconds

  names: true,
  nameRadiusThreshold: 10,

  gridColor: 'rgba(255,255,255,0.75)',
  gridWidth: 0.1,

  nameFont: '12px Helvetica',
  nameColor: 'white',

  selectionColor: 'rgba(255,255,85,0.5)',
  trailColor: 'rgba(85,85,225,0.25)'

}

const SPEED = 5,
  MIN_SCALE = 0.1,
  MAX_SCALE = 1000,
  MIN_DRAW_RADIUS = 0.5,
  BLUR_FACTOR = 5

/******************************************************************************/
// Camera Classes
/******************************************************************************/

const _focusBody = Symbol('focus-body'),
  _current = Symbol('current'),
  _velocity = Symbol('velocity'),
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

    this.target.scale = 1
    this.target.pos.x = canvas.width * 0.5
    this.target.pos.y = canvas.height * 0.5

    this[_current] = new CameraCoords()
    this[_velocity] = Vector.zero
    this[_focusBody] = null

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

  update(deltaTime) {

    const hasFocusBody = this.focusBody && !this.focusBody.destroyed
    const oldPos = this[_current].pos.copy()
    const targetPos = hasFocusBody ? this.target.pos.add(this.focusBody.pos) : this.target.pos

    //new position
    this[_current].pos.ilerp(targetPos, deltaTime * SPEED)

    //speed is new position minus old
    this[_velocity] = oldPos.isub(this[_current].pos)

    if (hasFocusBody)
      this[_velocity].iadd(this.focusBody.vel)

    //apply scale
    this.target.scale = clamp(this.target.scale, MIN_SCALE, MAX_SCALE)
    this[_current].scale = lerp(this[_current].scale, this.target.scale, deltaTime * SPEED)

  }

}

/******************************************************************************/
// SimulationCanvasDraw Class
/******************************************************************************/

const _drawStart = Symbol('draw-start'),
  _drawBody = Symbol('draw-body'),
  _drawComplete = Symbol('draw-complete'),
  _drawGrid = Symbol('draw-grid')

export default class SimulationCanvasDraw {

  constructor(simulation, canvas, options = {}) {

    Object.defineProperty(this, 'canvas', { value: canvas })
    Object.defineProperty(this, 'context', { value: canvas.getContext('2d') })
    Object.defineProperty(this, 'camera', { value: new Camera(canvas) })
    Object.defineProperty(this, 'simulation', { value: simulation })
    Object.defineProperty(this, 'tick', { value: 0, writable: true })

    this.options = Object.assign({}, options, OptionDefaults)

    this[_drawStart] = this[_drawStart].bind(this)
    this[_drawBody] = this[_drawBody].bind(this)
    this[_drawComplete] = this[_drawComplete].bind(this)

    this.simulation.on('interval-start', this[_drawStart])
    this.simulation.on('interval-body-update', this[_drawBody])
    this.simulation.on('interval-complete', this[_drawComplete])
  }

  [_drawStart]() {
    //clear the canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

    if (this.options.grid)
      this[_drawGrid]()
  }

  [_drawGrid]() {

    //draw a grid
    this.context.lineWidth = this.options.gridWidth
    this.context.strokeStyle = this.options.gridColor

    const current = this.camera[_current]
    const xLineDelta = this.canvas.width / current.scale
    const yLineDelta = this.canvas.height / current.scale

    const xOff = (-current.pos.x / current.scale + this.canvas.width * 0.5) % xLineDelta
    const yOff = (-current.pos.y / current.scale + this.canvas.height * 0.5) % yLineDelta

    let x = 0, y = 0
    while (x < this.canvas.width) {
      this.context.beginPath()
      this.context.moveTo(x + xOff, 0)
      this.context.lineTo(x + xOff, this.canvas.height)
      this.context.stroke()
      x += xLineDelta
    }

    while (y < this.canvas.height) {
      this.context.beginPath()
      this.context.moveTo(0, y + yOff)
      this.context.lineTo(this.canvas.width, y + yOff)
      this.context.stroke()
      y += yLineDelta
    }
  }

  [_drawBody](body) {
    const stats = body.statsAtTick(this.tick)

    //body doesn't exist at this.ticks
    if (!stats)
      return

    const current = this.camera[_current]

    const radius = stats.radius / current.scale
    const pos = this.camera.worldToCanvas(stats.pos)

    //velocity of body in relation to camera
    const vel = stats.vel.sub(this.camera.speed).div(current.scale).mult(0.001 * this.simulation.UPDATE_DELTA * 0.5)

    //speedRadius will warp the body from a circle to an ellipse if it is moving fasting enough
    let speedRadius = vel.magnitude

    //circularize if speed is too slow or simulation is paused
    speedRadius = speedRadius < radius || this.simulation.paused ? radius : speedRadius

    //in addition to warping, the body will be faded if moving sufficiently fast
    const opacity = lerp(0.5, 1, radius / speedRadius)

    //angle of the ellipse
    const angle = (vel.angle - 90) * Math.PI / 180

    this.context.fillStyle = `rgba(255,255,255,${opacity})`
    this.context.beginPath()

    //ellipse is draw with minum radii so we can still see bodies if they're too
    //small or if we're zoomed too far out
    this.context.ellipse(pos.x, pos.y,
      Math.max(radius, MIN_DRAW_RADIUS),
      Math.max(speedRadius, MIN_DRAW_RADIUS),
      angle, 0, 2 * Math.PI)

    this.context.closePath()
    this.context.fill()

  }


  [_drawComplete](deltaTime) {
    this.camera.update(deltaTime)
    //this prevents us from trying to draw a tick that hasn't finished calculating
    //yet, in the event the simulation is large and moving very slowly
    this.tick = Math.min(this.simulation.cacheSize, this.tick + 1)
  }

}
