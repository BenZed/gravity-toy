'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/******************************************************************************/
// Simulation Class
/******************************************************************************/

//Symbols for "private" properties
var _bodies = Symbol('bodies'),
    _update = Symbol('update'),
    _paused = Symbol('paused'),
    _interval = Symbol('interval'),
    _calculate = Symbol('calculate'),
    _integrate = Symbol('intergrate'),
    _collide = Symbol('collide');

var Simulation = function (_EventEmitter) {
  _inherits(Simulation, _EventEmitter);

  _createClass(Simulation, [{
    key: _integrate,


    // UPDATE *******************************************************************/

    value: function value() {

      var bodies = this[bodies];
      var interval = this[interval];

      //calculate loop
      while (interval.bodyIndex < bodies.length) {
        this[_calculate](bodies[interval.bodyIndex]);

        if (interval.exceeded) break;

        interval.bodySubIndex = 0;
        interval.bodyIndex += 1;
      }

      //apply loop
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];

        //we need to write the body class and figure out how cacheing is going to
        //work before we do this step
      }

      if (!interval.exceeded) {
        interval.bodyIndex = 0;
        interval.currentTick++;
      }
    }
  }, {
    key: _calculate,
    value: function value(body) {
      //This function gets called a lot, so there are
      //some manual inlining and optimizations
      //i've made. I dunno if they make a difference in the
      //grand scheme of things, but it helps my OCD

      var bodies = this[_bodies];
      var interval = this[_interval];

      // relative position vector between two bodies
      // declared outside of the while loop
      // to save garbage collections on Vector objects
      var relative = _vector2.default.zero;

      if (interval.bodySubIndex === 0) body.force.x = 0, body.force.y = 0;

      if (body.destroyed) return;

      while (interval.bodySubIndex < bodies.length) {
        var otherBody = bodies[interval.bodySubIndex];

        if (body != otherBody && !otherBody.destroyed) {

          //inlining body.pos.sub(otherBody.pos)
          relative.x = body.pos.x - otherBody.pos.x;
          relative.y = body.pos.y - otherBody.pos.y;

          var distSqr = relative.sqrMagnitude;
          //inlining relative.magnitude
          var dist = Math.sqrt(distSqr);

          if (dist < otherBody.collisionRadius + body.collisionRadius) this[_collide](body, otherBody);

          var G = this.g * body.mass / distSqr;

          //inlining body.iadd(new Vector(G * relative.x / dist, G * relative.y / dist)
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

      var _ref2 = _slicedToArray(_ref, 2);

      var big = _ref2[0];
      var small = _ref2[1];


      var totalMass = big.mass + small.mass;
      big.pos.imult(big.mass).iadd(small.pos.mult(small.mass)).idiv(totalMass);

      big.vel.imult(big.mass).iadd(small.vel.mult(small.mass)).idiv(totalMass);

      big.mass = totalMass;
      small.mass = 0; //this sets the destroyed flag to true
      small.emit('body-collision', big);
      big.emit('body-collision', small);

      this.emit('body-collision', small, big);
    }
  }, {
    key: _update,
    value: function value() {

      var interval = this[_interval];

      interval.start = (0, _performanceNow2.default)();
      interval.exceeded = false;
      this.emit('interval-start');

      if (!this[_paused]) while (!interval.check()) {
        this[_integrate]();
      }this.emit('interval-complete');
    }

    // API **********************************************************************/

  }]);

  function Simulation() {
    var updateDelta = arguments.length <= 0 || arguments[0] === undefined ? 20 : arguments[0];
    var g = arguments.length <= 1 || arguments[1] === undefined ? 0.225 : arguments[1];

    _classCallCheck(this, Simulation);

    //this.updateDelta readonly
    var _this = _possibleConstructorReturn(this, (Simulation.__proto__ || Object.getPrototypeOf(Simulation)).call(this));

    Object.defineProperty(_this, 'updateDelta', { value: updateDelta });
    //this.g readonly
    Object.defineProperty(_this, 'g', { value: g });
    _this[_bodies] = new Array();
    _this[_update] = _this[_update].bind(_this);
    _this[_interval] = {
      id: null,
      start: 0,
      exceeded: false,
      currentTick: 0,

      bodyIndex: 0,
      bodySubIndex: 0,

      check: function check() {
        var delta = (0, _performanceNow2.default)() - this.start;
        this.exceeded = delta >= this.updateDelta;
        return this.exceeded;
      }
    };
    return _this;
  }

  _createClass(Simulation, [{
    key: 'start',
    value: function start() {

      if (!this[_paused]) return;

      var interval = this[interval];

      if (!interval.id) interval.id = setInterval(this[_update], this.updateDelta);

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
    key: 'createBody',
    value: function createBody(mass, pos, vel) {
      var body = new _body2.default(mass, new _vector2.default(pos.x, pos.y), new _vector2.default(vel.x, vel.y));

      this[_bodies].push(body);
      this.emit('body-create', body);

      return body;
    }
  }, {
    key: 'copy',
    value: function copy() {
      var duplicate = new Simulation(this.updateDelta, this.g);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this[_bodies][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var body = _step.value;

          if (!body.destroyed) duplicate.createBody(body.mass, body.pos, body.vec);
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
      this[_paused] = value;
    }
  }]);

  return Simulation;
}(_events2.default);

exports.default = Simulation;


new Simulation();
//# sourceMappingURL=/Volumes/GM Production 02 External/Projects/Git/gravity-toy/lib-maps/simulation.js.map