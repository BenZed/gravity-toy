import CameraCoords from './camera-coords'

import { Vector, min, clamp, lerp } from 'math-plus'
import Define from 'define-utility'

const FOCUS_BODY = Symbol('focus-body')
export const CURRENT = Symbol('current')
const TARGET = Symbol('current')
const VELOCITY = Symbol('velocity')

const CAMERA_LERP_FACTOR = 5

export default class Camera {

  constructor(canvas) {

    Define(this)
      .const('canvas', canvas)
      .const(TARGET, new CameraCoords)
      .const(CURRENT, new CameraCoords)
      .const(VELOCITY, new Vector)
      .let(FOCUS_BODY, null)

  }

  get focusBody() {
    return this[FOCUS_BODY]
  }

  set focusBody(body) {
    if (this[FOCUS_BODY])
      this[TARGET].pos.iadd(this[FOCUS_BODY].pos)

    if (body)
      this[TARGET].pos.isub(body.pos)

    this[FOCUS_BODY] = body
  }

  get canvasCenter() {
    const { width, height } = this.canvas
    return new Vector(width * 0.5, height * 0.5)
  }

  worldToCanvas(point) {
    return point
      .sub(this[CURRENT].pos)
      .idiv(this[CURRENT].scale)
      .iadd(this.canvasCenter)
  }

  canvasToWorld(point) {
    return point
      .sub(this.canvasCenter)
      .imult(this[CURRENT].scale)
      .iadd(this[CURRENT].pos)
  }

  update = (deltaTime, draw) => {

    // const focusBodyStats = this.focusBody ? this.focusBody.statsAtTick(draw.tick) : null
    // const oldPos = this[_current].pos.copy()
    // const targetPos = focusBodyStats ? this.target.pos.add(focusBodyStats.pos) : this.target.pos
    //
    // //new position
    // this[_current].pos.ilerp(targetPos, deltaTime * CAMERA_LERP_FACTOR)
    //
    // //speed is new position minus old
    // this.vel = oldPos.isub(this[_current].pos).idiv(min(draw.tickDelta, MAX_TIME_DIALATION))
    //
    // if (focusBodyStats)
    //   this.vel.iadd(focusBodyStats.vel)
    //
    // //apply scale
    // this.target.scale = clamp(this.target.scale, draw.options.minZoom, draw.options.maxZoom)
    // this[_current].scale = lerp(this[_current].scale, this.target.scale, deltaTime * CAMERA_LERP_FACTOR)

  }

}
