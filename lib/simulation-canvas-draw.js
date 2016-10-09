'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _vector = require('./vector');

var _vector2 = _interopRequireDefault(_vector);

var _lerp = require('./lerp');

var _lerp2 = _interopRequireDefault(_lerp);

var _clamp = require('./clamp');

var _clamp2 = _interopRequireDefault(_clamp);

var _isExplicit = require('is-explicit');

var _isExplicit2 = _interopRequireDefault(_isExplicit);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _focusBody = Symbol('focus-body'),
    _current = Symbol('current'),
    _velocity = Symbol('velocity'),
    _canvasCenter = Symbol('canvas-center');

var CameraDefaults = {
  Speed: 5,
  MinScale: 0.1,
  MaxScale: 1000,
  blurFactor: 5
};

var SPEED = 5,
    MIN_SCALE = 0.1,
    MAX_SCALE = 1000,
    BLUR_FACTOR = 5;

var CameraCoords = function CameraCoords() {
  _classCallCheck(this, CameraCoords);

  this.pos = _vector2.default.zero;
  this.scale = 1;
};

var Camera = function () {
  function Camera(canvas) {
    _classCallCheck(this, Camera);

    this.canvas = canvas;
    this.target = new CameraCoords();

    this[_current] = new CameraCoords();
    this[_velocity] = _vector2.default.zero;
    this[_focusBody] = null;
  }

  _createClass(Camera, [{
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
      this[_velocity] = oldPos.isub(this[_current].pos);

      if (hasFocusBody) this[_velocity].iadd(this.focusBody.vel);

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
    key: 'canvasMid',
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

var SimulationCanvasDraw = function SimulationCanvasDraw(simulation, canvas) {
  _classCallCheck(this, SimulationCanvasDraw);
};

exports.default = SimulationCanvasDraw;
//# sourceMappingURL=/Users/bengaumond/Programming/gravity-toy/lib-maps/simulation-canvas-draw.js.map