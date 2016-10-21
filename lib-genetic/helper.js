'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.randomVec = randomVec;
exports.randomRange = randomRange;

var _lib = require('../lib');

var _helper = require('../lib/helper');

function randomVec() {
  var maxR = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
  var minR = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  var angle = (0, _helper.pseudoRandom)() * 2 * Math.PI;
  var radius = void 0;
  do {
    radius = minR + (0, _helper.pseudoRandom)() * maxR;
  } while (radius > maxR);

  var x = radius * Math.cos(angle);
  var y = radius * Math.sin(angle);

  return new _lib.Vector(x, y);
}

function randomRange(lo, hi) {
  return (hi - lo) * (0, _helper.pseudoRandom)() + lo;
}
//# sourceMappingURL=/Users/bengaumond/Programming/gravity-toy/lib-maps/helper.js.map