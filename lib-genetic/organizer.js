'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParamRanges = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _runner = require('./runner');

var _runner2 = _interopRequireDefault(_runner);

var _promiseQueue = require('promise-queue');

var _promiseQueue2 = _interopRequireDefault(_promiseQueue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ParamRanges = exports.ParamRanges = {
  radius: [100, 2000],
  mass: [100, 20000],
  vel: [-20, 20],
  bodies: [100, 3000],
  centerDensity: [0, 1],
  massFuzzy: [0, 2],
  velFuzzy: [-2, 2]
};

function generateParams() {

  var params = {};

  for (var i in ParamRanges) {
    params[i] = randomRange.apply(undefined, (0, _toConsumableArray3.default)(ParamRanges[i]));
  }var massRangeLo = ParamRanges.mass[0];
  var massLo = Math.max(randomRange(massRangeLo, params.mass) * 0.1, massRangeLo);
  params.mass = [massLo, params.mass];
  params.generation = 1;
  params.iteration = iteration++;

  return params;
}

function randomRange(lo, hi) {
  return (hi - lo) * Math.random() + lo;
}

var queue = new _promiseQueue2.default(1, Infinity);

var generation = 1;
var iteration = 0;
var initial_sims = 1000;

while (initial_sims) {
  queue.add(function () {
    return (0, _runner2.default)(generateParams()).then(function (res) {
      return console.log(res.score);
    }).catch(function (err) {
      return console.error(err);
    });
  });
  initial_sims--;
}
//# sourceMappingURL=/Users/bengaumond/Programming/gravity-toy/lib-maps/organizer.js.map