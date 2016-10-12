'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

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

var _isExplicit = require('is-explicit');

var _isExplicit2 = _interopRequireDefault(_isExplicit);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _performanceNow = require('performance-now');

var _performanceNow2 = _interopRequireDefault(_performanceNow);

var _body = require('./body');

var _body2 = _interopRequireDefault(_body);

var _vector = require('./vector');

var _vector2 = _interopRequireDefault(_vector);

var _helper = require('./helper');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/******************************************************************************/
// Simulation Class
/******************************************************************************/

//Used to make the interval between updates as consistent as possible
var UPDATE_SLACK = 10;

var ONE_MEG = 1048576; //bytes
var MAX_MEMORY = ONE_MEG * (256 + 128);
var MAX_NUMBER_ALLOCATIONS = MAX_MEMORY / 8; //bytes
var MAX_CACHE_ALLOCATIONS = Math.floor(MAX_NUMBER_ALLOCATIONS / _body.NUM_CACHE_PROPERTIES);

//Symbols for "private" properties

var _bodies = (0, _symbol2.default)('bodies'),
    _update = (0, _symbol2.default)('update'),
    _paused = (0, _symbol2.default)('paused'),
    _interval = (0, _symbol2.default)('interval'),
    _calculate = (0, _symbol2.default)('calculate'),
    _integrate = (0, _symbol2.default)('intergrate'),
    _collide = (0, _symbol2.default)('collide'),
    _cacheSize = (0, _symbol2.default)('cache-size'),
    _applyCacheAtTick = (0, _symbol2.default)('apply-cache-at-tick');

//Symbols for Body "protected" peropties

var _writeCacheAtTick = (0, _helper.getProtectedSymbol)(_body2.default, 'write-cache-at-tick'),
    _applyStatsAtTick = (0, _helper.getProtectedSymbol)(_body2.default, 'apply-stats-at-tick');

var Simulation = function (_EventEmitter) {
  (0, _inherits3.default)(Simulation, _EventEmitter);

  // API **********************************************************************/
  function Simulation() {
    var UPDATE_DELTA = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 20;
    var G = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.225;
    (0, _classCallCheck3.default)(this, Simulation);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Simulation.__proto__ || (0, _getPrototypeOf2.default)(Simulation)).call(this));

    _this[_update] = function () {
      var interval = _this[_interval];
      var bodies = _this[_bodies];

      //start the interval
      interval.start = (0, _performanceNow2.default)();
      interval.exceeded = false;
      _this.emit('interval-start', deltaTime);

      //integrate until the time budget has been used up or the cache is full
      if (!_this[_paused] && bodies.length > 0 && interval.currentTick < _this.maxCacheTicks) while (!interval.check()) {
        _this[_integrate]();
      }var deltaTime = Math.max(_this.UPDATE_DELTA + UPDATE_SLACK, interval.delta);

      _this.emit('interval-complete', deltaTime);
    };

    (0, _helper.constProperty)(_this, 'UPDATE_DELTA', UPDATE_DELTA);

    (0, _helper.constProperty)(_this, 'G', G);

    _this[_paused] = true;
    _this[_bodies] = [];
    _this[_cacheSize] = 0;

    _this[_interval] = {
      id: null,
      start: 0,
      delta: 0,
      exceeded: false,
      currentTick: 0,

      bodyIndex: 0,
      bodySubIndex: 0,

      check: function check() {
        this.delta = (0, _performanceNow2.default)() - this.start;
        return this.exceeded = this.delta >= UPDATE_DELTA;
      }
    };
    return _this;
  }

  (0, _createClass3.default)(Simulation, [{
    key: 'start',
    value: function start() {
      if (!this[_paused]) return;

      var interval = this[_interval];

      //because the integrator will run for the number of milliseconds specified
      //by update delta, it's still going to take a small amount of time to perform
      //commands after the integration is complete. Things like caching/updating
      //body positions and firing event subscribers. Adding UPDATE_SLACK will help
      //to make the framerate more consistent
      if (!interval.id) interval.id = setInterval(this[_update], this.UPDATE_DELTA + UPDATE_SLACK);

      this[_paused] = false;
    }
  }, {
    key: 'stop',
    value: function stop() {
      var interval = this[_interval];

      if (interval.id !== null) clearInterval(interval.id);

      this[_paused] = true;
    }
  }, {
    key: 'createBodyAtTick',
    value: function createBodyAtTick(mass) {
      var pos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _vector2.default.zero;
      var vel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _vector2.default.zero;
      var tick = arguments[3];


      tick = (0, _isExplicit2.default)(tick, Number) ? tick : this.cachedTicks;

      var body = new _body2.default(mass, new _vector2.default(pos.x, pos.y), new _vector2.default(vel.x, vel.y), tick);

      body[_writeCacheAtTick](tick);
      this[_bodies].push(body);
      this.emit('body-create', body);

      this[_applyCacheAtTick](tick);

      return body;
    }
  }, {
    key: 'forEachBody',
    value: function forEachBody(func) {
      this[_bodies].forEach(func);
    }
  }, {
    key: 'copy',
    value: function copy() {
      var duplicate = new Simulation(this.UPDATE_DELTA, this.G);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(this[_bodies]), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var body = _step.value;

          if (body.exists) duplicate.createBody(body.mass, body.pos, body.vec);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return duplicate;
    }
  }, {
    key: _applyCacheAtTick,
    value: function value(tick) {

      var interval = this[_interval];
      var bodies = this[_bodies];

      if (tick > interval.currentTick) throw new Error('Can\'t apply cache that hasn\'t been created yet.');

      interval.currentTick = tick;

      var i = 0;
      while (i < bodies.length) {
        var body = bodies[i];

        if (body[_applyStatsAtTick](tick)) i++;else bodies.splice(i, 1);
      }
    }
  }, {
    key: _integrate,
    value: function value() {

      var bodies = this[_bodies];
      var interval = this[_interval];

      // calculate loop
      while (interval.bodyIndex < bodies.length) {
        this[_calculate](bodies[interval.bodyIndex]);

        if (interval.exceeded) return;

        interval.bodySubIndex = 0;
        interval.bodyIndex += 1;
      }

      //count the cache and apply the physics integrator

      this[_cacheSize] = 0;
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];

        if (!body.exists) {
          this[_cacheSize] += body.cacheSize;
          continue;
        }

        //Velocity Verlet

        var oldVel = body.vel.copy();
        var newVel = oldVel.add(body.force.mult(this.UPDATE_DELTA * 0.001));
        body.vel = oldVel.add(newVel).mult(0.5);

        body.pos.iadd(body.vel);

        body[_writeCacheAtTick](interval.currentTick);
        this[_cacheSize] += body.cacheSize;
      }

      interval.bodyIndex = 0;
      interval.currentTick++;
    }

    //This function gets called a lot, so there are
    //some manual inlining and optimizations
    //i've made. I dunno if they make a difference in the
    //grand scheme of things, but it helps my OCD

  }, {
    key: _calculate,
    value: function value(body) {

      var bodies = this[_bodies];
      var interval = this[_interval];

      // relative position vector between two bodies
      // declared outside of the while loop
      // to save garbage collections on Vector objects
      var relative = _vector2.default.zero;

      //if the body sub index is zero, that means we
      //didn't leave in the middle of a force calculation
      //and we can reset
      if (interval.bodySubIndex === 0) body.force.x = 0, body.force.y = 0;

      if (!body.exists) return;

      while (interval.bodySubIndex < bodies.length) {
        var otherBody = bodies[interval.bodySubIndex];

        if (body != otherBody && otherBody.exists) {

          //inlining body.pos.sub(otherBody.pos)
          relative.x = otherBody.pos.x - body.pos.x;
          relative.y = otherBody.pos.y - body.pos.y;

          var distSqr = relative.sqrMagnitude;

          //inlining relative.magnitude
          var dist = Math.sqrt(distSqr);

          if (dist < body.collisionRadius + otherBody.collisionRadius) this[_collide](body, otherBody);

          var G = this.G * (otherBody.mass / distSqr);

          //inlining body.iadd(relative.imult(G).idiv(dist))
          body.force.x += G * relative.x / dist;
          body.force.y += G * relative.y / dist;
        }

        interval.bodySubIndex++;

        if (interval.check()) return;
      }
    }
  }, {
    key: _collide,
    value: function value(b1, b2) {
      var _ref = b1.mass > b2.mass ? [b1, b2] : [b2, b1];

      var _ref2 = (0, _slicedToArray3.default)(_ref, 2);

      var big = _ref2[0];
      var small = _ref2[1];


      var totalMass = big.mass + small.mass;
      big.pos.imult(big.mass).iadd(small.pos.mult(small.mass)).idiv(totalMass);

      big.vel.imult(big.mass).iadd(small.vel.mult(small.mass)).idiv(totalMass);

      small.mass = 0; //this sets the exists flag to false
      big.mass = totalMass;

      small.emit('body-collision', big);
      big.emit('body-collision', small);
      this.emit('body-collision', small, big);
    }
  }, {
    key: 'running',
    get: function get() {
      return this[_interval].id !== null;
    }
  }, {
    key: 'paused',
    get: function get() {
      return this[_paused];
    },
    set: function set(value) {
      this[_paused] = !!value;
    }
  }, {
    key: 'cachedTicks',
    get: function get() {
      return this[_interval].currentTick;
    }
  }, {
    key: 'maxCacheTicks',
    get: function get() {
      var totalCacheUsed = this[_cacheSize] / MAX_CACHE_ALLOCATIONS;

      var maxCacheTicks = Math.floor(this[_interval].currentTick / totalCacheUsed);

      return (0, _isExplicit2.default)(maxCacheTicks, Number) ? maxCacheTicks : Infinity;
    }
  }, {
    key: 'cachedSeconds',
    get: function get() {
      return this[_interval].currentTick / (this.UPDATE_DELTA + UPDATE_SLACK);
    }
  }, {
    key: 'maxCacheSeconds',
    get: function get() {
      return this.maxCacheTicks / (this.UPDATE_DELTA + UPDATE_SLACK);
    }
  }, {
    key: 'numBodies',
    get: function get() {
      return this[_bodies].length;
    }
  }]);
  return Simulation;
}(_events2.default);

exports.default = Simulation;
//# sourceMappingURL=/Users/bengaumond/Programming/gravity-toy/lib-maps/simulation.js.map