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

          // do only query the type if this is the last cursor
          if (!e.cursor || !e.cursor.isLastCursor()) {

            return;
          }

          if (_atomTernjsPackageConfig2['default'].options.inlineFnCompletion) {

            _this5.client && _atomTernjsType2['default'].queryType(editor, e);
          }
        }));

        disposables.push(editor.getBuffer().onDidSave(function (e) {

          _this5.client && _this5.client.update(editor);
        }));

        if (atom.config.get('atom-ternjs.debug')) {

          console.log('observing: ' + uRI);
        }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2F0b20tdGVybmpzLW1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O2dDQUVtQixzQkFBc0I7Ozs7Z0NBQ3RCLHNCQUFzQjs7OztnQ0FDckIsc0JBQXNCOzs7O3VDQUNoQiw2QkFBNkI7Ozs7bUNBQ2pDLHlCQUF5Qjs7Ozt1Q0FDckIsOEJBQThCOzs7OzhCQUN2QyxvQkFBb0I7Ozs7Z0NBQ2xCLHNCQUFzQjs7OztnQ0FLbEMsc0JBQXNCOztrQ0FDUix3QkFBd0I7Ozs7Z0NBQzFCLHNCQUFzQjs7OztrQ0FDbEIsdUJBQXVCOzs7O29CQUM3QixNQUFNOzs7O0FBbEJ2QixXQUFXLENBQUM7O0lBb0JOLE9BQU87QUFFQSxXQUZQLE9BQU8sR0FFRzswQkFGVixPQUFPOztBQUlULFFBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDOzs7OztBQUt0QixRQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQzs7Ozs7QUFLbEIsUUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7Ozs7O0FBS25CLFFBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDOzs7OztBQUtsQixRQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztBQUNuQixRQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztHQUNuQjs7ZUExQkcsT0FBTzs7V0E0Qkgsb0JBQUc7O0FBRVQsVUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7QUFDekIsVUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7O0FBRXhCLG9DQUFPLElBQUksRUFBRSxDQUFDO0FBQ2QsMkNBQWMsSUFBSSxFQUFFLENBQUM7QUFDckIsMkNBQWMsSUFBSSxFQUFFLENBQUM7QUFDckIsc0NBQVMsSUFBSSxFQUFFLENBQUM7QUFDaEIsdUNBQVUsSUFBSSxFQUFFLENBQUM7QUFDakIsb0NBQU8sSUFBSSxFQUFFLENB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RUFBRSxxQkFBcUIsRUFBRSxVQUFDLENBQUMsRUFBSzs7QUFFdEYsZUFBSyxNQUFNLElBQUksT0FBSyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDdEMsQ0FBQyxDQUFDLENBQUM7S0FDTDs7O1NBelRHLE9BQU87OztxQkE0VEUsSUFBSSxPQUFPLEVBQUUiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9hdG9tLXRlcm5qcy9saWIvYXRvbS10ZXJuanMtbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgU2VydmVyIGZyb20gJy4vYXRvbS10ZXJuanMtc2VydmVyJztcbmltcG9ydCBDbGllbnQgZnJvbSAnLi9hdG9tLXRlcm5qcy1jbGllbnQnO1xuaW1wb3J0IGVtaXR0ZXIgZnJvbSAnLi9hdG9tLXRlcm5qcy1ldmVudHMnO1xuaW1wb3J0IGRvY3VtZW50YXRpb24gZnJvbSAnLi9hdG9tLXRlcm5qcy1kb2N1bWVudGF0aW9uJztcbmltcG9ydCByZWZlcmVuY2UgZnJvbSAnLi9hdG9tLXRlcm5qcy1yZWZlcmVuY2UnO1xuaW1wb3J0IHBhY2thZ2VDb25maWcgZnJvbSAnLi9hdG9tLXRlcm5qcy1wYWNrYWdlLWNvbmZpZyc7XG5pbXBvcnQgdHlwZSBmcm9tICcuL2F0b20tdGVybmpzLXR5cGUnO1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuL2F0b20tdGVybmpzLWNvbmZpZyc7XG5pbXBvcnQge1xuICBpc0RpcmVjdG9yeSxcbiAgaXNWYWxpZEVkaXRvcixcbiAgZGlzcG9zZUFsbFxufSBmcm9tICcuL2F0b20tdGVybmpzLWhlbHBlcic7XG5pbXBvcnQgcHJvdmlkZXIgZnJvbSAnLi9hdG9tLXRlcm5qcy1wcm92aWRlcic7XG5pbXBvcnQgcmVuYW1lIGZyb20gJy4vYXRvbS10ZXJuanMtcmVuYW1lJztcbmltcG9ydCBuYXZpZ2F0aW9uIGZyb20gJy4vc2VydmljZXMvbmF2aWdhdGlvbic7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuY2xhc3MgTWFuYWdlciB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gW107XG4gICAgLyoqXG4gICAgICogY29sbGVjdGlvbiBvZiBhbGwgYWN0aXZlIGNsaWVudHNcbiAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICovXG4gICAgdGhpcy5jbGllbnRzID0gW107XG4gICAgLyoqXG4gICAgICogcmVmZXJlbmNlIHRvIHRoZSBjbGllbnQgZm9yIHRoZSBhY3RpdmUgdGV4dC1lZGl0b3JcbiAgICAgKiBAdHlwZSB7Q2xpZW50fVxuICAgICAqL1xuICAgIHRoaXMuY2xpZW50ID0gbnVsbDtcbiAgICAvKipcbiAgICAgKiBjb2xsZWN0aW9uIG9mIGFsbCBhY3RpdmUgc2VydmVyc1xuICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgKi9cbiAgICB0aGlzLnNlcnZlcnMgPSBbXTtcbiAgICAvKipcbiAgICAgKiByZWZlcmVuY2UgdG8gdGhlIHNlcnZlciBmb3IgdGhlIGFjdGl2ZSB0ZXh0LWVkaXRvclxuICAgICAqIEB0eXBlIHtTZXJ2ZXJ9XG4gICAgICovXG4gICAgdGhpcy5zZXJ2ZXIgPSBudWxsO1xuICAgIHRoaXMuZWRpdG9ycyA9IFtdO1xuICB9XG5cbiAgYWN0aXZhdGUoKSB7XG5cbiAgICB0aGlzLnJlZ2lzdGVyTGlzdGVuZXJzKCk7XG4gICAgdGhpcy5yZWdpc3RlckNvbW1hbmRzKCk7XG5cbiAgICBjb25maWcuaW5pdCgpO1xuICAgIGRvY3VtZW50YXRpb24uaW5pdCgpO1xuICAgIHBhY2thZ2VDb25maWcuaW5pdCgpO1xuICAgIHByb3ZpZGVyLmluaXQoKTtcbiAgICByZWZlcmVuY2UuaW5pdCgpO1xuICAgIHJlbmFtZS5pbml0KCk7XG4gICAgdHlwZS5pbml0KCk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuXG4gICAgZGlzcG9zZUFsbCh0aGlzLmRpc3Bvc2FibGVzKTtcbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gW107XG4gICAgdGhpcy5lZGl0b3JzLmZvckVhY2goZWRpdG9yID0+IGRpc3Bvc2VBbGwoZWRpdG9yLmRpc3Bvc2FibGVzKSk7XG4gICAgdGhpcy5lZGl0b3JzID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHNlcnZlciBvZiB0aGlzLnNlcnZlcnMpIHtcblxuICAgICAgc2VydmVyLmRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICB0aGlzLnNlcnZlcnMgPSBbXTtcbiAgICB0aGlzLmNsaWVudHMgPSBbXTtcblxuICAgIHRoaXMuc2VydmVyID0gbnVsbDtcbiAgICB0aGlzLmNsaWVudCA9IG51bGw7XG5cbiAgICBkb2N1bWVudGF0aW9uICYmIGRvY3VtZW50YXRpb24uZGVzdHJveSgpO1xuICAgIHJlZmVyZW5jZSAmJiByZWZlcmVuY2UuZGVzdHJveSgpO1xuICAgIHR5cGUgJiYgdHlwZS5kZXN0cm95KCk7XG4gICAgcGFja2FnZUNvbmZpZyAmJiBwYWNrYWdlQ29uZmlnLmRlc3Ryb3koKTtcbiAgICByZW5hbWUgJiYgcmVuYW1lLmRlc3Ryb3koKTtcbiAgICBjb25maWcgJiYgY29uZmlnLmRlc3Ryb3koKTtcbiAgICBwcm92aWRlciAmJiBwcm92aWRlci5kZXN0cm95KCk7XG4gICAgbmF2aWdhdGlvbi5yZXNldCgpO1xuICB9XG5cbiAgc3RhcnRTZXJ2ZXIocHJvamVjdERpcikge1xuXG4gICAgaWYgKCFpc0RpcmVjdG9yeShwcm9qZWN0RGlyKSkge1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZ2V0U2VydmVyRm9yUHJvamVjdChwcm9qZWN0RGlyKSkge1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBjbGllbnQgPSBuZXcgQ2xpZW50KHByb2plY3REaXIpO1xuICAgIHRoaXMuY2xpZW50cy5wdXNoKGNsaWVudCk7XG5cbiAgICB0aGlzLnNlcnZlcnMucHVzaChuZXcgU2VydmVyKHByb2plY3REaXIsIGNsaWVudCkpO1xuXG4gICAgdGhpcy5zZXRBY3RpdmVTZXJ2ZXJBbmRDbGllbnQocHJvamVjdERpcik7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHNldEFjdGl2ZVNlcnZlckFuZENsaWVudCh1UkkpIHtcblxuICAgIHRoaXMuc2VydmVyID0gdGhpcy5nZXRTZXJ2ZXJGb3JQcm9qZWN0KHVSSSk7XG4gICAgdGhpcy5jbGllbnQgPSB0aGlzLmdldENsaWVudEZvclByb2plY3QodVJJKTtcbiAgfVxuXG4gIGRlc3Ryb3lDbGllbnQocHJvamVjdERpcikge1xuXG4gICAgY29uc3QgY2xpZW50cyA9IHRoaXMuY2xpZW50cy5zbGljZSgpO1xuXG4gICAgY2xpZW50cy5mb3JFYWNoKChjbGllbnQsIGkpID0+IHtcblxuICAgICAgaWYgKGNsaWVudC5wcm9qZWN0RGlyID09PSBwcm9qZWN0RGlyKSB7XG5cbiAgICAgICAgdGhpcy5jbGllbnRzLnNwbGljZShpLCAxKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGRlc3Ryb3lTZXJ2ZXIocHJvamVjdERpcikge1xuXG4gICAgY29uc3Qgc2VydmVycyA9IHRoaXMuc2VydmVycy5zbGljZSgpO1xuXG4gICAgc2VydmVycy5mb3JFYWNoKChzZXJ2ZXIsIGkpID0+IHtcblxuICAgICAgaWYgKHNlcnZlci5wcm9qZWN0RGlyID09PSBwcm9qZWN0RGlyKSB7XG5cbiAgICAgICAgc2VydmVyLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgdGhpcy5kZXN0cm95Q2xpZW50KHByb2plY3REaXIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZGVzdHJveVVudXNlZFNlcnZlcnMoKSB7XG5cbiAgICBjb25zdCBwcm9qZWN0RGlycyA9IHRoaXMuZWRpdG9ycy5tYXAoZWRpdG9yID0+IGVkaXRvci5wcm9qZWN0RGlyKTtcbiAgICBjb25zdCBzZXJ2ZXJzID0gdGhpcy5zZXJ2ZXJzLnNsaWNlKCk7XG5cbiAgICBzZXJ2ZXJzLmZvckVhY2goc2VydmVyID0+IHtcblxuICAgICAgaWYgKCFwcm9qZWN0RGlycy5pbmNsdWRlcyhzZXJ2ZXIucHJvamVjdERpcikpIHtcblxuICAgICAgICB0aGlzLmRlc3Ryb3lTZXJ2ZXIoc2VydmVyLnByb2plY3REaXIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0U2VydmVyRm9yUHJvamVjdChwcm9qZWN0RGlyKSB7XG5cbiAgICByZXR1cm4gdGhpcy5zZXJ2ZXJzLmZpbHRlcihzZXJ2ZXIgPT4gc2VydmVyLnByb2plY3REaXIgPT09IHByb2plY3REaXIpLnBvcCgpO1xuICB9XG5cbiAgZ2V0Q2xpZW50Rm9yUHJvamVjdChwcm9qZWN0RGlyKSB7XG5cbiAgICByZXR1cm4gdGhpcy5jbGllbnRzLmZpbHRlcihjbGllbnQgPT4gY2xpZW50LnByb2plY3REaXIgPT09IHByb2plY3REaXIpLnBvcCgpO1xuICB9XG5cbiAgZ2V0RWRpdG9yKGlkKSB7XG5cbiAgICByZXR1cm4gdGhpcy5lZGl0b3JzLmZpbHRlcihlZGl0b3IgPT4gZWRpdG9yLmlkID09PSBpZCkucG9wKCk7XG4gIH1cblxuICBkZXN0cm95RWRpdG9yKGlkKSB7XG5cbiAgICBjb25zdCBlZGl0b3JzID0gdGhpcy5lZGl0b3JzLnNsaWNlKCk7XG5cbiAgICBlZGl0b3JzLmZvckVhY2goKGVkaXRvciwgaSkgPT4ge1xuXG4gICAgICBpZiAoZWRpdG9yLmlkID09PSBpZCkge1xuXG4gICAgICAgIGRpc3Bvc2VBbGwoZWRpdG9yLmRpc3Bvc2FibGVzKTtcbiAgICAgICAgdGhpcy5lZGl0b3JzLnNwbGljZShpLCAxKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGdldFByb2plY3REaXIodVJJKSB7XG5cbiAgICBjb25zdCBbcHJvamVjdCwgZmlsZV0gPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgodVJJKTtcblxuICAgIGlmIChwcm9qZWN0KSB7XG5cbiAgICAgIHJldHVybiBwcm9qZWN0O1xuICAgIH1cblxuICAgIGlmIChmaWxlKSB7XG5cbiAgICAgIGNvbnN0IGFic29sdXRlUGF0aCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIGZpbGUpO1xuXG4gICAgICByZXR1cm4gcGF0aC5kaXJuYW1lKGFic29sdXRlUGF0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHJlZ2lzdGVyTGlzdGVuZXJzKCkge1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5wdXNoKGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygoZWRpdG9yKSA9PiB7XG5cbiAgICAgIGlmICghaXNWYWxpZEVkaXRvcihlZGl0b3IpKSB7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB1UkkgPSBlZGl0b3IuZ2V0VVJJKCk7XG4gICAgICBjb25zdCBwcm9qZWN0RGlyID0gdGhpcy5nZXRQcm9qZWN0RGlyKHVSSSk7XG4gICAgICBjb25zdCBzZXJ2ZXJDcmVhdGVkT3JQcmVzZW50ID0gdGhpcy5zdGFydFNlcnZlcihwcm9qZWN0RGlyKTtcblxuICAgICAgaWYgKCFzZXJ2ZXJDcmVhdGVkT3JQcmVzZW50KSB7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpZCA9IGVkaXRvci5pZDtcbiAgICAgIGNvbnN0IGRpc3Bvc2FibGVzID0gW107XG5cbiAgICAgIC8vIFJlZ2lzdGVyIHZhbGlkIGVkaXRvclxuICAgICAgdGhpcy5lZGl0b3JzLnB1c2goe1xuXG4gICAgICAgIGlkLFxuICAgICAgICBwcm9qZWN0RGlyLFxuICAgICAgICBkaXNwb3NhYmxlc1xuICAgICAgfSk7XG5cbiAgICAgIGRpc3Bvc2FibGVzLnB1c2goZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG5cbiAgICAgICAgdGhpcy5kZXN0cm95RWRpdG9yKGlkKTtcbiAgICAgICAgdGhpcy5kZXN0cm95VW51c2VkU2VydmVycygpO1xuICAgICAgfSkpO1xuXG4gICAgICBkaXNwb3NhYmxlcy5wdXNoKGVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKChlKSA9PiB7XG5cbiAgICAgICAgLy8gZG8gb25seSBxdWVyeSB0aGUgdHlwZSBpZiB0aGlzIGlzIHRoZSBsYXN0IGN1cnNvclxuICAgICAgICBpZiAoIWUuY3Vyc29yIHx8ICFlLmN1cnNvci5pc0xhc3RDdXJzb3IoKSkge1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhY2thZ2VDb25maWcub3B0aW9ucy5pbmxpbmVGbkNvbXBsZXRpb24pIHtcblxuICAgICAgICAgIHRoaXMuY2xpZW50ICYmIHR5cGUucXVlcnlUeXBlKGVkaXRvciwgZSk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcblxuICAgICAgZGlzcG9zYWJsZXMucHVzaChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTYXZlKChlKSA9PiB7XG5cbiAgICAgICAgdGhpcy5jbGllbnQgJiYgdGhpcy5jbGllbnQudXBkYXRlKGVkaXRvcik7XG4gICAgICB9KSk7XG5cbiAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2F0b20tdGVybmpzLmRlYnVnJykpIHtcblxuICAgICAgICBjb25zb2xlLmxvZyhgb2JzZXJ2aW5nOiAke3VSSX1gKTtcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLnB1c2goYXRvbS53b3Jrc3BhY2Uub25EaWRDaGFuZ2VBY3RpdmVQYW5lSXRlbSgoaXRlbSkgPT4ge1xuXG4gICAgICBlbWl0dGVyLmVtaXQoJ3R5cGUtZGVzdHJveS1vdmVybGF5Jyk7XG4gICAgICBlbWl0dGVyLmVtaXQoJ2RvY3VtZW50YXRpb24tZGVzdHJveS1vdmVybGF5Jyk7XG4gICAgICBlbWl0dGVyLmVtaXQoJ3JlbmFtZS1oaWRlJyk7XG5cbiAgICAgIGlmICghaXNWYWxpZEVkaXRvcihpdGVtKSkge1xuXG4gICAgICAgIGVtaXR0ZXIuZW1pdCgncmVmZXJlbmNlLWhpZGUnKTtcblxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICBjb25zdCB1UkkgPSBpdGVtLmdldFVSSSgpO1xuICAgICAgICBjb25zdCBwcm9qZWN0RGlyID0gdGhpcy5nZXRQcm9qZWN0RGlyKHVSSSk7XG5cbiAgICAgICAgdGhpcy5zZXRBY3RpdmVTZXJ2ZXJBbmRDbGllbnQocHJvamVjdERpcik7XG4gICAgICB9XG4gICAgfSkpO1xuICB9XG5cbiAgcmVnaXN0ZXJDb21tYW5kcygpIHtcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMucHVzaChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcicsICdjb3JlOmNhbmNlbCcsIChlKSA9PiB7XG5cbiAgICAgIGVtaXR0ZXIuZW1pdCgndHlwZS1kZXN0cm95LW92ZXJsYXknKTtcbiAgICAgIGVtaXR0ZXIuZW1pdCgnZG9jdW1lbnRhdGlvbi1kZXN0cm95LW92ZXJsYXknKTtcbiAgICAgIGVtaXR0ZXIuZW1pdCgncmVmZXJlbmNlLWhpZGUnKTtcbiAgICAgIGVtaXR0ZXIuZW1pdCgncmVuYW1lLWhpZGUnKTtcbiAgICB9KSk7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLnB1c2goYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3InLCAnYXRvbS10ZXJuanM6bGlzdEZpbGVzJywgKGUpID0+IHtcblxuICAgICAgaWYgKHRoaXMuY2xpZW50KSB7XG5cbiAgICAgICAgdGhpcy5jbGllbnQuZmlsZXMoKS50aGVuKChkYXRhKSA9PiB7XG5cbiAgICAgICAgICBjb25zb2xlLmRpcihkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5wdXNoKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywgJ2F0b20tdGVybmpzOmZsdXNoJywgKGUpID0+IHtcblxuICAgICAgdGhpcy5zZXJ2ZXIgJiYgdGhpcy5zZXJ2ZXIuZmx1c2goKTtcbiAgICB9KSk7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLnB1c2goYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3InLCAnYXRvbS10ZXJuanM6bmF2aWdhdGVCYWNrJywgKGUpID0+IHtcblxuICAgICAgbmF2aWdhdGlvbi5nb1RvKC0xKTtcbiAgICB9KSk7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLnB1c2goYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3InLCAnYXRvbS10ZXJuanM6bmF2aWdhdGVGb3J3YXJkJywgKGUpID0+IHtcblxuICAgICAgbmF2aWdhdGlvbi5nb1RvKDEpO1xuICAgIH0pKTtcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMucHVzaChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcicsICdhdG9tLXRlcm5qczpkZWZpbml0aW9uJywgKGUpID0+IHtcblxuICAgICAgdGhpcy5jbGllbnQgJiYgdGhpcy5jbGllbnQuZGVmaW5pdGlvbigpO1xuICAgIH0pKTtcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMucHVzaChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnYXRvbS10ZXJuanM6cmVzdGFydCcsIChlKSA9PiB7XG5cbiAgICAgIHRoaXMuc2VydmVyICYmIHRoaXMuc2VydmVyLnJlc3RhcnQoKTtcbiAgICB9KSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IE1hbmFnZXIoKTtcbiJdfQ==