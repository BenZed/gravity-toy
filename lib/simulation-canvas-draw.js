'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawTypes = undefined;

var _sign = require('babel-runtime/core-js/math/sign');

var _sign2 = _interopRequireDefault(_sign);

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

var _helper = require('./helper');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var max = Math.max;
var min = Math.min;
var floor = Math.floor;
var round = Math.round;
var pow = Math.pow;
var abs = Math.abs;
var sign = _sign2.default;
var sqrt = Math.sqrt;
var PI = Math.PI;
var DrawTypes = exports.DrawTypes = {
  SELECTED: 'SELECTED',
  ON: 'ON',
  OFF: 'OFF'
};

var OptionDefaults = {

  grid: true,
  trails: DrawTypes.ON,
  predictions: DrawTypes.OFF,
  parents: DrawTypes.SELECTED,

  names: DrawTypes.ON,
  nameFont: '12px Helvetica',
  nameColor: 'white',
  nameRadiusThreshold: 10,

  gridColor: 'rgba(255,255,255,0.25)',
  gridWidth: 1,

  selectionColor: 'rgba(255,255,85,0.5)',
  trailColor: [0, 0, 255],
  predictionColor: [0, 255, 0],
  trailLength: 30,
  predictionLength: 30,

  trailStep: 1,
  trailWidth: 0.5,

  minZoom: 0.1,
  maxZoom: 250
};

var BodyOptionDefaults = {
  trails: false,
  predictions: false,
  selected: false,
  name: null
};

var CAMERA_LERP_FACTOR = 5,
    MIN_DRAW_RADIUS = 0.5,
    MAX_TIME_DIALATION = 48,
    BLUR_FACTOR = 0.4,
    TRAIL_FADE_START = 30;

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
    value: function update(deltaTime, draw) {

      var focusBodyStats = this.focusBody ? this.focusBody.statsAtTick(draw.tick) : null;
      var oldPos = this[_current].pos.copy();
      var targetPos = focusBodyStats ? this.target.pos.add(focusBodyStats.pos) : this.target.pos;

      //new position
      this[_current].pos.ilerp(targetPos, deltaTime * CAMERA_LERP_FACTOR);

      //speed is new position minus old
      this.vel = oldPos.isub(this[_current].pos).idiv(min(draw.tickDelta, MAX_TIME_DIALATION));

      if (focusBodyStats) this.vel.iadd(focusBodyStats.vel);

      //apply scale
      this.target.scale = (0, _helper.clamp)(this.target.scale, draw.options.minZoom, draw.options.maxZoom);
      this[_current].scale = (0, _helper.lerp)(this[_current].scale, this.target.scale, deltaTime * CAMERA_LERP_FACTOR);
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

//symbols for 'private' members


var _drawStart = (0, _symbol2.default)('draw-start'),
    _drawBody = (0, _symbol2.default)('draw-body'),
    _drawComplete = (0, _symbol2.default)('draw-complete'),
    _drawGrid = (0, _symbol2.default)('draw-grid'),
    _drawTrails = (0, _symbol2.default)('draw-trails'),
    _setBodyDrawOptions = (0, _symbol2.default)('set-body-draw-options');

var SimulationCanvasDraw = function () {
  function SimulationCanvasDraw(simulation, canvas) {
    var _this = this;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    (0, _classCallCheck3.default)(this, SimulationCanvasDraw);

    this[_drawStart] = function () {
      //clear the canvas
      _this.context.clearRect(0, 0, _this.canvas.width, _this.canvas.height);

      if (_this.options.grid) _this[_drawGrid]();
    };

    this[_drawBody] = function (body) {
      var stats = body.statsAtTick(_this.tick);

      //body doesn't exist at this.ticks
      if (!stats) return;

      var camera = _this.camera,
          current = camera[_current];

      //position and size of body in relation to camera
      var radius = stats.radius / current.scale;
      var pos = _this.camera.worldToCanvas(stats.pos);

      //time dialation will warp the body more if the simulation is being viewed
      //at faster than 1x
      var timeDialation = min(abs(_this.tickDelta), MAX_TIME_DIALATION);

      //velocity in relation to camera
      var vel = stats.vel.mult(timeDialation).isub(camera.vel).idiv(current.scale);

      //blurRadius will warp the body from a circle to an ellipse if it is moving fasting enough
      var blurRadius = vel.magnitude * BLUR_FACTOR;

      //circularize if speed is too slow or simulation is paused
      blurRadius = blurRadius < radius || _this.simulation.paused ? radius : blurRadius;

      //in addition to warping, the body will be faded if moving sufficiently fast
      var opacity = (0, _helper.lerp)(0.5, 1, radius / blurRadius);

      //angle of the ellipse
      var angle = (vel.angle - 90) * PI / 180;

      var mass = stats.mass;

      _this.context.fillStyle = 'rgba(255,\n      ' + round(256 / (1 + pow(mass / 100000, 1))) + ',\n      ' + round(256 / (1 + pow(mass / 10000, 1))) + ',\n      ' + opacity + ')';

      _this.context.beginPath();

      //ellipse is draw with minum radii so we can still see bodies if they're too
      //small or if we're zoomed too far out
      _this.context.ellipse(pos.x, pos.y, max(radius, MIN_DRAW_RADIUS), max(blurRadius, MIN_DRAW_RADIUS), angle, 0, 2 * PI);

      _this.context.closePath();
      _this.context.fill();
    };

    this[_drawTrails] = function (body, back) {
      var focusBody = _this.camera.focusBody;

      if (focusBody === body) return;

      var drawTick = _this.tick;
      var pos = void 0;

      var fOrg = focusBody ? focusBody.posAtTick(drawTick) : null;
      var scale = max(_this.camera[_current].scale, 1);

      var step = floor(_this.options.trailStep * scale);
      drawTick -= drawTick % step;

      var length = back ? body.startTick : body.endTick || _this.simulation.cachedTicks;
      length = min(abs(drawTick - length), (back ? _this.options.trailLength : _this.options.predictionLength) * scale);
      length = floor(length / step);

      var style = back ? _this.options.trailColor : _this.options.predictionColor;
      _this.context.beginPath();
      _this.context.strokeStyle = 'rgba(' + style + ',1)';
      _this.context.lineWidth = _this.options.trailWidth;

      var fadeStart = floor(TRAIL_FADE_START / sqrt(scale));

      while (length > 0) {

        pos = body.posAtTick(drawTick);
        drawTick += back ? -step : step;
        length -= 1;

        if (!pos) continue;

        if (focusBody) {
          var fPos = focusBody.posAtTick(drawTick);

          if (fPos) pos.isub(fPos).iadd(fOrg);
        }

        pos = _this.camera.worldToCanvas(pos);
        _this.context.lineTo(pos.x, pos.y);

        if (length >= fadeStart) continue;

        _this.context.strokeStyle = 'rgba(' + style + ',' + length / fadeStart + ')';
        _this.context.stroke();
        _this.context.beginPath();
        _this.context.moveTo(pos.x, pos.y);
      }

      _this.context.stroke();
    };

    this[_drawComplete] = function (deltaTime) {

      //draw all the bodies
      _this.simulation.forEachBody(function (body) {
        if (_this.options.trails === DrawTypes.ON) _this[_drawTrails](body, true);

        if (_this.options.predictions === DrawTypes.ON) _this[_drawTrails](body, false);
      });
      _this.simulation.forEachBody(_this[_drawBody]);

      _this.camera.update(deltaTime, _this);

      //this prevents us from trying to draw a tick that hasn't finished calculating
      //yet, in the event the simulation is large and moving very slowly
      var nextTick = (0, _helper.clamp)(_this.tick + _this.tickDelta, 0, _this.simulation.cachedTicks - 1);

      //if the next tick isn't what we're expecting it to be, we reduce the playback
      //speed to 1 or -1 in case we're playing back faster
      if (nextTick !== _this.tick + _this.tickDelta) _this.tickDelta = sign(_this.tickDelta);

      _this.tick = nextTick;
    };

    this[_setBodyDrawOptions] = function (body) {
      for (var i in BodyOptionDefaults) {
        body[i] = i in body ? body[i] : BodyOptionDefaults[i];
      }
    };

    Object.defineProperty(this, 'canvas', { value: canvas });
    Object.defineProperty(this, 'context', { value: canvas.getContext('2d') });
    Object.defineProperty(this, 'camera', { value: new Camera(canvas) });
    Object.defineProperty(this, 'simulation', { value: simulation });
    Object.defineProperty(this, 'tick', { value: 0, writable: true });
    Object.defineProperty(this, 'tickDelta', { value: 1, writable: true });

    this.options = (0, _assign2.default)({}, options, OptionDefaults);

    this.simulation.on('interval-start', this[_drawStart]);
    this.simulation.on('interval-complete', this[_drawComplete]);
    this.simulation.on('body-create', this[_setBodyDrawOptions]);
  }

  (0, _createClass3.default)(SimulationCanvasDraw, [{
    key: _drawGrid,
    value: function value() {

      if (!this.options.grid) return;

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
  }]);
  return SimulationCanvasDraw;
}();

exports.default = SimulationCanvasDraw;
//# sourceMappingURL=/Volumes/GM Production 02 External/Projects/Git/gravity-toy/lib-maps/simulation-canvas-draw.js.map