'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _symbol = require('babel-runtime/core-js/symbol');

var _symbol2 = _interopRequireDefault(_symbol);

var _cbrt = require('babel-runtime/core-js/math/cbrt');

var _cbrt2 = _interopRequireDefault(_cbrt);

var _events = require('events');

var _vector = require('./vector');

var _vector2 = _interopRequireDefault(_vector);

var _isExplicit = require('is-explicit');

var _isExplicit2 = _interopRequireDefault(_isExplicit);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/******************************************************************************/
// Constants
/******************************************************************************/

var BASE_RADIUS = 0.25;
var RADIUS_MULTIPLIER = 0.1;
var COLLIDE_LOW_THRESHOLD = 2;
var COLLIDE_RADIUS_FACTOR = 0.75;

var NUM_CACHE_PROPERTIES = 5;

/******************************************************************************/
// Helpers
/******************************************************************************/

function radiusFromMass(mass) {
  return BASE_RADIUS + (0, _cbrt2.default)(mass) * RADIUS_MULTIPLIER;
}

function collisionRadiusFromRadius(radius) {
  return radius < COLLIDE_LOW_THRESHOLD ? radius : (radius - COLLIDE_LOW_THRESHOLD) * COLLIDE_RADIUS_FACTOR + COLLIDE_LOW_THRESHOLD;
}

/******************************************************************************/
// Private Symbols
/******************************************************************************/

var _mass = (0, _symbol2.default)('mass'),
    _radius = (0, _symbol2.default)('radius'),
    _collisionRadius = (0, _symbol2.default)('collision-radius'),
    _cache = (0, _symbol2.default)('cache'),
    _startTick = (0, _symbol2.default)('start-tick');

var Body = function (_EventEmitter) {
  (0, _inherits3.default)(Body, _EventEmitter);

  function Body(mass, pos, vel, startTick) {
    (0, _classCallCheck3.default)(this, Body);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Body.__proto__ || (0, _getPrototypeOf2.default)(Body)).call(this));

    if (!(0, _isExplicit2.default)(mass, Number)) throw new TypeError('mass must be a Number');

    if (!(0, _isExplicit2.default)(pos, _vector2.default)) throw new TypeError('pos must be a Vector');

    if (!(0, _isExplicit2.default)(vel, _vector2.default)) throw new TypeError('vel must be a Vector');

    if (!(0, _isExplicit2.default)(startTick, Number)) throw new TypeError('startTick must be a Number');

    _this[_radius] = null;
    _this[_collisionRadius] = null;
    _this.mass = mass;

    _this.pos = pos.copy();
    _this.vel = vel.copy();
    _this.force = _vector2.default.zero;

    _this[_cache] = [];
    _this[_startTick] = startTick;

    return _this;
  }

  (0, _createClass3.default)(Body, [{
    key: 'cache',
    value: function cache(tick) {
      var index = (tick - this[_startTick]) * NUM_CACHE_PROPERTIES;

      var cache = this[_cache];

      //the cache is a single serialized array full of numbers.
      //I'm imagining that the less object references put into the cache array,
      //the longer they can be.
      cache[index] = this[_mass];
      cache[index + 1] = this.pos.x;
      cache[index + 2] = this.pos.y;
      cache[index + 3] = this.vel.x;
      cache[index + 4] = this.vel.y;
    }
  }, {
    key: 'shiftCache',
    value: function shiftCache(tick) {
      var index = (tick - this[_startTick]) * NUM_CACHE_PROPERTIES;
      var cache = this[_cache];

      if (index >= 0) cache.splice(0, index);

      this[_startTick] -= tick;
      if (this[_startTick] < 0) this[_startTick] = 0;
    }
  }, {
    key: 'statsAtTick',
    value: function statsAtTick(tick) {
      var index = (tick - this[_startTick]) * NUM_CACHE_PROPERTIES;
      var cache = this[_cache];

      var mass = cache[index];

      //only return stats if body exists at this tick
      if (!mass || mass <= 0) return null;

      var radius = radiusFromMass(mass);

      return {
        mass: mass,
        radius: radius,
        collisionRadius: collisionRadiusFromRadius(radius),
        pos: new _vector2.default(cache[index + 1], cache[index + 2]),
        vel: new _vector2.default(cache[index + 3], cache[index + 4])
      };
    }
  }, {
    key: 'mass',
    get: function get() {
      return this[_mass];
    },
    set: function set(value) {
      this[_mass] = value;
      this[_radius] = radiusFromMass(this[_mass]);
      this[_collisionRadius] = collisionRadiusFromRadius(this[_radius]);
    }
  }, {
    key: 'radius',
    get: function get() {
      return this[_radius];
    }
  }, {
    key: 'collisionRadius',
    get: function get() {
      return this[_collisionRadius];
    }
  }, {
    key: 'destroyed',
    get: function get() {
      return this.mass <= 0;
    }
  }]);
  return Body;
}(_events.EventEmitter);

exports.default = Body;
//# sourceMappingURL=/Users/bengaumond/Programming/gravity-toy/lib-maps/body.js.map