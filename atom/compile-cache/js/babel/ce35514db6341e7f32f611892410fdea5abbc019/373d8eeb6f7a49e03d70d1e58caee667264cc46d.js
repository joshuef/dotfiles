Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atomTernjsManager = require('../atom-ternjs-manager');

var _atomTernjsManager2 = _interopRequireDefault(_atomTernjsManager);

var _atomTernjsHelper = require('../atom-ternjs-helper');

var _underscorePlus = require('underscore-plus');

var _configTernConfig = require('../../config/tern-config');

'use babel';

var title = 'atom-ternjs project config';

var ConfigModel = (function () {
  function ConfigModel() {
    _classCallCheck(this, ConfigModel);

    /**
     * project configuration (.tern-project)
     * @type {Object}
     */
    this.projectConfig = {};
    /**
     * temporary project configuration
     * @type {Object}
     */
    this.config = {};
    /**
     * collection of all editors in config view
     * @type {Array}
     */
    this.editors = [];
  }

  _createClass(ConfigModel, [{
    key: 'getURI',
    value: function getURI() {

      return this.uRI;
    }
  }, {
    key: 'getProjectDir',
    value: function getProjectDir() {

      return this.projectDir;
    }
  }, {
    key: 'setProjectDir',
    value: function setProjectDir(dir) {

      this.projectDir = dir;
    }
  }, {
    key: 'setURI',
    value: function setURI(uRI) {

      this.uRI = uRI;
    }
  }, {
    key: 'getTitle',
    value: function getTitle() {

      return title;
    }
  }, {
    key: 'addLib',
    value: function addLib(lib) {

      if (!this.config.libs.includes(lib)) {

        this.config.libs.push(lib);
      }
    }
  }, {
    key: 'removeLib',
    value: function removeLib(lib) {
      var _this = this;

      var libs = this.config.libs.slice();

      libs.forEach(function (_lib, i) {

        if (_lib === lib) {

          _this.config.libs.splice(i, 1);
        }
      });
    }
  }, {
    key: 'getEcmaVersion',
    value: function getEcmaVersion() {

      return this.config.ecmaVersions;
    }
  }, {
    key: 'setEcmaVersion',
    value: function setEcmaVersion(value) {

      this.config.ecmaVersion = value;
    }
  }, {
    key: 'addPlugin',
    value: function addPlugin(key) {

      if (!this.config.plugins[key]) {

        // if there was a previous config for this pluging
        if (this.projectConfig.plugins && this.projectConfig.plugins[key]) {

          this.config.plugins[key] = this.projectConfig.plugins[key];

          return;
        }

        this.config.plugins[key] = _configTernConfig.availablePlugins[key];
      }
    }
  }, {
    key: 'removePlugin',
    value: function removePlugin(key) {

      this.config.plugins[key] && delete this.config.plugins[key];
    }
  }, {
    key: 'gatherData',
    value: function gatherData() {

      var projectDir = _atomTernjsManager2['default'].server && _atomTernjsManager2['default'].server.projectDir;

      if (!projectDir) {

        atom.notifications.addError('No Project found.');

        return false;
      }

      var projectConfig = (0, _atomTernjsHelper.readFile)(projectDir + '/.tern-project');

      if (!projectConfig) {

        this.config = (0, _underscorePlus.deepClone)(_configTernConfig.defaultProjectConfig);

        return true;
      }

      try {

        this.projectConfig = JSON.parse(projectConfig);
      } catch (error) {

        atom.notifications.addError(error);

        return false;
      }

      this.config = (0, _underscorePlus.deepClone)(this.projectConfig);

      if (!this.config.libs) {

        this.config.libs = [];
      }

      if (!this.config.plugins) {

        this.config.plugins = {};
      }

      return true;
    }
  }, {
    key: 'removeEditor',
    value: function removeEditor(editor) {
      var _this2 = this;

      if (!editor) {

        return;
      }

      var editors = this.editors.slice();

      editors.forEach(function (_editor, i) {

        if (_editor.ref === editor) {

          var buffer = _editor.ref.getModel().getBuffer();
          buffer.destroy();

          _this2.editors.splice(i, 1);
        }
      });
    }
  }, {
    key: 'updateConfig',
    value: function updateConfig() {
      var _this3 = this;

      this.config.loadEagerly = [];
      this.config.dontLoad = [];

      this.editors.forEach(function (editor) {

        var buffer = editor.ref.getModel().getBuffer();
        var text = buffer.getText().trim();

        if (text !== '') {

          _this3.config[editor.identifier].push(text);
        }
      });

      var json = JSON.stringify(this.config, null, 2);
      var activePane = atom.workspace.getActivePane();

      (0, _atomTernjsHelper.updateTernFile)(json);

      activePane && activePane.destroy();
    }
  }, {
    key: 'destroy',
    value: function destroy() {

      this.editors.forEach(function (editor) {

        var buffer = editor.ref.getModel().getBuffer();
        buffer.destroy();
      });

      this.editors = [];
    }
  }]);

  return ConfigModel;
})();

exports['default'] = ConfigModel;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9tb2RlbHMvY29uZmlnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7aUNBRW9CLHdCQUF3Qjs7OztnQ0FLckMsdUJBQXVCOzs4QkFJdkIsaUJBQWlCOztnQ0FLakIsMEJBQTBCOztBQWhCakMsV0FBVyxDQUFDOztBQWtCWixJQUFNLEtBQUssR0FBRyw0QkFBNEIsQ0FBQzs7SUFFdEIsV0FBVztBQUVuQixXQUZRLFdBQVcsR0FFaEI7MEJBRkssV0FBVzs7Ozs7O0FBUTVCLFFBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDOzs7OztBQUt4QixRQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQzs7Ozs7QUFLakIsUUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7R0FDbkI7O2VBbkJrQixXQUFXOztXQXFCeEIsa0JBQUc7O0FBRVAsYUFBTyxJQUFJLENBQUMsR0FBRyxDQUFDO0tBQ2pCOzs7V0FFWSx5QkFBRzs7QUFFZCxhQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7S0FDeEI7OztXQUVZLHVCQUFDLEdBQUcsRUFBRTs7QUFFakIsVUFBSSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7S0FDdkI7OztXQUVLLGdCQUFDLEdBQUcsRUFBRTs7QUFFVixVQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztLQUNoQjs7O1dBRU8sb0JBQUc7O0FBRVQsYUFBTyxLQUFLLENBQUM7S0FDZDs7O1dBRUssZ0JBQUMsR0FBRyxFQUFFOztBQUVWLFVBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7O0FBRW5DLFlBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUM1QjtLQUNGOzs7V0FFUSxtQkFBQyxHQUFHLEVBQUU7OztBQUViLFVBQU0sSUFBSSxHQUFH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QUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFDLE1BQU0sRUFBSzs7QUFFL0IsWUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNqRCxjQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDbEIsQ0FBQyxDQUFDOztBQUVILFVBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0tBQ25COzs7U0F0TWtCLFdBQVc7OztxQkFBWCxXQUFXIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9tb2RlbHMvY29uZmlnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmltcG9ydCBtYW5hZ2VyIGZyb20gJy4uL2F0b20tdGVybmpzLW1hbmFnZXInO1xuXG5pbXBvcnQge1xuICB1cGRhdGVUZXJuRmlsZSxcbiAgcmVhZEZpbGVcbn0gZnJvbSAnLi4vYXRvbS10ZXJuanMtaGVscGVyJztcblxuaW1wb3J0IHtcbiAgZGVlcENsb25lXG59IGZyb20gJ3VuZGVyc2NvcmUtcGx1cyc7XG5cbmltcG9ydCB7XG4gIGRlZmF1bHRQcm9qZWN0Q29uZmlnLFxuICBhdmFpbGFibGVQbHVnaW5zXG59IGZyb20gJy4uLy4uL2NvbmZpZy90ZXJuLWNvbmZpZyc7XG5cbmNvbnN0IHRpdGxlID0gJ2F0b20tdGVybmpzIHByb2plY3QgY29uZmlnJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29uZmlnTW9kZWwge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgLyoqXG4gICAgICogcHJvamVjdCBjb25maWd1cmF0aW9uICgudGVybi1wcm9qZWN0KVxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgdGhpcy5wcm9qZWN0Q29uZmlnID0ge307XG4gICAgLyoqXG4gICAgICogdGVtcG9yYXJ5IHByb2plY3QgY29uZmlndXJhdGlvblxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgdGhpcy5jb25maWcgPSB7fTtcbiAgICAvKipcbiAgICAgKiBjb2xsZWN0aW9uIG9mIGFsbCBlZGl0b3JzIGluIGNvbmZpZyB2aWV3XG4gICAgICogQHR5cGUge0FycmF5fVxuICAgICAqL1xuICAgIHRoaXMuZWRpdG9ycyA9IFtdO1xuICB9XG5cbiAgZ2V0VVJJKCkge1xuXG4gICAgcmV0dXJuIHRoaXMudVJJO1xuICB9XG5cbiAgZ2V0UHJvamVjdERpcigpIHtcblxuICAgIHJldHVybiB0aGlzLnByb2plY3REaXI7XG4gIH1cblxuICBzZXRQcm9qZWN0RGlyKGRpcikge1xuXG4gICAgdGhpcy5wcm9qZWN0RGlyID0gZGlyO1xuICB9XG5cbiAgc2V0VVJJKHVSSSkge1xuXG4gICAgdGhpcy51UkkgPSB1Ukk7XG4gIH1cblxuICBnZXRUaXRsZSgpIHtcblxuICAgIHJldHVybiB0aXRsZTtcbiAgfVxuXG4gIGFkZExpYihsaWIpIHtcblxuICAgIGlmICghdGhpcy5jb25maWcubGlicy5pbmNsdWRlcyhsaWIpKSB7XG5cbiAgICAgIHRoaXMuY29uZmlnLmxpYnMucHVzaChsaWIpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUxpYihsaWIpIHtcblxuICAgIGNvbnN0IGxpYnMgPSB0aGlzLmNvbmZpZy5saWJzLnNsaWNlKCk7XG5cbiAgICBsaWJzLmZvckVhY2goKF9saWIsIGkpID0+IHtcblxuICAgICAgaWYgKF9saWIgPT09IGxpYikge1xuXG4gICAgICAgIHRoaXMuY29uZmlnLmxpYnMuc3BsaWNlKGksIDEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0RWNtYVZlcnNpb24oKSB7XG5cbiAgICByZXR1cm4gdGhpcy5jb25maWcuZWNtYVZlcnNpb25zO1xuICB9XG5cbiAgc2V0RWNtYVZlcnNpb24odmFsdWUpIHtcblxuICAgIHRoaXMuY29uZmlnLmVjbWFWZXJzaW9uID0gdmFsdWU7XG4gIH1cblxuICBhZGRQbHVnaW4oa2V5KSB7XG5cbiAgICBpZiAoIXRoaXMuY29uZmlnLnBsdWdpbnNba2V5XSkge1xuXG4gICAgICAvLyBpZiB0aGVyZSB3YXMgYSBwcmV2aW91cyBjb25maWcgZm9yIHRoaXMgcGx1Z2luZ1xuICAgICAgaWYgKHRoaXMucHJvamVjdENvbmZpZy5wbHVnaW5zICYmIHRoaXMucHJvamVjdENvbmZpZy5wbHVnaW5zW2tleV0pIHtcblxuICAgICAgICB0aGlzLmNvbmZpZy5wbHVnaW5zW2tleV0gPSB0aGlzLnByb2plY3RDb25maWcucGx1Z2luc1trZXldO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5jb25maWcucGx1Z2luc1trZXldID0gYXZhaWxhYmxlUGx1Z2luc1trZXldO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZVBsdWdpbihrZXkpIHtcblxuICAgIHRoaXMuY29uZmlnLnBsdWdpbnNba2V5XSAmJiBkZWxldGUgdGhpcy5jb25maWcucGx1Z2luc1trZXldO1xuICB9XG5cbiAgZ2F0aGVyRGF0YSgpIHtcblxuICAgIGNvbnN0IHByb2plY3REaXIgPSBtYW5hZ2VyLnNlcnZlciAmJiBtYW5hZ2VyLnNlcnZlci5wcm9qZWN0RGlyO1xuXG4gICAgaWYgKCFwcm9qZWN0RGlyKSB7XG5cbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcignTm8gUHJvamVjdCBmb3VuZC4nKTtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHByb2plY3RDb25maWcgPSByZWFkRmlsZShgJHtwcm9qZWN0RGlyfS8udGVybi1wcm9qZWN0YCk7XG5cbiAgICBpZiAoIXByb2plY3RDb25maWcpIHtcblxuICAgICAgdGhpcy5jb25maWcgPSBkZWVwQ2xvbmUoZGVmYXVsdFByb2plY3RDb25maWcpO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB0cnkge1xuXG4gICAgICB0aGlzLnByb2plY3RDb25maWcgPSBKU09OLnBhcnNlKHByb2plY3RDb25maWcpO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcblxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKGVycm9yKTtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuY29uZmlnID0gZGVlcENsb25lKHRoaXMucHJvamVjdENvbmZpZyk7XG5cbiAgICBpZiAoIXRoaXMuY29uZmlnLmxpYnMpIHtcblxuICAgICAgdGhpcy5jb25maWcubGlicyA9IFtdO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5jb25maWcucGx1Z2lucykge1xuXG4gICAgICB0aGlzLmNvbmZpZy5wbHVnaW5zID0ge307XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZW1vdmVFZGl0b3IoZWRpdG9yKSB7XG5cbiAgICBpZiAoIWVkaXRvcikge1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZWRpdG9ycyA9IHRoaXMuZWRpdG9ycy5zbGljZSgpO1xuXG4gICAgZWRpdG9ycy5mb3JFYWNoKChfZWRpdG9yLCBpKSA9PiB7XG5cbiAgICAgIGlmIChfZWRpdG9yLnJlZiA9PT0gZWRpdG9yKSB7XG5cbiAgICAgICAgY29uc3QgYnVmZmVyID0gX2VkaXRvci5yZWYuZ2V0TW9kZWwoKS5nZXRCdWZmZXIoKTtcbiAgICAgICAgYnVmZmVyLmRlc3Ryb3koKTtcblxuICAgICAgICB0aGlzLmVkaXRvcnMuc3BsaWNlKGksIDEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdXBkYXRlQ29uZmlnKCkge1xuXG4gICAgdGhpcy5jb25maWcubG9hZEVhZ2VybHkgPSBbXTtcbiAgICB0aGlzLmNvbmZpZy5kb250TG9hZCA9IFtdO1xuXG4gICAgdGhpcy5lZGl0b3JzLmZvckVhY2goKGVkaXRvcikgPT4ge1xuXG4gICAgICBjb25zdCBidWZmZXIgPSBlZGl0b3IucmVmLmdldE1vZGVsKCkuZ2V0QnVmZmVyKCk7XG4gICAgICBjb25zdCB0ZXh0ID0gYnVmZmVyLmdldFRleHQoKS50cmltKCk7XG5cbiAgICAgIGlmICh0ZXh0ICE9PSAnJykge1xuXG4gICAgICAgIHRoaXMuY29uZmlnW2VkaXRvci5pZGVudGlmaWVyXS5wdXNoKHRleHQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QganNvbiA9IEpTT04uc3RyaW5naWZ5KHRoaXMuY29uZmlnLCBudWxsLCAyKTtcbiAgICBjb25zdCBhY3RpdmVQYW5lID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpO1xuXG4gICAgdXBkYXRlVGVybkZpbGUoanNvbik7XG5cbiAgICBhY3RpdmVQYW5lICYmIGFjdGl2ZVBhbmUuZGVzdHJveSgpO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcblxuICAgIHRoaXMuZWRpdG9ycy5mb3JFYWNoKChlZGl0b3IpID0+IHtcblxuICAgICAgY29uc3QgYnVmZmVyID0gZWRpdG9yLnJlZi5nZXRNb2RlbCgpLmdldEJ1ZmZlcigpO1xuICAgICAgYnVmZmVyLmRlc3Ryb3koKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZWRpdG9ycyA9IFtdO1xuICB9XG59XG4iXX0=