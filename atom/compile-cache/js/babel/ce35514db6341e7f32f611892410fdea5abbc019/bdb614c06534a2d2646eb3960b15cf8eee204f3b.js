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
    this.lastSetDockVisibility = false;

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
      if (this.showPanelConfig && (!this.hidePanelWhenEmpty || this.showPanelStateMessages)) {
        // NOTE: Don't show when user hide it on purpose
        if (this.lastSetDockVisibility === paneContainer.state.visible || paneContainer.state.visible) {
          paneContainer.show();
          this.lastSetDockVisibility = true;
        }
      } else {
        paneContainer.hide();
        this.lastSetDockVisibility = true;
      }
      panel.doPanelResize();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3BhbmVsL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O29CQUVvQyxNQUFNOzt3QkFDckIsWUFBWTs7OztvQkFDWCxRQUFROzs7O0lBR3hCLEtBQUs7QUFZRSxXQVpQLEtBQUssR0FZSzs7OzBCQVpWLEtBQUs7O0FBYVAsUUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7QUFDakIsUUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQzVDLFFBQUksQ0FBQyxRQUFRLEdBQUcsMkJBQWMsQ0FBQTtBQUM5QixRQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNsQixRQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQTtBQUN6QixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBO0FBQzlDLFFBQUksQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUE7QUFDbkMsUUFBSSxDQUFDLHFCQUFxQixHQUFHLEtBQUssQ0FBQTs7QUFFbEMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQ3JDLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxzQ0FBc0MsRUFBRSxVQUFBLGtCQUFrQixFQUFJO0FBQ2hGLFlBQUssa0JBQWtCLEdBQUcsa0JBQWtCLENBQUE7QUFDNUMsWUFBSyxPQUFPLEVBQUUsQ0FBQTtLQUNmLENBQUMsQ0FDSCxDQUFBO0FBQ0QsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3BCLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsVUFBQyxJQUFrQixFQUFLO1VBQWYsUUFBUSxHQUFoQixJQUFrQixDQUFoQixJQUFJOztBQUN6QyxV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QUUsQ0FBQTtBQUNwQixjQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFBO1NBQ2xDO09BQ0YsTUFBTTtBQUNMLHFCQUFhLENBQUMsSUFBSSxFQUFFLENBQUE7QUFDcEIsWUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQTtPQUNsQztBQUNELFdBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQTtLQUN0Qjs7O1dBQ00sbUJBQUc7QUFDUixVQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQTtBQUN4QixVQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDZCxZQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFBO09BQ3JCO0FBQ0QsVUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUM1QixZQUFNLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFBO0tBQ2hEOzs7U0F6R0csS0FBSzs7O0FBNEdYLE1BQU0sQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFBIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3BhbmVsL2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgRGVsZWdhdGUgZnJvbSAnLi9kZWxlZ2F0ZSdcbmltcG9ydCBQYW5lbERvY2sgZnJvbSAnLi9kb2NrJ1xuaW1wb3J0IHR5cGUgeyBMaW50ZXJNZXNzYWdlIH0gZnJvbSAnLi4vdHlwZXMnXG5cbmNsYXNzIFBhbmVsIHtcbiAgcGFuZWw6IFBhbmVsRG9jayB8IG51bGxcbiAgZWxlbWVudDogSFRNTEVsZW1lbnRcbiAgZGVsZWdhdGU6IERlbGVnYXRlXG4gIG1lc3NhZ2VzOiBBcnJheTxMaW50ZXJNZXNzYWdlPlxuICBkZWFjdGl2YXRpbmc6IGJvb2xlYW5cbiAgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZVxuICBzaG93UGFuZWxDb25maWc6IGJvb2xlYW5cbiAgaGlkZVBhbmVsV2hlbkVtcHR5OiBib29sZWFuXG4gIHNob3dQYW5lbFN0YXRlTWVzc2FnZXM6IGJvb2xlYW5cbiAgbGFzdFNldERvY2tWaXNpYmlsaXR5OiBib29sZWFuXG4gIGFjdGl2YXRpb25UaW1lcjogbnVtYmVyXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMucGFuZWwgPSBudWxsXG4gICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLmRlbGVnYXRlID0gbmV3IERlbGVnYXRlKClcbiAgICB0aGlzLm1lc3NhZ2VzID0gW11cbiAgICB0aGlzLmRlYWN0aXZhdGluZyA9IGZhbHNlXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIHRoaXMuc2hvd1BhbmVsU3RhdGVNZXNzYWdlcyA9IGZhbHNlXG4gICAgdGhpcy5sYXN0U2V0RG9ja1Zpc2liaWxpdHkgPSBmYWxzZVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmRlbGVnYXRlKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItdWktZGVmYXVsdC5oaWRlUGFuZWxXaGVuRW1wdHknLCBoaWRlUGFuZWxXaGVuRW1wdHkgPT4ge1xuICAgICAgICB0aGlzLmhpZGVQYW5lbFdoZW5FbXB0eSA9IGhpZGVQYW5lbFdoZW5FbXB0eVxuICAgICAgICB0aGlzLnJlZnJlc2goKVxuICAgICAgfSksXG4gICAgKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLndvcmtzcGFjZS5vbkRpZERlc3Ryb3lQYW5lSXRlbSgoeyBpdGVtOiBwYW5lSXRlbSB9KSA9PiB7XG4gICAgICAgIGlmIChwYW5lSXRlbSBpbnN0YW5jZW9mIFBhbmVsRG9jayAmJiAhdGhpcy5kZWFjdGl2YXRpbmcpIHtcbiAgICAgICAgICB0aGlzLnBhbmVsID0gbnVsbFxuICAgICAgICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLXVpLWRlZmF1bHQuc2hvd1BhbmVsJywgZmFsc2UpXG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgIClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLXVpLWRlZmF1bHQuc2hvd1BhbmVsJywgc2hvd1BhbmVsID0+IHtcbiAgICAgICAgdGhpcy5zaG93UGFuZWxDb25maWcgPSBzaG93UGFuZWxcbiAgICAgICAgdGhpcy5yZWZyZXNoKClcbiAgICAgIH0pLFxuICAgIClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0Q2VudGVyKCkub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKCgpID0+IHtcbiAgICAgICAgdGhpcy5zaG93UGFuZWxTdGF0ZU1lc3NhZ2VzID0gISF0aGlzLmRlbGVnYXRlLmZpbHRlcmVkTWVzc2FnZXMubGVuZ3RoXG4gICAgICAgIHRoaXMucmVmcmVzaCgpXG4gICAgICB9KSxcbiAgICApXG4gICAgdGhpcy5hY3RpdmF0aW9uVGltZXIgPSB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFjaygoKSA9PiB7XG4gICAgICB0aGlzLmFjdGl2YXRlKClcbiAgICB9KVxuICB9XG4gIGFzeW5jIGFjdGl2YXRlKCkge1xuICAgIGlmICh0aGlzLnBhbmVsKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5wYW5lbCA9IG5ldyBQYW5lbERvY2sodGhpcy5kZWxlZ2F0ZSlcbiAgICBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKHRoaXMucGFuZWwsIHtcbiAgICAgIGFjdGl2YXRlUGFuZTogZmFsc2UsXG4gICAgICBhY3RpdmF0ZUl0ZW06IGZhbHNlLFxuICAgICAgc2VhcmNoQWxsUGFuZXM6IHRydWUsXG4gICAgfSlcbiAgICB0aGlzLnVwZGF0ZSgpXG4gICAgdGhpcy5yZWZyZXNoKClcbiAgfVxuICB1cGRhdGUobmV3TWVzc2FnZXM6ID9BcnJheTxMaW50ZXJNZXNzYWdlPiA9IG51bGwpOiB2b2lkIHtcbiAgICBpZiAobmV3TWVzc2FnZXMpIHtcbiAgICAgIHRoaXMubWVzc2FnZXMgPSBuZXdNZXNzYWdlc1xuICAgIH1cbiAgICB0aGlzLmRlbGVnYXRlLnVwZGF0ZSh0aGlzLm1lc3NhZ2VzKVxuICAgIHRoaXMuc2hvd1BhbmVsU3RhdGVNZXNzYWdlcyA9ICEhdGhpcy5kZWxlZ2F0ZS5maWx0ZXJlZE1lc3NhZ2VzLmxlbmd0aFxuICAgIHRoaXMucmVmcmVzaCgpXG4gIH1cbiAgYXN5bmMgcmVmcmVzaCgpIHtcbiAgICBjb25zdCBwYW5lbCA9IHRoaXMucGFuZWxcbiAgICBpZiAocGFuZWwgPT09IG51bGwpIHtcbiAgICAgIGlmICh0aGlzLnNob3dQYW5lbENvbmZpZykge1xuICAgICAgICBhd2FpdCB0aGlzLmFjdGl2YXRlKClcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBwYW5lQ29udGFpbmVyID0gYXRvbS53b3Jrc3BhY2UucGFuZUNvbnRhaW5lckZvckl0ZW0ocGFuZWwpXG4gICAgaWYgKCFwYW5lQ29udGFpbmVyIHx8IHBhbmVDb250YWluZXIubG9jYXRpb24gIT09ICdib3R0b20nIHx8IHBhbmVDb250YWluZXIuZ2V0QWN0aXZlUGFuZUl0ZW0oKSAhPT0gcGFuZWwpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAodGhpcy5zaG93UGFuZWxDb25maWcgJiYgKCF0aGlzLmhpZGVQYW5lbFdoZW5FbXB0eSB8fCB0aGlzLnNob3dQYW5lbFN0YXRlTWVzc2FnZXMpKSB7XG4gICAgICAvLyBOT1RFOiBEb24ndCBzaG93IHdoZW4gdXNlciBoaWRlIGl0IG9uIHB1cnBvc2VcbiAgICAgIGlmICh0aGlzLmxhc3RTZXREb2NrVmlzaWJpbGl0eSA9PT0gcGFuZUNvbnRhaW5lci5zdGF0ZS52aXNpYmxlIHx8IHBhbmVDb250YWluZXIuc3RhdGUudmlzaWJsZSkge1xuICAgICAgICBwYW5lQ29udGFpbmVyLnNob3coKVxuICAgICAgICB0aGlzLmxhc3RTZXREb2NrVmlzaWJpbGl0eSA9IHRydWVcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGFuZUNvbnRhaW5lci5oaWRlKClcbiAgICAgIHRoaXMubGFzdFNldERvY2tWaXNpYmlsaXR5ID0gdHJ1ZVxuICAgIH1cbiAgICBwYW5lbC5kb1BhbmVsUmVzaXplKClcbiAgfVxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuZGVhY3RpdmF0aW5nID0gdHJ1ZVxuICAgIGlmICh0aGlzLnBhbmVsKSB7XG4gICAgICB0aGlzLnBhbmVsLmRpc3Bvc2UoKVxuICAgIH1cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgd2luZG93LmNhbmNlbElkbGVDYWxsYmFjayh0aGlzLmFjdGl2YXRpb25UaW1lcilcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVsXG4iXX0=