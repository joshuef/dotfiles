Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atomTernjsServer = require('./atom-ternjs-server');

var _atomTernjsServer2 = _interopRequireDefault(_atomTernjsServer);

var _atomTernjsClient = require('./atom-ternjs-client');

var _atomTernjsClient2 = _interopRequireDefault(_atomTernjsClient);

var _atomTernjsEvents = require('./atom-ternjs-events');

var _atomTernjsEvents2 = _interopRequireDefault(_atomTernjsEvents);

var _atomTernjsDocumentation = require('./atom-ternjs-documentation');

var _atomTernjsDocumentation2 = _interopRequireDefault(_atomTernjsDocumentation);

var _atomTernjsReference = require('./atom-ternjs-reference');

var _atomTernjsReference2 = _interopRequireDefault(_atomTernjsReference);

var _atomTernjsPackageConfig = require('./atom-ternjs-package-config');

var _atomTernjsPackageConfig2 = _interopRequireDefault(_atomTernjsPackageConfig);

var _atomTernjsType = require('./atom-ternjs-type');

var _atomTernjsType2 = _interopRequireDefault(_atomTernjsType);

var _atomTernjsConfig = require('./atom-ternjs-config');

var _atomTernjsConfig2 = _interopRequireDefault(_atomTernjsConfig);

var _atomTernjsHelper = require('./atom-ternjs-helper');

var _atomTernjsProvider = require('./atom-ternjs-provider');

var _atomTernjsProvider2 = _interopRequireDefault(_atomTernjsProvider);

var _atomTernjsRename = require('./atom-ternjs-rename');

var _atomTernjsRename2 = _interopRequireDefault(_atomTernjsRename);

var _servicesNavigation = require('./services/navigation');

var _servicesNavigation2 = _interopRequireDefault(_servicesNavigation);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

'use babel';

var Manager = (function () {
  function Manager() {
    _classCallCheck(this, Manager);

    this.disposables = [];
    /**
     * collection of all active clients
     * @type {Array}
     */
    this.clients = [];
    /**
     * reference to the client for the active text-editor
     * @type {Client}
     */
    this.client = null;
    /**
     * collection of all active servers
     * @type {Array}
     */
    this.servers = [];
    /**
     * reference to the server for the active text-editor
     * @type {Server}
     */
    this.server = null;
    this.editors = [];
  }

  _createClass(Manager, [{
    key: 'activate',
    value: function activate() {

      this.registerListeners();
      this.registerCommands();

      _atomTernjsConfig2['default'].init();
      _atomTernjsDocumentation2['default'].init();
      _atomTernjsPackageConfig2['default'].init();
      _atomTernjsProvider2['default'].init();
      _atomTernjsReference2['default'].init();
      _atomTernjsRename2['default'].init();
      _atomTernjsType2['default'].init();
    }
  }, {
    key: 'destroy',
    value: function destroy() {

      (0, _atomTernjsHelper.disposeAll)(this.disposables);
      this.disposables = [];
      this.editors.forEach(function (editor) {
        return (0, _atomTernjsHelper.disposeAll)(editor.disposables);
      });
      this.editors = [];

      for (var server of this.servers) {

        server.destroy();
      }

      this.servers = [];
      this.clients = [];

      this.server = null;
      this.client = null;

      _atomTernjsDocumentation2['default'] && _atomTernjsDocumentation2['default'].destroy();
      _atomTernjsReference2['default'] && _atomTernjsReference2['default'].destroy();
      _atomTernjsType2['default'] && _atomTernjsType2['default'].destroy();
      _atomTernjsPackageConfig2['default'] && _atomTernjsPackageConfig2['default'].destroy();
      _atomTernjsRename2['default'] && _atomTernjsRename2['default'].destroy();
      _atomTernjsConfig2['default'] && _atomTernjsConfig2['default'].destroy();
      _atomTernjsProvider2['default'] && _atomTernjsProvider2['default'].destroy();
      _servicesNavigation2['default'].reset();
    }
  }, {
    key: 'startServer',
    value: function startServer(projectDir) {

      if (!(0, _atomTernjsHelper.isDirectory)(projectDir)) {

        return false;
      }

      if (this.getServerForProject(projectDir)) {

        return true;
      }

      var client = new _atomTernjsClient2['default'](projectDir);
      this.clients.push(client);

      this.servers.push(new _atomTernjsServer2['default'](projectDir, client));

      this.setActiveServerAndClient(projectDir);

      return true;
    }
  }, {
    key: 'setActiveServerAndClient',
    value: function setActiveServerAndClient(uRI) {

      this.server = this.getServerForProject(uRI);
      this.client = this.getClientForProject(uRI);
    }
  }, {
    key: 'destroyClient',
    value: function destroyClient(projectDir) {
      var _this = this;

      var clients = this.clients.slice();

      clients.forEach(function (client, i) {

        if (client.projectDir === projectDir) {

          _this.clients.splice(i, 1);
        }
      });
    }
  }, {
    key: 'destroyServer',
    value: function destroyServer(projectDir) {
      var _this2 = this;

      var servers = this.servers.slice();

      servers.forEach(function (server, i) {

        if (server.projectDir === projectDir) {

          server.destroy();
          _this2.servers.splice(i, 1);
          _this2.destroyClient(projectDir);
        }
      });
    }
  }, {
    key: 'destroyUnusedServers',
    value: function destroyUnusedServers() {
      var _this3 = this;

      var projectDirs = this.editors.map(function (editor) {
        return editor.projectDir;
      });
      var servers = this.servers.slice();

      servers.forEach(function (server) {

        if (!projectDirs.includes(server.projectDir)) {

          _this3.destroyServer(server.projectDir);
        }
      });
    }
  }, {
    key: 'getServerForProject',
    value: function getServerForProject(projectDir) {

      return this.servers.filter(function (server) {
        return server.projectDir === projectDir;
      }).pop();
    }
  }, {
    key: 'getClientForProject',
    value: function getClientForProject(projectDir) {

      return this.clients.filter(function (client) {
        return client.projectDir === projectDir;
      }).pop();
    }
  }, {
    key: 'getEditor',
    value: function getEditor(id) {

      return this.editors.filter(function (editor) {
        return editor.id === id;
      }).pop();
    }
  }, {
    key: 'destroyEditor',
    value: function destroyEditor(id) {
      var _this4 = this;

      var editors = this.editors.slice();

      editors.forEach(function (editor, i) {

        if (editor.id === id) {

          (0, _atomTernjsHelper.disposeAll)(editor.disposables);
          _this4.editors.splice(i, 1);
        }
      });
    }
  }, {
    key: 'getProjectDir',
    value: function getProjectDir(uRI) {
      var _atom$project$relativizePath = atom.project.relativizePath(uRI);

      var _atom$project$relativizePath2 = _slicedToArray(_atom$project$relativizePath, 2);

      var project = _atom$project$relativizePath2[0];
      var file = _atom$project$relativizePath2[1];

      if (project) {

        return project;
      }

      if (file) {

        var absolutePath = _path2['default'].resolve(__dirname, file);

        return _path2['default'].dirname(absolutePath);
      }

      return undefined;
    }
  }, {
    key: 'registerListeners',
    value: function registerListeners() {
      var _this5 = this;

      this.disposables.push(atom.workspace.observeTextEditors(function (editor) {

        if (!(0, _atomTernjsHelper.isValidEditor)(editor)) {

          return;
        }

        var uRI = editor.getURI();
        var projectDir = _this5.getProjectDir(uRI);
        var serverCreatedOrPresent = _this5.startServer(projectDir);

        if (!serverCreatedOrPresent) {

          return;
        }

        var id = editor.id;
        var disposables = [];

        // Register valid editor
        _this5.editors.push({

          id: id,
          projectDir: projectDir,
          disposables: disposables
        });

        disposables.push(editor.onDidDestroy(function () {

          _this5.destroyEditor(id);
          _this5.destroyUnusedServers();
        }));

        disposables.push(editor.onDidChangeCursorPosition(function (e) {

          if (_atomTernjsPackageConfig2['default'].options.inlineFnCompletion) {

            _this5.client && _atomTernjsType2['default'].queryType(editor, e);
          }
        }));

        disposables.push(editor.getBuffer().onDidSave(function (e) {

          _this5.client && _this5.client.update(editor);
        }));
      }));

      this.disposables.push(atom.workspace.onDidChangeActivePaneItem(function (item) {

        _atomTernjsEvents2['default'].emit('type-destroy-overlay');
        _atomTernjsEvents2['default'].emit('documentation-destroy-overlay');
        _atomTernjsEvents2['default'].emit('rename-hide');

        if (!(0, _atomTernjsHelper.isValidEditor)(item)) {

          _atomTernjsEvents2['default'].emit('reference-hide');
        } else {

          var uRI = item.getURI();
          var projectDir = _this5.getProjectDir(uRI);

          _this5.setActiveServerAndClient(projectDir);
        }
      }));
    }
  }, {
    key: 'registerCommands',
    value: function registerCommands() {
      var _this6 = this;

      this.disposables.push(atom.commands.add('atom-text-editor', 'core:cancel', function (e) {

        _atomTernjsEvents2['default'].emit('type-destroy-overlay');
        _atomTernjsEvents2['default'].emit('documentation-destroy-overlay');
        _atomTernjsEvents2['default'].emit('reference-hide');
        _atomTernjsEvents2['default'].emit('rename-hide');
      }));

      this.disposables.push(atom.commands.add('atom-text-editor', 'atom-ternjs:listFiles', function (e) {

        if (_this6.client) {

          _this6.client.files().then(function (data) {

            console.dir(data);
          });
        }
      }));

      this.disposables.push(atom.commands.add('atom-text-editor', 'atom-ternjs:flush', function (e) {

        _this6.server && _this6.server.flush();
      }));

      this.disposables.push(atom.commands.add('atom-text-editor', 'atom-ternjs:navigateBack', function (e) {

        _servicesNavigation2['default'].goTo(-1);
      }));

      this.disposables.push(atom.commands.add('atom-text-editor', 'atom-ternjs:navigateForward', function (e) {

        _servicesNavigation2['default'].goTo(1);
      }));

      this.disposables.push(atom.commands.add('atom-text-editor', 'atom-ternjs:definition', function (e) {

        _this6.client && _this6.client.definition();
      }));

      this.disposables.push(atom.commands.add('atom-workspace', 'atom-ternjs:restart', function (e) {

        _this6.server && _this6.server.restart();
      }));
    }
  }]);

  return Manager;
})();

exports['default'] = new Manager();
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztnQ0FFbUIsc0JBQXNCOzs7O2dDQUN0QixzQkFBc0I7Ozs7Z0NBQ3JCLHNCQUFzQjs7Ozt1Q0FDaEIsNkJBQTZCOzs7O21DQUNqQyx5QkFBeUI7Ozs7dUNBQ3JCLDhCQUE4Qjs7Ozs4QkFDdkMsb0JBQW9COzs7O2dDQUNsQixzQkFBc0I7Ozs7Z0NBS2xDLHNCQUFzQjs7a0NBQ1Isd0JBQXdCOzs7O2dDQUMxQixzQkFBc0I7Ozs7a0NBQ2xCLHVCQUF1Qjs7OztvQkFDN0IsTUFBTTs7OztBQWxCdkIsV0FBVyxDQUFDOztJQW9CTixPQUFPO0FBRUEsV0FGUCxPQUFPLEdBRUc7MEJBRlYsT0FBTzs7QUFJVCxRQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQzs7Ozs7QUFLdEIsUUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Ozs7O0FBS2xCLFFBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDOzs7OztBQUtuQixRQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQzs7Ozs7QUFLbEIsUUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsUUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7R0FDbkI7O2VBMUJHLE9BQU87O1dBNEJILG9CQUFHOztBQUVULFVBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0FBQ3pCLFVBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDOztBQUV4QixvQ0FBTyxJQUFJLEVBQUUsQ0FBQztBQUNkLDJDQUFjLElBQUksRUFBRSxDQUFDO0FBQ3JCLDJDQUFjLElBQUksRUFBRSxDQUFDO0FBQ3JCLHNDQUFTLElBQUksRUFBRSxDQUFDO0FBQ2hCLHVDQUFVLElBQUksRUFBRSxDQUFDO0FBQ2pCLG9DQUFPLElBQUksRUFBRSxDQUFDO0FBQ2Qs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bWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgU2VydmVyIGZyb20gJy4vYXRvbS10ZXJuanMtc2VydmVyJztcbmltcG9ydCBDbGllbnQgZnJvbSAnLi9hdG9tLXRlcm5qcy1jbGllbnQnO1xuaW1wb3J0IGVtaXR0ZXIgZnJvbSAnLi9hdG9tLXRlcm5qcy1ldmVudHMnO1xuaW1wb3J0IGRvY3VtZW50YXRpb24gZnJvbSAnLi9hdG9tLXRlcm5qcy1kb2N1bWVudGF0aW9uJztcbmltcG9ydCByZWZlcmVuY2UgZnJvbSAnLi9hdG9tLXRlcm5qcy1yZWZlcmVuY2UnO1xuaW1wb3J0IHBhY2thZ2VDb25maWcgZnJvbSAnLi9hdG9tLXRlcm5qcy1wYWNrYWdlLWNvbmZpZyc7XG5pbXBvcnQgdHlwZSBmcm9tICcuL2F0b20tdGVybmpzLXR5cGUnO1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuL2F0b20tdGVybmpzLWNvbmZpZyc7XG5pbXBvcnQge1xuICBpc0RpcmVjdG9yeSxcbiAgaXNWYWxpZEVkaXRvcixcbiAgZGlzcG9zZUFsbFxufSBmcm9tICcuL2F0b20tdGVybmpzLWhlbHBlcic7XG5pbXBvcnQgcHJvdmlkZXIgZnJvbSAnLi9hdG9tLXRlcm5qcy1wcm92aWRlcic7XG5pbXBvcnQgcmVuYW1lIGZyb20gJy4vYXRvbS10ZXJuanMtcmVuYW1lJztcbmltcG9ydCBuYXZpZ2F0aW9uIGZyb20gJy4vc2VydmljZXMvbmF2aWdhdGlvbic7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuY2xhc3MgTWFuYWdlciB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gW107XG4gICAgLyoqXG4gICAgICogY29sbGVjdGlvbiBvZiBhbGwgYWN0aXZlIGNsaWVudHNcbiAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICovXG4gICAgdGhpcy5jbGllbnRzID0gW107XG4gICAgLyoqXG4gICAgICogcmVmZXJlbmNlIHRvIHRoZSBjbGllbnQgZm9yIHRoZSBhY3RpdmUgdGV4dC1lZGl0b3JcbiAgICAgKiBAdHlwZSB7Q2xpZW50fVxuICAgICAqL1xuICAgIHRoaXMuY2xpZW50ID0gbnVsbDtcbiAgICAvKipcbiAgICAgKiBjb2xsZWN0aW9uIG9mIGFsbCBhY3RpdmUgc2VydmVyc1xuICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgKi9cbiAgICB0aGlzLnNlcnZlcnMgPSBbXTtcbiAgICAvKipcbiAgICAgKiByZWZlcmVuY2UgdG8gdGhlIHNlcnZlciBmb3IgdGhlIGFjdGl2ZSB0ZXh0LWVkaXRvclxuICAgICAqIEB0eXBlIHtTZXJ2ZXJ9XG4gICAgICovXG4gICAgdGhpcy5zZXJ2ZXIgPSBudWxsO1xuICAgIHRoaXMuZWRpdG9ycyA9IFtdO1xuICB9XG5cbiAgYWN0aXZhdGUoKSB7XG5cbiAgICB0aGlzLnJlZ2lzdGVyTGlzdGVuZXJzKCk7XG4gICAgdGhpcy5yZWdpc3RlckNvbW1hbmRzKCk7XG5cbiAgICBjb25maWcuaW5pdCgpO1xuICAgIGRvY3VtZW50YXRpb24uaW5pdCgpO1xuICAgIHBhY2thZ2VDb25maWcuaW5pdCgpO1xuICAgIHByb3ZpZGVyLmluaXQoKTtcbiAgICByZWZlcmVuY2UuaW5pdCgpO1xuICAgIHJlbmFtZS5pbml0KCk7XG4gICAgdHlwZS5pbml0KCk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuXG4gICAgZGlzcG9zZUFsbCh0aGlzLmRpc3Bvc2FibGVzKTtcbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gW107XG4gICAgdGhpcy5lZGl0b3JzLmZvckVhY2goZWRpdG9yID0+IGRpc3Bvc2VBbGwoZWRpdG9yLmRpc3Bvc2FibGVzKSk7XG4gICAgdGhpcy5lZGl0b3JzID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHNlcnZlciBvZiB0aGlzLnNlcnZlcnMpIHtcblxuICAgICAgc2VydmVyLmRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICB0aGlzLnNlcnZlcnMgPSBbXTtcbiAgICB0aGlzLmNsaWVudHMgPSBbXTtcblxuICAgIHRoaXMuc2VydmVyID0gbnVsbDtcbiAgICB0aGlzLmNsaWVudCA9IG51bGw7XG5cbiAgICBkb2N1bWVudGF0aW9uICYmIGRvY3VtZW50YXRpb24uZGVzdHJveSgpO1xuICAgIHJlZmVyZW5jZSAmJiByZWZlcmVuY2UuZGVzdHJveSgpO1xuICAgIHR5cGUgJiYgdHlwZS5kZXN0cm95KCk7XG4gICAgcGFja2FnZUNvbmZpZyAmJiBwYWNrYWdlQ29uZmlnLmRlc3Ryb3koKTtcbiAgICByZW5hbWUgJiYgcmVuYW1lLmRlc3Ryb3koKTtcbiAgICBjb25maWcgJiYgY29uZmlnLmRlc3Ryb3koKTtcbiAgICBwcm92aWRlciAmJiBwcm92aWRlci5kZXN0cm95KCk7XG4gICAgbmF2aWdhdGlvbi5yZXNldCgpO1xuICB9XG5cbiAgc3RhcnRTZXJ2ZXIocHJvamVjdERpcikge1xuXG4gICAgaWYgKCFpc0RpcmVjdG9yeShwcm9qZWN0RGlyKSkge1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZ2V0U2VydmVyRm9yUHJvamVjdChwcm9qZWN0RGlyKSkge1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBjbGllbnQgPSBuZXcgQ2xpZW50KHByb2plY3REaXIpO1xuICAgIHRoaXMuY2xpZW50cy5wdXNoKGNsaWVudCk7XG5cbiAgICB0aGlzLnNlcnZlcnMucHVzaChuZXcgU2VydmVyKHByb2plY3REaXIsIGNsaWVudCkpO1xuXG4gICAgdGhpcy5zZXRBY3RpdmVTZXJ2ZXJBbmRDbGllbnQocHJvamVjdERpcik7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHNldEFjdGl2ZVNlcnZlckFuZENsaWVudCh1UkkpIHtcblxuICAgIHRoaXMuc2VydmVyID0gdGhpcy5nZXRTZXJ2ZXJGb3JQcm9qZWN0KHVSSSk7XG4gICAgdGhpcy5jbGllbnQgPSB0aGlzLmdldENsaWVudEZvclByb2plY3QodVJJKTtcbiAgfVxuXG4gIGRlc3Ryb3lDbGllbnQocHJvamVjdERpcikge1xuXG4gICAgY29uc3QgY2xpZW50cyA9IHRoaXMuY2xpZW50cy5zbGljZSgpO1xuXG4gICAgY2xpZW50cy5mb3JFYWNoKChjbGllbnQsIGkpID0+IHtcblxuICAgICAgaWYgKGNsaWVudC5wcm9qZWN0RGlyID09PSBwcm9qZWN0RGlyKSB7XG5cbiAgICAgICAgdGhpcy5jbGllbnRzLnNwbGljZShpLCAxKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGRlc3Ryb3lTZXJ2ZXIocHJvamVjdERpcikge1xuXG4gICAgY29uc3Qgc2VydmVycyA9IHRoaXMuc2VydmVycy5zbGljZSgpO1xuXG4gICAgc2VydmVycy5mb3JFYWNoKChzZXJ2ZXIsIGkpID0+IHtcblxuICAgICAgaWYgKHNlcnZlci5wcm9qZWN0RGlyID09PSBwcm9qZWN0RGlyKSB7XG5cbiAgICAgICAgc2VydmVyLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgdGhpcy5kZXN0cm95Q2xpZW50KHByb2plY3REaXIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZGVzdHJveVVudXNlZFNlcnZlcnMoKSB7XG5cbiAgICBjb25zdCBwcm9qZWN0RGlycyA9IHRoaXMuZWRpdG9ycy5tYXAoZWRpdG9yID0+IGVkaXRvci5wcm9qZWN0RGlyKTtcbiAgICBjb25zdCBzZXJ2ZXJzID0gdGhpcy5zZXJ2ZXJzLnNsaWNlKCk7XG5cbiAgICBzZXJ2ZXJzLmZvckVhY2goc2VydmVyID0+IHtcblxuICAgICAgaWYgKCFwcm9qZWN0RGlycy5pbmNsdWRlcyhzZXJ2ZXIucHJvamVjdERpcikpIHtcblxuICAgICAgICB0aGlzLmRlc3Ryb3lTZXJ2ZXIoc2VydmVyLnByb2plY3REaXIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0U2VydmVyRm9yUHJvamVjdChwcm9qZWN0RGlyKSB7XG5cbiAgICByZXR1cm4gdGhpcy5zZXJ2ZXJzLmZpbHRlcihzZXJ2ZXIgPT4gc2VydmVyLnByb2plY3REaXIgPT09IHByb2plY3REaXIpLnBvcCgpO1xuICB9XG5cbiAgZ2V0Q2xpZW50Rm9yUHJvamVjdChwcm9qZWN0RGlyKSB7XG5cbiAgICByZXR1cm4gdGhpcy5jbGllbnRzLmZpbHRlcihjbGllbnQgPT4gY2xpZW50LnByb2plY3REaXIgPT09IHByb2plY3REaXIpLnBvcCgpO1xuICB9XG5cbiAgZ2V0RWRpdG9yKGlkKSB7XG5cbiAgICByZXR1cm4gdGhpcy5lZGl0b3JzLmZpbHRlcihlZGl0b3IgPT4gZWRpdG9yLmlkID09PSBpZCkucG9wKCk7XG4gIH1cblxuICBkZXN0cm95RWRpdG9yKGlkKSB7XG5cbiAgICBjb25zdCBlZGl0b3JzID0gdGhpcy5lZGl0b3JzLnNsaWNlKCk7XG5cbiAgICBlZGl0b3JzLmZvckVhY2goKGVkaXRvciwgaSkgPT4ge1xuXG4gICAgICBpZiAoZWRpdG9yLmlkID09PSBpZCkge1xuXG4gICAgICAgIGRpc3Bvc2VBbGwoZWRpdG9yLmRpc3Bvc2FibGVzKTtcbiAgICAgICAgdGhpcy5lZGl0b3JzLnNwbGljZShpLCAxKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGdldFByb2plY3REaXIodVJJKSB7XG5cbiAgICBjb25zdCBbcHJvamVjdCwgZmlsZV0gPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgodVJJKTtcblxuICAgIGlmIChwcm9qZWN0KSB7XG5cbiAgICAgIHJldHVybiBwcm9qZWN0O1xuICAgIH1cblxuICAgIGlmIChmaWxlKSB7XG5cbiAgICAgIGNvbnN0IGFic29sdXRlUGF0aCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIGZpbGUpO1xuXG4gICAgICByZXR1cm4gcGF0aC5kaXJuYW1lKGFic29sdXRlUGF0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHJlZ2lzdGVyTGlzdGVuZXJzKCkge1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5wdXNoKGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygoZWRpdG9yKSA9PiB7XG5cbiAgICAgIGlmICghaXNWYWxpZEVkaXRvcihlZGl0b3IpKSB7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB1UkkgPSBlZGl0b3IuZ2V0VVJJKCk7XG4gICAgICBjb25zdCBwcm9qZWN0RGlyID0gdGhpcy5nZXRQcm9qZWN0RGlyKHVSSSk7XG4gICAgICBjb25zdCBzZXJ2ZXJDcmVhdGVkT3JQcmVzZW50ID0gdGhpcy5zdGFydFNlcnZlcihwcm9qZWN0RGlyKTtcblxuICAgICAgaWYgKCFzZXJ2ZXJDcmVhdGVkT3JQcmVzZW50KSB7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpZCA9IGVkaXRvci5pZDtcbiAgICAgIGNvbnN0IGRpc3Bvc2FibGVzID0gW107XG5cbiAgICAgIC8vIFJlZ2lzdGVyIHZhbGlkIGVkaXRvclxuICAgICAgdGhpcy5lZGl0b3JzLnB1c2goe1xuXG4gICAgICAgIGlkLFxuICAgICAgICBwcm9qZWN0RGlyLFxuICAgICAgICBkaXNwb3NhYmxlc1xuICAgICAgfSk7XG5cbiAgICAgIGRpc3Bvc2FibGVzLnB1c2goZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG5cbiAgICAgICAgdGhpcy5kZXN0cm95RWRpdG9yKGlkKTtcbiAgICAgICAgdGhpcy5kZXN0cm95VW51c2VkU2VydmVycygpO1xuICAgICAgfSkpO1xuXG4gICAgICBkaXNwb3NhYmxlcy5wdXNoKGVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKChlKSA9PiB7XG5cbiAgICAgICAgaWYgKHBhY2thZ2VDb25maWcub3B0aW9ucy5pbmxpbmVGbkNvbXBsZXRpb24pIHtcblxuICAgICAgICAgIHRoaXMuY2xpZW50ICYmIHR5cGUucXVlcnlUeXBlKGVkaXRvciwgZSk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcblxuICAgICAgZGlzcG9zYWJsZXMucHVzaChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTYXZlKChlKSA9PiB7XG5cbiAgICAgICAgdGhpcy5jbGllbnQgJiYgdGhpcy5jbGllbnQudXBkYXRlKGVkaXRvcik7XG4gICAgICB9KSk7XG4gICAgfSkpO1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5wdXNoKGF0b20ud29ya3NwYWNlLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW0oKGl0ZW0pID0+IHtcblxuICAgICAgZW1pdHRlci5lbWl0KCd0eXBlLWRlc3Ryb3ktb3ZlcmxheScpO1xuICAgICAgZW1pdHRlci5lbWl0KCdkb2N1bWVudGF0aW9uLWRlc3Ryb3ktb3ZlcmxheScpO1xuICAgICAgZW1pdHRlci5lbWl0KCdyZW5hbWUtaGlkZScpO1xuXG4gICAgICBpZiAoIWlzVmFsaWRFZGl0b3IoaXRlbSkpIHtcblxuICAgICAgICBlbWl0dGVyLmVtaXQoJ3JlZmVyZW5jZS1oaWRlJyk7XG5cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgY29uc3QgdVJJID0gaXRlbS5nZXRVUkkoKTtcbiAgICAgICAgY29uc3QgcHJvamVjdERpciA9IHRoaXMuZ2V0UHJvamVjdERpcih1UkkpO1xuXG4gICAgICAgIHRoaXMuc2V0QWN0aXZlU2VydmVyQW5kQ2xpZW50KHByb2plY3REaXIpO1xuICAgICAgfVxuICAgIH0pKTtcbiAgfVxuXG4gIHJlZ2lzdGVyQ29tbWFuZHMoKSB7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLnB1c2goYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3InLCAnY29yZTpjYW5jZWwnLCAoZSkgPT4ge1xuXG4gICAgICBlbWl0dGVyLmVtaXQoJ3R5cGUtZGVzdHJveS1vdmVybGF5Jyk7XG4gICAgICBlbWl0dGVyLmVtaXQoJ2RvY3VtZW50YXRpb24tZGVzdHJveS1vdmVybGF5Jyk7XG4gICAgICBlbWl0dGVyLmVtaXQoJ3JlZmVyZW5jZS1oaWRlJyk7XG4gICAgICBlbWl0dGVyLmVtaXQoJ3JlbmFtZS1oaWRlJyk7XG4gICAgfSkpO1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5wdXNoKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywgJ2F0b20tdGVybmpzOmxpc3RGaWxlcycsIChlKSA9PiB7XG5cbiAgICAgIGlmICh0aGlzLmNsaWVudCkge1xuXG4gICAgICAgIHRoaXMuY2xpZW50LmZpbGVzKCkudGhlbigoZGF0YSkgPT4ge1xuXG4gICAgICAgICAgY29uc29sZS5kaXIoZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMucHVzaChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcicsICdhdG9tLXRlcm5qczpmbHVzaCcsIChlKSA9PiB7XG5cbiAgICAgIHRoaXMuc2VydmVyICYmIHRoaXMuc2VydmVyLmZsdXNoKCk7XG4gICAgfSkpO1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5wdXNoKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywgJ2F0b20tdGVybmpzOm5hdmlnYXRlQmFjaycsIChlKSA9PiB7XG5cbiAgICAgIG5hdmlnYXRpb24uZ29UbygtMSk7XG4gICAgfSkpO1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5wdXNoKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywgJ2F0b20tdGVybmpzOm5hdmlnYXRlRm9yd2FyZCcsIChlKSA9PiB7XG5cbiAgICAgIG5hdmlnYXRpb24uZ29UbygxKTtcbiAgICB9KSk7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLnB1c2goYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3InLCAnYXRvbS10ZXJuanM6ZGVmaW5pdGlvbicsIChlKSA9PiB7XG5cbiAgICAgIHRoaXMuY2xpZW50ICYmIHRoaXMuY2xpZW50LmRlZmluaXRpb24oKTtcbiAgICB9KSk7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLnB1c2goYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ2F0b20tdGVybmpzOnJlc3RhcnQnLCAoZSkgPT4ge1xuXG4gICAgICB0aGlzLnNlcnZlciAmJiB0aGlzLnNlcnZlci5yZXN0YXJ0KCk7XG4gICAgfSkpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBNYW5hZ2VyKCk7XG4iXX0=