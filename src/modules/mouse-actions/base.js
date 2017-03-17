export default class MouseAction {

  constructor(ui) {
    this.ui = ui
  }

  get local() {
    const { origin, end } = this.ui.state.mouse

    return { origin, end }
  }

  get global() {
    const { renderer, state } = this.ui

    const { origin, end } = state.mouse

    return {
      origin: renderer.camera.canvasToWorld(origin),
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

}
