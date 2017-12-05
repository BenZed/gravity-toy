import { clearCanvas, drawBodies } from './drawing'
import Camera from './camera'
import define from 'define-utility'

/******************************************************************************/
// Main Component
/******************************************************************************/

class Renderer {

  constructor (canvas) {
    this::define()
      .enum.let('canvas', canvas)
      .enum.const('camera', new Camera(this))
  }

  render (simulation) {

    const ctx = this.canvas.getContext('2d')

    clearCanvas(ctx, this)
    drawBodies(ctx, this, simulation)
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Renderer
