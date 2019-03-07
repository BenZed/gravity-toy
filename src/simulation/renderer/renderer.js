import { clearCanvas, drawBodies } from './drawing'
import Camera from './camera'
import define from 'define-utility'
import is from 'is-explicit'

/******************************************************************************/
// Defaults
/******************************************************************************/

const DEFAULT_RENDERING_OPTIONS = Object.freeze({

  // could be 'doppler' 'mass'
  bodyColorBy: 'doppler',

  minZoom: 1,
  maxZoom: 1000000,

  grid: true,
  relations: false,

  // length of trail showing where body has been, in ticks.
  // 0 - off
  // positive values for future trails, negative values for past trails
  trailLength: -300,
  trailStep: 5,
  trailColor: '#c96af2',

  // Color of detail elements, such as grids, relations, reference circle
  detailsColor: 'rgba(81, 214, 83, 0.5)',
  detailsDash: [3, 3],
  detailsPad: 5 // pixels

})

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
      .enum.const('options', { ...DEFAULT_RENDERING_OPTIONS, ...options })
  }

  render (simulation, speed = this.speed) {

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

export { DEFAULT_RENDERING_OPTIONS }
