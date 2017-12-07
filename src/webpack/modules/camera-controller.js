import Hammer from 'hammerjs'
import { Vector } from 'math-plus'
/******************************************************************************/
// Main
/******************************************************************************/

class CameraContoller {

  constructor (toy) {

    this.toy = toy

    this.hammer = new Hammer(toy.canvas)

    this.hammer.get('pinch').set({ enable: true })
    this.hammer.on('pinchstart', this.onPinchStart)
    this.hammer.on('pinch', this.onPinchMove)

    this.hammer.on('pan', this.onPan)
    this.hammer.on('panend', this.onPanEnd)

    this.hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL })
    this.hammer.on('swipe', this.onSwipe)
  }

  dispose = () => {
    this.hammer.destroy()
  }

  /* Zoom */

  scale = 1

  onPinchStart = e => {
    const { camera } = this.toy.renderer

    this.scale = camera.current.zoom
  }

  onPinchMove = e => {
    const { camera } = this.toy.renderer

    const scale = this.scale / e.scale

    camera.current.zoom = scale
    camera.target.zoom = scale

    this.onPan(e)

  }

  onSwipe = e => {
    const { camera } = this.toy.renderer

    camera.target.pos.x += -e.deltaX * camera.current.zoom
    camera.target.pos.y += -e.deltaY * camera.current.zoom

  }

  /* Translation */

  lastPanCenter = null

  onPan = e => {

    const { camera } = this.toy.renderer

    const center = new Vector(-e.center.x, -e.center.y)

    if (this.lastPanCenter) {
      const delta = center.sub(this.lastPanCenter).imult(camera.current.zoom)
      camera.current.pos.iadd(delta)
      camera.target.pos.iadd(delta)
    }

    this.lastPanCenter = center.copy()

  }

  onPanEnd = e => {
    this.lastPanCenter = null
  }

}

/******************************************************************************/
// Helper
/******************************************************************************/

/******************************************************************************/
// Exports
/******************************************************************************/

export default CameraContoller
