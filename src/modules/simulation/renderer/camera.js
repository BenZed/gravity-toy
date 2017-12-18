import define from 'define-utility'
import { Vector, clamp, lerp } from 'math-plus'
import { TICK_DURATION } from '../constants'

/******************************************************************************/
// Symbols
/******************************************************************************/

const REFERENCE_FRAME = Symbol('reference-frame')
const ZOOM = Symbol('zoom')

/******************************************************************************/
// Helper
/******************************************************************************/

function canvasCenter (canvas) {
  const { width, height } = canvas

  return new Vector(width * 0.5, height * 0.5)
}

class Coords {

  constructor (camera) {
    this::define()
      .enum.const('pos', new Vector(960, 540))
      .const('camera', camera)
  }

  [ZOOM] = 1

  get zoom () {
    return this[ZOOM]
  }

  set zoom (value) {
    const { minZoom = 1, maxZoom = 1000 } = this.camera.renderer.options

    this[ZOOM] = clamp(value, minZoom, maxZoom)
  }

}

/******************************************************************************/
// Main
/******************************************************************************/

class Camera {

  constructor (renderer, options = {}) {

    this::define()
      .enum.const('renderer', renderer)
      .enum.const('target', new Coords(this))
      .enum.const('current', new Coords(this))
      .enum.const('options', { ...options })
      .enum.let(REFERENCE_FRAME, null)
  }

  worldToCanvas (point, canvas) {
    return point
      .sub(this.current.pos)
      .idiv(this.current.zoom)
      .iadd(canvasCenter(canvas))
  }

  canvasToWorld (point, canvas) {
    return point
      .sub(canvasCenter(canvas))
      .imult(this.current.zoom)
      .iadd(this.current.pos)
  }

  update = (speed) => {

    const { target, current, referenceFrame, renderer: { cameraSpeed = 5 } } = this

    if (referenceFrame && referenceFrame.exists) {
      const vel = referenceFrame.vel.mult(speed)
      target.pos.iadd(vel)
      current.pos.iadd(vel)
    }

    const delta = TICK_DURATION * cameraSpeed

    current.zoom = lerp(current.zoom, target.zoom, delta)
    current.pos.ilerp(target.pos, delta)

  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Camera
