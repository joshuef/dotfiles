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

var _atom = require('atom');

'use babel';

var AtomTernjs = (function () {
  function AtomTernjs() {
    _classCallCheck(this, AtomTernjs);

    this.config = _config2['default'];
  }

  _createClass(AtomTernjs, [{
    key: 'activate',
    value: function activate() {

      this.subscriptions = new _atom.CompositeDisposable();

      this.subscriptions.add(atom.packages.onDidActivateInitialPackages(function () {

        if (!atom.inSpecMode()) {

          require('atom-package-deps').install('atom-ternjs', true);
        }
      }));

      _atomTernjsManager2['default'].activate();
    }
  }, {
    key: 'deactivate',
    value: function deactivate() {

      _atomTernjsManager2['default'].destroy();
      this.subscriptions.dispose();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2F0b20tdGVybmpzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7c0JBRXlCLFVBQVU7Ozs7a0NBQ2Qsd0JBQXdCOzs7O2lDQUN6Qix1QkFBdUI7Ozs7NENBQ3BCLG1DQUFtQzs7OztvQkFDdEIsTUFBTTs7QUFOMUMsV0FBVyxDQUFDOztJQVFOLFVBQVU7QUFFSCxXQUZQLFVBQVUsR0FFQTswQkFGVixVQUFVOztBQUlaLFFBQUksQ0FBQyxNQUFNLHNCQUFlLENBQUM7R0FDNUI7O2VBTEcsVUFBVTs7V0FPTixvQkFBRzs7QUFFVCxVQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFDOztBQUUvQyxVQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDcEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyw0QkFBNEIsQ0FBQyxZQUFXOztBQUVwRCxZQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFOztBQUV0QixpQkFBTyxDQUFDLG1CQUFtQixDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMzRDtPQUNGLENBQUMsQ0FDSCxDQUFDOztBQUVGLHFDQUFRLFFBQVEsRUFBRSxDQUFDO0tBQ3BCOzs7V0FFUyxzQkFBRzs7QUFFWCxxQ0FBUSxPQUFPLEVBQUUsQ0FBQztBQUNsQixVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQzlCOzs7V0FFTSxtQkFBRzs7QUFFUiw2Q0FBZ0I7S0FDakI7OztXQUVnQiw2QkFBRzs7QUFFbEIsdURBQWtCO0tBQ25COzs7U0F0Q0csVUFBVTs7O3FCQXlDRCxJQUFJLFVBQVUsRUFBRSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgZGVmYXVsQ29uZmlnIGZyb20gJy4vY29uZmlnJztcbmltcG9ydCBwcm92aWRlciBmcm9tICcuL2F0b20tdGVybmpzLXByb3ZpZGVyJztcbmltcG9ydCBtYW5hZ2VyIGZyb20gJy4vYXRvbS10ZXJuanMtbWFuYWdlcic7XG5pbXBvcnQgaHlwZXJjbGljayBmcm9tICcuL2F0b20tdGVybmpzLWh5cGVyY2xpY2stcHJvdmlkZXInO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nO1xuXG5jbGFzcyBBdG9tVGVybmpzIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcblxuICAgIHRoaXMuY29uZmlnID0gZGVmYXVsQ29uZmlnO1xuICB9XG5cbiAgYWN0aXZhdGUoKSB7XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIGF0b20ucGFja2FnZXMub25EaWRBY3RpdmF0ZUluaXRpYWxQYWNrYWdlcyhmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAoIWF0b20uaW5TcGVjTW9kZSgpKSB7XG5cbiAgICAgICAgICByZXF1aXJlKCdhdG9tLXBhY2thZ2UtZGVwcycpLmluc3RhbGwoJ2F0b20tdGVybmpzJywgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcblxuICAgIG1hbmFnZXIuYWN0aXZhdGUoKTtcbiAgfVxuXG4gIGRlYWN0aXZhdGUoKSB7XG5cbiAgICBtYW5hZ2VyLmRlc3Ryb3koKTtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICB9XG5cbiAgcHJvdmlkZSgpIHtcblxuICAgIHJldHVybiBwcm92aWRlcjtcbiAgfVxuXG4gIHByb3ZpZGVIeXBlcmNsaWNrKCkge1xuXG4gICAgcmV0dXJuIGh5cGVyY2xpY2s7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IEF0b21UZXJuanMoKTtcbiJdfQ==