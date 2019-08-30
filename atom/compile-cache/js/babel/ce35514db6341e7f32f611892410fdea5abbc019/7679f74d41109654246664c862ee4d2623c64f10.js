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
        radio.checked = _this2.model.config.ecmaVersion === ecmaVersion;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi92aWV3cy9jb25maWcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztvQ0FFMkIsK0JBQStCOzs7OzZDQUM1Qix5Q0FBeUM7Ozs7Z0NBTWhFLDBCQUEwQjs7QUFUakMsV0FBVyxDQUFDOztBQVdaLElBQU0saUJBQWlCLGtLQU90QixDQUFDOztBQUVLLElBQU0sVUFBVSxHQUFHLFNBQWIsVUFBVSxDQUFJLEtBQUssRUFBSzs7QUFFbkMsU0FBTyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztDQUNyQyxDQUFDOzs7O0lBRW1CLFVBQVU7QUFFbEIsV0FGUSxVQUFVLENBRWpCLEtBQUssRUFBRTswQkFGQSxVQUFVOztBQUkzQixRQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3JCLFNBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQztHQUNwQjs7ZUFOa0IsVUFBVTs7V0FRekIsZ0JBQUc7OztBQUVMLFVBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7O0FBRTlDLFVBQUksQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QyxVQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUM1QyxVQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQzs7QUFFdEMsVUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDcEQsVUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDaEQsYUFBTyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUM7O0FBRS9CLFVBQU0s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VixhQUFPLEdBQUcsQ0FBQztLQUNaOzs7V0FFZSwwQkFBQyxJQUFJLEVBQUUsVUFBVSxFQUFFOztBQUVqQyxVQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDMUQsWUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRWxDLFVBQUksSUFBSSxFQUFFOztBQUVSLGNBQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDN0M7O0FBRUQsVUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDOztBQUV0QixrQkFBVSxFQUFWLFVBQVU7QUFDVixXQUFHLEVBQUUsTUFBTTtPQUNaLENBQUMsQ0FBQzs7QUFFSCxhQUFPLE1BQU0sQ0FBQztLQUNmOzs7V0FFTyxvQkFBRzs7QUFFVCxhQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7S0FDbkI7OztXQUVPLGtCQUFDLEtBQUssRUFBRTs7QUFFZCxVQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztLQUNwQjs7O1dBRU0sbUJBQUc7O0FBRVIsVUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztLQUNsQjs7O1NBclJrQixVQUFVOzs7cUJBQVYsVUFBVSIsImZpbGUiOiIvVXNlcnMvam9zaC8uYXRvbS9wYWNrYWdlcy9hdG9tLXRlcm5qcy9saWIvdmlld3MvY29uZmlnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmltcG9ydCB0ZXJuQ29uZmlnRG9jcyBmcm9tICcuLi8uLi9jb25maWcvdGVybi1jb25maWctZG9jcyc7XG5pbXBvcnQgcGx1Z2luRGVmaW5pdGlvbnMgZnJvbSAnLi4vLi4vY29uZmlnL3Rlcm4tcGx1Z2lucy1kZWZpbnRpb25zLmpzJztcblxuaW1wb3J0IHtcbiAgZWNtYVZlcnNpb25zLFxuICBhdmFpbGFibGVMaWJzLFxuICBhdmFpbGFibGVQbHVnaW5zXG59IGZyb20gJy4uLy4uL2NvbmZpZy90ZXJuLWNvbmZpZyc7XG5cbmNvbnN0IHRlbXBsYXRlQ29udGFpbmVyID0gYFxuXG4gIDxkaXY+XG4gICAgPGgxIGNsYXNzPVwidGl0bGVcIj48L2gxPlxuICAgIDxkaXYgY2xhc3M9XCJjb250ZW50XCI+PC9kaXY+XG4gICAgPGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tZGVmYXVsdFwiPlNhdmUgJmFtcDsgUmVzdGFydCBTZXJ2ZXI8L2J1dHRvbj5cbiAgPC9kaXY+XG5gO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlVmlldyA9IChtb2RlbCkgPT4ge1xuXG4gIHJldHVybiBuZXcgQ29uZmlnVmlldyhtb2RlbCkuaW5pdCgpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29uZmlnVmlldyB7XG5cbiAgY29uc3RydWN0b3IobW9kZWwpIHtcblxuICAgIHRoaXMuc2V0TW9kZWwobW9kZWwpO1xuICAgIG1vZGVsLmdhdGhlckRhdGEoKTtcbiAgfVxuXG4gIGluaXQoKSB7XG5cbiAgICBjb25zdCBwcm9qZWN0RGlyID0gdGhpcy5tb2RlbC5nZXRQcm9qZWN0RGlyKCk7XG5cbiAgICB0aGlzLmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbC5jbGFzc0xpc3QuYWRkKCdhdG9tLXRlcm5qcy1jb25maWcnKTtcbiAgICB0aGlzLmVsLmlubmVySFRNTCA9IHRlbXBsYXRlQ29udGFpbmVyO1xuXG4gICAgY29uc3QgZWxDb250ZW50ID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcuY29udGVudCcpO1xuICAgIGNvbnN0IGVsVGl0bGUgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy50aXRsZScpO1xuICAgIGVsVGl0bGUuaW5uZXJIVE1MID0gcHJvamVjdERpcjtcblxuICAgIGNvbnN0IGJ1dHRvblNhdmUgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbicpO1xuXG4gICAgYnV0dG9uU2F2ZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG5cbiAgICAgIHRoaXMubW9kZWwudXBkYXRlQ29uZmlnKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBzZWN0aW9uRWNtYVZlcnNpb24gPSB0aGlzLnJlbmRlclNlY3Rpb24oJ2VjbWFWZXJzaW9uJyk7XG4gICAgY29uc3QgZWNtYVZlcnNpb25zID0gdGhpcy5yZW5kZXJSYWRpbygpO1xuICAgIGVjbWFWZXJzaW9ucy5mb3JFYWNoKGVjbWFWZXJzaW9uID0+IHNlY3Rpb25FY21hVmVyc2lvbi5hcHBlbmRDaGlsZChlY21hVmVyc2lvbikpO1xuICAgIGVsQ29udGVudC5hcHBlbmRDaGlsZChzZWN0aW9uRWNtYVZlcnNpb24pO1xuXG4gICAgY29uc3Qgc2VjdGlvbkxpYnMgPSB0aGlzLnJlbmRlclNlY3Rpb24oJ2xpYnMnKTtcbiAgICBjb25zdCBsaWJzID0gdGhpcy5yZW5kZXJsaWJzKCk7XG4gICAgbGlicy5mb3JFYWNoKGxpYiA9PiBzZWN0aW9uTGlicy5hcHBlbmRDaGlsZChsaWIpKTtcbiAgICBlbENvbnRlbnQuYXBwZW5kQ2hpbGQoc2VjdGlvbkxpYnMpO1xuXG4gICAgZWxDb250ZW50LmFwcGVuZENoaWxkKHRoaXMucmVuZGVyRWRpdG9ycygnbG9hZEVhZ2VybHknLCB0aGlzLm1vZGVsLmNvbmZpZy5sb2FkRWFnZXJseSkpO1xuICAgIGVsQ29udGVudC5hcHBlbmRDaGlsZCh0aGlzLnJlbmRlckVkaXRvcnMoJ2RvbnRMb2FkJywgdGhpcy5tb2RlbC5jb25maWcuZG9udExvYWQpKTtcblxuICAgIGNvbnN0IHNlY3Rpb25QbHVnaW5zID0gdGhpcy5yZW5kZXJTZWN0aW9uKCdwbHVnaW5zJyk7XG4gICAgY29uc3QgcGx1Z2lucyA9IHRoaXMucmVuZGVyUGx1Z2lucygpO1xuICAgIHBsdWdpbnMuZm9yRWFjaChwbHVnaW4gPT4gc2VjdGlvblBsdWdpbnMuYXBwZW5kQ2hpbGQocGx1Z2luKSk7XG4gICAgZWxDb250ZW50LmFwcGVuZENoaWxkKHNlY3Rpb25QbHVnaW5zKTtcblxuICAgIHJldHVybiB0aGlzLmVsO1xuICB9XG5cbiAgcmVuZGVyU2VjdGlvbih0aXRsZSkge1xuXG4gICAgY29uc3Qgc2VjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlY3Rpb24nKTtcbiAgICBzZWN0aW9uLmNsYXNzTGlzdC5hZGQodGl0bGUpO1xuXG4gICAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDInKTtcbiAgICBoZWFkZXIuaW5uZXJIVE1MID0gdGl0bGU7XG5cbiAgICBzZWN0aW9uLmFwcGVuZENoaWxkKGhlYWRlcik7XG5cbiAgICBjb25zdCBkb2NzID0gdGVybkNvbmZpZ0RvY3NbdGl0bGVdLmRvYztcblxuICAgIGlmIChkb2NzKSB7XG5cbiAgICAgIGNvbnN0IGRvYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgICAgIGRvYy5pbm5lckhUTUwgPSBkb2NzO1xuXG4gICAgICBzZWN0aW9uLmFwcGVuZENoaWxkKGRvYyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlY3Rpb247XG4gIH1cblxuICByZW5kZXJSYWRpbygpIHtcblxuICAgIHJldHVybiBlY21hVmVyc2lvbnMubWFwKChlY21hVmVyc2lvbikgPT4ge1xuXG4gICAgICBjb25zdCBpbnB1dFdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIGlucHV0V3JhcHBlci5jbGFzc0xpc3QuYWRkKCdpbnB1dC13cmFwcGVyJyk7XG5cbiAgICAgIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgbGFiZWwuaW5uZXJIVE1MID0gYGVjbWFWZXJzaW9uICR7ZWNtYVZlcnNpb259YDtcblxuICAgICAgY29uc3QgcmFkaW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgcmFkaW8udHlwZSA9ICdyYWRpbyc7XG4gICAgICByYWRpby5uYW1lID0gJ2VjbWFWZXJzaW9ucyc7XG4gICAgICByYWRpby52YWx1ZSA9IGVjbWFWZXJzaW9uO1xuICAgICAgcmFkaW8uY2hlY2tlZCA9IHRoaXMubW9kZWwuY29uZmlnLmVjbWFWZXJzaW9uID09PSBlY21hVmVyc2lvbjtcblxuICAgICAgcmFkaW8uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGUpID0+IHtcblxuICAgICAgICB0aGlzLm1vZGVsLnNldEVjbWFWZXJzaW9uKGUudGFyZ2V0LnZhbHVlKTtcblxuICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICBpbnB1dFdyYXBwZXIuYXBwZW5kQ2hpbGQobGFiZWwpO1xuICAgICAgaW5wdXRXcmFwcGVyLmFwcGVuZENoaWxkKHJhZGlvKTtcblxuICAgICAgcmV0dXJuIGlucHV0V3JhcHBlcjtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlckVkaXRvcnMoaWRlbnRpZmllciwgcGF0aHMgPSBbXSkge1xuXG4gICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMucmVuZGVyU2VjdGlvbihpZGVudGlmaWVyKTtcblxuICAgIHBhdGhzLmZvckVhY2goKHBhdGgpID0+IHtcblxuICAgICAgc2VjdGlvbi5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZUlucHV0V3JhcHBlcihwYXRoLCBpZGVudGlmaWVyKSk7XG4gICAgfSk7XG5cbiAgICBzZWN0aW9uLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlSW5wdXRXcmFwcGVyKG51bGwsIGlkZW50aWZpZXIpKTtcblxuICAgIHJldHVybiBzZWN0aW9uO1xuICB9XG5cbiAgcmVuZGVyUGx1Z2lucygpIHtcblxuICAgIGNvbnN0IHBsdWdpbnMgPSBPYmplY3Qua2V5cyh0aGlzLm1vZGVsLmNvbmZpZy5wbHVnaW5zKTtcbiAgICBjb25zdCBhdmFpbGFibGVQbHVnaW5zS2V5cyA9IE9iamVjdC5rZXlzKGF2YWlsYWJsZVBsdWdpbnMpO1xuICAgIGNvbnN0IHVua25vd25QbHVnaW5zID0gcGx1Z2lucy5maWx0ZXIoKHBsdWdpbikgPT4ge1xuXG4gICAgICByZXR1cm4gIWF2YWlsYWJsZVBsdWdpbnNbcGx1Z2luXSA/IHRydWUgOiBmYWxzZTtcbiAgICB9KTtcblxuICAgIHJldHVybiBhdmFpbGFibGVQbHVnaW5zS2V5cy5tYXAocGx1Z2luID0+IHRoaXMucmVuZGVyUGx1Z2luKHBsdWdpbikpXG4gICAgLmNvbmNhdCh1bmtub3duUGx1Z2lucy5tYXAocGx1Z2luID0+IHRoaXMucmVuZGVyUGx1Z2luKHBsdWdpbikpKTtcbiAgfVxuXG4gIHJlbmRlclBsdWdpbihwbHVnaW4pIHtcblxuICAgIGNvbnN0IHdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG5cbiAgICB3cmFwcGVyLmFwcGVuZENoaWxkKFxuICAgICAgdGhpcy5idWlsZEJvb2xlYW4oXG4gICAgICAgIHBsdWdpbixcbiAgICAgICAgJ3BsdWdpbicsXG4gICAgICAgIHRoaXMubW9kZWwuY29uZmlnLnBsdWdpbnNbcGx1Z2luXVxuICAgICAgKVxuICAgICk7XG5cbiAgICBjb25zdCBkb2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgZG9jLmlubmVySFRNTCA9IHBsdWdpbkRlZmluaXRpb25zW3BsdWdpbl0gJiYgcGx1Z2luRGVmaW5pdGlvbnNbcGx1Z2luXS5kb2M7XG5cbiAgICB3cmFwcGVyLmFwcGVuZENoaWxkKGRvYyk7XG5cbiAgICByZXR1cm4gd3JhcHBlcjtcbiAgfVxuXG4gIHJlbmRlcmxpYnMoKSB7XG5cbiAgICByZXR1cm4gYXZhaWxhYmxlTGlicy5tYXAoKGxpYikgPT4ge1xuXG4gICAgICByZXR1cm4gdGhpcy5idWlsZEJvb2xlYW4oXG4gICAgICAgICAgbGliLFxuICAgICAgICAgICdsaWInLFxuICAgICAgICAgIHRoaXMubW9kZWwuY29uZmlnLmxpYnMuaW5jbHVkZXMobGliKVxuICAgICAgICApO1xuICAgIH0pO1xuICB9XG5cbiAgYnVpbGRCb29sZWFuKGtleSwgdHlwZSwgY2hlY2tlZCkge1xuXG4gICAgY29uc3QgaW5wdXRXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgY29uc3QgY2hlY2tib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXG4gICAgaW5wdXRXcmFwcGVyLmNsYXNzTGlzdC5hZGQoJ2lucHV0LXdyYXBwZXInKTtcbiAgICBsYWJlbC5pbm5lckhUTUwgPSBrZXk7XG4gICAgY2hlY2tib3gudHlwZSA9ICdjaGVja2JveCc7XG4gICAgY2hlY2tib3gudmFsdWUgPSBrZXk7XG4gICAgY2hlY2tib3guY2hlY2tlZCA9IGNoZWNrZWQ7XG5cbiAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZSkgPT4ge1xuXG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcblxuICAgICAgICBjYXNlICdsaWInOiB7XG5cbiAgICAgICAgICBlLnRhcmdldC5jaGVja2VkID8gdGhpcy5tb2RlbC5hZGRMaWIoa2V5KSA6IHRoaXMubW9kZWwucmVtb3ZlTGliKGtleSk7XG5cbiAgICAgICAgfSBicmVhaztcblxuICAgICAgICBjYXNlICdwbHVnaW4nOiB7XG5cbiAgICAgICAgICBlLnRhcmdldC5jaGVja2VkID8gdGhpcy5tb2RlbC5hZGRQbHVnaW4oa2V5KSA6IHRoaXMubW9kZWwucmVtb3ZlUGx1Z2luKGtleSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgIH0sIGZhbHNlKTtcblxuICAgIGlucHV0V3JhcHBlci5hcHBlbmRDaGlsZChsYWJlbCk7XG4gICAgaW5wdXRXcmFwcGVyLmFwcGVuZENoaWxkKGNoZWNrYm94KTtcblxuICAgIHJldHVybiBpbnB1dFdyYXBwZXI7XG4gIH1cblxuICBjcmVhdGVJbnB1dFdyYXBwZXIocGF0aCwgaWRlbnRpZmllcikge1xuXG4gICAgY29uc3QgaW5wdXRXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29uc3QgZWRpdG9yID0gdGhpcy5jcmVhdGVUZXh0RWRpdG9yKHBhdGgsIGlkZW50aWZpZXIpO1xuXG4gICAgaW5wdXRXcmFwcGVyLmNsYXNzTGlzdC5hZGQoJ2lucHV0LXdyYXBwZXInKTtcbiAgICBpbnB1dFdyYXBwZXIuYXBwZW5kQ2hpbGQoZWRpdG9yKTtcbiAgICBpbnB1dFdyYXBwZXIuYXBwZW5kQ2hpbGQodGhpcy5jcmVhdGVBZGQoaWRlbnRpZmllcikpO1xuICAgIGlucHV0V3JhcHBlci5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZVN1YihlZGl0b3IpKTtcblxuICAgIHJldHVybiBpbnB1dFdyYXBwZXI7XG4gIH1cblxuICBjcmVhdGVTdWIoZWRpdG9yKSB7XG5cbiAgICBjb25zdCBzdWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgc3ViLmNsYXNzTGlzdC5hZGQoJ3N1YicpO1xuICAgIHN1Yi5jbGFzc0xpc3QuYWRkKCdpbmxpbmUtYmxvY2snKTtcbiAgICBzdWIuY2xhc3NMaXN0LmFkZCgnc3RhdHVzLXJlbW92ZWQnKTtcbiAgICBzdWIuY2xhc3NMaXN0LmFkZCgnaWNvbicpO1xuICAgIHN1Yi5jbGFzc0xpc3QuYWRkKCdpY29uLWRpZmYtcmVtb3ZlZCcpO1xuXG4gICAgc3ViLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcblxuICAgICAgdGhpcy5tb2RlbC5yZW1vdmVFZGl0b3IoZWRpdG9yKTtcbiAgICAgIGNvbnN0IGlucHV0V3JhcHBlciA9IGUudGFyZ2V0LmNsb3Nlc3QoJy5pbnB1dC13cmFwcGVyJyk7XG4gICAgICBpbnB1dFdyYXBwZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpbnB1dFdyYXBwZXIpO1xuXG4gICAgfSwgZmFsc2UpO1xuXG4gICAgcmV0dXJuIHN1YjtcbiAgfVxuXG4gIGNyZWF0ZUFkZChpZGVudGlmaWVyKSB7XG5cbiAgICBjb25zdCBhZGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgYWRkLmNsYXNzTGlzdC5hZGQoJ2FkZCcpO1xuICAgIGFkZC5jbGFzc0xpc3QuYWRkKCdpbmxpbmUtYmxvY2snKTtcbiAgICBhZGQuY2xhc3NMaXN0LmFkZCgnc3RhdHVzLWFkZGVkJyk7XG4gICAgYWRkLmNsYXNzTGlzdC5hZGQoJ2ljb24nKTtcbiAgICBhZGQuY2xhc3NMaXN0LmFkZCgnaWNvbi1kaWZmLWFkZGVkJyk7XG4gICAgYWRkLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcblxuICAgICAgZS50YXJnZXQuY2xvc2VzdCgnc2VjdGlvbicpLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlSW5wdXRXcmFwcGVyKG51bGwsIGlkZW50aWZpZXIpKTtcblxuICAgIH0sIGZhbHNlKTtcblxuICAgIHJldHVybiBhZGQ7XG4gIH1cblxuICBjcmVhdGVUZXh0RWRpdG9yKHBhdGgsIGlkZW50aWZpZXIpIHtcblxuICAgIGNvbnN0IGVkaXRvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F0b20tdGV4dC1lZGl0b3InKTtcbiAgICBlZGl0b3Iuc2V0QXR0cmlidXRlKCdtaW5pJywgdHJ1ZSk7XG5cbiAgICBpZiAocGF0aCkge1xuXG4gICAgICBlZGl0b3IuZ2V0TW9kZWwoKS5nZXRCdWZmZXIoKS5zZXRUZXh0KHBhdGgpO1xuICAgIH1cblxuICAgIHRoaXMubW9kZWwuZWRpdG9ycy5wdXNoKHtcblxuICAgICAgaWRlbnRpZmllcixcbiAgICAgIHJlZjogZWRpdG9yXG4gICAgfSk7XG5cbiAgICByZXR1cm4gZWRpdG9yO1xuICB9XG5cbiAgZ2V0TW9kZWwoKSB7XG5cbiAgICByZXR1cm4gdGhpcy5tb2RlbDtcbiAgfVxuXG4gIHNldE1vZGVsKG1vZGVsKSB7XG5cbiAgICB0aGlzLm1vZGVsID0gbW9kZWw7XG4gIH1cblxuICBkZXN0cm95KCkge1xuXG4gICAgdGhpcy5lbC5yZW1vdmUoKTtcbiAgfVxufVxuIl19