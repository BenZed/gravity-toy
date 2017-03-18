export default class MouseAction {

  constructor(ui) {
    this.ui = ui
  }

  cancelled = false

  get local() {
    const { start, end } = this.ui.state.mouse

    return { start, end }
  }

  get global() {
    const { renderer, state } = this.ui

    const { start, end } = state.mouse

    return {
      start: renderer.camera.canvasToWorld(start),
      end: renderer.camera.canvasToWorld(end)
    }
  }

  get canvas() {
    return this.ui.renderer.canvas
  }

  get ctx() {
    return this.ui.renderer.context
  }

  get scale() {
    return this.ui.renderer.camera.target.scale
  }

  down() { }

  up() { }

  hold() { }

  hover() { }

  cancel() { }

}
