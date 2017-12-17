import { clearCanvas, drawBodies } from './drawing'
import Camera from './camera'
import define from 'define-utility'
import is from 'is-explicit'

/******************************************************************************/
// Defaults
/******************************************************************************/

const DEFAULT_RENDERING = Object.freeze({

  // could be 'doppler' 'mass'
  bodyColorBy: 'mass',

  // could be 'fill' 'outline' or ''
  bodyMode: 'fill',

  minZoom: 1,
  maxZoom: 1000,

  grid: true,
  relations: true,

  // length of trail showing where body has been, in ticks.
  // 0 - off
  // negative values show where the body WILL be,
  trailLength: 100,

  // Color of detail elements, such as grids, relations, reference circle
  detailsColor: 'rgba(81, 214, 83, 0.5)',
  detailsDash: [3, 4],
  detailsPad: 5 // pixels

})

/******************************************************************************/
// Main Component
/******************************************************************************/

class Renderer {

  constructor (canvas, options = {}) {

    if (!is.plainObject(options))
      throw new TypeError('options argument must be a plain object')

    this::define()
      .enum.let('canvas', canvas)
      .enum.const('camera', new Camera(this))
      .enum.const('options', { ...DEFAULT_RENDERING, ...options })
  }

  render (simulation, speed = 1, clear = true) {

    const ctx = this.canvas.getContext('2d')

    this.camera.update()

    if (clear)
      clearCanvas(ctx, this)

    drawBodies(ctx, this, simulation, speed)
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Renderer
