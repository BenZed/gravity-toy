'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Body = undefined;

var _events = require('events');

var _vector = require('./vector');

var _vector2 = _interopRequireDefault(_vector);

var _isExplicit = require('is-explicit');

var _isExplicit2 = _interopRequireDefault(_isExplicit);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Body extends _events.EventEmitter {

  constructor(mass, pos, vel) {
    super();

    if (!(0, _isExplicit2.default)(mass, Number)) throw new TypeError('mass must be a Number');

    if (!(0, _isExplicit2.default)(pos, _vector2.default)) throw new TypeError('pos must be a Vector');

    if (!(0, _isExplicit2.default)(vel, _vector2.default)) throw new TypeError('vel must be a Vector');

    this.mass = mass;
    this.pos = pos;
    this.vel = vel;
    this.cache = [];
  }

  get destroyed() {
    return this.mass <= 0;
  }

}
exports.Body = Body;
//# sourceMappingURL=/Users/bengaumond/Programming/gravity-toy/source-maps/modules/simulation/body.js.map