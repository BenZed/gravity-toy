import Action from './action'

/******************************************************************************/
// Main
/******************************************************************************/

class CameraMove extends Action {

  cameraZoom = 0
  cameraPos = null

  onStart () {
    const { camera } = this.toy.renderer

    this.cameraZoom = camera.target.zoom
    this.cameraPos = camera.target.pos.copy()
  }

  onTick () {
    const { camera } = this.toy.renderer

    const zoom = this.cameraZoom / this.touchScale

    camera.current.zoom = zoom
    camera.target.zoom = zoom

    camera.target.pos.x = this.cameraPos.x - this.deltaPos.x * zoom
    camera.current.pos.x = camera.target.pos.x

    camera.target.pos.y = this.cameraPos.y - this.deltaPos.y * zoom
    camera.current.pos.y = camera.target.pos.y

    if (camera.referenceFrame)
      camera.current.pos.iadd(camera.referenceFrame.pos)

  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default CameraMove
