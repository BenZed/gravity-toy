import { Vector, lerp, max, PI } from 'math-plus'
import { WeightedColorizer } from '../util'
import Define from 'define-utility'
import Camera, { CURRENT } from './camera'

const CLEAR_CANVAS = Symbol('clear-canvas')
const RENDER_GRID = Symbol('render-grid')
const RENDER_BODIES = Symbol('render-bodies')

export const DrawTypes = {
  SELECTED: 'SELECTED',
  ON: 'ON',
  OFF: 'OFF'
}

const RENDERER_DEFAULTS = {

  grid: true,

  trails: DrawTypes.ON,
  predictions: DrawTypes.OFF,
  parents: DrawTypes.SELECTED,

  names: DrawTypes.ON,
  nameFont: '12px Helvetica',
  nameColor: 'white',
  nameRadiusThreshold: 10,

  gridColor: [140,180,180],
  gridWidth: 1,

  selectionColor: 'rgba(255,255,85,0.5)',
  trailColor: [0,0,255],
  predictionColor: [0,255,0],
  trailLength: 200,
  predictionLength: 50,

  trailStep: 2,
  trailWidth: 0.5,

  minZoom: 0.1,
  maxZoom: 250

}

const MIN_DRAW_RADIUS = 0.5,
  MAX_TIME_DIALATION = 48,
  BLUR_FACTOR = 0.5,
  TRAIL_FADE_START = 30


const colorOfMass = new WeightedColorizer(
  ['#444', 'white', 'magenta', 'yellow', 'orange', 'red', '#420300'],
  [0, 10000, 30000, 100000, 1000000, 10000000, 100000000])


export default class Renderer {

  constructor(simulation, canvas, options = {}) {

    this.options = { ...options, ...RENDERER_DEFAULTS}

    const camera = new Camera(canvas, this.options.minZoom, this.options.maxZoom)

    Define(this)
      .const.enum('canvas', canvas)
      .const.enum('context', canvas.getContext('2d'))
      .const.enum('camera', camera)
      .const.enum('simulation', simulation)
      .let.enum('speed', 1)

  }

  render() {

    this[CLEAR_CANVAS]()
    if (this.options.grid) this[RENDER_GRID]()
    this[RENDER_BODIES]()

  }

  [CLEAR_CANVAS]() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  [RENDER_GRID]() {
    if (!this.options.grid)
      return

    const color = this.options.gridColor

    //draw a grid
    const current = this.camera[CURRENT]
    const opacity = lerp(0, 0.25, current.scale ** 0.25 / this.options.maxZoom ** 0.25 )

    this.context.lineWidth = this.options.gridWidth
    this.context.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${opacity})`

    const xLineDelta = this.canvas.width / current.scale
    const xOff = (-current.pos.x / current.scale + this.canvas.width * 0.5) % xLineDelta

    let x = 0
    while (x < this.canvas.width) {
      this.context.beginPath()
      this.context.moveTo(x + xOff, 0)
      this.context.lineTo(x + xOff, this.canvas.height)
      this.context.stroke()
      x += xLineDelta
    }

    const yLineDelta = this.canvas.height / current.scale
    const yOff = (-current.pos.y / current.scale + this.canvas.height * 0.5) % yLineDelta

    let y = 0
    while (y < this.canvas.height * 1) {
      this.context.beginPath()
      this.context.moveTo(0, y + yOff)
      this.context.lineTo(this.canvas.width, y + yOff)
      this.context.stroke()
      y += yLineDelta
    }
  }

  [RENDER_BODIES]() {

    const camera = this.camera, current = camera[CURRENT]

    for (const body of this.simulation) {

      const { radius, pos, mass } = body

      const visualRadius = radius / current.scale
      const visualPos = camera.worldToCanvas(pos)

      this.context.fillStyle = colorOfMass(mass)

      this.context.beginPath()

      //ellipse is draw with minum radii so we can still see bodies if they're too
      //small or if we're zoomed too far out
      this.context.ellipse(visualPos.x, visualPos.y,
        max(visualRadius, MIN_DRAW_RADIUS),
        max(visualRadius, MIN_DRAW_RADIUS),
        0, 0, 2 * PI)

      this.context.closePath()
      this.context.fill()

    }
  }
}
