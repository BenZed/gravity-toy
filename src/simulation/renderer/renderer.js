import { clearCanvas, drawBodies } from './drawing'
import Camera from './camera'
import define from 'define-utility'
import is from 'is-explicit'

import { DEFAULT_RENDERING } from '../constants'

/******************************************************************************/
// Main Component
/******************************************************************************/

class Renderer {

  speed = 1

  constructor (options = {}, canvas) {

    if (!is.plainObject(options))
      throw new TypeError('options argument must be a plain object')

    this::define()
      .enum.let('canvas', canvas)
      .enum.const('camera', new Camera(this))
      .enum.const('options', { ...DEFAULT_RENDERING, ...options })
  }

  render (simulation) {

    const ctx = this.canvas.getContext('2d')
    this.camera.update(simulation)

    clearCanvas(ctx, this)
    drawBodies(ctx, this, simulation)
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Renderer
