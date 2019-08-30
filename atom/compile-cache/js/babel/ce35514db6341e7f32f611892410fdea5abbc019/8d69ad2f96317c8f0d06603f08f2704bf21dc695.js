Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _atomTernjsProvider = require('./atom-ternjs-provider');

var _atomTernjsProvider2 = _interopRequireDefault(_atomTernjsProvider);

var _atomTernjsManager = require('./atom-ternjs-manager');

var _atomTernjsManager2 = _interopRequireDefault(_atomTernjsManager);

var _atomTernjsHyperclickProvider = require('./atom-ternjs-hyperclick-provider');

var _atomTernjsHyperclickProvider2 = _interopRequireDefault(_atomTernjsHyperclickProvider);

'use babel';

var AtomTernjs = (function () {
  function AtomTernjs() {
    _classCallCheck(this, AtomTernjs);

    this.config = _config2['default'];
  }

  _createClass(AtomTernjs, [{
    key: 'activate',
    value: function activate() {

      _atomTernjsManager2['default'].activate();
    }
  }, {
    key: 'deactivate',
    value: function deactivate() {

      _atomTernjsManager2['default'].destroy();
    }
  }, {
    key: 'provide',
    value: function provide() {

      return _atomTernjsProvider2['default'];
    }
  }, {
    key: 'provideHyperclick',
    value: function provideHyperclick() {

      return _atomTernjsHyperclickProvider2['default'];
    }
  }]);

  return AtomTernjs;
})();

exports['default'] = new AtomTernjs();
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O3NCQUV5QixVQUFVOzs7O2tDQUNkLHdCQUF3Qjs7OztpQ0FDekIsdUJBQXVCOzs7OzRDQUNwQixtQ0FBbUM7Ozs7QUFMMUQsV0FBVyxDQUFDOztJQU9OLFVBQVU7QUFFSCxXQUZQLFVBQVUsR0FFQTswQkFGVixVQUFVOztBQUlaLFFBQUksQ0FBQyxNQUFNLHNCQUFlLENBQUM7R0FDNUI7O2VBTEcsVUFBVTs7V0FPTixvQkFBRzs7QUFFVCxxQ0FBUSxRQUFRLEVBQUUsQ0FBQztLQUNwQjs7O1dBRVMsc0JBQUc7O0FBRVgscUNBQVEsT0FBTyxFQUFFLENBQUM7S0FDbkI7OztXQUVNLG1CQUFHOztBQUVSLDZDQUFnQjtLQUNqQjs7O1dBRWdCLDZCQUFHOztBQUVsQix1REFBa0I7S0FDbkI7OztTQXpCRyxVQUFVOzs7cUJBNEJELElBQUksVUFBVSxFQUFFIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgZGVmYXVsQ29uZmlnIGZyb20gJy4vY29uZmlnJztcbmltcG9ydCBwcm92aWRlciBmcm9tICcuL2F0b20tdGVybmpzLXByb3ZpZGVyJztcbmltcG9ydCBtYW5hZ2VyIGZyb20gJy4vYXRvbS10ZXJuanMtbWFuYWdlcic7XG5pbXBvcnQgaHlwZXJjbGljayBmcm9tICcuL2F0b20tdGVybmpzLWh5cGVyY2xpY2stcHJvdmlkZXInO1xuXG5jbGFzcyBBdG9tVGVybmpzIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcblxuICAgIHRoaXMuY29uZmlnID0gZGVmYXVsQ29uZmlnO1xuICB9XG5cbiAgYWN0aXZhdGUoKSB7XG5cbiAgICBtYW5hZ2VyLmFjdGl2YXRlKCk7XG4gIH1cblxuICBkZWFjdGl2YXRlKCkge1xuXG4gICAgbWFuYWdlci5kZXN0cm95KCk7XG4gIH1cblxuICBwcm92aWRlKCkge1xuXG4gICAgcmV0dXJuIHByb3ZpZGVyO1xuICB9XG5cbiAgcHJvdmlkZUh5cGVyY2xpY2soKSB7XG4gICAgXG4gICAgcmV0dXJuIGh5cGVyY2xpY2s7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IEF0b21UZXJuanMoKTtcbiJdfQ==