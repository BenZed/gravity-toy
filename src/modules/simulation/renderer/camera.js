import define from 'define-utility'
import { Vector, clamp, lerp } from '@benzed/math'
import { TICK_DURATION } from '../constants'

/******************************************************************************/
// Symbols
/******************************************************************************/

const REF = Symbol('reference-frame')
const REF_LEP = Symbol('reference-frame-last-existing-position')
const ZOOM = Symbol('zoom')

/******************************************************************************/
// Helper
/******************************************************************************/

function canvasCenter (canvas) {
  const { width, height } = canvas

  return new Vector(width, height).imult(0.5)
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

  get relPos () {
    const { referenceFrame } = this.camera

    return referenceFrame && referenceFrame.exists
      ? this.pos.add(referenceFrame.pos)
      : this.pos
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
      .enum.let(REF, null)
  }

  worldToCanvas (point, canvas) {
    return point
      .sub(this.current.relPos)
      .idiv(this.current.zoom)
      .iadd(canvasCenter(canvas))
  }

  canvasToWorld (point, canvas) {
    return point
      .sub(canvasCenter(canvas))
      .imult(this.current.zoom)
      .iadd(this.current.relPos)
  }

  get referenceFrame () {
    return this[REF]
  }

  set referenceFrame (value) {

    const prev = this[REF]

    this[REF] = value

    const { target, current } = this

    if (prev) {
      target.pos.iadd(this[REF_LEP])
      current.pos.iadd(this[REF_LEP])
    }

    if (value) {
      this[REF_LEP] = value.pos.copy()
      target.pos.isub(value.pos)
      current.pos.isub(value.pos)
    }

  }

  update = (speed, sim) => {

    const { target, current, renderer } = this
    const { cameraSpeed = 5 } = renderer

    const delta = TICK_DURATION * cameraSpeed

    while (this.referenceFrame && !this.referenceFrame.exists)
      this.referenceFrame = sim.body(this.referenceFrame.mergeId)

    if (this.referenceFrame)
      this[REF_LEP].set(this.referenceFrame.pos)

    current.zoom = lerp(current.zoom, target.zoom, delta)
    current.pos.ilerp(target.pos, delta)

  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Camera
