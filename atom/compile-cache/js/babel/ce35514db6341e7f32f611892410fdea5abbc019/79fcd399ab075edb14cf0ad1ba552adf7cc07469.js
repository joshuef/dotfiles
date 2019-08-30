var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _delegate = require('./delegate');

var _delegate2 = _interopRequireDefault(_delegate);

var _dock = require('./dock');

var _dock2 = _interopRequireDefault(_dock);

var Panel = (function () {
  function Panel() {
    var _this = this;

    _classCallCheck(this, Panel);

    this.panel = null;
    this.element = document.createElement('div');
    this.delegate = new _delegate2['default']();
    this.messages = [];
    this.deactivating = false;
    this.subscriptions = new _atom.CompositeDisposable();
    this.showPanelStateMessages = false;

    this.subscriptions.add(this.delegate);
    this.subscriptions.add(atom.config.observe('linter-ui-default.hidePanelWhenEmpty', function (hidePanelWhenEmpty) {
      _this.hidePanelWhenEmpty = hidePanelWhenEmpty;
      _this.refresh();
    }));
    this.subscriptions.add(atom.workspace.onDidDestroyPaneItem(function (_ref) {
      var paneItem = _ref.item;

      if (paneItem instanceof _dock2['default'] && !_this.deactivating) {
        _this.panel = null;
        atom.config.set('linter-ui-default.showPanel', false);
      }
    }));
    this.subscriptions.add(atom.config.observe('linter-ui-default.showPanel', function (showPanel) {
      _this.showPanelConfig = showPanel;
      _this.refresh();
    }));
    this.subscriptions.add(atom.workspace.getCenter().observeActivePaneItem(function () {
      _this.showPanelStateMessages = !!_this.delegate.filteredMessages.length;
      _this.refresh();
    }));
    this.activationTimer = window.requestIdleCallback(function () {
      _this.activate();
    });
  }

  _createClass(Panel, [{
    key: 'activate',
    value: _asyncToGenerator(function* () {
      if (this.panel) {
        return;
      }
      this.panel = new _dock2['default'](this.delegate);
      yield atom.workspace.open(this.panel, {
        activatePane: false,
        activateItem: false,
        searchAllPanes: true
      });
      this.update();
      this.refresh();
    })
  }, {
    key: 'update',
    value: function update() {
      var newMessages = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      if (newMessages) {
        this.messages = newMessages;
      }
      this.delegate.update(this.messages);
      this.showPanelStateMessages = !!this.delegate.filteredMessages.length;
      this.refresh();
    }
  }, {
    key: 'refresh',
    value: _asyncToGenerator(function* () {
      var panel = this.panel;
      if (panel === null) {
        if (this.showPanelConfig) {
          yield this.activate();
        }
        return;
      }
      var paneContainer = atom.workspace.paneContainerForItem(panel);
      if (!paneContainer || paneContainer.location !== 'bottom' || paneContainer.getActivePaneItem() !== panel) {
        return;
      }
      var visibilityAllowed1 = this.showPanelConfig;
      var visibilityAllowed2 = this.hidePanelWhenEmpty ? this.showPanelStateMessages : true;
      if (visibilityAllowed1 && visibilityAllowed2) {
        paneContainer.show();
        panel.doPanelResize();
      } else {
        paneContainer.hide();
      }
    })
  }, {
    key: 'dispose',
    value: function dispose() {
      this.deactivating = true;
      if (this.panel) {
        this.panel.dispose();
      }
      this.subscriptions.dispose();
      window.cancelIdleCallback(this.activationTimer);
    }
  }]);

  return Panel;
})();

module.exports = Panel;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3BhbmVsL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O29CQUVvQyxNQUFNOzt3QkFDckIsWUFBWTs7OztvQkFDWCxRQUFROzs7O0lBR3hCLEtBQUs7QUFXRSxXQVhQLEtBQUssR0FXSzs7OzBCQVhWLEtBQUs7O0FBWVAsUUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7QUFDakIsUUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQzVDLFFBQUksQ0FBQyxRQUFRLEdBQUcsMkJBQWMsQ0FBQTtBQUM5QixRQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNsQixRQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQTtBQUN6QixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBO0FBQzlDLFFBQUksQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUE7O0FBRW5DLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtBQUNyQyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsc0NBQXNDLEVBQUUsVUFBQSxrQkFBa0IsRUFBSTtBQUNoRixZQUFLLGtCQUFrQixHQUFHLGtCQUFrQixDQUFBO0FBQzVDLFlBQUssT0FBTyxFQUFFLENBQUE7S0FDZixDQUFDLENBQ0gsQ0FBQTtBQUNELFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUNwQixJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLFVBQUMsSUFBa0IsRUFBSztVQUFmLFFBQVEsR0FBaEIsSUFBa0IsQ0FBaEIsSUFBSTs7QUFDekMsVUFBSSxRQUFRLDZCQUFxQixJQUFJLENBQUMsTUFBSyxZQUFZLEVB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QUFJLEVBQUUsQ0FBQTtPQUNyQjtLQUNGOzs7V0FDTSxtQkFBRztBQUNSLFVBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFBO0FBQ3hCLFVBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtBQUNkLFlBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUE7T0FDckI7QUFDRCxVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO0FBQzVCLFlBQU0sQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUE7S0FDaEQ7OztTQXBHRyxLQUFLOzs7QUF1R1gsTUFBTSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUEiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItdWktZGVmYXVsdC9saWIvcGFuZWwvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCBEZWxlZ2F0ZSBmcm9tICcuL2RlbGVnYXRlJ1xuaW1wb3J0IFBhbmVsRG9jayBmcm9tICcuL2RvY2snXG5pbXBvcnQgdHlwZSB7IExpbnRlck1lc3NhZ2UgfSBmcm9tICcuLi90eXBlcydcblxuY2xhc3MgUGFuZWwge1xuICBwYW5lbDogUGFuZWxEb2NrIHwgbnVsbFxuICBlbGVtZW50OiBIVE1MRWxlbWVudFxuICBkZWxlZ2F0ZTogRGVsZWdhdGVcbiAgbWVzc2FnZXM6IEFycmF5PExpbnRlck1lc3NhZ2U+XG4gIGRlYWN0aXZhdGluZzogYm9vbGVhblxuICBzdWJzY3JpcHRpb25zOiBDb21wb3NpdGVEaXNwb3NhYmxlXG4gIHNob3dQYW5lbENvbmZpZzogYm9vbGVhblxuICBoaWRlUGFuZWxXaGVuRW1wdHk6IGJvb2xlYW5cbiAgc2hvd1BhbmVsU3RhdGVNZXNzYWdlczogYm9vbGVhblxuICBhY3RpdmF0aW9uVGltZXI6IG51bWJlclxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnBhbmVsID0gbnVsbFxuICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdGhpcy5kZWxlZ2F0ZSA9IG5ldyBEZWxlZ2F0ZSgpXG4gICAgdGhpcy5tZXNzYWdlcyA9IFtdXG4gICAgdGhpcy5kZWFjdGl2YXRpbmcgPSBmYWxzZVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLnNob3dQYW5lbFN0YXRlTWVzc2FnZXMgPSBmYWxzZVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmRlbGVnYXRlKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItdWktZGVmYXVsdC5oaWRlUGFuZWxXaGVuRW1wdHknLCBoaWRlUGFuZWxXaGVuRW1wdHkgPT4ge1xuICAgICAgICB0aGlzLmhpZGVQYW5lbFdoZW5FbXB0eSA9IGhpZGVQYW5lbFdoZW5FbXB0eVxuICAgICAgICB0aGlzLnJlZnJlc2goKVxuICAgICAgfSksXG4gICAgKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLndvcmtzcGFjZS5vbkRpZERlc3Ryb3lQYW5lSXRlbSgoeyBpdGVtOiBwYW5lSXRlbSB9KSA9PiB7XG4gICAgICAgIGlmIChwYW5lSXRlbSBpbnN0YW5jZW9mIFBhbmVsRG9jayAmJiAhdGhpcy5kZWFjdGl2YXRpbmcpIHtcbiAgICAgICAgICB0aGlzLnBhbmVsID0gbnVsbFxuICAgICAgICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLXVpLWRlZmF1bHQuc2hvd1BhbmVsJywgZmFsc2UpXG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgIClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLXVpLWRlZmF1bHQuc2hvd1BhbmVsJywgc2hvd1BhbmVsID0+IHtcbiAgICAgICAgdGhpcy5zaG93UGFuZWxDb25maWcgPSBzaG93UGFuZWxcbiAgICAgICAgdGhpcy5yZWZyZXNoKClcbiAgICAgIH0pLFxuICAgIClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0Q2VudGVyKCkub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKCgpID0+IHtcbiAgICAgICAgdGhpcy5zaG93UGFuZWxTdGF0ZU1lc3NhZ2VzID0gISF0aGlzLmRlbGVnYXRlLmZpbHRlcmVkTWVzc2FnZXMubGVuZ3RoXG4gICAgICAgIHRoaXMucmVmcmVzaCgpXG4gICAgICB9KSxcbiAgICApXG4gICAgdGhpcy5hY3RpdmF0aW9uVGltZXIgPSB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFjaygoKSA9PiB7XG4gICAgICB0aGlzLmFjdGl2YXRlKClcbiAgICB9KVxuICB9XG4gIGFzeW5jIGFjdGl2YXRlKCkge1xuICAgIGlmICh0aGlzLnBhbmVsKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5wYW5lbCA9IG5ldyBQYW5lbERvY2sodGhpcy5kZWxlZ2F0ZSlcbiAgICBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKHRoaXMucGFuZWwsIHtcbiAgICAgIGFjdGl2YXRlUGFuZTogZmFsc2UsXG4gICAgICBhY3RpdmF0ZUl0ZW06IGZhbHNlLFxuICAgICAgc2VhcmNoQWxsUGFuZXM6IHRydWUsXG4gICAgfSlcbiAgICB0aGlzLnVwZGF0ZSgpXG4gICAgdGhpcy5yZWZyZXNoKClcbiAgfVxuICB1cGRhdGUobmV3TWVzc2FnZXM6ID9BcnJheTxMaW50ZXJNZXNzYWdlPiA9IG51bGwpOiB2b2lkIHtcbiAgICBpZiAobmV3TWVzc2FnZXMpIHtcbiAgICAgIHRoaXMubWVzc2FnZXMgPSBuZXdNZXNzYWdlc1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnVwZGF0ZSh0aGlzLm1lc3NhZ2VzKVxuICAgIHRoaXMuc2hvd1BhbmVsU3RhdGVNZXNzYWdlcyA9ICEhdGhpcy5kZWxlZ2F0ZS5maWx0ZXJlZE1lc3NhZ2VzLmxlbmd0aFxuICAgIHRoaXMucmVmcmVzaCgpXG4gIH1cbiAgYXN5bmMgcmVmcmVzaCgpIHtcbiAgICBjb25zdCBwYW5lbCA9IHRoaXMucGFuZWxcbiAgICBpZiAocGFuZWwgPT09IG51bGwpIHtcbiAgICAgIGlmICh0aGlzLnNob3dQYW5lbENvbmZpZykge1xuICAgICAgICBhd2FpdCB0aGlzLmFjdGl2YXRlKClcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBwYW5lQ29udGFpbmVyID0gYXRvbS53b3Jrc3BhY2UucGFuZUNvbnRhaW5lckZvckl0ZW0ocGFuZWwpXG4gICAgaWYgKCFwYW5lQ29udGFpbmVyIHx8IHBhbmVDb250YWluZXIubG9jYXRpb24gIT09ICdib3R0b20nIHx8IHBhbmVDb250YWluZXIuZ2V0QWN0aXZlUGFuZUl0ZW0oKSAhPT0gcGFuZWwpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCB2aXNpYmlsaXR5QWxsb3dlZDEgPSB0aGlzLnNob3dQYW5lbENvbmZpZ1xuICAgIGNvbnN0IHZpc2liaWxpdHlBbGxvd2VkMiA9IHRoaXMuaGlkZVBhbmVsV2hlbkVtcHR5ID8gdGhpcy5zaG93UGFuZWxTdGF0ZU1lc3NhZ2VzIDogdHJ1ZVxuICAgIGlmICh2aXNpYmlsaXR5QWxsb3dlZDEgJiYgdmlzaWJpbGl0eUFsbG93ZWQyKSB7XG4gICAgICBwYW5lQ29udGFpbmVyLnNob3coKVxuICAgICAgcGFuZWwuZG9QYW5lbFJlc2l6ZSgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHBhbmVDb250YWluZXIuaGlkZSgpXG4gICAgfVxuICB9XG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRpbmcgPSB0cnVlXG4gICAgaWYgKHRoaXMucGFuZWwpIHtcbiAgICAgIHRoaXMucGFuZWwuZGlzcG9zZSgpXG4gICAgfVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICB3aW5kb3cuY2FuY2VsSWRsZUNhbGxiYWNrKHRoaXMuYWN0aXZhdGlvblRpbWVyKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxcbiJdfQ==