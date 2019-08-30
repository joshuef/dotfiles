Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _configTernConfigDocs = require('../../config/tern-config-docs');

var _configTernConfigDocs2 = _interopRequireDefault(_configTernConfigDocs);

var _configTernPluginsDefintionsJs = require('../../config/tern-plugins-defintions.js');

var _configTernPluginsDefintionsJs2 = _interopRequireDefault(_configTernPluginsDefintionsJs);

var _configTernConfig = require('../../config/tern-config');

'use babel';

var templateContainer = '\n\n  <div>\n    <h1 class="title"></h1>\n    <div class="content"></div>\n    <button class="btn btn-default">Save &amp; Restart Server</button>\n  </div>\n';

var createView = function createView(model) {

  return new ConfigView(model).init();
};

exports.createView = createView;

var ConfigView = (function () {
  function ConfigView(model) {
    _classCallCheck(this, ConfigView);

    this.setModel(model);
    model.gatherData();
  }

  _createClass(ConfigView, [{
    key: 'init',
    value: function init() {
      var _this = this;

      var projectDir = this.model.getProjectDir();

      this.el = document.createElement('div');
      this.el.classList.add('atom-ternjs-config');
      this.el.innerHTML = templateContainer;

      var elContent = this.el.querySelector('.content');
      var elTitle = this.el.querySelector('.title');
      elTitle.innerHTML = projectDir;

      var buttonSave = this.el.querySelector('button');

      buttonSave.addEventListener('click', function (e) {

        _this.model.updateConfig();
      });

      var sectionEcmaVersion = this.renderSection('ecmaVersion');
      var ecmaVersions = this.renderRadio();
      ecmaVersions.forEach(function (ecmaVersion) {
        return sectionEcmaVersion.appendChild(ecmaVersion);
      });
      elContent.appendChild(sectionEcmaVersion);

      var sectionLibs = this.renderSection('libs');
      var libs = this.renderlibs();
      libs.forEach(function (lib) {
        return sectionLibs.appendChild(lib);
      });
      elContent.appendChild(sectionLibs);

      elContent.appendChild(this.renderEditors('loadEagerly', this.model.config.loadEagerly));
      elContent.appendChild(this.renderEditors('dontLoad', this.model.config.dontLoad));

      var sectionPlugins = this.renderSection('plugins');
      var plugins = this.renderPlugins();
      plugins.forEach(function (plugin) {
        return sectionPlugins.appendChild(plugin);
      });
      elContent.appendChild(sectionPlugins);

      return this.el;
    }
  }, {
    key: 'renderSection',
    value: function renderSection(title) {

      var section = document.createElement('section');
      section.classList.add(title);

      var header = document.createElement('h2');
      header.innerHTML = title;

      section.appendChild(header);

      var docs = _configTernConfigDocs2['default'][title].doc;

      if (docs) {

        var doc = document.createElement('p');
        doc.innerHTML = docs;

        section.appendChild(doc);
      }

      return section;
    }
  }, {
    key: 'renderRadio',
    value: function renderRadio() {
      var _this2 = this;

      return _configTernConfig.ecmaVersions.map(function (ecmaVersion) {

        var inputWrapper = document.createElement('div');
        inputWrapper.classList.add('input-wrapper');

        var label = document.createElement('span');
        label.innerHTML = 'ecmaVersion ' + ecmaVersion;

        var radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'ecmaVersions';
        radio.value = ecmaVersion;
        radio.checked = parseInt(_this2.model.config.ecmaVersion) === ecmaVersion;

        radio.addEventListener('change', function (e) {

          _this2.model.setEcmaVersion(e.target.value);
        }, false);

        inputWrapper.appendChild(label);
        inputWrapper.appendChild(radio);

        return inputWrapper;
      });
    }
  }, {
    key: 'renderEditors',
    value: function renderEditors(identifier) {
      var _this3 = this;

      var paths = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      var section = this.renderSection(identifier);

      paths.forEach(function (path) {

        section.appendChild(_this3.createInputWrapper(path, identifier));
      });

      section.appendChild(this.createInputWrapper(null, identifier));

      return section;
    }
  }, {
    key: 'renderPlugins',
    value: function renderPlugins() {
      var _this4 = this;

      var plugins = Object.keys(this.model.config.plugins);
      var availablePluginsKeys = Object.keys(_configTernConfig.availablePlugins);
      var unknownPlugins = plugins.filter(function (plugin) {

        return !_configTernConfig.availablePlugins[plugin] ? true : false;
      });

      return availablePluginsKeys.map(function (plugin) {
        return _this4.renderPlugin(plugin);
      }).concat(unknownPlugins.map(function (plugin) {
        return _this4.renderPlugin(plugin);
      }));
    }
  }, {
    key: 'renderPlugin',
    value: function renderPlugin(plugin) {

      var wrapper = document.createElement('p');

      wrapper.appendChild(this.buildBoolean(plugin, 'plugin', this.model.config.plugins[plugin]));

      var doc = document.createElement('span');
      doc.innerHTML = _configTernPluginsDefintionsJs2['default'][plugin] && _configTernPluginsDefintionsJs2['default'][plugin].doc;

      wrapper.appendChild(doc);

      return wrapper;
    }
  }, {
    key: 'renderlibs',
    value: function renderlibs() {
      var _this5 = this;

      return _configTernConfig.availableLibs.map(function (lib) {

        return _this5.buildBoolean(lib, 'lib', _this5.model.config.libs.includes(lib));
      });
    }
  }, {
    key: 'buildBoolean',
    value: function buildBoolean(key, type, checked) {
      var _this6 = this;

      var inputWrapper = document.createElement('div');
      var label = document.createElement('span');
      var checkbox = document.createElement('input');

      inputWrapper.classList.add('input-wrapper');
      label.innerHTML = key;
      checkbox.type = 'checkbox';
      checkbox.value = key;
      checkbox.checked = checked;

      checkbox.addEventListener('change', function (e) {

        switch (type) {

          case 'lib':
            {

              e.target.checked ? _this6.model.addLib(key) : _this6.model.removeLib(key);
            }break;

          case 'plugin':
            {

              e.target.checked ? _this6.model.addPlugin(key) : _this6.model.removePlugin(key);
            }
        }
      }, false);

      inputWrapper.appendChild(label);
      inputWrapper.appendChild(checkbox);

      return inputWrapper;
    }
  }, {
    key: 'createInputWrapper',
    value: function createInputWrapper(path, identifier) {

      var inputWrapper = document.createElement('div');
      var editor = this.createTextEditor(path, identifier);

      inputWrapper.classList.add('input-wrapper');
      inputWrapper.appendChild(editor);
      inputWrapper.appendChild(this.createAdd(identifier));
      inputWrapper.appendChild(this.createSub(editor));

      return inputWrapper;
    }
  }, {
    key: 'createSub',
    value: function createSub(editor) {
      var _this7 = this;

      var sub = document.createElement('span');
      sub.classList.add('sub');
      sub.classList.add('inline-block');
      sub.classList.add('status-removed');
      sub.classList.add('icon');
      sub.classList.add('icon-diff-removed');

      sub.addEventListener('click', function (e) {

        _this7.model.removeEditor(editor);
        var inputWrapper = e.target.closest('.input-wrapper');
        inputWrapper.parentNode.removeChild(inputWrapper);
      }, false);

      return sub;
    }
  }, {
    key: 'createAdd',
    value: function createAdd(identifier) {
      var _this8 = this;

      var add = document.createElement('span');
      add.classList.add('add');
      add.classList.add('inline-block');
      add.classList.add('status-added');
      add.classList.add('icon');
      add.classList.add('icon-diff-added');
      add.addEventListener('click', function (e) {

        e.target.closest('section').appendChild(_this8.createInputWrapper(null, identifier));
      }, false);

      return add;
    }
  }, {
    key: 'createTextEditor',
    value: function createTextEditor(path, identifier) {

      var editor = document.createElement('atom-text-editor');
      editor.setAttribute('mini', true);

      if (path) {

        editor.getModel().getBuffer().setText(path);
      }

      this.model.editors.push({

        identifier: identifier,
        ref: editor
      });

      return editor;
    }
  }, {
    key: 'getModel',
    value: function getModel() {

      return this.model;
    }
  }, {
    key: 'setModel',
    value: function setModel(model) {

      this.model = model;
    }
  }, {
    key: 'destroy',
    value: function destroy() {

      this.el.remove();
    }
  }]);

  return ConfigView;
})();

exports['default'] = ConfigView;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL3ZpZXdzL2NvbmZpZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O29DQUUyQiwrQkFBK0I7Ozs7NkNBQzVCLHlDQUF5Qzs7OztnQ0FNaEUsMEJBQTBCOztBQVRqQyxXQUFXLENBQUM7O0FBV1osSUFBTSxpQkFBaUIsa0tBT3RCLENBQUM7O0FBRUssSUFBTSxVQUFVLEdBQUcsU0FBYixVQUFVLENBQUksS0FBSyxFQUFLOztBQUVuQyxTQUFPLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0NBQ3JDLENBQUM7Ozs7SUFFbUIsVUFBVTtBQUVsQixXQUZRLFVBQVUsQ0FFakIsS0FBSyxFQUFFOzBCQUZBLFVBQVU7O0FBSTNCLFFBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDckIsU0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDO0dBQ3BCOztlQU5rQixVQUFVOztXQVF6QixnQkFBRzs7O0FBRUwsVUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQzs7QUFFOUMsVUFBSSxDQUFDLEVBQUUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3hDLFVBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBQzVDLFVBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHLGlCQUFpQixDQUFDOztBQUV0QyxVQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNwRCxVQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNoRCxhQUFPLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQzs7QUFF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QUFFLEtBQUssQ0FBQyxDQUFDOztBQUVWLGFBQU8sR0FBRyxDQUFDO0tBQ1o7OztXQUVlLDBCQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7O0FBRWpDLFVBQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUMxRCxZQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQzs7QUFFbEMsVUFBSSxJQUFJLEVBQUU7O0FBRVIsY0FBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUM3Qzs7QUFFRCxVQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7O0FBRXRCLGtCQUFVLEVBQVYsVUFBVTtBQUNWLFdBQUcsRUFBRSxNQUFNO09BQ1osQ0FBQyxDQUFDOztBQUVILGFBQU8sTUFBTSxDQUFDO0tBQ2Y7OztXQUVPLG9CQUFHOztBQUVULGFBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztLQUNuQjs7O1dBRU8sa0JBQUMsS0FBSyxFQUFFOztBQUVkLFVBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0tBQ3BCOzs7V0FFTSxtQkFBRzs7QUFFUixVQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO0tBQ2xCOzs7U0FyUmtCLFVBQVU7OztxQkFBVixVQUFVIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL3ZpZXdzL2NvbmZpZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgdGVybkNvbmZpZ0RvY3MgZnJvbSAnLi4vLi4vY29uZmlnL3Rlcm4tY29uZmlnLWRvY3MnO1xuaW1wb3J0IHBsdWdpbkRlZmluaXRpb25zIGZyb20gJy4uLy4uL2NvbmZpZy90ZXJuLXBsdWdpbnMtZGVmaW50aW9ucy5qcyc7XG5cbmltcG9ydCB7XG4gIGVjbWFWZXJzaW9ucyxcbiAgYXZhaWxhYmxlTGlicyxcbiAgYXZhaWxhYmxlUGx1Z2luc1xufSBmcm9tICcuLi8uLi9jb25maWcvdGVybi1jb25maWcnO1xuXG5jb25zdCB0ZW1wbGF0ZUNvbnRhaW5lciA9IGBcblxuICA8ZGl2PlxuICAgIDxoMSBjbGFzcz1cInRpdGxlXCI+PC9oMT5cbiAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPjwvZGl2PlxuICAgIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIj5TYXZlICZhbXA7IFJlc3RhcnQgU2VydmVyPC9idXR0b24+XG4gIDwvZGl2PlxuYDtcblxuZXhwb3J0IGNvbnN0IGNyZWF0ZVZpZXcgPSAobW9kZWwpID0+IHtcblxuICByZXR1cm4gbmV3IENvbmZpZ1ZpZXcobW9kZWwpLmluaXQoKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbmZpZ1ZpZXcge1xuXG4gIGNvbnN0cnVjdG9yKG1vZGVsKSB7XG5cbiAgICB0aGlzLnNldE1vZGVsKG1vZGVsKTtcbiAgICBtb2RlbC5nYXRoZXJEYXRhKCk7XG4gIH1cblxuICBpbml0KCkge1xuXG4gICAgY29uc3QgcHJvamVjdERpciA9IHRoaXMubW9kZWwuZ2V0UHJvamVjdERpcigpO1xuXG4gICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWwuY2xhc3NMaXN0LmFkZCgnYXRvbS10ZXJuanMtY29uZmlnJyk7XG4gICAgdGhpcy5lbC5pbm5lckhUTUwgPSB0ZW1wbGF0ZUNvbnRhaW5lcjtcblxuICAgIGNvbnN0IGVsQ29udGVudCA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignLmNvbnRlbnQnKTtcbiAgICBjb25zdCBlbFRpdGxlID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcudGl0bGUnKTtcbiAgICBlbFRpdGxlLmlubmVySFRNTCA9IHByb2plY3REaXI7XG5cbiAgICBjb25zdCBidXR0b25TYXZlID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCdidXR0b24nKTtcblxuICAgIGJ1dHRvblNhdmUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuXG4gICAgICB0aGlzLm1vZGVsLnVwZGF0ZUNvbmZpZygpO1xuICAgIH0pO1xuXG4gICAgY29uc3Qgc2VjdGlvbkVjbWFWZXJzaW9uID0gdGhpcy5yZW5kZXJTZWN0aW9uKCdlY21hVmVyc2lvbicpO1xuICAgIGNvbnN0IGVjbWFWZXJzaW9ucyA9IHRoaXMucmVuZGVyUmFkaW8oKTtcbiAgICBlY21hVmVyc2lvbnMuZm9yRWFjaChlY21hVmVyc2lvbiA9PiBzZWN0aW9uRWNtYVZlcnNpb24uYXBwZW5kQ2hpbGQoZWNtYVZlcnNpb24pKTtcbiAgICBlbENvbnRlbnQuYXBwZW5kQ2hpbGQoc2VjdGlvbkVjbWFWZXJzaW9uKTtcblxuICAgIGNvbnN0IHNlY3Rpb25MaWJzID0gdGhpcy5yZW5kZXJTZWN0aW9uKCdsaWJzJyk7XG4gICAgY29uc3QgbGlicyA9IHRoaXMucmVuZGVybGlicygpO1xuICAgIGxpYnMuZm9yRWFjaChsaWIgPT4gc2VjdGlvbkxpYnMuYXBwZW5kQ2hpbGQobGliKSk7XG4gICAgZWxDb250ZW50LmFwcGVuZENoaWxkKHNlY3Rpb25MaWJzKTtcblxuICAgIGVsQ29udGVudC5hcHBlbmRDaGlsZCh0aGlzLnJlbmRlckVkaXRvcnMoJ2xvYWRFYWdlcmx5JywgdGhpcy5tb2RlbC5jb25maWcubG9hZEVhZ2VybHkpKTtcbiAgICBlbENvbnRlbnQuYXBwZW5kQ2hpbGQodGhpcy5yZW5kZXJFZGl0b3JzKCdkb250TG9hZCcsIHRoaXMubW9kZWwuY29uZmlnLmRvbnRMb2FkKSk7XG5cbiAgICBjb25zdCBzZWN0aW9uUGx1Z2lucyA9IHRoaXMucmVuZGVyU2VjdGlvbigncGx1Z2lucycpO1xuICAgIGNvbnN0IHBsdWdpbnMgPSB0aGlzLnJlbmRlclBsdWdpbnMoKTtcbiAgICBwbHVnaW5zLmZvckVhY2gocGx1Z2luID0+IHNlY3Rpb25QbHVnaW5zLmFwcGVuZENoaWxkKHBsdWdpbikpO1xuICAgIGVsQ29udGVudC5hcHBlbmRDaGlsZChzZWN0aW9uUGx1Z2lucyk7XG5cbiAgICByZXR1cm4gdGhpcy5lbDtcbiAgfVxuXG4gIHJlbmRlclNlY3Rpb24odGl0bGUpIHtcblxuICAgIGNvbnN0IHNlY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWN0aW9uJyk7XG4gICAgc2VjdGlvbi5jbGFzc0xpc3QuYWRkKHRpdGxlKTtcblxuICAgIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gyJyk7XG4gICAgaGVhZGVyLmlubmVySFRNTCA9IHRpdGxlO1xuXG4gICAgc2VjdGlvbi5hcHBlbmRDaGlsZChoZWFkZXIpO1xuXG4gICAgY29uc3QgZG9jcyA9IHRlcm5Db25maWdEb2NzW3RpdGxlXS5kb2M7XG5cbiAgICBpZiAoZG9jcykge1xuXG4gICAgICBjb25zdCBkb2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gICAgICBkb2MuaW5uZXJIVE1MID0gZG9jcztcblxuICAgICAgc2VjdGlvbi5hcHBlbmRDaGlsZChkb2MpO1xuICAgIH1cblxuICAgIHJldHVybiBzZWN0aW9uO1xuICB9XG5cbiAgcmVuZGVyUmFkaW8oKSB7XG5cbiAgICByZXR1cm4gZWNtYVZlcnNpb25zLm1hcCgoZWNtYVZlcnNpb24pID0+IHtcblxuICAgICAgY29uc3QgaW5wdXRXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBpbnB1dFdyYXBwZXIuY2xhc3NMaXN0LmFkZCgnaW5wdXQtd3JhcHBlcicpO1xuXG4gICAgICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgIGxhYmVsLmlubmVySFRNTCA9IGBlY21hVmVyc2lvbiAke2VjbWFWZXJzaW9ufWA7XG5cbiAgICAgIGNvbnN0IHJhZGlvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgIHJhZGlvLnR5cGUgPSAncmFkaW8nO1xuICAgICAgcmFkaW8ubmFtZSA9ICdlY21hVmVyc2lvbnMnO1xuICAgICAgcmFkaW8udmFsdWUgPSBlY21hVmVyc2lvbjtcbiAgICAgIHJhZGlvLmNoZWNrZWQgPSBwYXJzZUludCh0aGlzLm1vZGVsLmNvbmZpZy5lY21hVmVyc2lvbikgPT09IGVjbWFWZXJzaW9uO1xuXG4gICAgICByYWRpby5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZSkgPT4ge1xuXG4gICAgICAgIHRoaXMubW9kZWwuc2V0RWNtYVZlcnNpb24oZS50YXJnZXQudmFsdWUpO1xuXG4gICAgICB9LCBmYWxzZSk7XG5cbiAgICAgIGlucHV0V3JhcHBlci5hcHBlbmRDaGlsZChsYWJlbCk7XG4gICAgICBpbnB1dFdyYXBwZXIuYXBwZW5kQ2hpbGQocmFkaW8pO1xuXG4gICAgICByZXR1cm4gaW5wdXRXcmFwcGVyO1xuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyRWRpdG9ycyhpZGVudGlmaWVyLCBwYXRocyA9IFtdKSB7XG5cbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5yZW5kZXJTZWN0aW9uKGlkZW50aWZpZXIpO1xuXG4gICAgcGF0aHMuZm9yRWFjaCgocGF0aCkgPT4ge1xuXG4gICAgICBzZWN0aW9uLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlSW5wdXRXcmFwcGVyKHBhdGgsIGlkZW50aWZpZXIpKTtcbiAgICB9KTtcblxuICAgIHNlY3Rpb24uYXBwZW5kQ2hpbGQodGhpcy5jcmVhdGVJbnB1dFdyYXBwZXIobnVsbCwgaWRlbnRpZmllcikpO1xuXG4gICAgcmV0dXJuIHNlY3Rpb247XG4gIH1cblxuICByZW5kZXJQbHVnaW5zKCkge1xuXG4gICAgY29uc3QgcGx1Z2lucyA9IE9iamVjdC5rZXlzKHRoaXMubW9kZWwuY29uZmlnLnBsdWdpbnMpO1xuICAgIGNvbnN0IGF2YWlsYWJsZVBsdWdpbnNLZXlzID0gT2JqZWN0LmtleXMoYXZhaWxhYmxlUGx1Z2lucyk7XG4gICAgY29uc3QgdW5rbm93blBsdWdpbnMgPSBwbHVnaW5zLmZpbHRlcigocGx1Z2luKSA9PiB7XG5cbiAgICAgIHJldHVybiAhYXZhaWxhYmxlUGx1Z2luc1twbHVnaW5dID8gdHJ1ZSA6IGZhbHNlO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGF2YWlsYWJsZVBsdWdpbnNLZXlzLm1hcChwbHVnaW4gPT4gdGhpcy5yZW5kZXJQbHVnaW4ocGx1Z2luKSlcbiAgICAuY29uY2F0KHVua25vd25QbHVnaW5zLm1hcChwbHVnaW4gPT4gdGhpcy5yZW5kZXJQbHVnaW4ocGx1Z2luKSkpO1xuICB9XG5cbiAgcmVuZGVyUGx1Z2luKHBsdWdpbikge1xuXG4gICAgY29uc3Qgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcblxuICAgIHdyYXBwZXIuYXBwZW5kQ2hpbGQoXG4gICAgICB0aGlzLmJ1aWxkQm9vbGVhbihcbiAgICAgICAgcGx1Z2luLFxuICAgICAgICAncGx1Z2luJyxcbiAgICAgICAgdGhpcy5tb2RlbC5jb25maWcucGx1Z2luc1twbHVnaW5dXG4gICAgICApXG4gICAgKTtcblxuICAgIGNvbnN0IGRvYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBkb2MuaW5uZXJIVE1MID0gcGx1Z2luRGVmaW5pdGlvbnNbcGx1Z2luXSAmJiBwbHVnaW5EZWZpbml0aW9uc1twbHVnaW5dLmRvYztcblxuICAgIHdyYXBwZXIuYXBwZW5kQ2hpbGQoZG9jKTtcblxuICAgIHJldHVybiB3cmFwcGVyO1xuICB9XG5cbiAgcmVuZGVybGlicygpIHtcblxuICAgIHJldHVybiBhdmFpbGFibGVMaWJzLm1hcCgobGliKSA9PiB7XG5cbiAgICAgIHJldHVybiB0aGlzLmJ1aWxkQm9vbGVhbihcbiAgICAgICAgICBsaWIsXG4gICAgICAgICAgJ2xpYicsXG4gICAgICAgICAgdGhpcy5tb2RlbC5jb25maWcubGlicy5pbmNsdWRlcyhsaWIpXG4gICAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICBidWlsZEJvb2xlYW4oa2V5LCB0eXBlLCBjaGVja2VkKSB7XG5cbiAgICBjb25zdCBpbnB1dFdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBjb25zdCBjaGVja2JveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cbiAgICBpbnB1dFdyYXBwZXIuY2xhc3NMaXN0LmFkZCgnaW5wdXQtd3JhcHBlcicpO1xuICAgIGxhYmVsLmlubmVySFRNTCA9IGtleTtcbiAgICBjaGVja2JveC50eXBlID0gJ2NoZWNrYm94JztcbiAgICBjaGVja2JveC52YWx1ZSA9IGtleTtcbiAgICBjaGVja2JveC5jaGVja2VkID0gY2hlY2tlZDtcblxuICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlKSA9PiB7XG5cbiAgICAgIHN3aXRjaCAodHlwZSkge1xuXG4gICAgICAgIGNhc2UgJ2xpYic6IHtcblxuICAgICAgICAgIGUudGFyZ2V0LmNoZWNrZWQgPyB0aGlzLm1vZGVsLmFkZExpYihrZXkpIDogdGhpcy5tb2RlbC5yZW1vdmVMaWIoa2V5KTtcblxuICAgICAgICB9IGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3BsdWdpbic6IHtcblxuICAgICAgICAgIGUudGFyZ2V0LmNoZWNrZWQgPyB0aGlzLm1vZGVsLmFkZFBsdWdpbihrZXkpIDogdGhpcy5tb2RlbC5yZW1vdmVQbHVnaW4oa2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgfSwgZmFsc2UpO1xuXG4gICAgaW5wdXRXcmFwcGVyLmFwcGVuZENoaWxkKGxhYmVsKTtcbiAgICBpbnB1dFdyYXBwZXIuYXBwZW5kQ2hpbGQoY2hlY2tib3gpO1xuXG4gICAgcmV0dXJuIGlucHV0V3JhcHBlcjtcbiAgfVxuXG4gIGNyZWF0ZUlucHV0V3JhcHBlcihwYXRoLCBpZGVudGlmaWVyKSB7XG5cbiAgICBjb25zdCBpbnB1dFdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmNyZWF0ZVRleHRFZGl0b3IocGF0aCwgaWRlbnRpZmllcik7XG5cbiAgICBpbnB1dFdyYXBwZXIuY2xhc3NMaXN0LmFkZCgnaW5wdXQtd3JhcHBlcicpO1xuICAgIGlucHV0V3JhcHBlci5hcHBlbmRDaGlsZChlZGl0b3IpO1xuICAgIGlucHV0V3JhcHBlci5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZUFkZChpZGVudGlmaWVyKSk7XG4gICAgaW5wdXRXcmFwcGVyLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlU3ViKGVkaXRvcikpO1xuXG4gICAgcmV0dXJuIGlucHV0V3JhcHBlcjtcbiAgfVxuXG4gIGNyZWF0ZVN1YihlZGl0b3IpIHtcblxuICAgIGNvbnN0IHN1YiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBzdWIuY2xhc3NMaXN0LmFkZCgnc3ViJyk7XG4gICAgc3ViLmNsYXNzTGlzdC5hZGQoJ2lubGluZS1ibG9jaycpO1xuICAgIHN1Yi5jbGFzc0xpc3QuYWRkKCdzdGF0dXMtcmVtb3ZlZCcpO1xuICAgIHN1Yi5jbGFzc0xpc3QuYWRkKCdpY29uJyk7XG4gICAgc3ViLmNsYXNzTGlzdC5hZGQoJ2ljb24tZGlmZi1yZW1vdmVkJyk7XG5cbiAgICBzdWIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuXG4gICAgICB0aGlzLm1vZGVsLnJlbW92ZUVkaXRvcihlZGl0b3IpO1xuICAgICAgY29uc3QgaW5wdXRXcmFwcGVyID0gZS50YXJnZXQuY2xvc2VzdCgnLmlucHV0LXdyYXBwZXInKTtcbiAgICAgIGlucHV0V3JhcHBlci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGlucHV0V3JhcHBlcik7XG5cbiAgICB9LCBmYWxzZSk7XG5cbiAgICByZXR1cm4gc3ViO1xuICB9XG5cbiAgY3JlYXRlQWRkKGlkZW50aWZpZXIpIHtcblxuICAgIGNvbnN0IGFkZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBhZGQuY2xhc3NMaXN0LmFkZCgnYWRkJyk7XG4gICAgYWRkLmNsYXNzTGlzdC5hZGQoJ2lubGluZS1ibG9jaycpO1xuICAgIGFkZC5jbGFzc0xpc3QuYWRkKCdzdGF0dXMtYWRkZWQnKTtcbiAgICBhZGQuY2xhc3NMaXN0LmFkZCgnaWNvbicpO1xuICAgIGFkZC5jbGFzc0xpc3QuYWRkKCdpY29uLWRpZmYtYWRkZWQnKTtcbiAgICBhZGQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuXG4gICAgICBlLnRhcmdldC5jbG9zZXN0KCdzZWN0aW9uJykuYXBwZW5kQ2hpbGQodGhpcy5jcmVhdGVJbnB1dFdyYXBwZXIobnVsbCwgaWRlbnRpZmllcikpO1xuXG4gICAgfSwgZmFsc2UpO1xuXG4gICAgcmV0dXJuIGFkZDtcbiAgfVxuXG4gIGNyZWF0ZVRleHRFZGl0b3IocGF0aCwgaWRlbnRpZmllcikge1xuXG4gICAgY29uc3QgZWRpdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXRvbS10ZXh0LWVkaXRvcicpO1xuICAgIGVkaXRvci5zZXRBdHRyaWJ1dGUoJ21pbmknLCB0cnVlKTtcblxuICAgIGlmIChwYXRoKSB7XG5cbiAgICAgIGVkaXRvci5nZXRNb2RlbCgpLmdldEJ1ZmZlcigpLnNldFRleHQocGF0aCk7XG4gICAgfVxuXG4gICAgdGhpcy5tb2RlbC5lZGl0b3JzLnB1c2goe1xuXG4gICAgICBpZGVudGlmaWVyLFxuICAgICAgcmVmOiBlZGl0b3JcbiAgICB9KTtcblxuICAgIHJldHVybiBlZGl0b3I7XG4gIH1cblxuICBnZXRNb2RlbCgpIHtcblxuICAgIHJldHVybiB0aGlzLm1vZGVsO1xuICB9XG5cbiAgc2V0TW9kZWwobW9kZWwpIHtcblxuICAgIHRoaXMubW9kZWwgPSBtb2RlbDtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG5cbiAgICB0aGlzLmVsLnJlbW92ZSgpO1xuICB9XG59XG4iXX0=