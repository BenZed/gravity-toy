import Vector from './vector'
import lerp from './lerp'
import clamp from './clamp'

import is from 'is-explicit'

const _focusBody = Symbol('focus-body'),
  _current = Symbol('current'),
  _velocity = Symbol('velocity'),
  _canvasCenter = Symbol('canvas-center')

const CameraDefaults = {
  Speed: 5,
  MinScale: 0.1,
  MaxScale: 1000,
  blurFactor: 5
}

const SPEED = 5,
  MIN_SCALE = 0.1,
  MAX_SCALE = 1000,
  BLUR_FACTOR = 5

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

  get canvasMid() {
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

const _drawStart = Symbol('draw-start')

export default class SimulationCanvasDraw {

  constructor(simulation, canvas) {

    Object.defineProperty(this, 'canvas', { value: canvas })
    Object.defineProperty(this, 'context', { value: canvas.getContext('2d')})
    Object.defineProperty(this, 'camera', { value: new Camera(canvas)})

    this.simulation = simulation

    this[_drawStart] = this[_drawStart].bind(this)

    this.simulation.on('interval-start', this[_drawStart])
  }

  [_drawStart]() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
}
