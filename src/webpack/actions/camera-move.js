import Action from './action'

import { min } from 'math-plus'

const ZOOM_FACTOR = 0.01
const ZOOM_MAX_SPEED = 50

/******************************************************************************/
// Main
/******************************************************************************/

class CameraMove extends Action {

  static ZOOM_FACTOR = ZOOM_FACTOR
  static ZOOM_MAX_SPEED = ZOOM_MAX_SPEED

  cameraZoom = 0
  cameraPos = null

  onStart () {
    const { camera: { target } } = this.toy.renderer

    this.cameraZoom = target.zoom
    this.cameraPos = target.pos.copy()
  }

  onTick () {
    const { camera: { current, target, referenceFrame } } = this.toy.renderer

    const dist = this.touchDist
    const speed = min(this.cameraZoom * ZOOM_FACTOR, ZOOM_MAX_SPEED)
    const zoom = this.cameraZoom + speed * dist

    current.zoom = zoom
    target.zoom = zoom

    target.pos.x = this.cameraPos.x - this.deltaPos.x * zoom
    current.pos.x = target.pos.x

    target.pos.y = this.cameraPos.y - this.deltaPos.y * zoom
    current.pos.y = target.pos.y

    if (referenceFrame)
      current.pos.iadd(referenceFrame.pos)

  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default CameraMove
