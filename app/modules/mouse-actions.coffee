geometry = require "./geometry2D"
Vector = geometry.Vector

class MouseAction
  constructor: (@press, @hold, @release)->

class SelectBody extends MouseAction
  constructor: (@gravityUI)->
    press = (input)=>
      for body in @gravityUI.simulation.bodies
        body.selected = false
        @gravityUI.followBody = null if @gravityUI.followBody is body
    hold = (input)=>
    release = (input)=>
      clickPoint = @gravityUI.draw.camera.canvasToWorld input.mouseEnd
      for body in @gravityUI.simulation.bodies
        dist = Vector.distance clickPoint, body.pos
        if dist < body.radius + 3 * @gravityUI.draw.camera.current.scale
          body.selected = true
          @gravityUI.followBody = body
          break

    super press, hold, release

class CreateBody extends MouseAction
  constructor: (@gravityUI)->
    press = (input)=>
      @updatePseudoBodies()
      @updateCoords input
      @gravityUI.simulation.pause()

    hold = (input)=>
      @updateCoords input
      @drawTrajectory input

    release = (input)->
      @createNewBody()
      @gravityUI.simulation.start()

    super press, hold, release

  updatePseudoBodies: ->
    @pseudoBodies = []
    sim = @gravityUI.simulation
    mass = 1000 * Math.pow @gravityUI.draw.camera.current.scale, 3
    @pseudoBodies.push sim.createPseudoBody mass, Vector.zero, Vector.zero

    for body in sim.bodies when body.visible and not body.destroyed
      @pseudoBodies.push sim.createPseudoBody body.mass, body.pos.copy(), body.vel.copy()

  updateCoords: (input)->
    pb = @pseudoBodies[0]
    origin = @gravityUI.draw.camera.canvasToWorld input.mouseOrigin
    end = @gravityUI.draw.camera.canvasToWorld input.mouseEnd

    pb.original.pos = origin
    pb.original.vel = end.sub origin

  createNewBody: ->
    pb = @pseudoBodies[0]
    @gravityUI.simulation.createBody pb.original.mass, pb.original.pos, pb.original.vel

  pseudoReset: ->
    pBody.reset() for pBody in @pseudoBodies

  drawTrajectory: ->

    pb = @pseudoBodies[0]
    @pseudoReset()

    simulation = @gravityUI.simulation
    draw = @gravityUI.draw

    draw.context = draw.canvas.getContext '2d' 
    draw.context.lineWidth = 1

    view_scale = @gravityUI.draw.camera.current.scale
    speed_scale = pb.vel.magnitude * 0.025

    scales = view_scale * speed_scale
    scales = 1 if scales < 1

    step = simulation.UPDATE_DELTA * scales
    start_time = performance.now()
    prediction_time = 0
    integrate = simulation.constructor.integrate

    origin = pb.pos.copy()

    color_alt = Math.round((Math.min(scales, 100) / 255) * 255)
    console.log color_alt

    while performance.now() - start_time < simulation.UPDATE_DELTA
      
      canvasStart = draw.camera.worldToCanvas pb.pos
      integrate @pseudoBodies, step
      canvasEnd = draw.camera.worldToCanvas pb.pos

      draw.context.beginPath()
      draw.context.moveTo canvasStart.x, canvasStart.y
      draw.context.lineTo canvasEnd.x, canvasEnd.y
      alpha = geometry.lerp 1,0, prediction_time * 0.001
      alpha = 0.1 if alpha < 0.1
      draw.context.strokeStyle = "rgba(#{color_alt},255,0,#{alpha})"
      draw.context.stroke()

      if pb.suspended
        draw.context.fillStyle = "green"
        draw.context.beginPath()
        draw.context.arc canvasEnd.x, canvasEnd.y, 2, 0, 2 * Math.PI
        draw.context.closePath()
        draw.context.fill()

        break

      prediction_time += step

module.exports = { SelectBody, CreateBody }

