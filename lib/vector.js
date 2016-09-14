'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lerp2 = require('./lerp');

var _lerp3 = _interopRequireDefault(_lerp2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Vector = function () {
  _createClass(Vector, null, [{
    key: 'lerp',
    value: function lerp(from, to) {
      var delta = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

      var x = (0, _lerp3.default)(from.x, to.x, delta);
      var y = (0, _lerp3.default)(from.y, to.y, delta);

      return new Vector(x, y);
    }
  }, {
    key: 'distance',
    value: function distance(from, to) {
      return Math.sqrt(this.sqrDistance(from, to));
    }
  }, {
    key: 'sqrDistance',
    value: function sqrDistance(from, to) {
      return from.sub(to).sqrMagnitude;
    }
  }, {
    key: 'dot',
    value: function dot(a, b) {
      var an = a.normalized();
      var bn = b.normalized();

      return an.x * bn.x + an.y * bn.y;
    }
  }, {
    key: 'zero',
    get: function get() {
      return new Vector();
    }
  }]);

  function Vector() {
    var x = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
    var y = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

    _classCallCheck(this, Vector);

    this.x = x;
    this.y = y;
  }

  _createClass(Vector, [{
    key: 'iadd',
    value: function iadd() {
      var vec = arguments.length <= 0 || arguments[0] === undefined ? Vector.zero : arguments[0];

      this.x += vec.x;
      this.y += vec.y;
      return this;
    }
  }, {
    key: 'add',
    value: function add() {
      var vec = arguments.length <= 0 || arguments[0] === undefined ? Vector.zero : arguments[0];

      return new Vector(this.x + vec.x, this.y + vec.y);
    }
  }, {
    key: 'isub',
    value: function isub() {
      var vec = arguments.length <= 0 || arguments[0] === undefined ? Vector.zero : arguments[0];

      this.x -= vec.x;
      this.y -= vec.y;
      return this;
    }
  }, {
    key: 'sub',
    value: function sub() {
      var vec = arguments.length <= 0 || arguments[0] === undefined ? Vector.zero : arguments[0];

      return new Vector(this.x - vec.x, this.y - vec.y);
    }
  }, {
    key: 'imult',
    value: function imult() {
      var factor = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

      this.x *= factor;
      this.y *= factor;
      return this;
    }
  }, {
    key: 'mult',
    value: function mult() {
      var factor = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

      return new Vector(this.x * factor, this.y * factor);
    }
  }, {
    key: 'idiv',
    value: function idiv() {
      var factor = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

      this.x /= factor;
      this.y /= factor;
      return this;
    }
  }, {
    key: 'div',
    value: function div() {
      var factor = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

      return new Vector(this.x / factor, this.y / factor);
    }
  }, {
    key: 'ilerp',
    value: function ilerp() {
      var to = arguments.length <= 0 || arguments[0] === undefined ? Vector.zero : arguments[0];
      var delta = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

      this.x = (0, _lerp3.default)(this.x, to.x, delta);
      this.y = (0, _lerp3.default)(this.y, to.y, delta);
      return this;
    }
  }, {
    key: 'lerp',
    value: function lerp() {
      var to = arguments.length <= 0 || arguments[0] === undefined ? Vector.zero : arguments[0];
      var delta = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

      return Vector.lerp(this, to, delta);
    }
  }, {
    key: 'normalized',
    value: function normalized() {
      var mag = this.magnitude;
      return mag === 0 ? Vector.zero : new Vector(this.x / mag, this.y / mag);
    }
  }, {
    key: 'rotate',
    value: function rotate(deg) {
      var rad = deg * Math.PI / 180;
      var cos = Math.cos(rad);
      var sin = Math.sin(rad);

      return new Vector(this.x * cos - this.y * sin, this.y * cos + this.y * sin);
    }
  }, {
    key: 'perpendicular',
    value: function perpendicular() {
      var h = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

      return new Vector(-this.y, this.x).idiv(this.magnitude).imult(h);
    }
  }, {
    key: 'copy',
    value: function copy() {
      return new Vector(this.x, this.y);
    }
  }, {
    key: 'angle',
    get: function get() {
      return Math.atan2(this.y, this.x) * 180 / Math.PI;
    }
  }, {
    key: 'magnitude',
    get: function get() {
      return Math.sqrt(this.sqrMagnitude);
    }
  }, {
    key: 'sqrMagnitude',
    get: function get() {
      return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    }
  }]);

  return Vector;
}();

exports.default = Vector;
//# sourceMappingURL=/Volumes/GM Production 02 External/Projects/Git/gravity-toy/lib-maps/vector.js.map