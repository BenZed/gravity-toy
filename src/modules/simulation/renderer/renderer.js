import { clearCanvas, drawBodies } from './drawing'

/******************************************************************************/
// Main Component
/******************************************************************************/

class Renderer {

  constructor (canvas) {
    this.canvas = canvas
  }

  render (simulation) {

    const { canvas } = this
    const ctx = canvas.getContext('2d')

    clearCanvas(ctx, canvas)
    drawBodies(ctx, simulation)
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Renderer
