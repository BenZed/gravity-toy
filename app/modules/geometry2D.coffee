getter = (obj, prop, get) ->
  Object.defineProperty obj, prop, {get, configurable: yes}

setter = (obj, prop, set) ->
  Object.defineProperty obj, prop, {set, configurable: yes}

class Vector
  getter @, 'zero', -> new Vector 0,0



  @lerp = (from, to, delta)->
    newX = lerp from.x, to.x, delta
    newY = lerp from.y, to.y, delta

    new Vector newX, newY

  @distance = (a,b)->
    Math.sqrt @sqrDistance(a,b)

  @dot = (a,b)->
    a = a.normalized()
    b = b.normalized()
    return a.x * b.x + a.y * b.y

  @sqrDistance = (a,b)->
    (a.x - b.x) ** 2 + (a.y - b.y) ** 2

  @randomInCircle = (radius)->
    angle = 2 * Math.PI * Math.random();
    u = Math.random() + Math.random();
    r = if u > 1 then 2 - u else u;
    fr = r * radius
    new Vector fr * Math.cos(angle), fr * Math.sin(angle)

  constructor: (@x=0, @y=0)->

  iadd: (v2)->
    @x += v2.x
    @y += v2.y
    this
     
  add: (v2)->
    new Vector @x + v2.x, @y + v2.y

  isub: (v2)->
    @x -= v2.x
    @y -= v2.y
    this

  sub: (v2)->
    new Vector @x - v2.x, @y - v2.y

  imult: (factor)->
    @x *= factor
    @y *= factor
    this

  mult: (factor)->
    new Vector @x * factor, @y * factor

  idiv: (factor)->
    @x /= factor
    @y /= factor
    this

  div: (factor)->
    new Vector @x / factor, @y / factor

  ilerp: (to, delta)->
    @x = lerp @x, to.x, delta
    @y = lerp @y, to.y, delta
    this

  lerp: (to, delta)->
    x = lerp @x, to.x, delta
    y = lerp @y, to.y, delta
    new Vector x,y

  normalized: ->
    mag = @magnitude
    if mag is 0 
    then Vector.zero 
    else new Vector @x / mag, @y / mag

  rotate: (deg)->
    rad = deg * Math.PI / 180
    cos = Math.cos rad
    sin = Math.sin rad

    new Vector @x * cos - @y * sin, @y * cos + @x * sin

  perpendicular: (h)->
    h = 1 if !h?
    (new Vector(-@y, @x)).div(@magnitude).mult h

  copy: ->
    new Vector(@x, @y);

  getter @prototype, 'angle', -> Math.atan2(@y,@x) * 180 / Math.PI
  getter @prototype, 'magnitude', -> Math.sqrt @sqrMagnitude   
  getter @prototype, 'sqrMagnitude', -> @x ** 2 + @y ** 2

lerp = (from, to, delta)->
  from + delta * (to - from)


module.exports = { Vector, lerp }