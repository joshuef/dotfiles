var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _element = require('./element');

var _element2 = _interopRequireDefault(_element);

var _helpers = require('../helpers');

var StatusBar = (function () {
  function StatusBar() {
    var _this = this;

    _classCallCheck(this, StatusBar);

    this.element = new _element2['default']();
    this.messages = [];
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(this.element);
    this.subscriptions.add(atom.config.observe('linter-ui-default.statusBarRepresents', function (statusBarRepresents) {
      var notInitial = typeof _this.statusBarRepresents !== 'undefined';
      _this.statusBarRepresents = statusBarRepresents;
      if (notInitial) {
        _this.update();
      }
    }));
    this.subscriptions.add(atom.config.observe('linter-ui-default.statusBarClickBehavior', function (statusBarClickBehavior) {
      var notInitial = typeof _this.statusBarClickBehavior !== 'undefined';
      _this.statusBarClickBehavior = statusBarClickBehavior;
      if (notInitial) {
        _this.update();
      }
    }));
    this.subscriptions.add(atom.config.observe('linter-ui-default.showStatusBar', function (showStatusBar) {
      _this.element.setVisibility('config', showStatusBar);
    }));
    this.subscriptions.add(atom.workspace.getCenter().observeActivePaneItem(function (paneItem) {
      var isTextEditor = atom.workspace.isTextEditor(paneItem);
      _this.element.setVisibility('pane', isTextEditor);
      if (isTextEditor && _this.statusBarRepresents === 'Current File') {
        _this.update();
      }
    }));

    this.element.onDidClick(function (type) {
      var workspaceView = atom.views.getView(atom.workspace);
      if (_this.statusBarClickBehavior === 'Toggle Panel') {
        atom.commands.dispatch(workspaceView, 'linter-ui-default:toggle-panel');
      } else if (_this.statusBarClickBehavior === 'Toggle Status Bar Scope') {
        atom.config.set('linter-ui-default.statusBarRepresents', _this.statusBarRepresents === 'Entire Project' ? 'Current File' : 'Entire Project');
      } else {
        var postfix = _this.statusBarRepresents === 'Current File' ? '-in-current-file' : '';
        atom.commands.dispatch(workspaceView, 'linter-ui-default:next-' + type + postfix);
      }
    });
  }

  _createClass(StatusBar, [{
    key: 'update',
    value: function update() {
      var _this2 = this;

      var messages = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      if (messages) {
        this.messages = messages;
      } else {
        messages = this.messages;
      }

      var count = { error: 0, warning: 0, info: 0 };
      var currentTextEditor = (0, _helpers.getActiveTextEditor)();
      var currentPath = currentTextEditor && currentTextEditor.getPath() || NaN;
      // NOTE: ^ Setting default to NaN so it won't match empty file paths in messages

      messages.forEach(function (message) {
        if (_this2.statusBarRepresents === 'Entire Project' || (0, _helpers.$file)(message) === currentPath) {
          if (message.severity === 'error') {
            count.error++;
          } else if (message.severity === 'warning') {
            count.warning++;
          } else {
            count.info++;
          }
        }
      });
      this.element.update(count.error, count.warning, count.info);
    }
  }, {
    key: 'attach',
    value: function attach(statusBarRegistry) {
      var _this3 = this;

      var statusBar = null;

      this.subscriptions.add(atom.config.observe('linter-ui-default.statusBarPosition', function (statusBarPosition) {
        if (statusBar) {
          statusBar.destroy();
        }
        statusBar = statusBarRegistry['add' + statusBarPosition + 'Tile']({
          item: _this3.element.item,
          priority: statusBarPosition === 'Left' ? 0 : 1000
        });
      }));
      this.subscriptions.add(new _atom.Disposable(function () {
        if (statusBar) {
          statusBar.destroy();
        }
      }));
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
    }
  }]);

  return StatusBar;
})();

module.exports = StatusBar;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3N0YXR1cy1iYXIvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O29CQUVnRCxNQUFNOzt1QkFDbEMsV0FBVzs7Ozt1QkFDWSxZQUFZOztJQUdqRCxTQUFTO0FBT0YsV0FQUCxTQUFTLEdBT0M7OzswQkFQVixTQUFTOztBQVFYLFFBQUksQ0FBQyxPQUFPLEdBQUcsMEJBQWEsQ0FBQTtBQUM1QixRQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNsQixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBOztBQUU5QyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDcEMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLHVDQUF1QyxFQUFFLFVBQUEsbUJBQW1CLEVBQUk7QUFDbEYsVUFBTSxVQUFVLEdBQUcsT0FBTyxNQUFLLG1CQUFtQixLQUFLLFdBQVcsQ0FBQTtBQUNsRSxZQUFLLG1CQUFtQixHQUFHLG1CQUFtQixDQUFBO0FBQzlDLFVBQUksVUFBVSxFQUFFO0FBQ2QsY0FBSyxNQUFNLEVBQUUsQ0FBQTtPQUNkO0tBQ0YsQ0FBQyxDQUNILENBQUE7QUFDRCxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsMENBQTBDLEVBQUUsVUFBQSxzQkFBc0IsRUFBSTtBQUN4RixVQUFNLFVBQVUsR0FBRyxPQUFPLE1BQUssc0JBQXNCLEtBQUssV0FBVyxDQUFBO0FBQ3JFLFlBQUssc0JBQXNCLEdBQUcsc0JBQXNCLENBQUE7QUFDcEQsVUFBSSxVQUFVLEVBQUU7QUFDZCxjQUFLLE1BQU0sRUFBRSxDQUFBO09BQ2Q7S0FDRixDQUFDLENBQ0gsQ0FBQTtB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QUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtLQUM1RDs7O1dBQ0ssZ0JBQUMsaUJBQXlCLEVBQUU7OztBQUNoQyxVQUFJLFNBQVMsR0FBRyxJQUFJLENBQUE7O0FBRXBCLFVBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxxQ0FBcUMsRUFBRSxVQUFBLGlCQUFpQixFQUFJO0FBQzlFLFlBQUksU0FBUyxFQUFFO0FBQ2IsbUJBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtTQUNwQjtBQUNELGlCQUFTLEdBQUcsaUJBQWlCLFNBQU8saUJBQWlCLFVBQU8sQ0FBQztBQUMzRCxjQUFJLEVBQUUsT0FBSyxPQUFPLENBQUMsSUFBSTtBQUN2QixrQkFBUSxFQUFFLGlCQUFpQixLQUFLLE1BQU0sR0FBRyxDQUFDLEdBQUcsSUFBSTtTQUNsRCxDQUFDLENBQUE7T0FDSCxDQUFDLENBQ0gsQ0FBQTtBQUNELFVBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUNwQixxQkFBZSxZQUFXO0FBQ3hCLFlBQUksU0FBUyxFQUFFO0FBQ2IsbUJBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtTQUNwQjtPQUNGLENBQUMsQ0FDSCxDQUFBO0tBQ0Y7OztXQUNNLG1CQUFHO0FBQ1IsVUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtLQUM3Qjs7O1NBOUdHLFNBQVM7OztBQWlIZixNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2xpbnRlci11aS1kZWZhdWx0L2xpYi9zdGF0dXMtYmFyL2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgRWxlbWVudCBmcm9tICcuL2VsZW1lbnQnXG5pbXBvcnQgeyAkZmlsZSwgZ2V0QWN0aXZlVGV4dEVkaXRvciB9IGZyb20gJy4uL2hlbHBlcnMnXG5pbXBvcnQgdHlwZSB7IExpbnRlck1lc3NhZ2UgfSBmcm9tICcuLi90eXBlcydcblxuY2xhc3MgU3RhdHVzQmFyIHtcbiAgZWxlbWVudDogRWxlbWVudFxuICBtZXNzYWdlczogQXJyYXk8TGludGVyTWVzc2FnZT5cbiAgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZVxuICBzdGF0dXNCYXJSZXByZXNlbnRzOiAnRW50aXJlIFByb2plY3QnIHwgJ0N1cnJlbnQgRmlsZSdcbiAgc3RhdHVzQmFyQ2xpY2tCZWhhdmlvcjogJ1RvZ2dsZSBQYW5lbCcgfCAnSnVtcCB0byBuZXh0IGlzc3VlJyB8ICdUb2dnbGUgU3RhdHVzIEJhciBTY29wZSdcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBuZXcgRWxlbWVudCgpXG4gICAgdGhpcy5tZXNzYWdlcyA9IFtdXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmVsZW1lbnQpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci11aS1kZWZhdWx0LnN0YXR1c0JhclJlcHJlc2VudHMnLCBzdGF0dXNCYXJSZXByZXNlbnRzID0+IHtcbiAgICAgICAgY29uc3Qgbm90SW5pdGlhbCA9IHR5cGVvZiB0aGlzLnN0YXR1c0JhclJlcHJlc2VudHMgIT09ICd1bmRlZmluZWQnXG4gICAgICAgIHRoaXMuc3RhdHVzQmFyUmVwcmVzZW50cyA9IHN0YXR1c0JhclJlcHJlc2VudHNcbiAgICAgICAgaWYgKG5vdEluaXRpYWwpIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZSgpXG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgIClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLXVpLWRlZmF1bHQuc3RhdHVzQmFyQ2xpY2tCZWhhdmlvcicsIHN0YXR1c0JhckNsaWNrQmVoYXZpb3IgPT4ge1xuICAgICAgICBjb25zdCBub3RJbml0aWFsID0gdHlwZW9mIHRoaXMuc3RhdHVzQmFyQ2xpY2tCZWhhdmlvciAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgdGhpcy5zdGF0dXNCYXJDbGlja0JlaGF2aW9yID0gc3RhdHVzQmFyQ2xpY2tCZWhhdmlvclxuICAgICAgICBpZiAobm90SW5pdGlhbCkge1xuICAgICAgICAgIHRoaXMudXBkYXRlKClcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItdWktZGVmYXVsdC5zaG93U3RhdHVzQmFyJywgc2hvd1N0YXR1c0JhciA9PiB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zZXRWaXNpYmlsaXR5KCdjb25maWcnLCBzaG93U3RhdHVzQmFyKVxuICAgICAgfSksXG4gICAgKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLndvcmtzcGFjZS5nZXRDZW50ZXIoKS5vYnNlcnZlQWN0aXZlUGFuZUl0ZW0ocGFuZUl0ZW0gPT4ge1xuICAgICAgICBjb25zdCBpc1RleHRFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5pc1RleHRFZGl0b3IocGFuZUl0ZW0pXG4gICAgICAgIHRoaXMuZWxlbWVudC5zZXRWaXNpYmlsaXR5KCdwYW5lJywgaXNUZXh0RWRpdG9yKVxuICAgICAgICBpZiAoaXNUZXh0RWRpdG9yICYmIHRoaXMuc3RhdHVzQmFyUmVwcmVzZW50cyA9PT0gJ0N1cnJlbnQgRmlsZScpIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZSgpXG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgIClcblxuICAgIHRoaXMuZWxlbWVudC5vbkRpZENsaWNrKHR5cGUgPT4ge1xuICAgICAgY29uc3Qgd29ya3NwYWNlVmlldyA9IGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSlcbiAgICAgIGlmICh0aGlzLnN0YXR1c0JhckNsaWNrQmVoYXZpb3IgPT09ICdUb2dnbGUgUGFuZWwnKSB7XG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2god29ya3NwYWNlVmlldywgJ2xpbnRlci11aS1kZWZhdWx0OnRvZ2dsZS1wYW5lbCcpXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdHVzQmFyQ2xpY2tCZWhhdmlvciA9PT0gJ1RvZ2dsZSBTdGF0dXMgQmFyIFNjb3BlJykge1xuICAgICAgICBhdG9tLmNvbmZpZy5zZXQoXG4gICAgICAgICAgJ2xpbnRlci11aS1kZWZhdWx0LnN0YXR1c0JhclJlcHJlc2VudHMnLFxuICAgICAgICAgIHRoaXMuc3RhdHVzQmFyUmVwcmVzZW50cyA9PT0gJ0VudGlyZSBQcm9qZWN0JyA/ICdDdXJyZW50IEZpbGUnIDogJ0VudGlyZSBQcm9qZWN0JyxcbiAgICAgICAgKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcG9zdGZpeCA9IHRoaXMuc3RhdHVzQmFyUmVwcmVzZW50cyA9PT0gJ0N1cnJlbnQgRmlsZScgPyAnLWluLWN1cnJlbnQtZmlsZScgOiAnJ1xuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKHdvcmtzcGFjZVZpZXcsIGBsaW50ZXItdWktZGVmYXVsdDpuZXh0LSR7dHlwZX0ke3Bvc3RmaXh9YClcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIHVwZGF0ZShtZXNzYWdlczogP0FycmF5PExpbnRlck1lc3NhZ2U+ID0gbnVsbCk6IHZvaWQge1xuICAgIGlmIChtZXNzYWdlcykge1xuICAgICAgdGhpcy5tZXNzYWdlcyA9IG1lc3NhZ2VzXG4gICAgfSBlbHNlIHtcbiAgICAgIG1lc3NhZ2VzID0gdGhpcy5tZXNzYWdlc1xuICAgIH1cblxuICAgIGNvbnN0IGNvdW50ID0geyBlcnJvcjogMCwgd2FybmluZzogMCwgaW5mbzogMCB9XG4gICAgY29uc3QgY3VycmVudFRleHRFZGl0b3IgPSBnZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBjb25zdCBjdXJyZW50UGF0aCA9IChjdXJyZW50VGV4dEVkaXRvciAmJiBjdXJyZW50VGV4dEVkaXRvci5nZXRQYXRoKCkpIHx8IE5hTlxuICAgIC8vIE5PVEU6IF4gU2V0dGluZyBkZWZhdWx0IHRvIE5hTiBzbyBpdCB3b24ndCBtYXRjaCBlbXB0eSBmaWxlIHBhdGhzIGluIG1lc3NhZ2VzXG5cbiAgICBtZXNzYWdlcy5mb3JFYWNoKG1lc3NhZ2UgPT4ge1xuICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyUmVwcmVzZW50cyA9PT0gJ0VudGlyZSBQcm9qZWN0JyB8fCAkZmlsZShtZXNzYWdlKSA9PT0gY3VycmVudFBhdGgpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2Uuc2V2ZXJpdHkgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICBjb3VudC5lcnJvcisrXG4gICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5zZXZlcml0eSA9PT0gJ3dhcm5pbmcnKSB7XG4gICAgICAgICAgY291bnQud2FybmluZysrXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY291bnQuaW5mbysrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMuZWxlbWVudC51cGRhdGUoY291bnQuZXJyb3IsIGNvdW50Lndhcm5pbmcsIGNvdW50LmluZm8pXG4gIH1cbiAgYXR0YWNoKHN0YXR1c0JhclJlZ2lzdHJ5OiBPYmplY3QpIHtcbiAgICBsZXQgc3RhdHVzQmFyID0gbnVsbFxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci11aS1kZWZhdWx0LnN0YXR1c0JhclBvc2l0aW9uJywgc3RhdHVzQmFyUG9zaXRpb24gPT4ge1xuICAgICAgICBpZiAoc3RhdHVzQmFyKSB7XG4gICAgICAgICAgc3RhdHVzQmFyLmRlc3Ryb3koKVxuICAgICAgICB9XG4gICAgICAgIHN0YXR1c0JhciA9IHN0YXR1c0JhclJlZ2lzdHJ5W2BhZGQke3N0YXR1c0JhclBvc2l0aW9ufVRpbGVgXSh7XG4gICAgICAgICAgaXRlbTogdGhpcy5lbGVtZW50Lml0ZW0sXG4gICAgICAgICAgcHJpb3JpdHk6IHN0YXR1c0JhclBvc2l0aW9uID09PSAnTGVmdCcgPyAwIDogMTAwMCxcbiAgICAgICAgfSlcbiAgICAgIH0pLFxuICAgIClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgbmV3IERpc3Bvc2FibGUoZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChzdGF0dXNCYXIpIHtcbiAgICAgICAgICBzdGF0dXNCYXIuZGVzdHJveSgpXG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgIClcbiAgfVxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXR1c0JhclxuIl19