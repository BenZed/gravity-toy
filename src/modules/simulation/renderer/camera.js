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
      .enum.const('pos', Vector.zero)
      .const('camera', camera)
  }

  [ZOOM] = 10

  get zoom () {
    return this[ZOOM]
  }

  set zoom (value) {
    const { minZoom, maxZoom } = this.camera.renderer

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
      .let(REFERENCE_FRAME, null)
  }

  get referenceFrame () {
    return this[REFERENCE_FRAME]
  }

  set referenceFrame (body) {
    if (this[REFERENCE_FRAME])
      this.target.pos.iadd(this[REFERENCE_FRAME].pos)

    if (body)
      this.target.pos.isub(body.pos)

    this[REFERENCE_FRAME] = body
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

  update = () => {

    const { target, current, renderer: { cameraSpeed } } = this

    const delta = TICK_DURATION * cameraSpeed

    current.zoom = lerp(current.zoom, target.zoom, delta)
    current.pos.ilerp(target.pos, delta)

  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Camera
