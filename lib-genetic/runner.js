'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DefaultResultSettings = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.default = function (params) {
  var settings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DefaultResultSettings;

  var simulation = new _lib.Simulation();

  return new _promise2.default(function (res) {
    console.log('iteration: ' + params.iteration);

    createBodies(simulation, params);
    createEventHandlers(simulation, params, settings, res);

    simulation.start();
  });
};

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lib = require('../lib');

var _helper = require('../lib/helper');

var _helper2 = require('./helper');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DefaultResultSettings = exports.DefaultResultSettings = {
  ticksSinceLastDestroyedBody: 20000,
  nearbyBodyDistance: 6000,
  leastBodies: 3
};

function createBodies(simulation, params) {
  var bodies = params.bodies;
  var radius = params.radius;
  var mass = params.mass;
  var vel = params.vel;
  var centerDensity = params.centerDensity;
  var massFuzzy = params.massFuzzy;
  var velFuzzy = params.velFuzzy;


  var massHi = _helper2.randomRange.apply(undefined, (0, _toConsumableArray3.default)(mass));
  var massLo = (0, _helper2.randomRange)(mass[0], massHi);

  for (var j = 0; j < bodies; j++) {

    var pos = (0, _helper2.randomVec)(radius, radius * (0, _helper.pseudoRandom)() * centerDensity);

    var edgeFactor = pos.magnitude / radius;

    var massEdgeHi = massHi * (1 - edgeFactor);
    var m = Math.min(Math.max(massEdgeHi - massEdgeHi * (0, _helper.pseudoRandom)() * massFuzzy, massLo), massHi);

    var speed = vel * edgeFactor;
    var spin = pos.normalized().perpendicular(speed);

    var v = spin.add((0, _helper2.randomVec)(spin.magnitude).mult(velFuzzy));

    simulation.createBodyAtTick(0, m, pos, v);
  }
}

function createEventHandlers(simulation, params, settings, res) {

  var lastBodyDestroyed = 0;
  var interval = 0;

  simulation.on('body-collision', function () {
    return lastBodyDestroyed = simulation.cachedTicks;
  });

  simulation.on('interval-complete', function () {
    interval++;

    if (interval % 100 === 0) {
      process.stdout.write('.');
      interval = 0;
    }
  });

  simulation.on('tick-complete', function (tick) {

    var complete = false;

    if (tick % 1000 === 0) {
      var largest = getLargestBody(simulation);
      var nearby = getBodiesInRange(simulation, largest, settings.nearbyBodyDistance);

      console.log('tick:', tick, 'bodies in system:', nearby.length);

      if (nearby.length <= settings.leastBodies) complete = true;
    }

    if (tick - lastBodyDestroyed > settings.ticksSinceLastDestroyedBody || tick >= simulation.maxCacheTicks) complete = true;

    if (complete) createScoredResult(simulation, params, res);
  });
}

function createScoredResult(simulation, params, res) {
  simulation.stop();

  var json = void 0;

  try {
    json = simulation.toJSON(false);
  } catch (err) {
    json = simulation.toJSON(false, true);
  } finally {
    json = { error: 'simulation could not be converted to JSON' };
  }

  json.params = params;
  json.score = 0;

  var largest = getLargestBody(simulation);
  var nearby = getBodiesInRange(simulation, largest, 6000);

  nearby.forEach(function (body) {
    json.score += 5;
    json.score += body.mass / largest.mass * 10;
  });

  var url = _path2.default.resolve(__dirname, 'results', 'sim-' + params.generation + '-' + params.iteration + '.json');

  _fs2.default.writeFileSync(url, (0, _stringify2.default)(json, null, 4), 'utf-8');

  res(json);
}

/******************************************************************************/
// Helper
/******************************************************************************/

function getLargestBody(simulation) {
  var largest = null;

  simulation.forEachBody(function (body) {
    if (!body.exists) return;

    if (largest === null || body.mass > largest.mass) largest = body;
  });

  return largest;
}

function getBodiesInRange(simulation, otherBody) {
  var range = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 5000;

  var bodies = [];
  simulation.forEachBody(function (body) {
    if (!body.exists) return;

    var dist = body.pos.sub(otherBody.pos).magnitude;
    if (dist >= range) return;

    bodies.push(body);
  });
  return bodies;
}
//# sourceMappingURL=/Users/bengaumond/Programming/gravity-toy/lib-maps/runner.js.map