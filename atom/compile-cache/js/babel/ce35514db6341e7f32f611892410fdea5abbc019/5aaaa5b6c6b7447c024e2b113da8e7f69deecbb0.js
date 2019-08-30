var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _atomTernjsView = require('./atom-ternjs-view');

var _atomTernjsView2 = _interopRequireDefault(_atomTernjsView);

'use babel';

var TypeView = (function (_TernView) {
  _inherits(TypeView, _TernView);

  function TypeView() {
    _classCallCheck(this, TypeView);

    _get(Object.getPrototypeOf(TypeView.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(TypeView, [{
    key: 'initialize',
    value: function initialize(model) {

      _get(Object.getPrototypeOf(TypeView.prototype), 'initialize', this).call(this, model);

      this.addEventListener('click', model.destroyOverlay);
    }
  }, {
    key: 'setData',
    value: function setData(type, documentation) {

      this.innerHTML = documentation ? type + '<br /><br />' + documentation : '' + type;
    }
  }]);

  return TypeView;
})(_atomTernjsView2['default']);

module.exports = document.registerElement('atom-ternjs-type', {

  prototype: TypeView.prototype
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy10eXBlLXZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs4QkFFcUIsb0JBQW9COzs7O0FBRnpDLFdBQVcsQ0FBQzs7SUFJTixRQUFRO1lBQVIsUUFBUTs7V0FBUixRQUFROzBCQUFSLFFBQVE7OytCQUFSLFFBQVE7OztlQUFSLFFBQVE7O1dBRUYsb0JBQUMsS0FBSyxFQUFFOztBQUVoQixpQ0FKRSxRQUFRLDRDQUlPLEtBQUssRUFBRTs7QUFFeEIsVUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7S0FDdEQ7OztXQUVNLGlCQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7O0FBRTNCLFVBQUksQ0FBQyxTQUFTLEdBQUcsYUFBYSxHQUFNLElBQUksb0JBQWUsYUFBYSxRQUFRLElBQUksQUFBRSxDQUFDO0tBQ3BGOzs7U0FaRyxRQUFROzs7QUFlZCxNQUFNLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsa0JBQWtCLEVBQUU7O0FBRTVELFdBQVMsRUFBRSxRQUFRLENBQUMsU0FBUztDQUM5QixDQUFDLENBQUMiLCJmaWxlIjoiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2F0b20tdGVybmpzLXR5cGUtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgVGVyblZpZXcgZnJvbSAnLi9hdG9tLXRlcm5qcy12aWV3JztcblxuY2xhc3MgVHlwZVZpZXcgZXh0ZW5kcyBUZXJuVmlldyB7XG5cbiAgaW5pdGlhbGl6ZShtb2RlbCkge1xuXG4gICAgc3VwZXIuaW5pdGlhbGl6ZShtb2RlbCk7XG5cbiAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgbW9kZWwuZGVzdHJveU92ZXJsYXkpO1xuICB9XG5cbiAgc2V0RGF0YSh0eXBlLCBkb2N1bWVudGF0aW9uKSB7XG5cbiAgICB0aGlzLmlubmVySFRNTCA9IGRvY3VtZW50YXRpb24gPyBgJHt0eXBlfTxiciAvPjxiciAvPiR7ZG9jdW1lbnRhdGlvbn1gIDogYCR7dHlwZX1gO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCdhdG9tLXRlcm5qcy10eXBlJywge1xuXG4gIHByb3RvdHlwZTogVHlwZVZpZXcucHJvdG90eXBlXG59KTtcbiJdfQ==