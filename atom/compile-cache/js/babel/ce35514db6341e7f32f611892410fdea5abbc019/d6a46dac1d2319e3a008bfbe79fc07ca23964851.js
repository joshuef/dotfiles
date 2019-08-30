Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _modelsConfig = require('./models/config');

var _modelsConfig2 = _interopRequireDefault(_modelsConfig);

var _viewsConfig = require('./views/config');

var _atomTernjsHelper = require('./atom-ternjs-helper');

var _atomTernjsManager = require('./atom-ternjs-manager');

var _atomTernjsManager2 = _interopRequireDefault(_atomTernjsManager);

'use babel';

var Config = (function () {
  function Config() {
    _classCallCheck(this, Config);

    this.disposables = [];
  }

  _createClass(Config, [{
    key: 'init',
    value: function init() {

      this.disposables.push(atom.views.addViewProvider(_modelsConfig2['default'], _viewsConfig.createView), atom.workspace.addOpener(this.opener.bind(this)), atom.commands.add('atom-workspace', 'atom-ternjs:openConfig', this.requestPane.bind(this)));
    }
  }, {
    key: 'opener',
    value: function opener(uri) {

      var projectDir = _atomTernjsManager2['default'].server && _atomTernjsManager2['default'].server.projectDir;

      var _url$parse = _url2['default'].parse(uri);

      var protocol = _url$parse.protocol;
      var host = _url$parse.host;

      if (protocol !== 'atom-ternjs:' || host !== 'config') {

        return undefined;
      }

      var model = new _modelsConfig2['default']();

      model.setProjectDir(projectDir);
      model.setURI(uri);

      return model;
    }
  }, {
    key: 'requestPane',
    value: function requestPane() {

      var projectDir = _atomTernjsManager2['default'].server && _atomTernjsManager2['default'].server.projectDir;

      if (!projectDir) {

        atom.notifications.addError('There is no active server');

        return;
      }

      var uri = 'atom-ternjs:' + '//config/' + projectDir;
      var previousPane = atom.workspace.paneForURI(uri);

      if (previousPane) {

        previousPane.activate();

        return;
      }

      atom.workspace.open('atom-ternjs:' + '//config/' + projectDir, {

        searchAllPanes: true,
        split: 'right'

      }).then(function (model) {

        // console.log(model);
      });
    }
  }, {
    key: 'destroy',
    value: function destroy() {

      (0, _atomTernjsHelper.disposeAll)(this.disposables);
      this.disposables = [];
    }
  }]);

  return Config;
})();

exports['default'] = new Config();
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1jb25maWcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OzttQkFFZ0IsS0FBSzs7Ozs0QkFFRyxpQkFBaUI7Ozs7MkJBQ2hCLGdCQUFnQjs7Z0NBSWxDLHNCQUFzQjs7aUNBRVQsdUJBQXVCOzs7O0FBWDNDLFdBQVcsQ0FBQzs7SUFhTixNQUFNO0FBRUMsV0FGUCxNQUFNLEdBRUk7MEJBRlYsTUFBTTs7QUFJUixRQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztHQUN2Qjs7ZUFMRyxNQUFNOztXQU9OLGdCQUFHOztBQUVMLFVBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUVuQixJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsb0RBQXlCLEVBQ25ELElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQ2hELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLHdCQUF3QixFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQzNGLENBQUM7S0FDSDs7O1dBRUssZ0JBQUMsR0FBRyxFQUFFOztBQUVWLFVBQU0sVUFBVSxHQUFHLCtCQUFRLE1BQU0sSUFBSSwrQkFBUSxNQUFNLENBQUMsVUFBVSxDQUFDOzt1QkFDdEMsaUJBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQzs7VUFBaEMsUUFBUSxjQUFSLFFBQVE7VUFBRSxJQUFJLGNBQUosSUFBSTs7QUFFckIsVUFDRSxRQUFRLEtBQUssY0FBYyxJQUMzQixJQUFJLEtBQUssUUFBUSxFQUNqQjs7QUFFQSxlQUFPLFNBQVMsQ0FBQztPQUNsQjs7QUFFRCxVQUFNLEtBQUssR0FBRywrQkFBaUIsQ0FBQzs7QUFFaEMsV0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNoQyxXQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUVsQixhQUFPLEtBQUssQ0FBQztLQUNkOzs7V0FFVSx1QkFBRzs7QUFFWixVQUFNLFVBQVUsR0FBRywrQkFBUSxNQUFNLElBQUksK0JBQVEsTUFBTSxDQUFDLFVBQVUsQ0FBQzs7QUFFL0QsVUFBSSxDQUFDLFVBQVUsRUFBRTs7QUFFZixZQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDOztBQUV6RCxlQUFPO09BQ1I7O0FBRUQsVUFBTSxHQUFHLEdBQUcsY0FBYyxHQUFHLFdBQVcsR0FBRyxVQUFVLENBQUM7QUFDdEQsVUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7O0FBRXBELFVBQUksWUFBWSxFQUFFOztBQUVoQixvQkFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUV4QixlQUFPO09BQ1I7O0FBRUQsVUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxHQUFHLFdBQVcsR0FBRyxVQUFVLEVBQUU7O0FBRTdELHNCQUFjLEVBQUUsSUFBSTtBQUNwQixhQUFLLEVBQUUsT0FBTzs7T0FFZixDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsS0FBSyxFQUFLOzs7T0FHbEIsQ0FBQyxDQUFDO0tBQ0o7OztXQUVNLG1CQUFHOztBQUVSLHdDQUFXLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUM3QixVQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztLQUN2Qjs7O1NBMUVHLE1BQU07OztxQkE2RUcsSUFBSSxNQUFNLEVBQUUiLCJmaWxlIjoiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2F0b20tdGVybmpzLWNvbmZpZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgdXJsIGZyb20gJ3VybCc7XG5cbmltcG9ydCBDb25maWdNb2RlbCBmcm9tICcuL21vZGVscy9jb25maWcnO1xuaW1wb3J0IHtjcmVhdGVWaWV3fSBmcm9tICcuL3ZpZXdzL2NvbmZpZyc7XG5cbmltcG9ydCB7XG4gIGRpc3Bvc2VBbGxcbn0gZnJvbSAnLi9hdG9tLXRlcm5qcy1oZWxwZXInO1xuXG5pbXBvcnQgbWFuYWdlciBmcm9tICcuL2F0b20tdGVybmpzLW1hbmFnZXInO1xuXG5jbGFzcyBDb25maWcge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlcyA9IFtdO1xuICB9XG5cbiAgaW5pdCgpIHtcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMucHVzaChcblxuICAgICAgYXRvbS52aWV3cy5hZGRWaWV3UHJvdmlkZXIoQ29uZmlnTW9kZWwsIGNyZWF0ZVZpZXcpLFxuICAgICAgYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyKHRoaXMub3BlbmVyLmJpbmQodGhpcykpLFxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ2F0b20tdGVybmpzOm9wZW5Db25maWcnLCB0aGlzLnJlcXVlc3RQYW5lLmJpbmQodGhpcykpXG4gICAgKTtcbiAgfVxuXG4gIG9wZW5lcih1cmkpIHtcblxuICAgIGNvbnN0IHByb2plY3REaXIgPSBtYW5hZ2VyLnNlcnZlciAmJiBtYW5hZ2VyLnNlcnZlci5wcm9qZWN0RGlyO1xuICAgIGNvbnN0IHtwcm90b2NvbCwgaG9zdH0gPSB1cmwucGFyc2UodXJpKTtcblxuICAgIGlmIChcbiAgICAgIHByb3RvY29sICE9PSAnYXRvbS10ZXJuanM6JyB8fFxuICAgICAgaG9zdCAhPT0gJ2NvbmZpZydcbiAgICApIHtcblxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCBtb2RlbCA9IG5ldyBDb25maWdNb2RlbCgpO1xuXG4gICAgbW9kZWwuc2V0UHJvamVjdERpcihwcm9qZWN0RGlyKTtcbiAgICBtb2RlbC5zZXRVUkkodXJpKTtcblxuICAgIHJldHVybiBtb2RlbDtcbiAgfVxuXG4gIHJlcXVlc3RQYW5lKCkge1xuXG4gICAgY29uc3QgcHJvamVjdERpciA9IG1hbmFnZXIuc2VydmVyICYmIG1hbmFnZXIuc2VydmVyLnByb2plY3REaXI7XG5cbiAgICBpZiAoIXByb2plY3REaXIpIHtcblxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKCdUaGVyZSBpcyBubyBhY3RpdmUgc2VydmVyJyk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB1cmkgPSAnYXRvbS10ZXJuanM6JyArICcvL2NvbmZpZy8nICsgcHJvamVjdERpcjtcbiAgICBjb25zdCBwcmV2aW91c1BhbmUgPSBhdG9tLndvcmtzcGFjZS5wYW5lRm9yVVJJKHVyaSk7XG5cbiAgICBpZiAocHJldmlvdXNQYW5lKSB7XG5cbiAgICAgIHByZXZpb3VzUGFuZS5hY3RpdmF0ZSgpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYXRvbS53b3Jrc3BhY2Uub3BlbignYXRvbS10ZXJuanM6JyArICcvL2NvbmZpZy8nICsgcHJvamVjdERpciwge1xuXG4gICAgICBzZWFyY2hBbGxQYW5lczogdHJ1ZSxcbiAgICAgIHNwbGl0OiAncmlnaHQnXG5cbiAgICB9KS50aGVuKChtb2RlbCkgPT4ge1xuXG4gICAgICAvLyBjb25zb2xlLmxvZyhtb2RlbCk7XG4gICAgfSk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuXG4gICAgZGlzcG9zZUFsbCh0aGlzLmRpc3Bvc2FibGVzKTtcbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gW107XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IENvbmZpZygpO1xuIl19