#Dependencies
geometry = require "./geometry2D"
is_type = require "is-explicit"
events = require "events"
now = if window and window.performance then -> window.performance.now() else require "performance-now"

Vector = geometry.Vector

#Constants
UPDATE_DELTA = 20 # ms
GRAVITATIONAL_CONSTANT = 0.225

running_simulations = []

set_body_mass_radius = (mass)-> #dangler for Body and Psuedo Body
  @mass = mass
  @radius = 0.25 + Math.cbrt(@mass) * 0.1;
  @collisionRadius = if @radius < 2 then @radius else (@radius - 2) * 0.75 + 2

class Time
  constructor: (@simulation)->
    @delta = 0 #ms
    @start = 0 #ms
    @exceeded = false
    @paused = false
    @simulationSpeedLog = []

    @_bi = 0 #body iterator
    @_bsi = 0 #body sub iterator
    @_step = UPDATE_DELTA * 0.001

  start_interval: ->
    @delta = 0
    @start = now()
    @exceeded = false
    @simulation.emitter.emit 'interval-start'

  check_if_exceeded: ->
    @delta = now() - @start
    @exceeded = @delta > UPDATE_DELTA
    return @exceeded

  complete_interval : ->
    timeDeltaMs = if @delta > UPDATE_DELTA then @delta else UPDATE_DELTA
    timeDeltaSeconds = timeDeltaMs * 0.001

    @simulationSpeedLog.push if @exceeded then 0 else timeDeltaMs
    @simulationSpeedLog.shift() if @simulationSpeedLog.length > 360

    speed = 0
    speed += dt for dt in @simulationSpeedLog
    speed /= @simulationSpeedLog.length * UPDATE_DELTA

    @simulation.emitter.emit 'interval-complete', timeDeltaSeconds, speed

    @_bi = 0 if not @exceeded

class PsuedoBody

  @collide = (b1, b2)->
    [big, small] = if b1.mass >= b2.mass then [b1, b2] else [b2, b1]

    small.suspended = true

    totalMass = big.mass + small.mass
    big.pos.x = (big.pos.x * big.mass + small.pos.x * small.mass) / totalMass
    big.pos.y = (big.pos.y * big.mass + small.pos.y * small.mass) / totalMass
    big.vel.x = (big.vel.x * big.mass + small.vel.x * small.mass) / totalMass
    big.vel.y = (big.vel.y * big.mass + small.vel.y * small.mass) / totalMass

    set_body_mass_radius.call big, totalMass

  constructor: (mass, @pos, @vel)->
    @force = Vector.zero
    @suspended = false
    set_body_mass_radius.call this, mass
    @original = 
      mass: mass
      pos: @pos.copy()
      vel: @vel.copy()

  reset: ->
    @pos = @original.pos.copy()
    @vel = @original.vel.copy()
    set_body_mass_radius.call this, @original.mass
    @suspended = false


class Body extends events.EventEmitter

  @collide = (b1, b2, main_emitter)->
    [big, small] = if b1.mass >= b2.mass then [b1, b2] else [b2, b1]
   
    small.destroyed = true

    small.emit 'body-collision', big
    big.emit 'body-collision', small

    small.emit 'body-collision-perished', big
    big.emit 'body-collision-survived', small

    if main_emitter
      main_emitter.emit 'body-collision', small, big
      main_emitter.emit 'body-collision', big, small
      main_emitter.emit 'body-collision-perished', small, big
      main_emitter.emit 'body-collision-survived', big, small

    totalMass = big.mass + small.mass
    big.pos.x = (big.pos.x * big.mass + small.pos.x * small.mass) / totalMass
    big.pos.y = (big.pos.y * big.mass + small.pos.y * small.mass) / totalMass
    big.vel.x = (big.vel.x * big.mass + small.vel.x * small.mass) / totalMass
    big.vel.y = (big.vel.y * big.mass + small.vel.y * small.mass) / totalMass

    set_body_mass_radius.call big, totalMass

  constructor: (mass, @pos, @vel)->
    @force = Vector.zero
    @destroyed = false
    set_body_mass_radius.call this, mass

#SIMULATION

class Simulation

  @integrate = (bodies, time) ->
    #Create a psuedo time object if a proper Time object isn't passed in,
    #like if the integrate function was being used outside of this module
    #for prediction
    custom_step = if is_type time, Number then time * 0.001 else UPDATE_DELTA * 0.001
    if !is_type time, Time
      time = 
        _bi: 0
        _bsi: 0
        _step: custom_step
        simulation: false
        paused: false
        exceeded: false
        check_if_exceeded: -> false

    main_emitter = if is_type time.simulation, Simulation then time.simulation.emitter else null

    #Calculate
    if not time.paused
      while time._bi < bodies.length
        body = bodies[time._bi]

        calculate.call body, bodies, time, main_emitter
        break if time.exceeded

        time._bsi = 0
        time._bi += 1

    #Integrate
    i = 0
    while i < bodies.length

      body = bodies[i]
      if not body.destroyed

        if not time.exceeded and not time.paused and not body.suspended
          #plain old boring inaccurate Euler
          # body.vel.iadd body.force.mult(time._step)
          # body.pos.iadd body.vel.mult(time._step)

          #velocity verlet
          old_vel = body.vel.copy()
          new_vel = old_vel.add body.force.mult(time._step)
          body.vel = old_vel.add(new_vel).mult(0.5)
          body.pos.iadd body.vel.mult(time._step)

        if not body.suspended
          body.emit 'body-update' if is_type body, events.EventEmitter
          main_emitter.emit 'body-update', body if main_emitter

        i += 1

      bodies.splice i, 1 if body.destroyed

  constructor: ->
    @bodies = []
    @time = new Time this
    @emitter = new events.EventEmitter

  start: ->
    @time.paused = false

    for sim in running_simulations
      return if this is sim

    run_index = setInterval ()=> 
      @time.start_interval()
      Simulation.integrate @bodies, @time
      @time.complete_interval()
    , UPDATE_DELTA

    running_simulations[run_index] = this

  pause: ->
    @time.paused = true

  terminate: ->
    for sim, i in running_simulations
      if this is sim
        clearInterval i
        running_simulations.splice i, 1
        return

  on: (name, func) ->
    @emitter.on name, func

  createBody: (mass, pos, vel) ->

    throw 'pos must be Vector' if not is_type pos, Vector
    throw 'vel must be Vector' if not is_type vel, Vector
    throw 'mass must be Number above zero' if not is_type(mass, Number) or mass <= 0

    body = new Body mass, pos, vel, @emitter
    @bodies.push body
    @emitter.emit 'body-create', body

  createPseudoBody: (mass, pos, vel) ->
    throw 'pos must be Vector' if not is_type pos, Vector
    throw 'vel must be Vector' if not is_type vel, Vector
    throw 'mass must be Number above zero' if not is_type(mass, Number) or mass <= 0

    return new PsuedoBody mass, pos, vel

  #private danglers
  calculate = (bodies, time, main_emitter)->
    @force = Vector.zero if time._bsi is 0

    return if @destroyed or @suspended

    while time._bsi < bodies.length
      body = bodies[time._bsi]
      
      if this isnt body and not body.destroyed and not body.suspended

        relative = body.pos.sub @pos
        distSqr = relative.sqrMagnitude
        dist = Math.sqrt distSqr

        if dist < body.collisionRadius + @collisionRadius and is_type body.constructor.collide, Function
          body.constructor.collide this, body, main_emitter

        forceOfGravity = GRAVITATIONAL_CONSTANT * body.mass / distSqr
        force = new Vector forceOfGravity * relative.x / dist, forceOfGravity * relative.y / dist
        @force.iadd force

      time._bsi += 1

      return if time.check_if_exceeded() 

Object.defineProperty Simulation.prototype, "UPDATE_DELTA", get: (-> UPDATE_DELTA), configurable: no
#Export
module.exports = Simulation
#module.exports = Object.freeze {start, pause, terminate, bodies: get_bodies, on: on_event, UPDATE_DELTA, GRAVITATIONAL_CONSTANT}