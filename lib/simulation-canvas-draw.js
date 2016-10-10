'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _symbol = require('babel-runtime/core-js/symbol');

var _symbol2 = _interopRequireDefault(_symbol);

var _vector = require('./vector');

var _vector2 = _interopRequireDefault(_vector);

var _lerp = require('./lerp');

var _lerp2 = _interopRequireDefault(_lerp);

var _clamp = require('./clamp');

var _clamp2 = _interopRequireDefault(_clamp);

var _isExplicit = require('is-explicit');

var _isExplicit2 = _interopRequireDefault(_isExplicit);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var OptionDefaults = {

  grid: true,
  parents: true,
  trails: true,
  trailLength: 120, //seconds

  names: true,
  nameRadiusThreshold: 10,

  gridColor: 'rgba(255,255,255,0.75)',
  gridWidth: 0.1,

  nameFont: '12px Helvetica',
  nameColor: 'white',

  selectionColor: 'rgba(255,255,85,0.5)',
  trailColor: 'rgba(85,85,225,0.25)'

};

var SPEED = 5,
    MIN_SCALE = 0.1,
    MAX_SCALE = 1000,
    MIN_DRAW_RADIUS = 0.5,
    BLUR_FACTOR = 0.4;

/******************************************************************************/
// Camera Classes
/******************************************************************************/

var _focusBody = (0, _symbol2.default)('focus-body'),
    _current = (0, _symbol2.default)('current'),
    _canvasCenter = (0, _symbol2.default)('canvas-center');

var CameraCoords = function CameraCoords() {
  (0, _classCallCheck3.default)(this, CameraCoords);

  this.pos = _vector2.default.zero;
  this.scale = 1;
};

var Camera = function () {
  function Camera(canvas) {
    (0, _classCallCheck3.default)(this, Camera);


    this.canvas = canvas;
    this.target = new CameraCoords();

    this.target.scale = 1;
    this.target.pos.x = canvas.width * 0.5;
    this.target.pos.y = canvas.height * 0.5;

    this[_current] = new CameraCoords();
    this[_focusBody] = null;
    this.vel = _vector2.default.zero;

    this.update = this.update.bind(this);
  }

  (0, _createClass3.default)(Camera, [{
    key: 'worldToCanvas',
    value: function worldToCanvas(point) {
      return point.sub(this[_current].pos).idiv(this[_current].scale).iadd(this[_canvasCenter]);
    }
  }, {
    key: 'canvasToWorld',
    value: function canvasToWorld(point) {
      return point.sub(this[_canvasCenter]).imult(this[_current].scale).iadd(this[_current].pos);
    }
  }, {
    key: 'update',
    value: function update(deltaTime) {

      var hasFocusBody = this.focusBody && !this.focusBody.destroyed;
      var oldPos = this[_current].pos.copy();
      var targetPos = hasFocusBody ? this.target.pos.add(this.focusBody.pos) : this.target.pos;

      //new position
      this[_current].pos.ilerp(targetPos, deltaTime * SPEED);

      //speed is new position minus old
      this.vel = oldPos.isub(this[_current].pos);

      if (hasFocusBody) this.vel.iadd(this.focusBody.vel);

      //apply scale
      this.target.scale = (0, _clamp2.default)(this.target.scale, MIN_SCALE, MAX_SCALE);
      this[_current].scale = (0, _lerp2.default)(this[_current].scale, this.target.scale, deltaTime * SPEED);
    }
  }, {
    key: 'focusBody',
    get: function get() {
      return this[_focusBody];
    },
    set: function set(body) {
      if (this[_focusBody]) this.target.pos.iadd(this[_focusBody].pos);

      if (body) this.target.pos.isub(body.pos);

      this[_focusBody] = body;
    }
  }, {
    key: _canvasCenter,
    get: function get() {
      var _canvas = this.canvas;
      var width = _canvas.width;
      var height = _canvas.height;

      return new _vector2.default(width * 0.5, height * 0.5);
    }
  }]);
  return Camera;
}();

/******************************************************************************/
// SimulationCanvasDraw Class
/******************************************************************************/

var _drawStart = (0, _symbol2.default)('draw-start'),
    _drawBody = (0, _symbol2.default)('draw-body'),
    _drawComplete = (0, _symbol2.default)('draw-complete'),
    _drawGrid = (0, _symbol2.default)('draw-grid'),
    _drawTrails = (0, _symbol2.default)('draw-trails');

var SimulationCanvasDraw = function () {
  function SimulationCanvasDraw(simulation, canvas) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    (0, _classCallCheck3.default)(this, SimulationCanvasDraw);


    Object.defineProperty(this, 'canvas', { value: canvas });
    Object.defineProperty(this, 'context', { value: canvas.getContext('2d') });
    Object.defineProperty(this, 'camera', { value: new Camera(canvas) });
    Object.defineProperty(this, 'simulation', { value: simulation });
    Object.defineProperty(this, 'tick', { value: 0, writable: true });
    Object.defineProperty(this, 'tickDelta', { value: 1, writable: true });

    this.options = (0, _assign2.default)({}, options, OptionDefaults);

    this[_drawStart] = this[_drawStart].bind(this);
    this[_drawBody] = this[_drawBody].bind(this);
    this[_drawComplete] = this[_drawComplete].bind(this);

    this.simulation.on('interval-start', this[_drawStart]);
    this.simulation.on('interval-body-update', this[_drawBody]);
    this.simulation.on('interval-complete', this[_drawComplete]);
  }

  (0, _createClass3.default)(SimulationCanvasDraw, [{
    key: _drawStart,
    value: function value() {
      //clear the canvas
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      if (this.options.grid) this[_drawGrid]();
    }
  }, {
    key: _drawGrid,
    value: function value() {

      //draw a grid
      this.context.lineWidth = this.options.gridWidth;
      this.context.strokeStyle = this.options.gridColor;

      var current = this.camera[_current];
      var xLineDelta = this.canvas.width / current.scale;
      var yLineDelta = this.canvas.height / current.scale;

      var xOff = (-current.pos.x / current.scale + this.canvas.width * 0.5) % xLineDelta;
      var yOff = (-current.pos.y / current.scale + this.canvas.height * 0.5) % yLineDelta;

      var x = 0,
          y = 0;
      while (x < this.canvas.width) {
        this.context.beginPath();
        this.context.moveTo(x + xOff, 0);
        this.context.lineTo(x + xOff, this.canvas.height);
        this.context.stroke();
        x += xLineDelta;
      }

      while (y < this.canvas.height) {
        this.context.beginPath();
        this.context.moveTo(0, y + yOff);
        this.context.lineTo(this.canvas.width, y + yOff);
        this.context.stroke();
        y += yLineDelta;
      }
    }
  }, {
    key: _drawBody,
    value: function value(body) {
      var stats = body.statsAtTick(this.tick);

      //body doesn't exist at this.ticks
      if (!stats) return;

      var camera = this.camera,
          current = camera[_current];

      //position speed and size of body in relation to camera
      var radius = stats.radius / current.scale;
      var pos = this.camera.worldToCanvas(stats.pos);
      var vel = stats.vel.sub(camera.vel).div(current.scale);

      this[_drawTrails](body, pos);

      //blurRadius will warp the body from a circle to an ellipse if it is moving fasting enough
      var blurRadius = vel.magnitude * BLUR_FACTOR;

      //circularize if speed is too slow or simulation is paused
      blurRadius = blurRadius < radius || this.simulation.paused ? radius : blurRadius;

      //in addition to warping, the body will be faded if moving sufficiently fast
      var opacity = (0, _lerp2.default)(0.5, 1, radius / blurRadius);

      //angle of the ellipse
      var angle = (vel.angle - 90) * Math.PI / 180;

      var mass = stats.mass;

      this.context.fillStyle = 'rgba(255,\n      ' + Math.round(256 / (1 + Math.pow(mass / 100000, 1))) + ',\n      ' + Math.round(256 / (1 + Math.pow(mass / 10000, 1))) + ',\n      ' + opacity + ')';

      this.context.beginPath();

      //ellipse is draw with minum radii so we can still see bodies if they're too
      //small or if we're zoomed too far out
      this.context.ellipse(pos.x, pos.y, Math.max(radius, MIN_DRAW_RADIUS), Math.max(blurRadius, MIN_DRAW_RADIUS), angle, 0, 2 * Math.PI);

      this.context.closePath();
      this.context.fill();
    }
  }, {
    key: _drawTrails,
    value: function value(body, relpos) {}
  }, {
    key: _drawComplete,
    value: function value(deltaTime) {
      this.camera.update(deltaTime);
      //this prevents us from trying to draw a tick that hasn't finished calculating
      //yet, in the event the simulation is large and moving very slowly
      this.tick = (0, _clamp2.default)(this.tick + this.tickDelta, 0, this.simulation.cacheSize - 1);
    }
  }]);
  return SimulationCanvasDraw;
}();

exports.default = SimulationCanvasDraw;
//# sourceMappingURL=/Users/bengaumond/Programming/gravity-toy/lib-maps/simulation-canvas-draw.js.map