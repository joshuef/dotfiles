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

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

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
    var _this = this;

    _classCallCheck(this, Server);

    this.onError = function (e) {

      _this.restart('Child process error: ' + e);
    };

    this.onDisconnect = function () {

      console.warn('child process disconnected.');
    };

    this.onWorkerMessage = function (e) {

      if (e.error && e.error.isUncaughtException) {

        _this.restart('UncaughtException: ' + e.error.message + '. Restarting Server...');

        return;
      }

      var isError = e.error !== 'null' && e.error !== 'undefined';
      var id = e.id;

      if (!id) {

        console.error('no id given', e);

        return;
      }

      if (isError) {

        _this.rejects[id] && _this.rejects[id](e.error);
      } else {

        _this.resolves[id] && _this.resolves[id](e.data);
      }

      delete _this.resolves[id];
      delete _this.rejects[id];

      _this.pendingRequest--;
    };

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
      var _this2 = this;

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

          _glob2['default'].sync(pat, { cwd: _this2.projectDir }).forEach(function (file) {

            files.push(file);
          });
        });
      }

      this.child = _child_process2['default'].fork(_path2['default'].resolve(__dirname, './atom-ternjs-server-worker.js'));
      this.child.on('message', this.onWorkerMessage);
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
    key: 'request',
    value: function request(type, data) {
      var _this3 = this;

      if (this.pendingRequest >= maxPendingRequests) {

        this.restart('Max number of pending requests reached. Restarting server...');

        return;
      }

      var requestID = _uuid2['default'].v1();

      this.pendingRequest++;

      return new Promise(function (resolve, reject) {

        _this3.resolves[requestID] = resolve;
        _this3.rejects[requestID] = reject;

        _this3.child.send({

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

          for (var _name in this.defaultConfig.plugins) {

            if (!Object.prototype.hasOwnProperty.call(data.plugins, _name)) {

              data.plugins[_name] = this.defaultConfig.plugins[_name];
            }
          }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2F0b20tdGVybmpzLXNlcnZlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O2lDQUVvQix1QkFBdUI7Ozs7Z0NBQ2xCLHNCQUFzQjs7a0JBQ2hDLElBQUk7Ozs7b0JBQ0YsTUFBTTs7OztvQkFDTixNQUFNOzs7OzZCQUNSLGVBQWU7Ozs7eUJBQ1IsV0FBVzs7OztvQkFDaEIsTUFBTTs7OzsyQkFDQyxjQUFjOzs7O3VDQUNaLDhCQUE4Qjs7OztnQ0FDdEIsdUJBQXVCOzs4QkFJbEQsaUJBQWlCOztBQWhCeEIsV0FBVyxDQUFDOztBQWtCWixJQUFNLGtCQUFrQixHQUFHLEVBQUUsQ0FBQzs7SUFFVCxNQUFNO0FBRWQsV0FGUSxNQUFNLENBRWIsV0FBVyxFQUFFLE1BQU0sRUFBRTs7OzBCQUZkLE1BQU07O1NBbUZ6QixPQUFPLEdBQUcsVUFBQyxDQUFDLEVBQUs7O0FBRWYsWUFBSyxPQUFPLDJCQUF5QixDQUFDLENBQUcsQ0FBQztLQUMzQzs7U0FFRCxZQUFZLEdBQUcsWUFBTTs7QUFFbkIsYUFBTyxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0tBQzdDOztTQTZERCxlQUFlLEdBQUcsVUFBQyxDQUFDLEVBQUs7O0FBRXZCLFVBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLG1CQUFtQixFQUFFOztBQUUxQyxjQUFLLE9BQU8seUJBQXVCLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyw0QkFBeUIsQ0FBQzs7QUFFNUUsZUFBTztPQUNSOztBQUVELFVBQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxLQUFLLEtBQUssTUFBTSxJQUFJLENBQUMsQ0FBQyxLQUFLLEtBQUssV0FBVyxDQUFDO0FBQzlELFVBQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7O0FBRWhCLFVBQUksQ0FBQyxFQUFFLEVBQUU7O0FB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QUcsQ0FBQztXQUUzRSxDQUFDLE9BQU8sQ0FBQyxFQUFFOztBQUVWLGdCQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsNEJBQTBCLE1BQU0sU0FBTTs7QUFFL0QseUJBQVcsRUFBRSxJQUFJO2FBQ2xCLENBQUMsQ0FBQztBQUNILHFCQUFTO1dBQ1Y7U0FDRjs7QUFFRCxZQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdEMsZUFBTyxDQUFDLGtCQUFLLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztPQUN0Qzs7QUFFRCxhQUFPLE9BQU8sQ0FBQztLQUNoQjs7O1NBbFlrQixNQUFNOzs7cUJBQU4sTUFBTSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1zZXJ2ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcblxuaW1wb3J0IG1hbmFnZXIgZnJvbSAnLi9hdG9tLXRlcm5qcy1tYW5hZ2VyJztcbmltcG9ydCB7ZmlsZUV4aXN0c30gZnJvbSAnLi9hdG9tLXRlcm5qcy1oZWxwZXInO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGdsb2IgZnJvbSAnZ2xvYic7XG5pbXBvcnQgY3AgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgbWluaW1hdGNoIGZyb20gJ21pbmltYXRjaCc7XG5pbXBvcnQgdXVpZCBmcm9tICd1dWlkJztcbmltcG9ydCByZXNvbHZlRnJvbSBmcm9tICdyZXNvbHZlLWZyb20nO1xuaW1wb3J0IHBhY2thZ2VDb25maWcgZnJvbSAnLi9hdG9tLXRlcm5qcy1wYWNrYWdlLWNvbmZpZyc7XG5pbXBvcnQge2RlZmF1bHRTZXJ2ZXJDb25maWd9IGZyb20gJy4uL2NvbmZpZy90ZXJuLWNvbmZpZyc7XG5cbmltcG9ydCB7XG4gIGNsb25lXG59IGZyb20gJ3VuZGVyc2NvcmUtcGx1cyc7XG5cbmNvbnN0IG1heFBlbmRpbmdSZXF1ZXN0cyA9IDUwO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZXJ2ZXIge1xuXG4gIGNvbnN0cnVjdG9yKHByb2plY3RSb290LCBjbGllbnQpIHtcblxuICAgIHRoaXMuY2xpZW50ID0gY2xpZW50O1xuXG4gICAgdGhpcy5jaGlsZCA9IG51bGw7XG5cbiAgICB0aGlzLnJlc29sdmVzID0ge307XG4gICAgdGhpcy5yZWplY3RzID0ge307XG5cbiAgICB0aGlzLnBlbmRpbmdSZXF1ZXN0ID0gMDtcblxuICAgIHRoaXMucHJvamVjdERpciA9IHByb2plY3RSb290O1xuICAgIHRoaXMuZGlzdERpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9ub2RlX21vZHVsZXMvdGVybicpO1xuXG4gICAgdGhpcy5kZWZhdWx0Q29uZmlnID0gY2xvbmUoZGVmYXVsdFNlcnZlckNvbmZpZyk7XG5cbiAgICBjb25zdCBob21lRGlyID0gcHJvY2Vzcy5lbnYuSE9NRSB8fCBwcm9jZXNzLmVudi5VU0VSUFJPRklMRTtcblxuICAgIGlmIChob21lRGlyICYmIGZzLmV4aXN0c1N5bmMocGF0aC5yZXNvbHZlKGhvbWVEaXIsICcudGVybi1jb25maWcnKSkpIHtcblxuICAgICAgdGhpcy5kZWZhdWx0Q29uZmlnID0gdGhpcy5yZWFkUHJvamVjdEZpbGUocGF0aC5yZXNvbHZlKGhvbWVEaXIsICcudGVybi1jb25maWcnKSk7XG4gICAgfVxuXG4gICAgdGhpcy5wcm9qZWN0RmlsZU5hbWUgPSAnLnRlcm4tcHJvamVjdCc7XG4gICAgdGhpcy5kaXNhYmxlTG9hZGluZ0xvY2FsID0gZmFsc2U7XG5cbiAgICB0aGlzLmluaXQoKTtcbiAgfVxuXG4gIGluaXQoKSB7XG5cbiAgICBpZiAoIXRoaXMucHJvamVjdERpcikge1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jb25maWcgPSB0aGlzLnJlYWRQcm9qZWN0RmlsZShwYXRoLnJlc29sdmUodGhpcy5wcm9qZWN0RGlyLCB0aGlzLnByb2plY3RGaWxlTmFtZSkpO1xuXG4gICAgaWYgKCF0aGlzLmNvbmZpZykge1xuXG4gICAgICB0aGlzLmNvbmZpZyA9IHRoaXMuZGVmYXVsdENvbmZpZztcbiAgICB9XG5cbiAgICB0aGlzLmNvbmZpZy5hc3luYyA9IHBhY2thZ2VDb25maWcub3B0aW9ucy50ZXJuU2VydmVyR2V0RmlsZUFzeW5jO1xuICAgIHRoaXMuY29uZmlnLmRlcGVuZGVuY3lCdWRnZXQgPSBwYWNrYWdlQ29uZmlnLm9wdGlvbnMudGVyblNlcnZlckRlcGVuZGVuY3lCdWRnZXQ7XG5cbiAgICBpZiAoIXRoaXMuY29uZmlnLnBsdWdpbnNbJ2RvY19jb21tZW50J10pIHtcblxuICAgICAgdGhpcy5jb25maWcucGx1Z2luc1snZG9jX2NvbW1lbnQnXSA9IHRydWU7XG4gICAgfVxuXG4gICAgbGV0IGRlZnMgPSB0aGlzLmZpbmREZWZzKHRoaXMucHJvamVjdERpciwgdGhpcy5jb25maWcpO1xuICAgIGxldCBwbHVnaW5zID0gdGhpcy5sb2FkUGx1Z2lucyh0aGlzLnByb2plY3REaXIsIHRoaXMuY29uZmlnKTtcbiAgICBsZXQgZmlsZXMgPSBbXTtcblxuICAgIGlmICh0aGlzLmNvbmZpZy5sb2FkRWFnZXJseSkge1xuXG4gICAgICB0aGlzLmNvbmZpZy5sb2FkRWFnZXJseS5mb3JFYWNoKChwYXQpID0+IHtcblxuICAgICAgICBnbG9iLnN5bmMocGF0LCB7IGN3ZDogdGhpcy5wcm9qZWN0RGlyIH0pLmZvckVhY2goZnVuY3Rpb24oZmlsZSkge1xuXG4gICAgICAgICAgZmlsZXMucHVzaChmaWxlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLmNoaWxkID0gY3AuZm9yayhwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9hdG9tLXRlcm5qcy1zZXJ2ZXItd29ya2VyLmpzJykpO1xuICAgIHRoaXMuY2hpbGQub24oJ21lc3NhZ2UnLCB0aGlzLm9uV29ya2VyTWVzc2FnZSk7XG4gICAgdGhpcy5jaGlsZC5vbignZXJyb3InLCB0aGlzLm9uRXJyb3IpO1xuICAgIHRoaXMuY2hpbGQub24oJ2Rpc2Nvbm5lY3QnLCB0aGlzLm9uRGlzY29ubmVjdCk7XG4gICAgdGhpcy5jaGlsZC5zZW5kKHtcblxuICAgICAgdHlwZTogJ2luaXQnLFxuICAgICAgZGlyOiB0aGlzLnByb2plY3REaXIsXG4gICAgICBjb25maWc6IHRoaXMuY29uZmlnLFxuICAgICAgZGVmczogZGVmcyxcbiAgICAgIHBsdWdpbnM6IHBsdWdpbnMsXG4gICAgICBmaWxlczogZmlsZXNcbiAgICB9KTtcbiAgfVxuXG4gIG9uRXJyb3IgPSAoZSkgPT4ge1xuXG4gICAgdGhpcy5yZXN0YXJ0KGBDaGlsZCBwcm9jZXNzIGVycm9yOiAke2V9YCk7XG4gIH1cblxuICBvbkRpc2Nvbm5lY3QgPSAoKSA9PiB7XG5cbiAgICBjb25zb2xlLndhcm4oJ2NoaWxkIHByb2Nlc3MgZGlzY29ubmVjdGVkLicpO1xuICB9XG5cbiAgcmVxdWVzdCh0eXBlLCBkYXRhKSB7XG5cbiAgICBpZiAodGhpcy5wZW5kaW5nUmVxdWVzdCA+PSBtYXhQZW5kaW5nUmVxdWVzdHMpIHtcblxuICAgICAgdGhpcy5yZXN0YXJ0KCdNYXggbnVtYmVyIG9mIHBlbmRpbmcgcmVxdWVzdHMgcmVhY2hlZC4gUmVzdGFydGluZyBzZXJ2ZXIuLi4nKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCByZXF1ZXN0SUQgPSB1dWlkLnYxKCk7XG5cbiAgICB0aGlzLnBlbmRpbmdSZXF1ZXN0Kys7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICB0aGlzLnJlc29sdmVzW3JlcXVlc3RJRF0gPSByZXNvbHZlO1xuICAgICAgdGhpcy5yZWplY3RzW3JlcXVlc3RJRF0gPSByZWplY3Q7XG5cbiAgICAgIHRoaXMuY2hpbGQuc2VuZCh7XG5cbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgaWQ6IHJlcXVlc3RJRCxcbiAgICAgICAgZGF0YTogZGF0YVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBmbHVzaCgpIHtcblxuICAgIHRoaXMucmVxdWVzdCgnZmx1c2gnLCB7fSkudGhlbigoKSA9PiB7XG5cbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKCdBbGwgZmlsZXMgZmV0Y2hlZCBhbmQgYW5hbHl6ZWQuJyk7XG4gICAgfSk7XG4gIH1cblxuICBkb250TG9hZChmaWxlKSB7XG5cbiAgICBpZiAoIXRoaXMuY29uZmlnLmRvbnRMb2FkKSB7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5jb25maWcuZG9udExvYWQuc29tZSgocGF0KSA9PiB7XG5cbiAgICAgIHJldHVybiBtaW5pbWF0Y2goZmlsZSwgcGF0KTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlc3RhcnQobWVzc2FnZSkge1xuXG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKG1lc3NhZ2UgfHwgJ1Jlc3RhcnRpbmcgU2VydmVyLi4uJywge1xuXG4gICAgICBkaXNtaXNzYWJsZTogZmFsc2VcbiAgICB9KTtcblxuICAgIG1hbmFnZXIuZGVzdHJveVNlcnZlcih0aGlzLnByb2plY3REaXIpO1xuICAgIG1hbmFnZXIuc3RhcnRTZXJ2ZXIodGhpcy5wcm9qZWN0RGlyKTtcbiAgfVxuXG4gIG9uV29ya2VyTWVzc2FnZSA9IChlKSA9PiB7XG5cbiAgICBpZiAoZS5lcnJvciAmJiBlLmVycm9yLmlzVW5jYXVnaHRFeGNlcHRpb24pIHtcblxuICAgICAgdGhpcy5yZXN0YXJ0KGBVbmNhdWdodEV4Y2VwdGlvbjogJHtlLmVycm9yLm1lc3NhZ2V9LiBSZXN0YXJ0aW5nIFNlcnZlci4uLmApO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNFcnJvciA9IGUuZXJyb3IgIT09ICdudWxsJyAmJiBlLmVycm9yICE9PSAndW5kZWZpbmVkJztcbiAgICBjb25zdCBpZCA9IGUuaWQ7XG5cbiAgICBpZiAoIWlkKSB7XG5cbiAgICAgIGNvbnNvbGUuZXJyb3IoJ25vIGlkIGdpdmVuJywgZSk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoaXNFcnJvcikge1xuXG4gICAgICB0aGlzLnJlamVjdHNbaWRdICYmIHRoaXMucmVqZWN0c1tpZF0oZS5lcnJvcik7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICB0aGlzLnJlc29sdmVzW2lkXSAmJiB0aGlzLnJlc29sdmVzW2lkXShlLmRhdGEpO1xuICAgIH1cblxuICAgIGRlbGV0ZSB0aGlzLnJlc29sdmVzW2lkXTtcbiAgICBkZWxldGUgdGhpcy5yZWplY3RzW2lkXTtcblxuICAgIHRoaXMucGVuZGluZ1JlcXVlc3QtLTtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG5cbiAgICBpZiAoIXRoaXMuY2hpbGQpIHtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMucmVqZWN0cykge1xuXG4gICAgICB0aGlzLnJlamVjdHNba2V5XSgnU2VydmVyIGlzIGJlaW5nIGRlc3Ryb3llZC4gUmVqZWN0aW5nLicpO1xuICAgIH1cblxuICAgIHRoaXMucmVzb2x2ZXMgPSB7fTtcbiAgICB0aGlzLnJlamVjdHMgPSB7fTtcblxuICAgIHRoaXMucGVuZGluZ1JlcXVlc3QgPSAwO1xuXG4gICAgdHJ5IHtcblxuICAgICAgdGhpcy5jaGlsZC5kaXNjb25uZWN0KCk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9XG4gIH1cblxuICByZWFkSlNPTihmaWxlTmFtZSkge1xuXG4gICAgaWYgKGZpbGVFeGlzdHMoZmlsZU5hbWUpICE9PSB1bmRlZmluZWQpIHtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCBmaWxlID0gZnMucmVhZEZpbGVTeW5jKGZpbGVOYW1lLCAndXRmOCcpO1xuXG4gICAgdHJ5IHtcblxuICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZmlsZSk7XG5cbiAgICB9IGNhdGNoIChlKSB7XG5cbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcbiAgICAgICAgYEJhZCBKU09OIGluICR7ZmlsZU5hbWV9OiAke2UubWVzc2FnZX0uIFBsZWFzZSByZXN0YXJ0IGF0b20gYWZ0ZXIgdGhlIGZpbGUgaXMgZml4ZWQuIFRoaXMgaXNzdWUgaXNuJ3QgZnVsbHkgY292ZXJlZCB5ZXQuYCxcbiAgICAgICAgeyBkaXNtaXNzYWJsZTogdHJ1ZSB9XG4gICAgICApO1xuXG4gICAgICBtYW5hZ2VyLmRlc3Ryb3lTZXJ2ZXIodGhpcy5wcm9qZWN0RGlyKTtcbiAgICB9XG4gIH1cblxuICByZWFkUHJvamVjdEZpbGUoZmlsZU5hbWUpIHtcblxuICAgIGxldCBkYXRhID0gdGhpcy5yZWFkSlNPTihmaWxlTmFtZSk7XG5cbiAgICBpZiAoIWRhdGEpIHtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZvciAodmFyIG9wdGlvbiBpbiB0aGlzLmRlZmF1bHRDb25maWcpIHtcblxuICAgICAgaWYgKCFkYXRhLmhhc093blByb3BlcnR5KG9wdGlvbikpIHtcblxuICAgICAgICBkYXRhW29wdGlvbl0gPSB0aGlzLmRlZmF1bHRDb25maWdbb3B0aW9uXTtcblxuICAgICAgfSBlbHNlIGlmIChvcHRpb24gPT09ICdwbHVnaW5zJykge1xuXG4gICAgICAgIGZvciAoY29uc3QgbmFtZSBpbiB0aGlzLmRlZmF1bHRDb25maWcucGx1Z2lucykge1xuXG4gICAgICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZGF0YS5wbHVnaW5zLCBuYW1lKSkge1xuXG4gICAgICAgICAgICBkYXRhLnBsdWdpbnNbbmFtZV0gPSB0aGlzLmRlZmF1bHRDb25maWcucGx1Z2luc1tuYW1lXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIGZpbmRGaWxlKGZpbGUsIHByb2plY3REaXIsIGZhbGxiYWNrRGlyKSB7XG5cbiAgICBsZXQgbG9jYWwgPSBwYXRoLnJlc29sdmUocHJvamVjdERpciwgZmlsZSk7XG5cbiAgICBpZiAoIXRoaXMuZGlzYWJsZUxvYWRpbmdMb2NhbCAmJiBmcy5leGlzdHNTeW5jKGxvY2FsKSkge1xuXG4gICAgICByZXR1cm4gbG9jYWw7XG4gICAgfVxuXG4gICAgbGV0IHNoYXJlZCA9IHBhdGgucmVzb2x2ZShmYWxsYmFja0RpciwgZmlsZSk7XG5cbiAgICBpZiAoZnMuZXhpc3RzU3luYyhzaGFyZWQpKSB7XG5cbiAgICAgIHJldHVybiBzaGFyZWQ7XG4gICAgfVxuICB9XG5cbiAgZmluZERlZnMocHJvamVjdERpciwgY29uZmlnKSB7XG5cbiAgICBsZXQgZGVmcyA9IFtdO1xuICAgIGxldCBzcmMgPSBjb25maWcubGlicy5zbGljZSgpO1xuXG4gICAgaWYgKGNvbmZpZy5lY21hU2NyaXB0ICYmIHNyYy5pbmRleE9mKCdlY21hc2NyaXB0JykgPT09IC0xKSB7XG5cbiAgICAgIHNyYy51bnNoaWZ0KCdlY21hc2NyaXB0Jyk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcmMubGVuZ3RoOyArK2kpIHtcblxuICAgICAgbGV0IGZpbGUgPSBzcmNbaV07XG5cbiAgICAgIGlmICghL1xcLmpzb24kLy50ZXN0KGZpbGUpKSB7XG5cbiAgICAgICAgZmlsZSA9IGAke2ZpbGV9Lmpzb25gO1xuICAgICAgfVxuXG4gICAgICBsZXQgZm91bmQgPVxuICAgICAgICB0aGlzLmZpbmRGaWxlKGZpbGUsIHByb2plY3REaXIsIHBhdGgucmVzb2x2ZSh0aGlzLmRpc3REaXIsICdkZWZzJykpIHx8XG4gICAgICAgIHJlc29sdmVGcm9tKHByb2plY3REaXIsIGB0ZXJuLSR7c3JjW2ldfWApXG4gICAgICAgIDtcblxuICAgICAgaWYgKCFmb3VuZCkge1xuXG4gICAgICAgIHRyeSB7XG5cbiAgICAgICAgICBmb3VuZCA9IHJlcXVpcmUucmVzb2x2ZShgdGVybi0ke3NyY1tpXX1gKTtcblxuICAgICAgICB9IGNhdGNoIChlKSB7XG5cbiAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoYEZhaWxlZCB0byBmaW5kIGxpYnJhcnkgJHtzcmNbaV19XFxuYCwge1xuXG4gICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChmb3VuZCkge1xuXG4gICAgICAgIGRlZnMucHVzaCh0aGlzLnJlYWRKU09OKGZvdW5kKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZnM7XG4gIH1cblxuICBsb2FkUGx1Z2lucyhwcm9qZWN0RGlyLCBjb25maWcpIHtcblxuICAgIGxldCBwbHVnaW5zID0gY29uZmlnLnBsdWdpbnM7XG4gICAgbGV0IG9wdGlvbnMgPSB7fTtcbiAgICB0aGlzLmNvbmZpZy5wbHVnaW5JbXBvcnRzID0gW107XG5cbiAgICBmb3IgKGxldCBwbHVnaW4gaW4gcGx1Z2lucykge1xuXG4gICAgICBsZXQgdmFsID0gcGx1Z2luc1twbHVnaW5dO1xuXG4gICAgICBpZiAoIXZhbCkge1xuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBsZXQgZm91bmQgPVxuICAgICAgICB0aGlzLmZpbmRGaWxlKGAke3BsdWdpbn0uanNgLCBwcm9qZWN0RGlyLCBwYXRoLnJlc29sdmUodGhpcy5kaXN0RGlyLCAncGx1Z2luJykpIHx8XG4gICAgICAgIHJlc29sdmVGcm9tKHByb2plY3REaXIsIGB0ZXJuLSR7cGx1Z2lufWApXG4gICAgICAgIDtcblxuICAgICAgaWYgKCFmb3VuZCkge1xuXG4gICAgICAgIHRyeSB7XG5cbiAgICAgICAgICBmb3VuZCA9IHJlcXVpcmUucmVzb2x2ZShgdGVybi0ke3BsdWdpbn1gKTtcblxuICAgICAgICB9IGNhdGNoIChlKSB7XG5cbiAgICAgICAgICBjb25zb2xlLndhcm4oZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFmb3VuZCkge1xuXG4gICAgICAgIHRyeSB7XG5cbiAgICAgICAgICBmb3VuZCA9IHJlcXVpcmUucmVzb2x2ZShgJHt0aGlzLnByb2plY3REaXJ9L25vZGVfbW9kdWxlcy90ZXJuLSR7cGx1Z2lufWApO1xuXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcblxuICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihgRmFpbGVkIHRvIGZpbmQgcGx1Z2luICR7cGx1Z2lufVxcbmAsIHtcblxuICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLmNvbmZpZy5wbHVnaW5JbXBvcnRzLnB1c2goZm91bmQpO1xuICAgICAgb3B0aW9uc1twYXRoLmJhc2VuYW1lKHBsdWdpbildID0gdmFsO1xuICAgIH1cblxuICAgIHJldHVybiBvcHRpb25zO1xuICB9XG59XG4iXX0=