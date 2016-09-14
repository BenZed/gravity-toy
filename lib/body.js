'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Body = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _vector = require('./vector');

var _vector2 = _interopRequireDefault(_vector);

var _isExplicit = require('is-explicit');

var _isExplicit2 = _interopRequireDefault(_isExplicit);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Body = exports.Body = function (_EventEmitter) {
  _inherits(Body, _EventEmitter);

  function Body(mass, pos, vel) {
    _classCallCheck(this, Body);

    var _this = _possibleConstructorReturn(this, (Body.__proto__ || Object.getPrototypeOf(Body)).call(this));

    if (!(0, _isExplicit2.default)(mass, Number)) throw new TypeError('mass must be a Number');

    if (!(0, _isExplicit2.default)(pos, _vector2.default)) throw new TypeError('pos must be a Vector');

    if (!(0, _isExplicit2.default)(vel, _vector2.default)) throw new TypeError('vel must be a Vector');

    _this.mass = mass;
    _this.pos = pos;
    _this.vel = vel;
    _this.cache = [];

    return _this;
  }

  _createClass(Body, [{
    key: 'destroyed',
    get: function get() {
      return this.mass <= 0;
    }
  }]);

  return Body;
}(_events.EventEmitter);
//# sourceMappingURL=/Volumes/GM Production 02 External/Projects/Git/gravity-toy/lib-maps/body.js.map