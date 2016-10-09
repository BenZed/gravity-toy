"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = lerp;
function lerp(from, to, delta) {
  var clamped = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;


  delta = clamped ? Math.clamp01(delta) : delta;

  return from + delta * (to - from);
}
//# sourceMappingURL=/Users/bengaumond/Programming/gravity-toy/lib-maps/lerp.js.map