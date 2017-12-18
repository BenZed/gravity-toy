import Action from './action'

import { min, abs, Vector } from 'math-plus'

const ZOOM_FACTOR = 0.01
const ZOOM_MAX_SPEED = 50

function approx (a, b, epsilon = 0.001) {
  return abs(a - b) < epsilon
}

/******************************************************************************/
// Main
/******************************************************************************/

class CameraMove extends Action {

  static ZOOM_FACTOR = ZOOM_FACTOR
  static ZOOM_MAX_SPEED = ZOOM_MAX_SPEED

  cameraZoom = 0
  cameraPos = null

  onStart () {
    const { camera: { referenceFrame, target } } = this.toy.renderer

    this.cameraZoom = target.zoom
    this.cameraPos = target.pos.copy()
    this.refStart = referenceFrame ? referenceFrame.pos.copy() : Vector.zero
  }

  onTick () {
    const { camera: { current, target, referenceFrame } } = this.toy.renderer

    const dist = this.touchDist
    const zoomSpeed = min(this.cameraZoom * ZOOM_FACTOR, ZOOM_MAX_SPEED)
    const zoom = this.cameraZoom + zoomSpeed * dist

    if (approx(current.zoom, target.zoom))
      current.zoom = zoom
    target.zoom = zoom

    const refCurrent = referenceFrame
      ? referenceFrame.pos.copy()
      : Vector.zero

    const refOffset = refCurrent.sub(this.refStart)

    const x = this.cameraPos.x + refOffset.x - this.deltaPos.x * zoom
    if (approx(current.pos.x, target.pos.x, 1))
      current.pos.x = x
    target.pos.x = x

    const y = this.cameraPos.y + refOffset.y - this.deltaPos.y * zoom
    if (approx(current.pos.y, target.pos.y, 1))
      current.pos.y = y
    target.pos.y = y

  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default CameraMove
