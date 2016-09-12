import Vector from './vector'
import is from 'is-explicit'

const CameraDefaults = {
  speed: 5,
  minScale: 0.1,
  maxScale: 1000,
  blurFactor: 5
}

class CameraCoords {
  constructor() {
    this.pos = Vector.zero
    this.scale = 1
  }
}

class Camera {
  constructor(canvas) {
    this.canvas = canvas
    this.current = new CameraCoords()
    this.target = new CameraCoords()
    this.speed = Vector.zero()

    this.center = null
  }

  setCenter() {}

  worldToCanvas(point) {}

  canvasToWorld(point) {}

  update() {}

}

/******************************************************************************/
// SimulationCanvasDraw Class
/******************************************************************************/

export default class SimulationCanvasDraw {

  constructor(simulation, canvas) { }

}
