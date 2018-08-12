import { Vector } from '@benzed/math'

/******************************************************************************/
// Helper
/******************************************************************************/

class Coords {

  startPos = Vector.zero
  currentPos = Vector.zero

  get deltaPos () {
    return this.currentPos.sub(this.startPos)
  }

  get startWorldPos () {
    const { camera, canvas } = this.renderer
    return camera.canvasToWorld(this.startPos, canvas)
  }

  get currentWorldPos () {
    const { camera, canvas } = this.renderer
    return camera.canvasToWorld(this.currentPos, canvas)
  }

  constructor (renderer) {
    this.renderer = renderer
  }

  toString () {
    return `[${this.constructor.name}]`
  }

}

class Touch extends Coords {

  constructor (eventTouch, renderer) {
    super(renderer)
    this.startPos.x = this.currentPos.x = eventTouch.clientX
    this.startPos.y = this.currentPos.y = eventTouch.clientY
  }

  update (eventTouch) {
    this.currentPos.x = eventTouch.clientX
    this.currentPos.y = eventTouch.clientY
  }

}

/******************************************************************************/
// Main
/******************************************************************************/

class Action extends Coords {

  touches = []

  startTime = 0
  currentTime = 0
  active = false

  constructor (toy) {
    super(toy.renderer)
    this.toy = toy

  }

  // Helpers

  get touchScale () {

    if (this.touches.length <= 1)
      return 1

    let startAggregateDist = 0
    let currentAggregateDist = 0

    for (const touch of this.touches) {
      startAggregateDist += touch.startPos.sub(this.startPos).magnitude
      currentAggregateDist += touch.currentPos.sub(this.startPos).magnitude
    }

    return currentAggregateDist / startAggregateDist

  }

  get touchDist () {

    if (this.touches.length <= 1)
      return 0

    let startAggregateDist = 0
    let currentAggregateDist = 0

    for (const touch of this.touches) {
      startAggregateDist += touch.startPos.sub(this.startPos).magnitude
      currentAggregateDist += touch.currentPos.sub(this.startPos).magnitude
    }

    const relativeAggregateDist = currentAggregateDist - startAggregateDist
    return relativeAggregateDist / this.touches.length

  }

  // Handlers

  start = e => {

    this.touches.length = 0
    this.startTime = this.currentTime = null
    this.active = true

    this.startPos.imult(0)

    for (const eventTouch of e.touches) {
      const touch = new Touch(eventTouch, this.toy.renderer)
      this.touches.push(touch)
      this.startPos.iadd(touch.startPos)
    }

    this.startPos.idiv(this.touches.length)
    this.currentPos.imult(0).iadd(this.startPos)

    this.onStart()

  }

  update = e => {

    this.currentPos.imult(0)

    for (const eventTouch of e.touches) {
      const i = eventTouch.identifier - 1

      const touch = this.touches[i]
      touch.update(eventTouch)

      this.currentPos.iadd(touch.currentPos)
    }

    this.currentPos.idiv(this.touches.length)

  }

  end = e => {

    this.active = false
    this.update(e)
    this.onEnd()

  }

  // Hooks

  onStart () { }

  onTick (deltaTime) { }

  onDraw (ctx) { }

  onEnd () { }

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default Action
