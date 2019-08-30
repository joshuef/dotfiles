Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var _atom = require('atom');

var _main = require('./main');

var _main2 = _interopRequireDefault(_main);

// Internal variables
var instance = undefined;

var idleCallbacks = new Set();

exports['default'] = {
  activate: function activate() {
    this.subscriptions = new _atom.CompositeDisposable();

    instance = new _main2['default']();
    this.subscriptions.add(instance);

    // TODO: Remove this after a few version bumps
    var oldConfigCallbackID = window.requestIdleCallback(_asyncToGenerator(function* () {
      idleCallbacks['delete'](oldConfigCallbackID);
      var FS = require('sb-fs');
      var Path = require('path');
      var Greeter = require('./greeter');

      // Greet the user if they are coming from Linter v1
      var greeter = new Greeter();
      this.subscriptions.add(greeter);
      var linterConfigs = atom.config.get('linter');
      // Unset v1 configs
      var removedV1Configs = ['lintOnFly', 'lintOnFlyInterval', 'ignoredMessageTypes', 'ignoreVCSIgnoredFiles', 'ignoreMatchedFiles', 'showErrorInline', 'inlineTooltipInterval', 'gutterEnabled', 'gutterPosition', 'underlineIssues', 'showProviderName', 'showErrorPanel', 'errorPanelHeight', 'alwaysTakeMinimumSpace', 'displayLinterInfo', 'displayLinterStatus', 'showErrorTabLine', 'showErrorTabFile', 'showErrorTabProject', 'statusIconScope', 'statusIconPosition'];
      if (removedV1Configs.some(function (config) {
        return ({}).hasOwnProperty.call(linterConfigs, config);
      })) {
        greeter.showWelcome();
      }
      removedV1Configs.forEach(function (e) {
        atom.config.unset('linter.' + e);
      });

      // There was an external config file in use briefly, migrate any use of that to settings
      var oldConfigFile = Path.join(atom.getConfigDirPath(), 'linter-config.json');
      if (yield FS.exists(oldConfigFile)) {
        var disabledProviders = atom.config.get('linter.disabledProviders');
        try {
          var oldConfigFileContents = yield FS.readFile(oldConfigFile, 'utf8');
          disabledProviders = disabledProviders.concat(JSON.parse(oldConfigFileContents).disabled);
        } catch (_) {
          console.error('[Linter] Error reading old state file', _);
        }
        atom.config.set('linter.disabledProviders', disabledProviders);
        try {
          yield FS.unlink(oldConfigFile);
        } catch (_) {/* No Op */}
      }
    }).bind(this));
    idleCallbacks.add(oldConfigCallbackID);

    var linterDepsCallback = window.requestIdleCallback(function linterDepsInstall() {
      idleCallbacks['delete'](linterDepsCallback);
      if (!atom.inSpecMode()) {
        // eslint-disable-next-line global-require
        require('atom-package-deps').install('linter', true);
      }
    });
    idleCallbacks.add(linterDepsCallback);
  },
  consumeLinter: function consumeLinter(linter) {
    var linters = [].concat(linter);
    for (var entry of linters) {
      instance.addLinter(entry);
    }
    return new _atom.Disposable(function () {
      for (var entry of linters) {
        instance.deleteLinter(entry);
      }
    });
  },
  consumeLinterLegacy: function consumeLinterLegacy(linter) {
    var linters = [].concat(linter);
    for (var entry of linters) {
      linter.name = linter.name || 'Unknown';
      linter.lintOnFly = Boolean(linter.lintOnFly);
      instance.addLinter(entry, true);
    }
    return new _atom.Disposable(function () {
      for (var entry of linters) {
        instance.deleteLinter(entry);
      }
    });
  },
  consumeUI: function consumeUI(ui) {
    var uis = [].concat(ui);
    for (var entry of uis) {
      instance.addUI(entry);
    }
    return new _atom.Disposable(function () {
      for (var entry of uis) {
        instance.deleteUI(entry);
      }
    });
  },
  provideIndie: function provideIndie() {
    return function (indie) {
      return instance.addIndie(indie);
    };
  },
  provideIndieLegacy: function provideIndieLegacy() {
    return {
      register: function register(indie) {
        return instance.addLegacyIndie(indie);
      }
    };
  },
  deactivate: function deactivate() {
    idleCallbacks.forEach(function (callbackID) {
      return window.cancelIdleCallback(callbackID);
    });
    idleCallbacks.clear();
    this.subscriptions.dispose();
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztvQkFFZ0QsTUFBTTs7b0JBRW5DLFFBQVE7Ozs7O0FBSTNCLElBQUksUUFBUSxZQUFBLENBQUE7O0FBRVosSUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTs7cUJBRWhCO0FBQ2IsVUFBUSxFQUFBLG9CQUFHO0FBQ1QsUUFBSSxDQUFDLGFBQWEsR0FBRywrQkFBeUIsQ0FBQTs7QUFFOUMsWUFBUSxHQUFHLHVCQUFZLENBQUE7QUFDdkIsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUE7OztBQUdoQyxRQUFNLG1CQUFtQixHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBQSxhQUFrQztBQUN2RixtQkFBYSxVQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQTtBQUN6QyxVQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDM0IsVUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQzVCLFVBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTs7O0FBR3BDLFVBQU0sT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUE7QUFDN0IsVUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDL0IsVUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUE7O0FBRS9DLFVBQU0sZ0JBQWdCLEdBQUcsQ0FDdkIsV0FBVyxFQUNYLG1CQUFtQixFQUNuQixxQkFBcUIsRUFDckIsdUJBQXVCLEVBQ3ZCLG9CQUFvQixFQUNwQixpQkFBaUIsRUFDakIsdUJBQXVCLEVBQ3ZCLGVBQWUsRUFDZixnQkFBZ0IsRUFDaEIsaUJBQWlCLEVB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LGtCQUFrQixDQUFDLFVBQVUsQ0FBQztLQUFBLENBQUMsQ0FBQTtBQUMxRSxpQkFBYSxDQUFDLEtBQUssRUFBRSxDQUFBO0FBQ3JCLFFBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUE7R0FDN0I7Q0FDRiIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2xpbnRlci9saWIvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcblxuaW1wb3J0IExpbnRlciBmcm9tICcuL21haW4nXG5pbXBvcnQgdHlwZSB7IFVJLCBMaW50ZXIgYXMgTGludGVyUHJvdmlkZXIgfSBmcm9tICcuL3R5cGVzJ1xuXG4vLyBJbnRlcm5hbCB2YXJpYWJsZXNcbmxldCBpbnN0YW5jZVxuXG5jb25zdCBpZGxlQ2FsbGJhY2tzID0gbmV3IFNldCgpXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgYWN0aXZhdGUoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgaW5zdGFuY2UgPSBuZXcgTGludGVyKClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGluc3RhbmNlKVxuXG4gICAgLy8gVE9ETzogUmVtb3ZlIHRoaXMgYWZ0ZXIgYSBmZXcgdmVyc2lvbiBidW1wc1xuICAgIGNvbnN0IG9sZENvbmZpZ0NhbGxiYWNrSUQgPSB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFjayhhc3luYyBmdW5jdGlvbiBsaW50ZXJPbGRDb25maWdzKCkge1xuICAgICAgaWRsZUNhbGxiYWNrcy5kZWxldGUob2xkQ29uZmlnQ2FsbGJhY2tJRClcbiAgICAgIGNvbnN0IEZTID0gcmVxdWlyZSgnc2ItZnMnKVxuICAgICAgY29uc3QgUGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuICAgICAgY29uc3QgR3JlZXRlciA9IHJlcXVpcmUoJy4vZ3JlZXRlcicpXG5cbiAgICAgIC8vIEdyZWV0IHRoZSB1c2VyIGlmIHRoZXkgYXJlIGNvbWluZyBmcm9tIExpbnRlciB2MVxuICAgICAgY29uc3QgZ3JlZXRlciA9IG5ldyBHcmVldGVyKClcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoZ3JlZXRlcilcbiAgICAgIGNvbnN0IGxpbnRlckNvbmZpZ3MgPSBhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlcicpXG4gICAgICAvLyBVbnNldCB2MSBjb25maWdzXG4gICAgICBjb25zdCByZW1vdmVkVjFDb25maWdzID0gW1xuICAgICAgICAnbGludE9uRmx5JyxcbiAgICAgICAgJ2xpbnRPbkZseUludGVydmFsJyxcbiAgICAgICAgJ2lnbm9yZWRNZXNzYWdlVHlwZXMnLFxuICAgICAgICAnaWdub3JlVkNTSWdub3JlZEZpbGVzJyxcbiAgICAgICAgJ2lnbm9yZU1hdGNoZWRGaWxlcycsXG4gICAgICAgICdzaG93RXJyb3JJbmxpbmUnLFxuICAgICAgICAnaW5saW5lVG9vbHRpcEludGVydmFsJyxcbiAgICAgICAgJ2d1dHRlckVuYWJsZWQnLFxuICAgICAgICAnZ3V0dGVyUG9zaXRpb24nLFxuICAgICAgICAndW5kZXJsaW5lSXNzdWVzJyxcbiAgICAgICAgJ3Nob3dQcm92aWRlck5hbWUnLFxuICAgICAgICAnc2hvd0Vycm9yUGFuZWwnLFxuICAgICAgICAnZXJyb3JQYW5lbEhlaWdodCcsXG4gICAgICAgICdhbHdheXNUYWtlTWluaW11bVNwYWNlJyxcbiAgICAgICAgJ2Rpc3BsYXlMaW50ZXJJbmZvJyxcbiAgICAgICAgJ2Rpc3BsYXlMaW50ZXJTdGF0dXMnLFxuICAgICAgICAnc2hvd0Vycm9yVGFiTGluZScsXG4gICAgICAgICdzaG93RXJyb3JUYWJGaWxlJyxcbiAgICAgICAgJ3Nob3dFcnJvclRhYlByb2plY3QnLFxuICAgICAgICAnc3RhdHVzSWNvblNjb3BlJyxcbiAgICAgICAgJ3N0YXR1c0ljb25Qb3NpdGlvbicsXG4gICAgICBdXG4gICAgICBpZiAocmVtb3ZlZFYxQ29uZmlncy5zb21lKGNvbmZpZyA9PiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChsaW50ZXJDb25maWdzLCBjb25maWcpKSkpIHtcbiAgICAgICAgZ3JlZXRlci5zaG93V2VsY29tZSgpXG4gICAgICB9XG4gICAgICByZW1vdmVkVjFDb25maWdzLmZvckVhY2goKGUpID0+IHsgYXRvbS5jb25maWcudW5zZXQoYGxpbnRlci4ke2V9YCkgfSlcblxuICAgICAgLy8gVGhlcmUgd2FzIGFuIGV4dGVybmFsIGNvbmZpZyBmaWxlIGluIHVzZSBicmllZmx5LCBtaWdyYXRlIGFueSB1c2Ugb2YgdGhhdCB0byBzZXR0aW5nc1xuICAgICAgY29uc3Qgb2xkQ29uZmlnRmlsZSA9IFBhdGguam9pbihhdG9tLmdldENvbmZpZ0RpclBhdGgoKSwgJ2xpbnRlci1jb25maWcuanNvbicpXG4gICAgICBpZiAoYXdhaXQgRlMuZXhpc3RzKG9sZENvbmZpZ0ZpbGUpKSB7XG4gICAgICAgIGxldCBkaXNhYmxlZFByb3ZpZGVycyA9IGF0b20uY29uZmlnLmdldCgnbGludGVyLmRpc2FibGVkUHJvdmlkZXJzJylcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBvbGRDb25maWdGaWxlQ29udGVudHMgPSBhd2FpdCBGUy5yZWFkRmlsZShvbGRDb25maWdGaWxlLCAndXRmOCcpXG4gICAgICAgICAgZGlzYWJsZWRQcm92aWRlcnMgPSBkaXNhYmxlZFByb3ZpZGVycy5jb25jYXQoSlNPTi5wYXJzZShvbGRDb25maWdGaWxlQ29udGVudHMpLmRpc2FibGVkKVxuICAgICAgICB9IGNhdGNoIChfKSB7IGNvbnNvbGUuZXJyb3IoJ1tMaW50ZXJdIEVycm9yIHJlYWRpbmcgb2xkIHN0YXRlIGZpbGUnLCBfKSB9XG4gICAgICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLmRpc2FibGVkUHJvdmlkZXJzJywgZGlzYWJsZWRQcm92aWRlcnMpXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgRlMudW5saW5rKG9sZENvbmZpZ0ZpbGUpXG4gICAgICAgIH0gY2F0Y2ggKF8pIHsgLyogTm8gT3AgKi8gfVxuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSlcbiAgICBpZGxlQ2FsbGJhY2tzLmFkZChvbGRDb25maWdDYWxsYmFja0lEKVxuXG4gICAgY29uc3QgbGludGVyRGVwc0NhbGxiYWNrID0gd2luZG93LnJlcXVlc3RJZGxlQ2FsbGJhY2soZnVuY3Rpb24gbGludGVyRGVwc0luc3RhbGwoKSB7XG4gICAgICBpZGxlQ2FsbGJhY2tzLmRlbGV0ZShsaW50ZXJEZXBzQ2FsbGJhY2spXG4gICAgICBpZiAoIWF0b20uaW5TcGVjTW9kZSgpKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBnbG9iYWwtcmVxdWlyZVxuICAgICAgICByZXF1aXJlKCdhdG9tLXBhY2thZ2UtZGVwcycpLmluc3RhbGwoJ2xpbnRlcicsIHRydWUpXG4gICAgICB9XG4gICAgfSlcbiAgICBpZGxlQ2FsbGJhY2tzLmFkZChsaW50ZXJEZXBzQ2FsbGJhY2spXG4gIH0sXG4gIGNvbnN1bWVMaW50ZXIobGludGVyOiBMaW50ZXJQcm92aWRlcik6IERpc3Bvc2FibGUge1xuICAgIGNvbnN0IGxpbnRlcnMgPSBbXS5jb25jYXQobGludGVyKVxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgbGludGVycykge1xuICAgICAgaW5zdGFuY2UuYWRkTGludGVyKGVudHJ5KVxuICAgIH1cbiAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBsaW50ZXJzKSB7XG4gICAgICAgIGluc3RhbmNlLmRlbGV0ZUxpbnRlcihlbnRyeSlcbiAgICAgIH1cbiAgICB9KVxuICB9LFxuICBjb25zdW1lTGludGVyTGVnYWN5KGxpbnRlcjogTGludGVyUHJvdmlkZXIpOiBEaXNwb3NhYmxlIHtcbiAgICBjb25zdCBsaW50ZXJzID0gW10uY29uY2F0KGxpbnRlcilcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGxpbnRlcnMpIHtcbiAgICAgIGxpbnRlci5uYW1lID0gbGludGVyLm5hbWUgfHwgJ1Vua25vd24nXG4gICAgICBsaW50ZXIubGludE9uRmx5ID0gQm9vbGVhbihsaW50ZXIubGludE9uRmx5KVxuICAgICAgaW5zdGFuY2UuYWRkTGludGVyKGVudHJ5LCB0cnVlKVxuICAgIH1cbiAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBsaW50ZXJzKSB7XG4gICAgICAgIGluc3RhbmNlLmRlbGV0ZUxpbnRlcihlbnRyeSlcbiAgICAgIH1cbiAgICB9KVxuICB9LFxuICBjb25zdW1lVUkodWk6IFVJKTogRGlzcG9zYWJsZSB7XG4gICAgY29uc3QgdWlzID0gW10uY29uY2F0KHVpKVxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgdWlzKSB7XG4gICAgICBpbnN0YW5jZS5hZGRVSShlbnRyeSlcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgdWlzKSB7XG4gICAgICAgIGluc3RhbmNlLmRlbGV0ZVVJKGVudHJ5KVxuICAgICAgfVxuICAgIH0pXG4gIH0sXG4gIHByb3ZpZGVJbmRpZSgpOiBPYmplY3Qge1xuICAgIHJldHVybiBpbmRpZSA9PlxuICAgICAgaW5zdGFuY2UuYWRkSW5kaWUoaW5kaWUpXG4gIH0sXG4gIHByb3ZpZGVJbmRpZUxlZ2FjeSgpOiBPYmplY3Qge1xuICAgIHJldHVybiB7XG4gICAgICByZWdpc3RlcjogaW5kaWUgPT4gaW5zdGFuY2UuYWRkTGVnYWN5SW5kaWUoaW5kaWUpLFxuICAgIH1cbiAgfSxcbiAgZGVhY3RpdmF0ZSgpIHtcbiAgICBpZGxlQ2FsbGJhY2tzLmZvckVhY2goY2FsbGJhY2tJRCA9PiB3aW5kb3cuY2FuY2VsSWRsZUNhbGxiYWNrKGNhbGxiYWNrSUQpKVxuICAgIGlkbGVDYWxsYmFja3MuY2xlYXIoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgfSxcbn1cbiJdfQ==