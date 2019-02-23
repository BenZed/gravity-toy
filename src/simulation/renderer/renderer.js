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
  maxZoom: 1000000,

  grid: true,
  relations: false,

  // length of trail showing where body has been, in ticks.
  // 0 - off
  // positive values for future trails, negative values for past trails
  trailLength: -400,
  trailStep: 3,
  trailColor: 'rgb(200, 91, 255)',

  // Color of detail elements, such as grids, relations, reference circle
  detailsColor: 'rgba(81, 214, 83, 0.5)',
  detailsDash: [3, 3],
  detailsPad: 5, // pixels

  speed: 1, // ticks per second

  clear: true // clear the canvas before rendering

})

/******************************************************************************/
// Main Component
/******************************************************************************/

class Renderer {

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

    if (this.options.clear)
      clearCanvas(ctx, this)

    drawBodies(ctx, this, simulation)
  }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Renderer
