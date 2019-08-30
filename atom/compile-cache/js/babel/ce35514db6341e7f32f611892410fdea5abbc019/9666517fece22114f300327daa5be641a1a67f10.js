Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atomTernjsManager = require('./atom-ternjs-manager');

var _atomTernjsManager2 = _interopRequireDefault(_atomTernjsManager);

var _atomTernjsHelper = require('./atom-ternjs-helper');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _minimatch = require('minimatch');

var _minimatch2 = _interopRequireDefault(_minimatch);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _resolveFrom = require('resolve-from');

var _resolveFrom2 = _interopRequireDefault(_resolveFrom);

var _atomTernjsPackageConfig = require('./atom-ternjs-package-config');

var _atomTernjsPackageConfig2 = _interopRequireDefault(_atomTernjsPackageConfig);

var _configTernConfig = require('../config/tern-config');

var _underscorePlus = require('underscore-plus');

'use babel';

var maxPendingRequests = 50;

var Server = (function () {
  function Server(projectRoot, client) {
    _classCallCheck(this, Server);

    this.client = client;

    this.child = null;

    this.resolves = {};
    this.rejects = {};

    this.pendingRequest = 0;

    this.projectDir = projectRoot;
    this.distDir = _path2['default'].resolve(__dirname, '../node_modules/tern');

    this.defaultConfig = (0, _underscorePlus.clone)(_configTernConfig.defaultServerConfig);

    var homeDir = process.env.HOME || process.env.USERPROFILE;

    if (homeDir && _fs2['default'].existsSync(_path2['default'].resolve(homeDir, '.tern-config'))) {

      this.defaultConfig = this.readProjectFile(_path2['default'].resolve(homeDir, '.tern-config'));
    }

    this.projectFileName = '.tern-project';
    this.disableLoadingLocal = false;

    this.init();
  }

  _createClass(Server, [{
    key: 'init',
    value: function init() {
      var _this = this;

      if (!this.projectDir) {

        return;
      }

      this.config = this.readProjectFile(_path2['default'].resolve(this.projectDir, this.projectFileName));

      if (!this.config) {

        this.config = this.defaultConfig;
      }

      this.config.async = _atomTernjsPackageConfig2['default'].options.ternServerGetFileAsync;
      this.config.dependencyBudget = _atomTernjsPackageConfig2['default'].options.ternServerDependencyBudget;

      if (!this.config.plugins['doc_comment']) {

        this.config.plugins['doc_comment'] = true;
      }

      var defs = this.findDefs(this.projectDir, this.config);
      var plugins = this.loadPlugins(this.projectDir, this.config);
      var files = [];

      if (this.config.loadEagerly) {

        this.config.loadEagerly.forEach(function (pat) {

          _glob2['default'].sync(pat, { cwd: _this.projectDir }).forEach(function (file) {

            files.push(file);
          });
        });
      }

      this.child = _child_process2['default'].fork(_path2['default'].resolve(__dirname, './atom-ternjs-server-worker.js'));
      this.child.on('message', this.onWorkerMessage.bind(this));
      this.child.on('error', this.onError);
      this.child.on('disconnect', this.onDisconnect);
      this.child.send({

        type: 'init',
        dir: this.projectDir,
        config: this.config,
        defs: defs,
        plugins: plugins,
        files: files
      });
    }
  }, {
    key: 'onError',
    value: function onError(e) {

      this.restart('Child process error: ' + e);
    }
  }, {
    key: 'onDisconnect',
    value: function onDisconnect() {

      console.warn('child process disconnected.');
    }
  }, {
    key: 'request',
    value: function request(type, data) {
      var _this2 = this;

      if (this.pendingRequest >= maxPendingRequests) {

        this.restart('Max number of pending requests reached. Restarting server...');

        return;
      }

      var requestID = _nodeUuid2['default'].v1();

      this.pendingRequest++;

      return new Promise(function (resolve, reject) {

        _this2.resolves[requestID] = resolve;
        _this2.rejects[requestID] = reject;

        _this2.child.send({

          type: type,
          id: requestID,
          data: data
        });
      });
    }
  }, {
    key: 'flush',
    value: function flush() {

      this.request('flush', {}).then(function () {

        atom.notifications.addInfo('All files fetched and analyzed.');
      });
    }
  }, {
    key: 'dontLoad',
    value: function dontLoad(file) {

      if (!this.config.dontLoad) {

        return;
      }

      return this.config.dontLoad.some(function (pat) {

        return (0, _minimatch2['default'])(file, pat);
      });
    }
  }, {
    key: 'restart',
    value: function restart(message) {

      atom.notifications.addError(message || 'Restarting Server...', {

        dismissable: false
      });

      _atomTernjsManager2['default'].destroyServer(this.projectDir);
      _atomTernjsManager2['default'].startServer(this.projectDir);
    }
  }, {
    key: 'onWorkerMessage',
    value: function onWorkerMessage(e) {

      if (e.error && e.error.isUncaughtException) {

        this.restart('UncaughtException: ' + e.error.message + '. Restarting Server...');

        return;
      }

      var isError = e.error !== 'null' && e.error !== 'undefined';
      var id = e.id;

      if (!id) {

        console.error('no id given', e);

        return;
      }

      if (isError) {

        this.rejects[id] && this.rejects[id](e.error);
      } else {

        this.resolves[id] && this.resolves[id](e.data);
      }

      delete this.resolves[id];
      delete this.rejects[id];

      this.pendingRequest--;
    }
  }, {
    key: 'destroy',
    value: function destroy() {

      if (!this.child) {

        return;
      }

      for (var key in this.rejects) {

        this.rejects[key]('Server is being destroyed. Rejecting.');
      }

      this.resolves = {};
      this.rejects = {};

      this.pendingRequest = 0;

      try {

        this.child.disconnect();
      } catch (error) {

        console.error(error);
      }
    }
  }, {
    key: 'readJSON',
    value: function readJSON(fileName) {

      if ((0, _atomTernjsHelper.fileExists)(fileName) !== undefined) {

        return false;
      }

      var file = _fs2['default'].readFileSync(fileName, 'utf8');

      try {

        return JSON.parse(file);
      } catch (e) {

        atom.notifications.addError('Bad JSON in ' + fileName + ': ' + e.message + '. Please restart atom after the file is fixed. This issue isn\'t fully covered yet.', { dismissable: true });

        _atomTernjsManager2['default'].destroyServer(this.projectDir);
      }
    }
  }, {
    key: 'mergeObjects',
    value: function mergeObjects(base, value) {

      if (!base) {

        return value;
      }

      if (!value) {

        return base;
      }

      var result = {};

      for (var prop in base) {

        result[prop] = base[prop];
      }

      for (var prop in value) {

        result[prop] = value[prop];
      }

      return result;
    }
  }, {
    key: 'readProjectFile',
    value: function readProjectFile(fileName) {

      var data = this.readJSON(fileName);

      if (!data) {

        return false;
      }

      for (var option in this.defaultConfig) {

        if (!data.hasOwnProperty(option)) {

          data[option] = this.defaultConfig[option];
        } else if (option === 'plugins') {

          data[option] = this.mergeObjects(this.defaultConfig[option], data[option]);
        }
      }

      return data;
    }
  }, {
    key: 'findFile',
    value: function findFile(file, projectDir, fallbackDir) {

      var local = _path2['default'].resolve(projectDir, file);

      if (!this.disableLoadingLocal && _fs2['default'].existsSync(local)) {

        return local;
      }

      var shared = _path2['default'].resolve(fallbackDir, file);

      if (_fs2['default'].existsSync(shared)) {

        return shared;
      }
    }
  }, {
    key: 'findDefs',
    value: function findDefs(projectDir, config) {

      var defs = [];
      var src = config.libs.slice();

      if (config.ecmaScript && src.indexOf('ecmascript') === -1) {

        src.unshift('ecmascript');
      }

      for (var i = 0; i < src.length; ++i) {

        var file = src[i];

        if (!/\.json$/.test(file)) {

          file = file + '.json';
        }

        var found = this.findFile(file, projectDir, _path2['default'].resolve(this.distDir, 'defs')) || (0, _resolveFrom2['default'])(projectDir, 'tern-' + src[i]);

        if (!found) {

          try {

            found = require.resolve('tern-' + src[i]);
          } catch (e) {

            atom.notifications.addError('Failed to find library ' + src[i] + '\n', {

              dismissable: true
            });
            continue;
          }
        }

        if (found) {

          defs.push(this.readJSON(found));
        }
      }

      return defs;
    }
  }, {
    key: 'loadPlugins',
    value: function loadPlugins(projectDir, config) {

      var plugins = config.plugins;
      var options = {};
      this.config.pluginImports = [];

      for (var plugin in plugins) {

        var val = plugins[plugin];

        if (!val) {

          continue;
        }

        var found = this.findFile(plugin + '.js', projectDir, _path2['default'].resolve(this.distDir, 'plugin')) || (0, _resolveFrom2['default'])(projectDir, 'tern-' + plugin);

        if (!found) {

          try {

            found = require.resolve('tern-' + plugin);
          } catch (e) {

            console.warn(e);
          }
        }

        if (!found) {

          try {

            found = require.resolve(this.projectDir + '/node_modules/tern-' + plugin);
          } catch (e) {

            atom.notifications.addError('Failed to find plugin ' + plugin + '\n', {

              dismissable: true
            });
            continue;
          }
        }

        this.config.pluginImports.push(found);
        options[_path2['default'].basename(plugin)] = val;
      }

      return options;
    }
  }]);

  return Server;
})();

exports['default'] = Server;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1zZXJ2ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztpQ0FFb0IsdUJBQXVCOzs7O2dDQUNsQixzQkFBc0I7O2tCQUNoQyxJQUFJOzs7O29CQUNGLE1BQU07Ozs7b0JBQ04sTUFBTTs7Ozs2QkFDUixlQUFlOzs7O3lCQUNSLFdBQVc7Ozs7d0JBQ2hCLFdBQVc7Ozs7MkJBQ0osY0FBYzs7Ozt1Q0FDWiw4QkFBOEI7Ozs7Z0NBQ3RCLHVCQUF1Qjs7OEJBSWxELGlCQUFpQjs7QUFoQnhCLFdBQVcsQ0FBQzs7QUFrQlosSUFBTSxrQkFBa0IsR0FBRyxFQUFFLENBQUM7O0lBRVQsTUFBTTtBQUVkLFdBRlEsTUFBTSxDQUViLFdBQVcsRUFBRSxNQUFNLEVBQUU7MEJBRmQsTUFBTTs7QUFJdkIsUUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7O0FBRXJCLFFBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDOztBQUVsQixRQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztBQUNuQixRQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQzs7QUFFbEIsUUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7O0FBRXhCLFFBQUksQ0FBQyxVQUFVLEdBQUcsV0FBVyxDQUFDO0FBQzlCLFFBQUksQ0FBQyxPQUFPLEdBQUcsa0JBQUssT0FBTyxDQUFDLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDOztBQUUvRCxRQUFJLENBQUMsYUFBYSxHQUFHLGlFQUEwQixDQUFDOztBQUVoRCxRQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQzs7QUFFNUQsUUFBSSxPQUFPLElBQUksZ0JBQUcsVUFBVSxDQUFDLGtCQUFLLE9BQU8sQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUMsRUFBRTs7QUFFbkUsVUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLGtCQUFLLE9BQU8sQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztLQUNsRjs7QUFFRCxRQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztBQUN2QyxRQUFJLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDOztBQUVqQyxRQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7R0FDYjs7ZUE3QmtCLE1BQU07O1dBK0JyQixnQkFBRzs7O0FBRUwsVUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUU7O0FBRXBCLGVBQU87T0FDUjs7QUFFRCxVQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsa0JBQUssT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7O0FBRXhGLFVBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFOztBQUVoQixZQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7T0FDbEM7O0FBRUQsVUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcscUNBQWMsT0FBTyxDQUFDLHNCQUFzQixDQUFDO0FBQ2pFLFVBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEdBQUcscUNBQWMsT0FBTyxDQUFDLDBCQUEwQixDQUFDOztBQUVoRixVQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUU7O0FBRXZDLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQztPQUMzQzs7QUFFRCxVQUFJLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3ZELFVBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0QsVUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDOztBQUVmLFVBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUU7O0FBRTNCLFlBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxVQUFDLEdBQUcsRUFBSzs7QUFFdkMsNEJBQUssSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsRUFBRSxNQUFLLFVBQVUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVMsSUFBSSxFQUFFOztBQUU5RCxpQkFBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztXQUNsQixDQUFDLENBQUM7U0FDSixDQUFDLENBQUM7T0FDSjs7QUFFRCxVQUFJLENBQUMsS0FBSyxHQUFHLDJCQUFHLElBQUksQ0FBQyxrQkFBSyxPQUFPLENBQUMsU0FBUyxFQUFFLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztBQUNoRixVQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMxRCxVQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3JDLFVBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDL0MsVUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7O0FBRWQsWUFBSSxFQUFFLE1BQU07QUFDWixXQUFHLEVBQUUsSUFBSSxDQUFDLFVBQVU7QUFDcEIsY0FBTSxFQUFFLElBQUksQ0FBQyxNQUFNO0FBQ25CLFlBQUksRUFBRSxJQUFJO0FBQ1YsZUFBTyxFQUFFLE9BQU87QUFDaEIsYUFBSyxFQUFFLEtBQUs7T0FDYixDQUFDLENBQUM7S0FDSjs7O1dBRU0saUJBQUMsQ0FBQyxFQUFFOztBQUVULFVBQUksQ0FBQyxPQUFPLDJCQUF5QixDQUFDLENBQUcsQ0FBQztLQUMzQzs7O1dBRVcsd0JBQUc7O0FBRWIsYUFBTyxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0tBQzdDOzs7V0FFTSxpQkFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFOzs7QUFFbEIsVUFBSSxJQUFJLENBQUMsY0FBYyxJQUFJLGtCQUFrQixFQUFFOztBQUU3QyxZQUFJLENBQUMsT0FBTyxDQUFDLDhEQUE4RCxDQUFDLENBQUM7O0FBRTdFLGVBQU87T0FDUjs7QUFFRCxVQUFJLFNBQVMsR0FBRyxzQkFBSyxFQUFFLEVBQUUsQ0FBQzs7QUFFMUIsVUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDOztBQUV0QixhQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBSzs7QUFFdEMsZUFBSyxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDO0FBQ25DLGVBQUssT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLE1BQU0sQ0FBQzs7QUFFakMsZUFBSyxLQUFLLENBQUMsSUFBSSxDQUFDOztBQUVkLGNBQUksRUFBRSxJQUFJO0FBQ1YsWUFBRSxFQUFFLFNBQVM7QUFDYixjQUFJLEVBQUUsSUFBSTtTQUNYLENBQUMsQ0FBQztPQUNKLENBQUMsQ0FBQztLQUNKOzs7V0FFSSxpQkFBRzs7QUFFTixVQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBTTs7QUFFbkMsWUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsaUNBQWlDLENBQUMsQ0FBQztPQUMvRCxDQUFDLENBQUM7S0FDSjs7O1dBRU8sa0JBQUMsSUFBSSxFQUFFOztBQUViLFVBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTs7QUFFekIsZUFBTztPQUNSOztBQUVELGFBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQUMsR0FBRyxFQUFLOztBQUV4QyxlQUFPLDRCQUFVLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztPQUM3QixDQUFDLENBQUM7S0FDSjs7O1dBRU0saUJBQUMsT0FBTyxFQUFFOztBQUVmLFVBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLE9BQU8sSUFBSSxzQkFBc0IsRUFBRTs7QUFFN0QsbUJBQVcsRUFBRSxLQUFLO09BQ25CLENBQUMsQ0FBQzs7QUFFSCxxQ0FBUSxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3ZDLHFDQUFRLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDdEM7OztXQUVjLHlCQUFDLENBQUMsRUFBRTs7QUFFakIsVUFBSSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUU7O0FBRTFDLFlBQUksQ0FBQyxPQUFPLHlCQUF1QixDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sNEJBQXlCLENBQUM7O0FBRTVFLGVBQU87T0FDUjs7QUFFRCxVQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsS0FBSyxLQUFLLE1BQU0sSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLFdBQVcsQ0FBQztBQUM5RCxVQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDOztBQUVoQixVQUFJLENBQUMsRUFBRSxFQUFFOztBQUVQLGVBQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDOztBQUVoQyxlQUFPO09BQ1I7O0FBRUQsVUFBSSxPQUFPLEVBQUU7O0FBRVgsWUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztPQUUvQyxNQUFNOztBQUVMLFlBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDaEQ7O0FBRUQsYUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3pCLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQzs7QUFFeEIsVUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0tBQ3ZCOzs7V0FFTSxtQkFBRzs7QUFFUixVQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTs7QUFFZixlQUFPO09BQ1I7O0FBRUQsV0FBSyxJQUFNLEdBQUcsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFOztBQUU5QixZQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7T0FDNUQ7O0FBRUQsVUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7QUFDbkIsVUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7O0FBRWxCLFVBQUksQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDOztBQUV4QixVQUFJOztBQUVGLFlBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7T0FFekIsQ0FBQyxPQUFPLEtBQUssRUFBRTs7QUFFZCxlQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO09BQ3RCO0tBQ0Y7OztXQUVPLGtCQUFDLFFBQVEsRUFBRTs7QUFFakIsVUFBSSxrQ0FBVyxRQUFRLENBQUMsS0FBSyxTQUFTLEVBQUU7O0FBRXRDLGVBQU8sS0FBSyxDQUFDO09BQ2Q7O0FBRUQsVUFBSSxJQUFJLEdBQUcsZ0JBQUcsWUFBWSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQzs7QUFFN0MsVUFBSTs7QUFFRixlQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7T0FFekIsQ0FBQyxPQUFPLENBQUMsRUFBRTs7QUFFVixZQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsa0JBQ1YsUUFBUSxVQUFLLENBQUMsQ0FBQyxPQUFPLDBGQUNyQyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FDdEIsQ0FBQzs7QUFFRix1Q0FBUSxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO09BQ3hDO0tBQ0Y7OztXQUVXLHNCQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7O0FBRXhCLFVBQUksQ0FBQyxJQUFJLEVBQUU7O0FBRVQsZUFBTyxLQUFLLENBQUM7T0FDZDs7QUFFRCxVQUFJLENBQUMsS0FBSyxFQUFFOztBQUVWLGVBQU8sSUFBSSxDQUFDO09BQ2I7O0FBRUQsVUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDOztBQUVoQixXQUFLLElBQU0sSUFBSSxJQUFJLElBQUksRUFBRTs7QUFFdkIsY0FBTSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUMzQjs7QUFFRCxXQUFLLElBQU0sSUFBSSxJQUFJLEtBQUssRUFBRTs7QUFFeEIsY0FBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUM1Qjs7QUFFRCxhQUFPLE1BQU0sQ0FBQztLQUNmOzs7V0FFYyx5QkFBQyxRQUFRLEVBQUU7O0FBRXhCLFVBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRW5DLFVBQUksQ0FBQyxJQUFJLEVBQUU7O0FBRVQsZUFBTyxLQUFLLENBQUM7T0FDZDs7QUFFRCxXQUFLLElBQUksTUFBTSxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7O0FBRXJDLFlBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxFQUFFOztBQUVoQyxjQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUUzQyxNQUFNLElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTs7QUFFL0IsY0FBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztTQUM1RTtPQUNGOztBQUVELGFBQU8sSUFBSSxDQUFDO0tBQ2I7OztXQUVPLGtCQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFOztBQUV0QyxVQUFJLEtBQUssR0FBRyxrQkFBSyxPQUFPLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUUzQyxVQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixJQUFJLGdCQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRTs7QUFFckQsZUFBTyxLQUFLLENBQUM7T0FDZDs7QUFFRCxVQUFJLE1BQU0sR0FBRyxrQkFBSyxPQUFPLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUU3QyxVQUFJLGdCQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRTs7QUFFekIsZUFBTyxNQUFNLENBQUM7T0FDZjtLQUNGOzs7V0FFTyxrQkFBQyxVQUFVLEVBQUUsTUFBTSxFQUFFOztBQUUzQixVQUFJLElBQUksR0FBRyxFQUFFLENBQUM7QUFDZCxVQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDOztBQUU5QixVQUFJLE1BQU0sQ0FBQyxVQUFVLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTs7QUFFekQsV0FBRyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztPQUMzQjs7QUFFRCxXQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTs7QUFFbkMsWUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUVsQixZQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTs7QUFFekIsY0FBSSxHQUFNLElBQUksVUFBTyxDQUFDO1NBQ3ZCOztBQUVELFlBQUksS0FBSyxHQUNQLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxrQkFBSyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxJQUNuRSw4QkFBWSxVQUFVLFlBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFHLENBQ3hDOztBQUVILFlBQUksQ0FBQyxLQUFLLEVBQUU7O0FBRVYsY0FBSTs7QUFFRixpQkFBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLFdBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFHLENBQUM7V0FFM0MsQ0FBQyxPQUFPLENBQUMsRUFBRTs7QUFFVixnQkFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLDZCQUEyQixHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQU07O0FBRWhFLHlCQUFXLEVBQUUsSUFBSTthQUNsQixDQUFDLENBQUM7QUFDSCxxQkFBUztXQUNWO1NBQ0Y7O0FBRUQsWUFBSSxLQUFLLEVBQUU7O0FBRVQsY0FBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDakM7T0FDRjs7QUFFRCxhQUFPLElBQUksQ0FBQztLQUNiOzs7V0FFVSxxQkFBQyxVQUFVLEVBQUUsTUFBTSxFQUFFOztBQUU5QixVQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO0FBQzdCLFVBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNqQixVQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7O0FBRS9CLFdBQUssSUFBSSxNQUFNLElBQUksT0FBTyxFQUFFOztBQUUxQixZQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTFCLFlBQUksQ0FBQyxHQUFHLEVBQUU7O0FBRVIsbUJBQVM7U0FDVjs7QUFFRCxZQUFJLEtBQUssR0FDUCxJQUFJLENBQUMsUUFBUSxDQUFJLE1BQU0sVUFBTyxVQUFVLEVBQUUsa0JBQUssT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFDL0UsOEJBQVksVUFBVSxZQUFVLE1BQU0sQ0FBRyxDQUN4Qzs7QUFFSCxZQUFJLENBQUMsS0FBSyxFQUFFOztBQUVWLGNBQUk7O0FBRUYsaUJBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxXQUFTLE1BQU0sQ0FBRyxDQUFDO1dBRTNDLENBQUMsT0FBTyxDQUFDLEVBQUU7O0FBRVYsbUJBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7V0FDakI7U0FDRjs7QUFFRCxZQUFJLENBQUMsS0FBSyxFQUFFOztBQUVWLGNBQUk7O0FBRUYsaUJBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFJLElBQUksQ0FBQyxVQUFVLDJCQUFzQixNQUFNLENBQUcsQ0FBQztXQUUzRSxDQUFDLE9BQU8sQ0FBQyxFQUFFOztBQUVWLGdCQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsNEJBQTBCLE1BQU0sU0FBTTs7QUFFL0QseUJBQVcsRUFBRSxJQUFJO2FBQ2xCLENBQUMsQ0FBQztBQUNILHFCQUFTO1dBQ1Y7U0FDRjs7QUFFRCxZQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdEMsZUFBTyxDQUFDLGtCQUFLLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztPQUN0Qzs7QUFFRCxhQUFPLE9BQU8sQ0FBQztLQUNoQjs7O1NBdlprQixNQUFNOzs7cUJBQU4sTUFBTSIsImZpbGUiOiIvVXNlcnMvam9zaC8uYXRvbS9wYWNrYWdlcy9hdG9tLXRlcm5qcy9saWIvYXRvbS10ZXJuanMtc2VydmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmltcG9ydCBtYW5hZ2VyIGZyb20gJy4vYXRvbS10ZXJuanMtbWFuYWdlcic7XG5pbXBvcnQge2ZpbGVFeGlzdHN9IGZyb20gJy4vYXRvbS10ZXJuanMtaGVscGVyJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBnbG9iIGZyb20gJ2dsb2InO1xuaW1wb3J0IGNwIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IG1pbmltYXRjaCBmcm9tICdtaW5pbWF0Y2gnO1xuaW1wb3J0IHV1aWQgZnJvbSAnbm9kZS11dWlkJztcbmltcG9ydCByZXNvbHZlRnJvbSBmcm9tICdyZXNvbHZlLWZyb20nO1xuaW1wb3J0IHBhY2thZ2VDb25maWcgZnJvbSAnLi9hdG9tLXRlcm5qcy1wYWNrYWdlLWNvbmZpZyc7XG5pbXBvcnQge2RlZmF1bHRTZXJ2ZXJDb25maWd9IGZyb20gJy4uL2NvbmZpZy90ZXJuLWNvbmZpZyc7XG5cbmltcG9ydCB7XG4gIGNsb25lXG59IGZyb20gJ3VuZGVyc2NvcmUtcGx1cyc7XG5cbmNvbnN0IG1heFBlbmRpbmdSZXF1ZXN0cyA9IDUwO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZXJ2ZXIge1xuXG4gIGNvbnN0cnVjdG9yKHByb2plY3RSb290LCBjbGllbnQpIHtcblxuICAgIHRoaXMuY2xpZW50ID0gY2xpZW50O1xuXG4gICAgdGhpcy5jaGlsZCA9IG51bGw7XG5cbiAgICB0aGlzLnJlc29sdmVzID0ge307XG4gICAgdGhpcy5yZWplY3RzID0ge307XG5cbiAgICB0aGlzLnBlbmRpbmdSZXF1ZXN0ID0gMDtcblxuICAgIHRoaXMucHJvamVjdERpciA9IHByb2plY3RSb290O1xuICAgIHRoaXMuZGlzdERpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9ub2RlX21vZHVsZXMvdGVybicpO1xuXG4gICAgdGhpcy5kZWZhdWx0Q29uZmlnID0gY2xvbmUoZGVmYXVsdFNlcnZlckNvbmZpZyk7XG5cbiAgICBjb25zdCBob21lRGlyID0gcHJvY2Vzcy5lbnYuSE9NRSB8fCBwcm9jZXNzLmVudi5VU0VSUFJPRklMRTtcblxuICAgIGlmIChob21lRGlyICYmIGZzLmV4aXN0c1N5bmMocGF0aC5yZXNvbHZlKGhvbWVEaXIsICcudGVybi1jb25maWcnKSkpIHtcblxuICAgICAgdGhpcy5kZWZhdWx0Q29uZmlnID0gdGhpcy5yZWFkUHJvamVjdEZpbGUocGF0aC5yZXNvbHZlKGhvbWVEaXIsICcudGVybi1jb25maWcnKSk7XG4gICAgfVxuXG4gICAgdGhpcy5wcm9qZWN0RmlsZU5hbWUgPSAnLnRlcm4tcHJvamVjdCc7XG4gICAgdGhpcy5kaXNhYmxlTG9hZGluZ0xvY2FsID0gZmFsc2U7XG5cbiAgICB0aGlzLmluaXQoKTtcbiAgfVxuXG4gIGluaXQoKSB7XG5cbiAgICBpZiAoIXRoaXMucHJvamVjdERpcikge1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jb25maWcgPSB0aGlzLnJlYWRQcm9qZWN0RmlsZShwYXRoLnJlc29sdmUodGhpcy5wcm9qZWN0RGlyLCB0aGlzLnByb2plY3RGaWxlTmFtZSkpO1xuXG4gICAgaWYgKCF0aGlzLmNvbmZpZykge1xuXG4gICAgICB0aGlzLmNvbmZpZyA9IHRoaXMuZGVmYXVsdENvbmZpZztcbiAgICB9XG5cbiAgICB0aGlzLmNvbmZpZy5hc3luYyA9IHBhY2thZ2VDb25maWcub3B0aW9ucy50ZXJuU2VydmVyR2V0RmlsZUFzeW5jO1xuICAgIHRoaXMuY29uZmlnLmRlcGVuZGVuY3lCdWRnZXQgPSBwYWNrYWdlQ29uZmlnLm9wdGlvbnMudGVyblNlcnZlckRlcGVuZGVuY3lCdWRnZXQ7XG5cbiAgICBpZiAoIXRoaXMuY29uZmlnLnBsdWdpbnNbJ2RvY19jb21tZW50J10pIHtcblxuICAgICAgdGhpcy5jb25maWcucGx1Z2luc1snZG9jX2NvbW1lbnQnXSA9IHRydWU7XG4gICAgfVxuXG4gICAgbGV0IGRlZnMgPSB0aGlzLmZpbmREZWZzKHRoaXMucHJvamVjdERpciwgdGhpcy5jb25maWcpO1xuICAgIGxldCBwbHVnaW5zID0gdGhpcy5sb2FkUGx1Z2lucyh0aGlzLnByb2plY3REaXIsIHRoaXMuY29uZmlnKTtcbiAgICBsZXQgZmlsZXMgPSBbXTtcblxuICAgIGlmICh0aGlzLmNvbmZpZy5sb2FkRWFnZXJseSkge1xuXG4gICAgICB0aGlzLmNvbmZpZy5sb2FkRWFnZXJseS5mb3JFYWNoKChwYXQpID0+IHtcblxuICAgICAgICBnbG9iLnN5bmMocGF0LCB7IGN3ZDogdGhpcy5wcm9qZWN0RGlyIH0pLmZvckVhY2goZnVuY3Rpb24oZmlsZSkge1xuXG4gICAgICAgICAgZmlsZXMucHVzaChmaWxlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLmNoaWxkID0gY3AuZm9yayhwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9hdG9tLXRlcm5qcy1zZXJ2ZXItd29ya2VyLmpzJykpO1xuICAgIHRoaXMuY2hpbGQub24oJ21lc3NhZ2UnLCB0aGlzLm9uV29ya2VyTWVzc2FnZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmNoaWxkLm9uKCdlcnJvcicsIHRoaXMub25FcnJvcik7XG4gICAgdGhpcy5jaGlsZC5vbignZGlzY29ubmVjdCcsIHRoaXMub25EaXNjb25uZWN0KTtcbiAgICB0aGlzLmNoaWxkLnNlbmQoe1xuXG4gICAgICB0eXBlOiAnaW5pdCcsXG4gICAgICBkaXI6IHRoaXMucHJvamVjdERpcixcbiAgICAgIGNvbmZpZzogdGhpcy5jb25maWcsXG4gICAgICBkZWZzOiBkZWZzLFxuICAgICAgcGx1Z2luczogcGx1Z2lucyxcbiAgICAgIGZpbGVzOiBmaWxlc1xuICAgIH0pO1xuICB9XG5cbiAgb25FcnJvcihlKSB7XG5cbiAgICB0aGlzLnJlc3RhcnQoYENoaWxkIHByb2Nlc3MgZXJyb3I6ICR7ZX1gKTtcbiAgfVxuXG4gIG9uRGlzY29ubmVjdCgpIHtcblxuICAgIGNvbnNvbGUud2FybignY2hpbGQgcHJvY2VzcyBkaXNjb25uZWN0ZWQuJyk7XG4gIH1cblxuICByZXF1ZXN0KHR5cGUsIGRhdGEpIHtcblxuICAgIGlmICh0aGlzLnBlbmRpbmdSZXF1ZXN0ID49IG1heFBlbmRpbmdSZXF1ZXN0cykge1xuXG4gICAgICB0aGlzLnJlc3RhcnQoJ01heCBudW1iZXIgb2YgcGVuZGluZyByZXF1ZXN0cyByZWFjaGVkLiBSZXN0YXJ0aW5nIHNlcnZlci4uLicpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHJlcXVlc3RJRCA9IHV1aWQudjEoKTtcblxuICAgIHRoaXMucGVuZGluZ1JlcXVlc3QrKztcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgIHRoaXMucmVzb2x2ZXNbcmVxdWVzdElEXSA9IHJlc29sdmU7XG4gICAgICB0aGlzLnJlamVjdHNbcmVxdWVzdElEXSA9IHJlamVjdDtcblxuICAgICAgdGhpcy5jaGlsZC5zZW5kKHtcblxuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBpZDogcmVxdWVzdElELFxuICAgICAgICBkYXRhOiBkYXRhXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZsdXNoKCkge1xuXG4gICAgdGhpcy5yZXF1ZXN0KCdmbHVzaCcsIHt9KS50aGVuKCgpID0+IHtcblxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oJ0FsbCBmaWxlcyBmZXRjaGVkIGFuZCBhbmFseXplZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRvbnRMb2FkKGZpbGUpIHtcblxuICAgIGlmICghdGhpcy5jb25maWcuZG9udExvYWQpIHtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmNvbmZpZy5kb250TG9hZC5zb21lKChwYXQpID0+IHtcblxuICAgICAgcmV0dXJuIG1pbmltYXRjaChmaWxlLCBwYXQpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVzdGFydChtZXNzYWdlKSB7XG5cbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IobWVzc2FnZSB8fCAnUmVzdGFydGluZyBTZXJ2ZXIuLi4nLCB7XG5cbiAgICAgIGRpc21pc3NhYmxlOiBmYWxzZVxuICAgIH0pO1xuXG4gICAgbWFuYWdlci5kZXN0cm95U2VydmVyKHRoaXMucHJvamVjdERpcik7XG4gICAgbWFuYWdlci5zdGFydFNlcnZlcih0aGlzLnByb2plY3REaXIpO1xuICB9XG5cbiAgb25Xb3JrZXJNZXNzYWdlKGUpIHtcblxuICAgIGlmIChlLmVycm9yICYmIGUuZXJyb3IuaXNVbmNhdWdodEV4Y2VwdGlvbikge1xuXG4gICAgICB0aGlzLnJlc3RhcnQoYFVuY2F1Z2h0RXhjZXB0aW9uOiAke2UuZXJyb3IubWVzc2FnZX0uIFJlc3RhcnRpbmcgU2VydmVyLi4uYCk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpc0Vycm9yID0gZS5lcnJvciAhPT0gJ251bGwnICYmIGUuZXJyb3IgIT09ICd1bmRlZmluZWQnO1xuICAgIGNvbnN0IGlkID0gZS5pZDtcblxuICAgIGlmICghaWQpIHtcblxuICAgICAgY29uc29sZS5lcnJvcignbm8gaWQgZ2l2ZW4nLCBlKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChpc0Vycm9yKSB7XG5cbiAgICAgIHRoaXMucmVqZWN0c1tpZF0gJiYgdGhpcy5yZWplY3RzW2lkXShlLmVycm9yKTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIHRoaXMucmVzb2x2ZXNbaWRdICYmIHRoaXMucmVzb2x2ZXNbaWRdKGUuZGF0YSk7XG4gICAgfVxuXG4gICAgZGVsZXRlIHRoaXMucmVzb2x2ZXNbaWRdO1xuICAgIGRlbGV0ZSB0aGlzLnJlamVjdHNbaWRdO1xuXG4gICAgdGhpcy5wZW5kaW5nUmVxdWVzdC0tO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcblxuICAgIGlmICghdGhpcy5jaGlsZCkge1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5yZWplY3RzKSB7XG5cbiAgICAgIHRoaXMucmVqZWN0c1trZXldKCdTZXJ2ZXIgaXMgYmVpbmcgZGVzdHJveWVkLiBSZWplY3RpbmcuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5yZXNvbHZlcyA9IHt9O1xuICAgIHRoaXMucmVqZWN0cyA9IHt9O1xuXG4gICAgdGhpcy5wZW5kaW5nUmVxdWVzdCA9IDA7XG5cbiAgICB0cnkge1xuXG4gICAgICB0aGlzLmNoaWxkLmRpc2Nvbm5lY3QoKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG5cbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIHJlYWRKU09OKGZpbGVOYW1lKSB7XG5cbiAgICBpZiAoZmlsZUV4aXN0cyhmaWxlTmFtZSkgIT09IHVuZGVmaW5lZCkge1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IGZpbGUgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZU5hbWUsICd1dGY4Jyk7XG5cbiAgICB0cnkge1xuXG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShmaWxlKTtcblxuICAgIH0gY2F0Y2ggKGUpIHtcblxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFxuICAgICAgICBgQmFkIEpTT04gaW4gJHtmaWxlTmFtZX06ICR7ZS5tZXNzYWdlfS4gUGxlYXNlIHJlc3RhcnQgYXRvbSBhZnRlciB0aGUgZmlsZSBpcyBmaXhlZC4gVGhpcyBpc3N1ZSBpc24ndCBmdWxseSBjb3ZlcmVkIHlldC5gLFxuICAgICAgICB7IGRpc21pc3NhYmxlOiB0cnVlIH1cbiAgICAgICk7XG5cbiAgICAgIG1hbmFnZXIuZGVzdHJveVNlcnZlcih0aGlzLnByb2plY3REaXIpO1xuICAgIH1cbiAgfVxuXG4gIG1lcmdlT2JqZWN0cyhiYXNlLCB2YWx1ZSkge1xuXG4gICAgaWYgKCFiYXNlKSB7XG5cbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBpZiAoIXZhbHVlKSB7XG5cbiAgICAgIHJldHVybiBiYXNlO1xuICAgIH1cblxuICAgIGxldCByZXN1bHQgPSB7fTtcblxuICAgIGZvciAoY29uc3QgcHJvcCBpbiBiYXNlKSB7XG5cbiAgICAgIHJlc3VsdFtwcm9wXSA9IGJhc2VbcHJvcF07XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBwcm9wIGluIHZhbHVlKSB7XG5cbiAgICAgIHJlc3VsdFtwcm9wXSA9IHZhbHVlW3Byb3BdO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICByZWFkUHJvamVjdEZpbGUoZmlsZU5hbWUpIHtcblxuICAgIGxldCBkYXRhID0gdGhpcy5yZWFkSlNPTihmaWxlTmFtZSk7XG5cbiAgICBpZiAoIWRhdGEpIHtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZvciAodmFyIG9wdGlvbiBpbiB0aGlzLmRlZmF1bHRDb25maWcpIHtcblxuICAgICAgaWYgKCFkYXRhLmhhc093blByb3BlcnR5KG9wdGlvbikpIHtcblxuICAgICAgICBkYXRhW29wdGlvbl0gPSB0aGlzLmRlZmF1bHRDb25maWdbb3B0aW9uXTtcblxuICAgICAgfSBlbHNlIGlmIChvcHRpb24gPT09ICdwbHVnaW5zJykge1xuXG4gICAgICAgIGRhdGFbb3B0aW9uXSA9IHRoaXMubWVyZ2VPYmplY3RzKHRoaXMuZGVmYXVsdENvbmZpZ1tvcHRpb25dLCBkYXRhW29wdGlvbl0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgZmluZEZpbGUoZmlsZSwgcHJvamVjdERpciwgZmFsbGJhY2tEaXIpIHtcblxuICAgIGxldCBsb2NhbCA9IHBhdGgucmVzb2x2ZShwcm9qZWN0RGlyLCBmaWxlKTtcblxuICAgIGlmICghdGhpcy5kaXNhYmxlTG9hZGluZ0xvY2FsICYmIGZzLmV4aXN0c1N5bmMobG9jYWwpKSB7XG5cbiAgICAgIHJldHVybiBsb2NhbDtcbiAgICB9XG5cbiAgICBsZXQgc2hhcmVkID0gcGF0aC5yZXNvbHZlKGZhbGxiYWNrRGlyLCBmaWxlKTtcblxuICAgIGlmIChmcy5leGlzdHNTeW5jKHNoYXJlZCkpIHtcblxuICAgICAgcmV0dXJuIHNoYXJlZDtcbiAgICB9XG4gIH1cblxuICBmaW5kRGVmcyhwcm9qZWN0RGlyLCBjb25maWcpIHtcblxuICAgIGxldCBkZWZzID0gW107XG4gICAgbGV0IHNyYyA9IGNvbmZpZy5saWJzLnNsaWNlKCk7XG5cbiAgICBpZiAoY29uZmlnLmVjbWFTY3JpcHQgJiYgc3JjLmluZGV4T2YoJ2VjbWFzY3JpcHQnKSA9PT0gLTEpIHtcblxuICAgICAgc3JjLnVuc2hpZnQoJ2VjbWFzY3JpcHQnKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNyYy5sZW5ndGg7ICsraSkge1xuXG4gICAgICBsZXQgZmlsZSA9IHNyY1tpXTtcblxuICAgICAgaWYgKCEvXFwuanNvbiQvLnRlc3QoZmlsZSkpIHtcblxuICAgICAgICBmaWxlID0gYCR7ZmlsZX0uanNvbmA7XG4gICAgICB9XG5cbiAgICAgIGxldCBmb3VuZCA9XG4gICAgICAgIHRoaXMuZmluZEZpbGUoZmlsZSwgcHJvamVjdERpciwgcGF0aC5yZXNvbHZlKHRoaXMuZGlzdERpciwgJ2RlZnMnKSkgfHxcbiAgICAgICAgcmVzb2x2ZUZyb20ocHJvamVjdERpciwgYHRlcm4tJHtzcmNbaV19YClcbiAgICAgICAgO1xuXG4gICAgICBpZiAoIWZvdW5kKSB7XG5cbiAgICAgICAgdHJ5IHtcblxuICAgICAgICAgIGZvdW5kID0gcmVxdWlyZS5yZXNvbHZlKGB0ZXJuLSR7c3JjW2ldfWApO1xuXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcblxuICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihgRmFpbGVkIHRvIGZpbmQgbGlicmFyeSAke3NyY1tpXX1cXG5gLCB7XG5cbiAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGZvdW5kKSB7XG5cbiAgICAgICAgZGVmcy5wdXNoKHRoaXMucmVhZEpTT04oZm91bmQpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVmcztcbiAgfVxuXG4gIGxvYWRQbHVnaW5zKHByb2plY3REaXIsIGNvbmZpZykge1xuXG4gICAgbGV0IHBsdWdpbnMgPSBjb25maWcucGx1Z2lucztcbiAgICBsZXQgb3B0aW9ucyA9IHt9O1xuICAgIHRoaXMuY29uZmlnLnBsdWdpbkltcG9ydHMgPSBbXTtcblxuICAgIGZvciAobGV0IHBsdWdpbiBpbiBwbHVnaW5zKSB7XG5cbiAgICAgIGxldCB2YWwgPSBwbHVnaW5zW3BsdWdpbl07XG5cbiAgICAgIGlmICghdmFsKSB7XG5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGxldCBmb3VuZCA9XG4gICAgICAgIHRoaXMuZmluZEZpbGUoYCR7cGx1Z2lufS5qc2AsIHByb2plY3REaXIsIHBhdGgucmVzb2x2ZSh0aGlzLmRpc3REaXIsICdwbHVnaW4nKSkgfHxcbiAgICAgICAgcmVzb2x2ZUZyb20ocHJvamVjdERpciwgYHRlcm4tJHtwbHVnaW59YClcbiAgICAgICAgO1xuXG4gICAgICBpZiAoIWZvdW5kKSB7XG5cbiAgICAgICAgdHJ5IHtcblxuICAgICAgICAgIGZvdW5kID0gcmVxdWlyZS5yZXNvbHZlKGB0ZXJuLSR7cGx1Z2lufWApO1xuXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcblxuICAgICAgICAgIGNvbnNvbGUud2FybihlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIWZvdW5kKSB7XG5cbiAgICAgICAgdHJ5IHtcblxuICAgICAgICAgIGZvdW5kID0gcmVxdWlyZS5yZXNvbHZlKGAke3RoaXMucHJvamVjdERpcn0vbm9kZV9tb2R1bGVzL3Rlcm4tJHtwbHVnaW59YCk7XG5cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuXG4gICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKGBGYWlsZWQgdG8gZmluZCBwbHVnaW4gJHtwbHVnaW59XFxuYCwge1xuXG4gICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY29uZmlnLnBsdWdpbkltcG9ydHMucHVzaChmb3VuZCk7XG4gICAgICBvcHRpb25zW3BhdGguYmFzZW5hbWUocGx1Z2luKV0gPSB2YWw7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9wdGlvbnM7XG4gIH1cbn1cbiJdfQ==