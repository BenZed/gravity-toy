'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _vector = require('./vector');

var _vector2 = _interopRequireDefault(_vector);

var _isExplicit = require('is-explicit');

var _isExplicit2 = _interopRequireDefault(_isExplicit);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CameraDefaults = {
  speed: 5,
  minScale: 0.1,
  maxScale: 1000,
  blurFactor: 5
};

var CameraCoords = function CameraCoords() {
  _classCallCheck(this, CameraCoords);

  this.pos = _vector2.default.zero;
  this.scale = 1;
};

var Camera = function () {
  function Camera(canvas) {
    _classCallCheck(this, Camera);

    this.canvas = canvas;
    this.current = new CameraCoords();
    this.target = new CameraCoords();
    this.speed = _vector2.default.zero();

    this.center = null;
  }

  _createClass(Camera, [{
    key: 'setCenter',
    value: function setCenter() {}
  }, {
    key: 'worldToCanvas',
    value: function worldToCanvas(point) {}
  }, {
    key: 'canvasToWorld',
    value: function canvasToWorld(point) {}
  }, {
    key: 'update',
    value: function update() {}
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
//# sourceMappingURL=/Volumes/GM Production 02 External/Projects/Git/gravity-toy/lib-maps/simulation-canvas-draw.js.map