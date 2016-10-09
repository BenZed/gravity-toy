'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = lerp;

var _clamp = require('./clamp');

var _clamp2 = _interopRequireDefault(_clamp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function lerp(from, to, delta) {
  var clamped = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;


  delta = clamped ? (0, _clamp2.default)(delta, 0, 1) : delta;

  return from + delta * (to - from);
}
//# sourceMappingURL=/Users/bengaumond/Programming/gravity-toy/lib-maps/lerp.js.map