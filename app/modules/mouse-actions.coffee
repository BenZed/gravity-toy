geometry = require "./geometry2D"
Vector = geometry.Vector

CLICK_DISTANCE = 5

class MouseAction
  constructor: (@gravityUI, @press, @hold, @release)->

class SelectBody extends MouseAction
  constructor: (gUI)->
    press = (input)=>
      for body in @gravityUI.simulation.bodies
        body.selected = false

    hold = (input)=>
      @drawSelectionBox input

    release = (input)=>
      area = @getSelectionArea input

      single_point = area.start.x is area.end.x and area.start.y is area.end.y

      for body in @gravityUI.simulation.bodies
        pos = @gravityUI.draw.camera.worldToCanvas body.pos

        if single_point
          dist = Vector.distance area.end, pos

          if dist < body.radius + CLICK_DISTANCE * @gravityUI.draw.camera.current.scale
            body.selected = true
            break

        else if pos.x >= area.start.x and pos.x <= area.end.x and pos.y >= area.start.y and pos.y <= area.end.y
          body.selected = true

    super gUI, press, hold, release

  drawSelectionBox: (input)->
    context = @gravityUI.draw.context
    area = @getSelectionArea input

    context.fillStyle = 'rgba(85,200,85,0.25)'
    context.rect area.start.x, area.start.y, area.end.x - area.start.x, area.end.y - area.start.y
    context.fill()

  getSelectionArea: (input)->
    origin = input.mouseOrigin
    final = input.mouseEnd

    start = 
      x: if origin.x < final.x then origin.x else final.x
      y: if origin.y < final.y then origin.y else final.y

    end =   
      x: if origin.x > final.x then origin.x else final.x
      y: if origin.y > final.y then origin.y else final.y

    {start, end}

# class CenterAction extends MouseAction
#   constructor: (gUI)->

class CreateBody extends MouseAction

  try_center = (input)->
    clickPoint = @gravityUI.draw.camera.canvasToWorld input.mouseOrigin
    @centeredThisPress = false

    for body in @gravityUI.draw.simulation.bodies
      dist = Vector.distance clickPoint, body.pos
      if dist < body.radius + CLICK_DISTANCE * @gravityUI.draw.camera.current.scale
          @centeredThisPress = true
          @gravityUI.draw.camera.setCenter body
          break

  constructor: (gUI)->
    @newPB = null
    @centerPB = null
    @centeredThisPress = false

    press = (input)=>
      try_center.call this, input
      @updatePseudoBodies()

      return if @centeredThisPress
      @updateCoords input
      @gravityUI.simulation.pause()

    hold = (input)=>
      return if @centeredThisPress

      @updateCoords input
      @drawTrajectory input

    release = (input)->
      @createNewBody() if not @centeredThisPress
      @newPB = null
      @centerPB = null
      @gravityUI.simulation.start()

    super gUI, press, hold, release

  updatePseudoBodies: ->
    sim = @gravityUI.simulation
    mass = 1000 * Math.pow @gravityUI.draw.camera.current.scale, 3

    @newPB = sim.createPseudoBody mass, Vector.zero, Vector.zero

    @pseudoBodies = []
    @pseudoBodies.push  @newPB

    for body in sim.bodies when not body.destroyed and not body.suspended
      is_center = body is @gravityUI.draw.camera.center
      
      continue if not is_center and not body.visible

      pb = sim.createPseudoBody body.mass, body.pos.copy(), body.vel.copy()
      @centerPB = pb if is_center
      @pseudoBodies.push pb

  updateCoords: (input)->
  
    origin = @gravityUI.draw.camera.canvasToWorld input.mouseOrigin
    end = @gravityUI.draw.camera.canvasToWorld input.mouseEnd
    speed = @gravityUI.draw.camera.speed

    @newPB.original.pos = origin
    @newPB.original.vel = end.sub(origin).add(speed)

  createNewBody: ->
    @gravityUI.simulation.createBody @newPB.original.mass, @newPB.original.pos, @newPB.original.vel

  pseudoReset: ->
    pBody.reset() for pBody in @pseudoBodies

  get_pos = -> #private dangler

    newPB_canvas_pos = @gravityUI.draw.camera.worldToCanvas @newPB.pos
    return newPB_canvas_pos if not @centerPB?

    centerPB_canvas_pos = @gravityUI.draw.camera.worldToCanvas @centerPB.pos
    centerPB_canvas_original_pos =  @gravityUI.draw.camera.worldToCanvas @centerPB.original.pos

    newPB_canvas_pos.sub(centerPB_canvas_pos).add centerPB_canvas_original_pos 

  drawTrajectory: ->
    @pseudoReset()

    simulation = @gravityUI.simulation
    draw = @gravityUI.draw

    draw.context = draw.canvas.getContext '2d' 
    draw.context.lineWidth = 1

    view_scale = @gravityUI.draw.camera.current.scale
    speed_scale = @newPB.vel.magnitude * 0.025

    scales = view_scale * speed_scale
    scales = 1 if scales < 1

    step = simulation.UPDATE_DELTA * scales
    start_time = performance.now()
    prediction_time = 0
    integrate = simulation.constructor.integrate

    color_alt = Math.round((Math.min(scales, 2) / 255) * 255)
    offset = Vector.zero

    while performance.now() - start_time < simulation.UPDATE_DELTA

      #works, base on center      
      canvasStart = get_pos.call @
      integrate @pseudoBodies, step
      canvasEnd = get_pos.call @

      draw.context.beginPath()
      draw.context.moveTo canvasStart.x, canvasStart.y
      draw.context.lineTo canvasEnd.x, canvasEnd.y
      
      alpha = geometry.lerp 1,0, prediction_time * 0.001
      alpha = 0.1 if alpha < 0.1

      draw.context.strokeStyle = "rgba(#{color_alt},255,0,#{alpha})"
      draw.context.stroke()
      draw.context.closePath()

      if @newPB.suspended
        draw.context.fillStyle = "green"
        draw.context.beginPath()
        draw.context.arc canvasEnd.x, canvasEnd.y, 2, 0, 2 * Math.PI
        draw.context.closePath()
        draw.context.fill()

        break

      prediction_time += step

module.exports = { SelectBody, CreateBody }

