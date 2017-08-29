import CameraCoords from './camera-coords'

import { Vector, min, clamp, lerp } from 'math-plus'
import define from 'define-utility'

const FOCUS_BODY = Symbol('focus-body')
export const CURRENT = Symbol('current')
const VELOCITY = Symbol('velocity')
const MIN_ZOOM = Symbol('min-zoom')
const MAX_ZOOM = Symbol('max-zoom')

const CAMERA_LERP_FACTOR = 5

export default class Camera {

  constructor(canvas, min, max) {

    define(this)
      .const('canvas', canvas)
      .const('target', new CameraCoords())
      .const(CURRENT, new CameraCoords())
      .const(VELOCITY, new Vector())
      .const(MIN_ZOOM, min)
      .const(MAX_ZOOM, max)
      .let(FOCUS_BODY, null)

  }

  get focusBody () {
    return this[FOCUS_BODY]
  }

  set focusBody (body) {
    if (this[FOCUS_BODY])
      this.target.pos.iadd(this[FOCUS_BODY].pos)

    if (body)
      this.target.pos.isub(body.pos)

    this[FOCUS_BODY] = body
  }

  get canvasCenter () {
    const { width, height } = this.canvas
    return new Vector(width * 0.5, height * 0.5)
  }

  worldToCanvas (point) {
    return point
      .sub(this[CURRENT].pos)
      .idiv(this[CURRENT].scale)
      .iadd(this.canvasCenter)
  }

  canvasToWorld (point) {
    return point
      .sub(this.canvasCenter)
      .imult(this[CURRENT].scale)
      .iadd(this[CURRENT].pos)
  }

  update = () => {

    const delta = 1 / 25 * CAMERA_LERP_FACTOR

    const current = this[CURRENT]
    const target = this.target

    target.scale = clamp(target.scale, this[MIN_ZOOM], this[MAX_ZOOM])

    current.scale = lerp(current.scale, target.scale, delta)
    current.pos.ilerp(target.pos, delta)

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
